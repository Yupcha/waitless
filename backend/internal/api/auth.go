package api

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/waitless/waitless/internal/database"
	"github.com/waitless/waitless/internal/middleware"
	"github.com/waitless/waitless/internal/models"
	"github.com/waitless/waitless/internal/services"
	"golang.org/x/crypto/bcrypt"
)

type registerRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func Register(w http.ResponseWriter, r *http.Request) {
	if os.Getenv("DISABLE_REGISTRATION") == "true" {
		jsonError(w, "registration is disabled", http.StatusForbidden)
		return
	}

	var req registerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid request", http.StatusBadRequest)
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.Name = services.SanitizeName(req.Name)

	if !services.ValidateEmail(req.Email) {
		jsonError(w, "invalid email format", http.StatusBadRequest)
		return
	}
	if len(req.Password) < 8 {
		jsonError(w, "password must be at least 8 characters", http.StatusBadRequest)
		return
	}
	if req.Name == "" {
		jsonError(w, "name is required", http.StatusBadRequest)
		return
	}

	// Check if user exists
	var existing models.User
	if result := database.DB.Where("email = ?", req.Email).First(&existing); result.Error == nil {
		jsonError(w, "email already registered", http.StatusConflict)
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 12)
	if err != nil {
		jsonError(w, "internal error", http.StatusInternalServerError)
		return
	}

	// First user becomes admin
	var count int64
	database.DB.Model(&models.User{}).Count(&count)
	role := models.RoleUser
	if count == 0 {
		role = models.RoleAdmin
	}

	user := models.User{
		Email:        req.Email,
		PasswordHash: string(hash),
		Name:         req.Name,
		Role:         role,
	}
	if err := database.DB.Create(&user).Error; err != nil {
		jsonError(w, "error creating user", http.StatusInternalServerError)
		return
	}

	token, err := generateToken()
	if err != nil {
		jsonError(w, "internal error", http.StatusInternalServerError)
		return
	}

	session := models.Session{
		UserID:    user.ID,
		Token:     token,
		IPAddress: r.RemoteAddr,
		UserAgent: r.UserAgent(),
		ExpiresAt: time.Now().Add(30 * 24 * time.Hour),
	}
	database.DB.Create(&session)

	setSessionCookie(w, token)
	jsonResponse(w, map[string]interface{}{
		"user":  user,
		"token": token,
	}, http.StatusCreated)
}

func Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid request", http.StatusBadRequest)
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))

	var user models.User
	if err := database.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		jsonError(w, "invalid credentials", http.StatusUnauthorized)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		jsonError(w, "invalid credentials", http.StatusUnauthorized)
		return
	}

	// Limit sessions per user
	var sessionCount int64
	database.DB.Model(&models.Session{}).Where("user_id = ?", user.ID).Count(&sessionCount)
	if sessionCount >= 5 {
		// Remove oldest session
		var oldest models.Session
		database.DB.Where("user_id = ?", user.ID).Order("created_at ASC").First(&oldest)
		database.DB.Delete(&oldest)
	}

	token, err := generateToken()
	if err != nil {
		jsonError(w, "internal error", http.StatusInternalServerError)
		return
	}

	session := models.Session{
		UserID:    user.ID,
		Token:     token,
		IPAddress: r.RemoteAddr,
		UserAgent: r.UserAgent(),
		ExpiresAt: time.Now().Add(30 * 24 * time.Hour),
	}
	database.DB.Create(&session)

	setSessionCookie(w, token)
	jsonResponse(w, map[string]interface{}{
		"user":  user,
		"token": token,
	}, http.StatusOK)
}

func Logout(w http.ResponseWriter, r *http.Request) {
	token := ""
	cookie, err := r.Cookie("waitless_session")
	if err == nil {
		token = cookie.Value
	}
	if token != "" {
		database.DB.Where("token = ?", token).Delete(&models.Session{})
	}
	http.SetCookie(w, &http.Cookie{
		Name:     "waitless_session",
		Value:    "",
		Expires:  time.Unix(0, 0),
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})
	jsonResponse(w, map[string]string{"message": "logged out"}, http.StatusOK)
}

func Me(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	jsonResponse(w, user, http.StatusOK)
}

func UpdateProfile(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)

	var req struct {
		Name  string `json:"name"`
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid request", http.StatusBadRequest)
		return
	}

	if req.Name != "" {
		user.Name = services.SanitizeName(req.Name)
	}
	if req.Email != "" {
		email := strings.TrimSpace(strings.ToLower(req.Email))
		if !services.ValidateEmail(email) {
			jsonError(w, "invalid email format", http.StatusBadRequest)
			return
		}
		// Check uniqueness
		var existing models.User
		if database.DB.Where("email = ? AND id != ?", email, user.ID).First(&existing).Error == nil {
			jsonError(w, "email already in use", http.StatusConflict)
			return
		}
		user.Email = email
	}

	database.DB.Save(user)
	jsonResponse(w, user, http.StatusOK)
}

func ChangePassword(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)

	var req struct {
		Current string `json:"current_password"`
		New     string `json:"new_password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid request", http.StatusBadRequest)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Current)); err != nil {
		jsonError(w, "current password is incorrect", http.StatusUnauthorized)
		return
	}

	if len(req.New) < 8 {
		jsonError(w, "new password must be at least 8 characters", http.StatusBadRequest)
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.New), 12)
	if err != nil {
		jsonError(w, "internal error", http.StatusInternalServerError)
		return
	}

	database.DB.Model(user).Update("password_hash", string(hash))
	jsonResponse(w, map[string]string{"message": "password changed"}, http.StatusOK)
}

func generateToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func setSessionCookie(w http.ResponseWriter, token string) {
	secure := os.Getenv("COOKIE_SECURE") == "true"
	http.SetCookie(w, &http.Cookie{
		Name:     "waitless_session",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   30 * 24 * 3600,
	})
}

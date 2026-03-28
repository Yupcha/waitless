package middleware

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/waitless/waitless/internal/database"
	"github.com/waitless/waitless/internal/models"
)

type contextKey string

const UserContextKey contextKey = "user"

func AuthRequired(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := extractToken(r)
		if token == "" {
			http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
			return
		}

		var session models.Session
		result := database.DB.Where("token = ? AND expires_at > ?", token, time.Now()).
			Preload("User").First(&session)
		if result.Error != nil {
			http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), UserContextKey, &session.User)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func AdminRequired(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user := GetUser(r)
		if user == nil || user.Role != models.RoleAdmin {
			http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func GetUser(r *http.Request) *models.User {
	user, _ := r.Context().Value(UserContextKey).(*models.User)
	return user
}

func extractToken(r *http.Request) string {
	// Check Authorization header
	auth := r.Header.Get("Authorization")
	if strings.HasPrefix(auth, "Bearer ") {
		return strings.TrimPrefix(auth, "Bearer ")
	}
	// Check cookie
	cookie, err := r.Cookie("waitless_session")
	if err == nil {
		return cookie.Value
	}
	return ""
}

package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/smtp"
	"os"
	"strings"
	"time"

	"github.com/waitless/waitless/internal/database"
	"github.com/waitless/waitless/internal/models"
	"github.com/waitless/waitless/internal/services"
	"golang.org/x/crypto/bcrypt"
)

func ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid request", http.StatusBadRequest)
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if !services.ValidateEmail(req.Email) {
		jsonError(w, "invalid email", http.StatusBadRequest)
		return
	}

	// Always return success to avoid user enumeration
	var user models.User
	if err := database.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		jsonResponse(w, map[string]string{
			"message": "If that email is registered, a reset link has been sent.",
		}, http.StatusOK)
		return
	}

	// Generate reset token
	token := models.NewToken()
	expiry := time.Now().Add(1 * time.Hour)
	database.DB.Model(&user).Updates(map[string]interface{}{
		"reset_token":  token,
		"reset_expiry": expiry,
	})

	// Send email if SMTP configured
	go sendResetEmail(user.Email, user.Name, token, r)

	jsonResponse(w, map[string]string{
		"message": "If that email is registered, a reset link has been sent.",
	}, http.StatusOK)
}

func ResetPassword(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Token    string `json:"token"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid request", http.StatusBadRequest)
		return
	}

	if req.Token == "" {
		jsonError(w, "token is required", http.StatusBadRequest)
		return
	}
	if len(req.Password) < 8 {
		jsonError(w, "password must be at least 8 characters", http.StatusBadRequest)
		return
	}

	var user models.User
	if err := database.DB.Where("reset_token = ? AND reset_expiry > ?", req.Token, time.Now()).
		First(&user).Error; err != nil {
		jsonError(w, "invalid or expired reset token", http.StatusBadRequest)
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 12)
	if err != nil {
		jsonError(w, "internal error", http.StatusInternalServerError)
		return
	}

	database.DB.Model(&user).Updates(map[string]interface{}{
		"password_hash": string(hash),
		"reset_token":   "",
		"reset_expiry":  nil,
	})

	// Invalidate all sessions for security
	database.DB.Where("user_id = ?", user.ID).Delete(&models.Session{})

	jsonResponse(w, map[string]string{
		"message": "Password has been reset. Please log in.",
	}, http.StatusOK)
}

func sendResetEmail(email, name, token string, r *http.Request) {
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")
	smtpUser := os.Getenv("SMTP_USER")
	smtpPass := os.Getenv("SMTP_PASS")
	smtpFrom := os.Getenv("SMTP_FROM")

	if smtpHost == "" {
		return // No platform SMTP configured
	}
	if smtpPort == "" {
		smtpPort = "587"
	}
	if smtpFrom == "" {
		smtpFrom = smtpUser
	}

	baseURL := getBaseURL(r)
	resetURL := fmt.Sprintf("%s/reset-password?token=%s", baseURL, token)

	if name == "" {
		name = "there"
	}

	subject := "Reset your Waitless password"
	body := fmt.Sprintf(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a12;font-family:Inter,sans-serif;">
<div style="max-width:480px;margin:40px auto;padding:40px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:16px;">
<h2 style="margin:0 0 16px;color:#e2e8f0;font-size:22px;">Reset your password</h2>
<p style="color:#94a3b8;font-size:15px;line-height:1.6;">Hi %s,</p>
<p style="color:#94a3b8;font-size:15px;line-height:1.6;">Click the button below to reset your password. This link expires in 1 hour.</p>
<a href="%s" style="display:inline-block;margin:24px 0;padding:12px 28px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">Reset Password</a>
<p style="color:#475569;font-size:13px;line-height:1.6;">If you didn't request this, you can safely ignore this email.</p>
<hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:24px 0;">
<p style="color:#334155;font-size:12px;">Waitless</p>
</div>
</body>
</html>`, name, resetURL)

	msg := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\nContent-Type: text/html; charset=utf-8\r\n\r\n%s",
		smtpFrom, email, subject, body)

	auth := smtp.PlainAuth("", smtpUser, smtpPass, smtpHost)
	addr := smtpHost + ":" + smtpPort
	smtp.SendMail(addr, auth, smtpFrom, []string{email}, []byte(msg))
}

package api

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/waitless/waitless/internal/database"
	middleware "github.com/waitless/waitless/internal/middleware"
	"github.com/waitless/waitless/internal/models"
	"github.com/waitless/waitless/internal/services"
)

// GetTelegramConfig returns the Telegram notification config for a project
func GetTelegramConfig(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "id")
	user := middleware.GetUser(r)

	var project models.Project
	if err := database.DB.Where("id = ? AND user_id = ?", projectID, user.ID).First(&project).Error; err != nil {
		jsonError(w, "project not found", http.StatusNotFound)
		return
	}

	var cfg models.TelegramConfig
	database.DB.Where("project_id = ?", projectID).First(&cfg)
	jsonResponse(w, cfg, http.StatusOK)
}

// SaveTelegramConfig creates or updates Telegram config
func SaveTelegramConfig(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "id")
	user := middleware.GetUser(r)

	var project models.Project
	if err := database.DB.Where("id = ? AND user_id = ?", projectID, user.ID).First(&project).Error; err != nil {
		jsonError(w, "project not found", http.StatusNotFound)
		return
	}

	var input struct {
		BotToken          string `json:"bot_token"`
		ChatID            string `json:"chat_id"`
		Enabled           bool   `json:"enabled"`
		NotifySignup      bool   `json:"notify_signup"`
		NotifyCoupon      bool   `json:"notify_coupon"`
		NotifyUnsubscribe bool   `json:"notify_unsubscribe"`
		CampaignFilter    string `json:"campaign_filter"`
	}
	if err := decodeJSON(r, &input); err != nil {
		jsonError(w, "invalid request", http.StatusBadRequest)
		return
	}

	var cfg models.TelegramConfig
	database.DB.Where("project_id = ?", projectID).First(&cfg)

	cfg.ProjectID = projectID
	cfg.BotToken = input.BotToken
	cfg.ChatID = input.ChatID
	cfg.Enabled = input.Enabled
	cfg.NotifySignup = input.NotifySignup
	cfg.NotifyCoupon = input.NotifyCoupon
	cfg.NotifyUnsubscribe = input.NotifyUnsubscribe
	cfg.CampaignFilter = input.CampaignFilter

	if cfg.ID == "" {
		database.DB.Create(&cfg)
	} else {
		database.DB.Save(&cfg)
	}

	jsonResponse(w, cfg, http.StatusOK)
}

// TestTelegramConfig sends a test message
func TestTelegramConfig(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "id")
	user := middleware.GetUser(r)

	var project models.Project
	if err := database.DB.Where("id = ? AND user_id = ?", projectID, user.ID).First(&project).Error; err != nil {
		jsonError(w, "project not found", http.StatusNotFound)
		return
	}

	var cfg models.TelegramConfig
	if err := database.DB.Where("project_id = ?", projectID).First(&cfg).Error; err != nil {
		jsonError(w, "telegram not configured", http.StatusBadRequest)
		return
	}

	err := services.SendTelegramNotification(cfg.BotToken, cfg.ChatID,
		"✅ <b>Waitless Test</b>\n\nTelegram notifications are working for: "+project.Name)
	if err != nil {
		jsonError(w, "failed to send: "+err.Error(), http.StatusBadRequest)
		return
	}

	jsonResponse(w, map[string]string{"message": "test sent"}, http.StatusOK)
}

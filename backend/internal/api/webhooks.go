package api

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/waitless/waitless/internal/database"
	"github.com/waitless/waitless/internal/middleware"
	"github.com/waitless/waitless/internal/models"
)

func ListWebhooks(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	projectID := chi.URLParam(r, "id")

	// Verify ownership
	var project models.Project
	query := database.DB
	if user.Role != models.RoleAdmin {
		query = query.Where("user_id = ?", user.ID)
	}
	if err := query.Where("id = ?", projectID).First(&project).Error; err != nil {
		jsonError(w, "project not found", http.StatusNotFound)
		return
	}

	var webhooks []models.Webhook
	database.DB.Where("project_id = ?", projectID).Order("created_at DESC").Find(&webhooks)
	jsonResponse(w, webhooks, http.StatusOK)
}

func CreateWebhook(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	projectID := chi.URLParam(r, "id")

	var project models.Project
	query := database.DB
	if user.Role != models.RoleAdmin {
		query = query.Where("user_id = ?", user.ID)
	}
	if err := query.Where("id = ?", projectID).First(&project).Error; err != nil {
		jsonError(w, "project not found", http.StatusNotFound)
		return
	}

	var req struct {
		URL    string `json:"url"`
		Events string `json:"events"` // "subscriber.created,subscriber.unsubscribed"
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid request", http.StatusBadRequest)
		return
	}
	if req.URL == "" {
		jsonError(w, "url is required", http.StatusBadRequest)
		return
	}

	secret, _ := generateToken()

	webhook := models.Webhook{
		ProjectID: projectID,
		URL:       req.URL,
		Events:    req.Events,
		Secret:    secret[:32],
		Active:    true,
	}
	if err := database.DB.Create(&webhook).Error; err != nil {
		jsonError(w, "error creating webhook", http.StatusInternalServerError)
		return
	}

	jsonResponse(w, map[string]interface{}{
		"webhook": webhook,
		"secret":  secret[:32], // Show once
	}, http.StatusCreated)
}

func DeleteWebhook(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	projectID := chi.URLParam(r, "id")
	whID := chi.URLParam(r, "whId")

	var project models.Project
	query := database.DB
	if user.Role != models.RoleAdmin {
		query = query.Where("user_id = ?", user.ID)
	}
	if err := query.Where("id = ?", projectID).First(&project).Error; err != nil {
		jsonError(w, "project not found", http.StatusNotFound)
		return
	}

	database.DB.Where("id = ? AND project_id = ?", whID, projectID).Delete(&models.Webhook{})
	jsonResponse(w, map[string]string{"message": "deleted"}, http.StatusOK)
}

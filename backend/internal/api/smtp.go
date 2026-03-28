package api

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/waitless/waitless/internal/database"
	"github.com/waitless/waitless/internal/middleware"
	"github.com/waitless/waitless/internal/models"
	"github.com/waitless/waitless/internal/services"
)

type smtpRequest struct {
	Host      string `json:"host"`
	Port      int    `json:"port"`
	Username  string `json:"username"`
	Password  string `json:"password"`
	FromEmail string `json:"from_email"`
	FromName  string `json:"from_name"`
	TLS       bool   `json:"tls"`
}

func GetSMTP(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	projectID := chi.URLParam(r, "id")

	if !userOwnsProject(user, projectID) {
		jsonError(w, "project not found", http.StatusNotFound)
		return
	}

	var smtp models.ProjectSMTP
	if err := database.DB.Where("project_id = ?", projectID).First(&smtp).Error; err != nil {
		jsonResponse(w, nil, http.StatusOK)
		return
	}

	// Never return the password
	smtp.Password = ""
	jsonResponse(w, smtp, http.StatusOK)
}

func SaveSMTP(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	projectID := chi.URLParam(r, "id")

	if !userOwnsProject(user, projectID) {
		jsonError(w, "project not found", http.StatusNotFound)
		return
	}

	var req smtpRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid request", http.StatusBadRequest)
		return
	}

	var smtp models.ProjectSMTP
	if err := database.DB.Where("project_id = ?", projectID).First(&smtp).Error; err != nil {
		smtp = models.ProjectSMTP{ProjectID: projectID}
	}

	smtp.Host = req.Host
	smtp.Port = req.Port
	if smtp.Port == 0 {
		smtp.Port = 587
	}
	smtp.Username = req.Username

	// Encrypt password at rest
	if req.Password != "" {
		encrypted, err := services.Encrypt(req.Password)
		if err != nil {
			jsonError(w, "encryption error", http.StatusInternalServerError)
			return
		}
		smtp.Password = encrypted
	}

	smtp.FromEmail = req.FromEmail
	smtp.FromName = req.FromName
	smtp.TLS = req.TLS
	smtp.Verified = false

	if smtp.ID == "" {
		database.DB.Create(&smtp)
	} else {
		database.DB.Save(&smtp)
	}

	smtp.Password = ""
	jsonResponse(w, smtp, http.StatusOK)
}

func TestSMTP(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	projectID := chi.URLParam(r, "id")

	if !userOwnsProject(user, projectID) {
		jsonError(w, "project not found", http.StatusNotFound)
		return
	}

	var smtp models.ProjectSMTP
	if err := database.DB.Where("project_id = ?", projectID).First(&smtp).Error; err != nil {
		jsonError(w, "no SMTP configured", http.StatusBadRequest)
		return
	}

	var project models.Project
	database.DB.Where("id = ?", projectID).First(&project)

	emailSvc := services.NewEmailService()
	if err := emailSvc.SendTestSMTP(&smtp, &project, user.Email); err != nil {
		database.DB.Model(&smtp).Update("verified", false)
		jsonError(w, "SMTP test failed: "+err.Error(), http.StatusBadRequest)
		return
	}

	database.DB.Model(&smtp).Update("verified", true)
	jsonResponse(w, map[string]string{"message": "SMTP test successful"}, http.StatusOK)
}

func userOwnsProject(user *models.User, projectID string) bool {
	var project models.Project
	q := database.DB
	if user.Role != models.RoleAdmin {
		q = q.Where("user_id = ?", user.ID)
	}
	return q.Where("id = ?", projectID).First(&project).Error == nil
}

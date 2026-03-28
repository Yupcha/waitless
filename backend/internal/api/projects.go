package api

import (
	"encoding/json"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/waitless/waitless/internal/database"
	"github.com/waitless/waitless/internal/middleware"
	"github.com/waitless/waitless/internal/models"
)

var slugRegex = regexp.MustCompile(`^[a-z0-9-]+$`)

type createProjectRequest struct {
	Name          string `json:"name"`
	Slug          string `json:"slug"`
	Description   string `json:"description"`
	LogoURL       string `json:"logo_url"`
	LaunchDate    string `json:"launch_date"`
	Features      string `json:"features"`
	CurrentPrice  string `json:"current_price"`
	DiscountPrice string `json:"discount_price"`
	OfferTitle    string `json:"offer_title"`
	ThemeColor    string `json:"theme_color"`
}

func ListProjects(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	var projects []models.Project
	database.DB.Where("user_id = ?", user.ID).Preload("SMTP").
		Order("created_at DESC").Find(&projects)
	jsonResponse(w, projects, http.StatusOK)
}

func CreateProject(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)

	var req createProjectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid request", http.StatusBadRequest)
		return
	}
	if req.Name == "" || req.Slug == "" {
		jsonError(w, "name and slug are required", http.StatusBadRequest)
		return
	}

	slug := strings.ToLower(strings.TrimSpace(req.Slug))
	if !slugRegex.MatchString(slug) {
		jsonError(w, "slug must be lowercase letters, numbers, and hyphens only", http.StatusBadRequest)
		return
	}

	// Check slug uniqueness
	var existing models.Project
	if database.DB.Where("slug = ?", slug).First(&existing).Error == nil {
		jsonError(w, "slug already taken", http.StatusConflict)
		return
	}

	project := models.Project{
		UserID:        user.ID,
		Name:          req.Name,
		Slug:          slug,
		Description:   req.Description,
		LogoURL:       req.LogoURL,
		Features:      req.Features,
		CurrentPrice:  req.CurrentPrice,
		DiscountPrice: req.DiscountPrice,
		OfferTitle:    req.OfferTitle,
		ThemeColor:    req.ThemeColor,
		Status:        models.ProjectActive,
	}

	if req.LaunchDate != "" {
		t, err := time.Parse("2006-01-02", req.LaunchDate)
		if err == nil {
			project.LaunchDate = &t
		}
	}

	if project.ThemeColor == "" {
		project.ThemeColor = "#f97316"
	}

	if err := database.DB.Create(&project).Error; err != nil {
		jsonError(w, "error creating project", http.StatusInternalServerError)
		return
	}

	jsonResponse(w, project, http.StatusCreated)
}

func GetProject(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	projectID := chi.URLParam(r, "id")

	var project models.Project
	query := database.DB.Preload("SMTP")
	if user.Role != models.RoleAdmin {
		query = query.Where("user_id = ?", user.ID)
	}
	if err := query.Where("id = ?", projectID).First(&project).Error; err != nil {
		jsonError(w, "project not found", http.StatusNotFound)
		return
	}

	jsonResponse(w, project, http.StatusOK)
}

func UpdateProject(w http.ResponseWriter, r *http.Request) {
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

	var req createProjectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid request", http.StatusBadRequest)
		return
	}

	if req.Name != "" {
		project.Name = req.Name
	}
	if req.Description != "" {
		project.Description = req.Description
	}
	if req.LogoURL != "" {
		project.LogoURL = req.LogoURL
	}
	if req.Features != "" {
		project.Features = req.Features
	}
	if req.CurrentPrice != "" {
		project.CurrentPrice = req.CurrentPrice
	}
	if req.DiscountPrice != "" {
		project.DiscountPrice = req.DiscountPrice
	}
	if req.OfferTitle != "" {
		project.OfferTitle = req.OfferTitle
	}
	if req.ThemeColor != "" {
		project.ThemeColor = req.ThemeColor
	}
	if req.LaunchDate != "" {
		t, err := time.Parse("2006-01-02", req.LaunchDate)
		if err == nil {
			project.LaunchDate = &t
		}
	}

	database.DB.Save(&project)
	jsonResponse(w, project, http.StatusOK)
}

func DeleteProject(w http.ResponseWriter, r *http.Request) {
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

	database.DB.Where("project_id = ?", project.ID).Delete(&models.Subscriber{})
	database.DB.Where("project_id = ?", project.ID).Delete(&models.ProjectSMTP{})
	database.DB.Where("project_id = ?", project.ID).Delete(&models.APIKey{})
	database.DB.Where("project_id = ?", project.ID).Delete(&models.EmailLog{})
	database.DB.Where("project_id = ?", project.ID).Delete(&models.AnalyticsRecord{})
	database.DB.Delete(&project)

	jsonResponse(w, map[string]string{"message": "deleted"}, http.StatusOK)
}

func GetProjectBySlug(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")

	var project models.Project
	if err := database.DB.Where("slug = ? AND status = ?", slug, models.ProjectActive).
		First(&project).Error; err != nil {
		jsonError(w, "waitlist not found", http.StatusNotFound)
		return
	}

	// Count subscribers
	var count int64
	database.DB.Model(&models.Subscriber{}).Where("project_id = ?", project.ID).Count(&count)

	// Track page view
	go func() {
		record := models.AnalyticsRecord{
			ProjectID: project.ID,
			Event:     models.EventPageView,
			IPAddress: r.RemoteAddr,
			UserAgent: r.UserAgent(),
		}
		database.DB.Create(&record)
	}()

	jsonResponse(w, map[string]interface{}{
		"project":          project,
		"subscriber_count": count,
	}, http.StatusOK)
}

func UpdateProjectStatus(w http.ResponseWriter, r *http.Request) {
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
		Status models.ProjectStatus `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid request", http.StatusBadRequest)
		return
	}

	project.Status = req.Status
	database.DB.Save(&project)
	jsonResponse(w, project, http.StatusOK)
}

func GetProjectStats(w http.ResponseWriter, r *http.Request) {
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

	var totalSubs, activeSubs, unsubscribed int64
	database.DB.Model(&models.Subscriber{}).Where("project_id = ?", projectID).Count(&totalSubs)
	database.DB.Model(&models.Subscriber{}).Where("project_id = ? AND status = ?", projectID, models.StatusActive).Count(&activeSubs)
	database.DB.Model(&models.Subscriber{}).Where("project_id = ? AND status = ?", projectID, models.StatusUnsubscribed).Count(&unsubscribed)

	var emailsSent, emailsFailed int64
	database.DB.Model(&models.EmailLog{}).Where("project_id = ? AND status = ?", projectID, models.EmailSent).Count(&emailsSent)
	database.DB.Model(&models.EmailLog{}).Where("project_id = ? AND status = ?", projectID, models.EmailFailed).Count(&emailsFailed)

	// Signups per day for last 30 days
	type DailyStat struct {
		Date  string `json:"date"`
		Count int64  `json:"count"`
	}
	var dailyStats []DailyStat
	database.DB.Raw(`
		SELECT DATE(created_at) as date, COUNT(*) as count 
		FROM subscribers 
		WHERE project_id = ? AND created_at > NOW() - INTERVAL '30 days'
		GROUP BY DATE(created_at) 
		ORDER BY date ASC
	`, projectID).Scan(&dailyStats)

	jsonResponse(w, map[string]interface{}{
		"total_subscribers": totalSubs,
		"active_subscribers": activeSubs,
		"unsubscribed":      unsubscribed,
		"emails_sent":       emailsSent,
		"emails_failed":     emailsFailed,
		"daily_signups":     dailyStats,
	}, http.StatusOK)
}

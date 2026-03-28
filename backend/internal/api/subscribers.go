package api

import (
	"encoding/csv"
	"encoding/json"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/waitless/waitless/internal/database"
	"github.com/waitless/waitless/internal/middleware"
	"github.com/waitless/waitless/internal/models"
	"github.com/waitless/waitless/internal/services"
)

type signupRequest struct {
	Email      string                 `json:"email"`
	Name       string                 `json:"name"`
	Source     string                 `json:"source"`
	Promo      string                 `json:"promo"`
	CustomData map[string]interface{} `json:"custom_data"`
}

type customFieldDef struct {
	Key      string   `json:"key"`
	Label    string   `json:"label"`
	Type     string   `json:"type"` // text, textarea, select, checkbox
	Required bool     `json:"required"`
	Options  []string `json:"options,omitempty"`
}

func PublicSignup(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")

	var req signupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid request", http.StatusBadRequest)
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.Name = services.SanitizeName(req.Name)

	if !services.ValidateEmail(req.Email) {
		jsonError(w, "invalid email address", http.StatusBadRequest)
		return
	}

	// Find project
	var project models.Project
	if err := database.DB.Where("slug = ? AND status = ?", slug, models.ProjectActive).
		Preload("SMTP").First(&project).Error; err != nil {
		jsonError(w, "waitlist not found", http.StatusNotFound)
		return
	}

	// Check for duplicate
	var existing models.Subscriber
	if database.DB.Where("project_id = ? AND email = ?", project.ID, req.Email).
		First(&existing).Error == nil {
		jsonError(w, "already subscribed", http.StatusConflict)
		return
	}

	// Honeypot - if 'website' field present, it's a bot
	if r.FormValue("website") != "" {
		jsonResponse(w, map[string]string{"message": "subscribed"}, http.StatusOK)
		return
	}

	source := models.SourceForm
	if req.Source == "api" {
		source = models.SourceAPI
	} else if req.Source == "widget" {
		source = models.SourceWidget
	}

	status := models.StatusActive
	if project.DoubleOptIn {
		status = models.StatusPending
	}

	// Validate and store custom data
	var customDataJSON string
	if project.CustomFields != "" && project.CustomFields != "[]" {
		var fields []customFieldDef
		if err := json.Unmarshal([]byte(project.CustomFields), &fields); err == nil {
			for _, f := range fields {
				if f.Required {
					val, exists := req.CustomData[f.Key]
					if !exists || val == nil || val == "" {
						jsonError(w, f.Label+" is required", http.StatusBadRequest)
						return
					}
				}
			}
		}
		if len(req.CustomData) > 0 {
			b, _ := json.Marshal(req.CustomData)
			customDataJSON = string(b)
		}
	}

	subscriber := models.Subscriber{
		ProjectID:  project.ID,
		Email:      req.Email,
		Name:       req.Name,
		Status:     status,
		Source:     source,
		IPAddress:  strings.Split(r.RemoteAddr, ":")[0],
		CustomData: customDataJSON,
	}

	if err := database.DB.Create(&subscriber).Error; err != nil {
		jsonError(w, "error saving subscriber", http.StatusInternalServerError)
		return
	}

	// Track signup event + referrer
	go func() {
		record := models.AnalyticsRecord{
			ProjectID: project.ID,
			Event:     models.EventSignup,
			IPAddress: strings.Split(r.RemoteAddr, ":")[0],
			UserAgent: r.UserAgent(),
			Referrer:  r.Header.Get("Referer"),
		}
		database.DB.Create(&record)
	}()

	// Generate coupon code if promo campaign is enabled
	coupon, campaign := GenerateCouponForSubscriber(project.ID, subscriber.ID, req.Promo)

	// Send welcome email async
	baseURL := getBaseURL(r)
	go func() {
		// Only attempt if SMTP is configured
		if project.SMTP == nil || project.SMTP.Host == "" {
			return
		}

		emailSvc := services.NewEmailService()
		emailStatus := models.EmailSent
		errMsg := ""

		var emailCoupon *models.CouponCode
		if coupon != nil && campaign != nil && campaign.DeliveryMethod == "email" {
			emailCoupon = coupon
		}

		if err := emailSvc.SendWelcome(project.SMTP, &project, &subscriber, emailCoupon, baseURL); err != nil {
			emailStatus = models.EmailFailed
			errMsg = err.Error()
		}

		log := models.EmailLog{
			ProjectID:    project.ID,
			SubscriberID: subscriber.ID,
			Template:     "welcome",
			Subject:      "Welcome to waitlist",
			Recipient:    subscriber.Email,
			Status:       emailStatus,
			Error:        errMsg,
			SentAt:       time.Now(),
		}
		database.DB.Create(&log)
	}()

	// Fire webhooks async
	go fireWebhooks(project.ID, "subscriber.created", subscriber)

	// Geo-lookup country async
	go services.UpdateSubscriberCountry(subscriber.ID, strings.Split(r.RemoteAddr, ":")[0])

	// Telegram notification async
	go services.NotifyNewSubscriber(project.ID, project.Name, subscriber.Email, subscriber.Name, req.Promo)

	resp := map[string]interface{}{
		"message":    "subscribed",
		"subscriber": subscriber,
	}
	if coupon != nil && campaign != nil && campaign.DeliveryMethod == "api" {
		resp["coupon"] = map[string]interface{}{
			"code":           coupon.Code,
			"discount_type":  coupon.DiscountType,
			"discount_value": coupon.DiscountValue,
			"currency":       coupon.Currency,
			"expires_at":     coupon.ExpiresAt,
		}
	}

	jsonResponse(w, resp, http.StatusCreated)
}

func HandleUnsubscribe(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		jsonError(w, "invalid token", http.StatusBadRequest)
		return
	}

	var subscriber models.Subscriber
	if err := database.DB.Where("unsubscribe_token = ?", token).First(&subscriber).Error; err != nil {
		jsonError(w, "invalid or expired token", http.StatusNotFound)
		return
	}

	subscriber.Status = models.StatusUnsubscribed
	database.DB.Save(&subscriber)

	// Fire webhook
	go fireWebhooks(subscriber.ProjectID, "subscriber.unsubscribed", subscriber)
	go services.NotifyUnsubscribe(subscriber.ProjectID, subscriber.Email)

	// Return a simple HTML page
	w.Header().Set("Content-Type", "text/html")
	w.Write([]byte(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Unsubscribed</title>
<style>body{margin:0;background:#0a0a12;color:#e2e8f0;font-family:Inter,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;}
.card{text-align:center;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:48px;max-width:440px;}
h1{font-size:24px;margin:0 0 8px;}.p{color:#64748b;font-size:15px;margin:0;}</style></head>
<body><div class="card"><h1>You've been unsubscribed</h1><p class="p">You won't receive any more emails from this waitlist.</p></div></body></html>`))
}

func ListSubscribers(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	projectID := chi.URLParam(r, "id")

	if projectID == "" {
		jsonError(w, "invalid project id", http.StatusBadRequest)
		return
	}

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

	// Pagination
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit < 1 || limit > 500 {
		limit = 50
	}
	offset := (page - 1) * limit

	// Filters
	search := r.URL.Query().Get("search")
	statusFilter := r.URL.Query().Get("status")
	sortBy := services.ValidateSortColumn(r.URL.Query().Get("sort_by"))
	sortDir := r.URL.Query().Get("sort_dir")

	q := database.DB.Where("project_id = ?", projectID)
	if search != "" {
		like := "%" + search + "%"
		q = q.Where("email ILIKE ? OR name ILIKE ?", like, like)
	}
	if statusFilter != "" {
		q = q.Where("status = ?", statusFilter)
	}
	countryFilter := r.URL.Query().Get("country")
	if countryFilter != "" {
		q = q.Where("country = ?", strings.ToUpper(countryFilter))
	}

	if sortDir != "asc" {
		sortDir = "desc"
	}
	q = q.Order(sortBy + " " + sortDir)

	var total int64
	q.Model(&models.Subscriber{}).Count(&total)

	var subscribers []models.Subscriber
	q.Offset(offset).Limit(limit).Find(&subscribers)

	// Enrich with coupon info
	subIDs := make([]string, len(subscribers))
	for i, s := range subscribers {
		subIDs[i] = s.ID
	}
	var coupons []models.CouponCode
	if len(subIDs) > 0 {
		database.DB.Where("subscriber_id IN ?", subIDs).Find(&coupons)
	}
	couponMap := map[string]models.CouponCode{}
	for _, c := range coupons {
		couponMap[c.SubscriberID] = c
	}

	type enrichedSub struct {
		models.Subscriber
		CouponCode   string `json:"coupon_code,omitempty"`
		CouponStatus string `json:"coupon_status,omitempty"`
		PromoUsed    string `json:"promo_used,omitempty"`
	}

	enriched := make([]enrichedSub, len(subscribers))
	for i, s := range subscribers {
		enriched[i] = enrichedSub{Subscriber: s}
		if c, ok := couponMap[s.ID]; ok {
			enriched[i].CouponCode = c.Code
			enriched[i].CouponStatus = string(c.Status)
			enriched[i].PromoUsed = c.SourceCode
		}
	}

	jsonResponse(w, map[string]interface{}{
		"subscribers": enriched,
		"total":       total,
		"page":        page,
		"limit":       limit,
	}, http.StatusOK)
}

func DeleteSubscriber(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	projectID := chi.URLParam(r, "id")
	subID := chi.URLParam(r, "subId")

	var project models.Project
	query := database.DB
	if user.Role != models.RoleAdmin {
		query = query.Where("user_id = ?", user.ID)
	}
	if err := query.Where("id = ?", projectID).First(&project).Error; err != nil {
		jsonError(w, "project not found", http.StatusNotFound)
		return
	}

	database.DB.Where("id = ? AND project_id = ?", subID, projectID).Delete(&models.Subscriber{})
	jsonResponse(w, map[string]string{"message": "deleted"}, http.StatusOK)
}

func UpdateSubscriberStatus(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	projectID := chi.URLParam(r, "id")
	subID := chi.URLParam(r, "subId")

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
		Status models.SubscriberStatus `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid request", http.StatusBadRequest)
		return
	}

	database.DB.Model(&models.Subscriber{}).
		Where("id = ? AND project_id = ?", subID, projectID).
		Update("status", req.Status)

	jsonResponse(w, map[string]string{"message": "updated"}, http.StatusOK)
}

func ExportSubscribersCSV(w http.ResponseWriter, r *http.Request) {
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

	var subscribers []models.Subscriber
	database.DB.Where("project_id = ?", projectID).Order("created_at ASC").Find(&subscribers)

	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", `attachment; filename="subscribers.csv"`)

	cw := csv.NewWriter(w)
	cw.Write([]string{"Name", "Email", "Status", "Source", "Signed Up"})
	for _, s := range subscribers {
		cw.Write([]string{
			s.Name,
			s.Email,
			string(s.Status),
			string(s.Source),
			s.CreatedAt.Format(time.RFC3339),
		})
	}
	cw.Flush()
}

func ImportSubscribersCSV(w http.ResponseWriter, r *http.Request) {
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

	// Parse multipart form (max 5MB)
	if err := r.ParseMultipartForm(5 << 20); err != nil {
		jsonError(w, "file too large or invalid", http.StatusBadRequest)
		return
	}

	file, _, err := r.FormFile("file")
	if err != nil {
		jsonError(w, "file required", http.StatusBadRequest)
		return
	}
	defer file.Close()

	reader := csv.NewReader(file)
	header, err := reader.Read()
	if err != nil {
		jsonError(w, "invalid CSV", http.StatusBadRequest)
		return
	}

	// Find email and name columns
	emailCol, nameCol := -1, -1
	for i, h := range header {
		h = strings.TrimSpace(strings.ToLower(h))
		if h == "email" {
			emailCol = i
		}
		if h == "name" {
			nameCol = i
		}
	}
	if emailCol < 0 {
		jsonError(w, "CSV must have an 'email' column", http.StatusBadRequest)
		return
	}

	imported, skipped := 0, 0
	for {
		row, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			continue
		}

		email := strings.TrimSpace(strings.ToLower(row[emailCol]))
		if !services.ValidateEmail(email) {
			skipped++
			continue
		}

		name := ""
		if nameCol >= 0 && nameCol < len(row) {
			name = services.SanitizeName(row[nameCol])
		}

		// Check duplicate
		var existing models.Subscriber
		if database.DB.Where("project_id = ? AND email = ?", projectID, email).First(&existing).Error == nil {
			skipped++
			continue
		}

		sub := models.Subscriber{
			ProjectID: projectID,
			Email:     email,
			Name:      name,
			Status:    models.StatusActive,
			Source:    models.SourceImport,
		}
		database.DB.Create(&sub)
		imported++
	}

	jsonResponse(w, map[string]interface{}{
		"imported": imported,
		"skipped":  skipped,
	}, http.StatusOK)
}

func BulkAction(w http.ResponseWriter, r *http.Request) {
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
		Action string   `json:"action"` // delete | unsubscribe | resubscribe
		IDs    []string `json:"ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid request", http.StatusBadRequest)
		return
	}

	switch req.Action {
	case "delete":
		database.DB.Where("id IN ? AND project_id = ?", req.IDs, projectID).Delete(&models.Subscriber{})
	case "unsubscribe":
		database.DB.Model(&models.Subscriber{}).
			Where("id IN ? AND project_id = ?", req.IDs, projectID).
			Update("status", models.StatusUnsubscribed)
	case "resubscribe":
		database.DB.Model(&models.Subscriber{}).
			Where("id IN ? AND project_id = ?", req.IDs, projectID).
			Update("status", models.StatusActive)
	default:
		jsonError(w, "unknown action", http.StatusBadRequest)
		return
	}

	jsonResponse(w, map[string]string{"message": "done"}, http.StatusOK)
}

// Email logs viewer
func ListEmailLogs(w http.ResponseWriter, r *http.Request) {
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

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	limit := 50
	offset := (page - 1) * limit

	var total int64
	database.DB.Model(&models.EmailLog{}).Where("project_id = ?", projectID).Count(&total)

	var logs []models.EmailLog
	database.DB.Where("project_id = ?", projectID).
		Order("sent_at DESC").
		Offset(offset).Limit(limit).Find(&logs)

	jsonResponse(w, map[string]interface{}{
		"logs":  logs,
		"total": total,
		"page":  page,
	}, http.StatusOK)
}

// API v1 — external API key endpoints
func APIListSubscribers(w http.ResponseWriter, r *http.Request) {
	pid := getAPIProjectID(r)
	if pid == "" {
		jsonError(w, "invalid project", http.StatusBadRequest)
		return
	}

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit < 1 || limit > 200 {
		limit = 50
	}

	var subscribers []models.Subscriber
	database.DB.Where("project_id = ?", pid).
		Order("created_at DESC").
		Offset((page - 1) * limit).Limit(limit).
		Find(&subscribers)

	var total int64
	database.DB.Model(&models.Subscriber{}).Where("project_id = ?", pid).Count(&total)

	jsonResponse(w, map[string]interface{}{
		"subscribers": subscribers,
		"total":       total,
		"page":        page,
	}, http.StatusOK)
}

func APIAddSubscriber(w http.ResponseWriter, r *http.Request) {
	pid := getAPIProjectID(r)
	if pid == "" {
		jsonError(w, "invalid project", http.StatusBadRequest)
		return
	}

	var req struct {
		Email string `json:"email"`
		Name  string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid request", http.StatusBadRequest)
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if !services.ValidateEmail(req.Email) {
		jsonError(w, "invalid email address", http.StatusBadRequest)
		return
	}

	// Check duplicate
	var existing models.Subscriber
	if database.DB.Where("project_id = ? AND email = ?", pid, req.Email).First(&existing).Error == nil {
		jsonError(w, "already subscribed", http.StatusConflict)
		return
	}

	sub := models.Subscriber{
		ProjectID: pid,
		Email:     req.Email,
		Name:      services.SanitizeName(req.Name),
		Status:    models.StatusActive,
		Source:    models.SourceAPI,
	}
	if err := database.DB.Create(&sub).Error; err != nil {
		jsonError(w, "error creating subscriber", http.StatusInternalServerError)
		return
	}

	// Fire webhooks
	go fireWebhooks(pid, "subscriber.created", sub)

	jsonResponse(w, sub, http.StatusCreated)
}

func APISubscriberCount(w http.ResponseWriter, r *http.Request) {
	pid := getAPIProjectID(r)
	if pid == "" {
		jsonError(w, "invalid project", http.StatusBadRequest)
		return
	}

	var total, active int64
	database.DB.Model(&models.Subscriber{}).Where("project_id = ?", pid).Count(&total)
	database.DB.Model(&models.Subscriber{}).Where("project_id = ? AND status = ?", pid, models.StatusActive).Count(&active)

	jsonResponse(w, map[string]int64{
		"total":  total,
		"active": active,
	}, http.StatusOK)
}

// Helper: get project ID from API key context
func getAPIProjectID(r *http.Request) string {
	return middleware.GetAPIKeyProjectID(r)
}

// Helper: get base URL from request
func getBaseURL(r *http.Request) string {
	scheme := "https"
	if r.TLS == nil {
		scheme = "http"
	}
	return scheme + "://" + r.Host
}

// Fire webhooks for event
func fireWebhooks(projectID string, event string, data interface{}) {
	var webhooks []models.Webhook
	database.DB.Where("project_id = ? AND active = ?", projectID, true).Find(&webhooks)

	for _, wh := range webhooks {
		if !strings.Contains(wh.Events, event) {
			continue
		}
		// Fire webhook in background
		go func(url string) {
			payload, _ := json.Marshal(map[string]interface{}{
				"event":     event,
				"data":      data,
				"timestamp": time.Now().UTC().Format(time.RFC3339),
			})
			resp, err := http.Post(url, "application/json", strings.NewReader(string(payload)))
			if err != nil {
				database.DB.Model(&wh).Update("last_error", err.Error())
				return
			}
			resp.Body.Close()
			if resp.StatusCode >= 400 {
				database.DB.Model(&wh).Update("last_error", "HTTP "+resp.Status)
			} else {
				database.DB.Model(&wh).Update("last_error", "")
			}
		}(wh.URL)
	}
}

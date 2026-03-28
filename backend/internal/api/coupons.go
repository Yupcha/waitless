package api

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/waitless/waitless/internal/database"
	"github.com/waitless/waitless/internal/models"
)

// ============ Dashboard Handlers ============

// GetPromoCampaign returns the promo campaign config for a project
func GetPromoCampaign(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "id")
	userID := r.Context().Value("user_id").(string)

	// Verify ownership
	var project models.Project
	if err := database.DB.Where("id = ? AND user_id = ?", projectID, userID).First(&project).Error; err != nil {
		jsonError(w, "project not found", http.StatusNotFound)
		return
	}

	var campaign models.PromoCampaign
	database.DB.Where("project_id = ?", projectID).First(&campaign)

	// Also get stats
	var totalCodes int64
	var usedCodes int64
	var activeCodes int64
	database.DB.Model(&models.CouponCode{}).Where("project_id = ?", projectID).Count(&totalCodes)
	database.DB.Model(&models.CouponCode{}).Where("project_id = ? AND status = ?", projectID, models.CouponUsed).Count(&usedCodes)
	database.DB.Model(&models.CouponCode{}).Where("project_id = ? AND status = ?", projectID, models.CouponActive).Count(&activeCodes)

	jsonResponse(w, map[string]interface{}{
		"campaign":     campaign,
		"total_codes":  totalCodes,
		"used_codes":   usedCodes,
		"active_codes": activeCodes,
	}, http.StatusOK)
}

// SavePromoCampaign creates or updates the promo campaign config
func SavePromoCampaign(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "id")
	userID := r.Context().Value("user_id").(string)

	var project models.Project
	if err := database.DB.Where("id = ? AND user_id = ?", projectID, userID).First(&project).Error; err != nil {
		jsonError(w, "project not found", http.StatusNotFound)
		return
	}

	var input struct {
		Enabled       bool    `json:"enabled"`
		DiscountType  string  `json:"discount_type"`
		DiscountValue float64 `json:"discount_value"`
		Currency      string  `json:"currency"`
		CodePrefix    string  `json:"code_prefix"`
		CodeLength    int     `json:"code_length"`
		MaxCodes      int     `json:"max_codes"`
		ValidDays     int     `json:"valid_days"`
		Description   string  `json:"description"`
	}
	if err := decodeJSON(r, &input); err != nil {
		jsonError(w, "invalid request", http.StatusBadRequest)
		return
	}

	if input.DiscountType != "flat" && input.DiscountType != "percent" {
		input.DiscountType = "flat"
	}
	if input.CodeLength < 6 {
		input.CodeLength = 8
	}
	if input.Currency == "" {
		input.Currency = "USD"
	}

	var campaign models.PromoCampaign
	database.DB.Where("project_id = ?", projectID).First(&campaign)

	campaign.ProjectID = projectID
	campaign.Enabled = input.Enabled
	campaign.DiscountType = models.DiscountType(input.DiscountType)
	campaign.DiscountValue = input.DiscountValue
	campaign.Currency = input.Currency
	campaign.CodePrefix = input.CodePrefix
	campaign.CodeLength = input.CodeLength
	campaign.MaxCodes = input.MaxCodes
	campaign.ValidDays = input.ValidDays
	campaign.Description = input.Description

	if campaign.ID == "" {
		database.DB.Create(&campaign)
	} else {
		database.DB.Save(&campaign)
	}

	jsonResponse(w, campaign, http.StatusOK)
}

// ListCouponCodes lists all coupon codes for a project
func ListCouponCodes(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "id")
	userID := r.Context().Value("user_id").(string)

	var project models.Project
	if err := database.DB.Where("id = ? AND user_id = ?", projectID, userID).First(&project).Error; err != nil {
		jsonError(w, "project not found", http.StatusNotFound)
		return
	}

	status := r.URL.Query().Get("status")
	search := r.URL.Query().Get("search")
	page := queryInt(r, "page", 1)
	limit := queryInt(r, "limit", 50)
	offset := (page - 1) * limit

	query := database.DB.Where("coupon_codes.project_id = ?", projectID).
		Preload("Subscriber")

	if status != "" {
		query = query.Where("coupon_codes.status = ?", status)
	}
	if search != "" {
		query = query.Joins("JOIN subscribers ON subscribers.id = coupon_codes.subscriber_id").
			Where("coupon_codes.code ILIKE ? OR subscribers.email ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	var total int64
	query.Model(&models.CouponCode{}).Count(&total)

	var codes []models.CouponCode
	query.Order("coupon_codes.created_at DESC").Offset(offset).Limit(limit).Find(&codes)

	// Auto-expire codes past their expiry
	now := time.Now()
	for i, c := range codes {
		if c.Status == models.CouponActive && c.ExpiresAt != nil && c.ExpiresAt.Before(now) {
			codes[i].Status = models.CouponExpired
			database.DB.Model(&c).Update("status", models.CouponExpired)
		}
	}

	jsonResponse(w, map[string]interface{}{
		"coupons": codes,
		"total":   total,
		"page":    page,
	}, http.StatusOK)
}

// RevokeCouponCode revokes a single coupon code
func RevokeCouponCode(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "id")
	couponID := chi.URLParam(r, "cid")
	userID := r.Context().Value("user_id").(string)

	var project models.Project
	if err := database.DB.Where("id = ? AND user_id = ?", projectID, userID).First(&project).Error; err != nil {
		jsonError(w, "project not found", http.StatusNotFound)
		return
	}

	var coupon models.CouponCode
	if err := database.DB.Where("id = ? AND project_id = ?", couponID, projectID).First(&coupon).Error; err != nil {
		jsonError(w, "coupon not found", http.StatusNotFound)
		return
	}

	coupon.Status = models.CouponRevoked
	database.DB.Save(&coupon)

	jsonResponse(w, coupon, http.StatusOK)
}

// ============ REST API v1 Handlers ============

// APIValidateCoupon validates a coupon code and returns discount info
func APIValidateCoupon(w http.ResponseWriter, r *http.Request) {
	projectID := r.Context().Value("project_id").(string)
	code := r.URL.Query().Get("code")

	if code == "" {
		jsonError(w, "code parameter required", http.StatusBadRequest)
		return
	}

	var coupon models.CouponCode
	if err := database.DB.Where("code = ? AND project_id = ?", code, projectID).
		Preload("Subscriber").First(&coupon).Error; err != nil {
		jsonError(w, "coupon not found", http.StatusNotFound)
		return
	}

	// Auto-expire if past expiry
	if coupon.Status == models.CouponActive && coupon.ExpiresAt != nil && coupon.ExpiresAt.Before(time.Now()) {
		coupon.Status = models.CouponExpired
		database.DB.Model(&coupon).Update("status", models.CouponExpired)
	}

	valid := coupon.Status == models.CouponActive

	jsonResponse(w, map[string]interface{}{
		"valid":          valid,
		"code":           coupon.Code,
		"status":         coupon.Status,
		"discount_type":  coupon.DiscountType,
		"discount_value": coupon.DiscountValue,
		"currency":       coupon.Currency,
		"expires_at":     coupon.ExpiresAt,
		"subscriber": map[string]interface{}{
			"id":    coupon.Subscriber.ID,
			"email": coupon.Subscriber.Email,
			"name":  coupon.Subscriber.Name,
		},
	}, http.StatusOK)
}

// APIUpdateCouponStatus updates the status of a coupon code via REST API
func APIUpdateCouponStatus(w http.ResponseWriter, r *http.Request) {
	projectID := r.Context().Value("project_id").(string)
	code := chi.URLParam(r, "code")

	var input struct {
		Status string `json:"status"`
	}
	if err := decodeJSON(r, &input); err != nil {
		jsonError(w, "invalid request", http.StatusBadRequest)
		return
	}

	validStatuses := map[string]bool{"active": true, "used": true, "revoked": true, "expired": true}
	if !validStatuses[input.Status] {
		jsonError(w, "invalid status, must be: active, used, revoked, expired", http.StatusBadRequest)
		return
	}

	var coupon models.CouponCode
	if err := database.DB.Where("code = ? AND project_id = ?", code, projectID).First(&coupon).Error; err != nil {
		jsonError(w, "coupon not found", http.StatusNotFound)
		return
	}

	coupon.Status = models.CouponStatus(input.Status)
	if input.Status == "used" {
		now := time.Now()
		coupon.UsedAt = &now
	}
	database.DB.Save(&coupon)

	// Fire webhook if status changed to "used"
	if input.Status == "used" {
		go fireWebhooks(projectID, "coupon.redeemed", map[string]interface{}{
			"coupon_code":   coupon.Code,
			"subscriber_id": coupon.SubscriberID,
			"discount_type": coupon.DiscountType,
			"discount_value": coupon.DiscountValue,
		})
	}

	jsonResponse(w, coupon, http.StatusOK)
}

// GenerateCouponForSubscriber creates a coupon code for a new subscriber if promo is enabled
func GenerateCouponForSubscriber(projectID, subscriberID string) *models.CouponCode {
	var campaign models.PromoCampaign
	if err := database.DB.Where("project_id = ? AND enabled = true", projectID).First(&campaign).Error; err != nil {
		return nil
	}

	// Check max codes limit
	if campaign.MaxCodes > 0 {
		var count int64
		database.DB.Model(&models.CouponCode{}).Where("project_id = ?", projectID).Count(&count)
		if int(count) >= campaign.MaxCodes {
			return nil
		}
	}

	code := models.GenerateCouponCode(campaign.CodePrefix, campaign.CodeLength)

	coupon := models.CouponCode{
		ProjectID:     projectID,
		SubscriberID:  subscriberID,
		Code:          code,
		Status:        models.CouponActive,
		DiscountType:  campaign.DiscountType,
		DiscountValue: campaign.DiscountValue,
		Currency:      campaign.Currency,
	}

	if campaign.ValidDays > 0 {
		exp := time.Now().AddDate(0, 0, campaign.ValidDays)
		coupon.ExpiresAt = &exp
	}

	database.DB.Create(&coupon)
	return &coupon
}

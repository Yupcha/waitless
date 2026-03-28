package api

import (
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/waitless/waitless/internal/database"
	middleware "github.com/waitless/waitless/internal/middleware"
	"github.com/waitless/waitless/internal/models"
	"github.com/waitless/waitless/internal/services"
)

// ============ Dashboard Handlers ============

// ListPromoCampaigns returns all promo campaigns for a project with stats
func ListPromoCampaigns(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "id")
	user := middleware.GetUser(r)

	var project models.Project
	if err := database.DB.Where("id = ? AND user_id = ?", projectID, user.ID).First(&project).Error; err != nil {
		jsonError(w, "project not found", http.StatusNotFound)
		return
	}

	var campaigns []models.PromoCampaign
	database.DB.Where("project_id = ?", projectID).Order("is_default DESC, created_at DESC").Find(&campaigns)

	// Fill codes_issued virtual field
	for i, c := range campaigns {
		var count int64
		database.DB.Model(&models.CouponCode{}).Where("campaign_id = ?", c.ID).Count(&count)
		campaigns[i].CodesIssued = count
	}

	// Global stats
	var totalCodes int64
	var usedCodes int64
	var activeCodes int64
	database.DB.Model(&models.CouponCode{}).Where("project_id = ?", projectID).Count(&totalCodes)
	database.DB.Model(&models.CouponCode{}).Where("project_id = ? AND status = ?", projectID, models.CouponUsed).Count(&usedCodes)
	database.DB.Model(&models.CouponCode{}).Where("project_id = ? AND status = ?", projectID, models.CouponActive).Count(&activeCodes)

	jsonResponse(w, map[string]interface{}{
		"campaigns":    campaigns,
		"total_codes":  totalCodes,
		"used_codes":   usedCodes,
		"active_codes": activeCodes,
	}, http.StatusOK)
}

// CreatePromoCampaign creates a new promo campaign
func CreatePromoCampaign(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "id")
	user := middleware.GetUser(r)

	var project models.Project
	if err := database.DB.Where("id = ? AND user_id = ?", projectID, user.ID).First(&project).Error; err != nil {
		jsonError(w, "project not found", http.StatusNotFound)
		return
	}

	var input struct {
		PromoCode     string  `json:"promo_code"`
		IsDefault     bool    `json:"is_default"`
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

	input.PromoCode = strings.TrimSpace(strings.ToLower(input.PromoCode))

	if input.DiscountType != "flat" && input.DiscountType != "percent" {
		input.DiscountType = "flat"
	}
	if input.CodeLength < 6 {
		input.CodeLength = 8
	}
	if input.Currency == "" {
		input.Currency = "USD"
	}

	// Check duplicate promo_code within project
	if input.PromoCode != "" {
		var existing models.PromoCampaign
		if database.DB.Where("project_id = ? AND promo_code = ?", projectID, input.PromoCode).First(&existing).Error == nil {
			jsonError(w, "promo code already exists for this project", http.StatusConflict)
			return
		}
	}

	// If setting as default, unset other defaults
	if input.IsDefault {
		database.DB.Model(&models.PromoCampaign{}).Where("project_id = ? AND is_default = ?", projectID, true).
			Update("is_default", false)
	}

	campaign := models.PromoCampaign{
		ProjectID:     projectID,
		PromoCode:     input.PromoCode,
		IsDefault:     input.IsDefault,
		Enabled:       input.Enabled,
		DiscountType:  models.DiscountType(input.DiscountType),
		DiscountValue: input.DiscountValue,
		Currency:      input.Currency,
		CodePrefix:    input.CodePrefix,
		CodeLength:    input.CodeLength,
		MaxCodes:      input.MaxCodes,
		ValidDays:     input.ValidDays,
		Description:   input.Description,
	}

	database.DB.Create(&campaign)
	jsonResponse(w, campaign, http.StatusCreated)
}

// UpdatePromoCampaign updates an existing campaign
func UpdatePromoCampaign(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "id")
	campaignID := chi.URLParam(r, "cid")
	user := middleware.GetUser(r)

	var project models.Project
	if err := database.DB.Where("id = ? AND user_id = ?", projectID, user.ID).First(&project).Error; err != nil {
		jsonError(w, "project not found", http.StatusNotFound)
		return
	}

	var campaign models.PromoCampaign
	if err := database.DB.Where("id = ? AND project_id = ?", campaignID, projectID).First(&campaign).Error; err != nil {
		jsonError(w, "campaign not found", http.StatusNotFound)
		return
	}

	var input struct {
		PromoCode     string  `json:"promo_code"`
		IsDefault     bool    `json:"is_default"`
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

	input.PromoCode = strings.TrimSpace(strings.ToLower(input.PromoCode))

	// Check duplicate promo_code (excluding self)
	if input.PromoCode != "" {
		var existing models.PromoCampaign
		if database.DB.Where("project_id = ? AND promo_code = ? AND id != ?", projectID, input.PromoCode, campaignID).First(&existing).Error == nil {
			jsonError(w, "promo code already exists for this project", http.StatusConflict)
			return
		}
	}

	if input.IsDefault && !campaign.IsDefault {
		database.DB.Model(&models.PromoCampaign{}).Where("project_id = ? AND is_default = ? AND id != ?", projectID, true, campaignID).
			Update("is_default", false)
	}

	campaign.PromoCode = input.PromoCode
	campaign.IsDefault = input.IsDefault
	campaign.Enabled = input.Enabled
	campaign.DiscountType = models.DiscountType(input.DiscountType)
	campaign.DiscountValue = input.DiscountValue
	campaign.Currency = input.Currency
	campaign.CodePrefix = input.CodePrefix
	campaign.CodeLength = input.CodeLength
	campaign.MaxCodes = input.MaxCodes
	campaign.ValidDays = input.ValidDays
	campaign.Description = input.Description

	database.DB.Save(&campaign)
	jsonResponse(w, campaign, http.StatusOK)
}

// DeletePromoCampaign deletes a campaign
func DeletePromoCampaign(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "id")
	campaignID := chi.URLParam(r, "cid")
	user := middleware.GetUser(r)

	var project models.Project
	if err := database.DB.Where("id = ? AND user_id = ?", projectID, user.ID).First(&project).Error; err != nil {
		jsonError(w, "project not found", http.StatusNotFound)
		return
	}

	database.DB.Where("id = ? AND project_id = ?", campaignID, projectID).Delete(&models.PromoCampaign{})
	jsonResponse(w, map[string]string{"message": "deleted"}, http.StatusOK)
}

// ListCouponCodes lists all coupon codes for a project
func ListCouponCodes(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "id")
	user := middleware.GetUser(r)

	var project models.Project
	if err := database.DB.Where("id = ? AND user_id = ?", projectID, user.ID).First(&project).Error; err != nil {
		jsonError(w, "project not found", http.StatusNotFound)
		return
	}

	status := r.URL.Query().Get("status")
	search := r.URL.Query().Get("search")
	campaignFilter := r.URL.Query().Get("campaign_id")
	page := queryInt(r, "page", 1)
	limit := queryInt(r, "limit", 50)
	offset := (page - 1) * limit

	query := database.DB.Where("coupon_codes.project_id = ?", projectID).
		Preload("Subscriber").Preload("Campaign")

	if status != "" {
		query = query.Where("coupon_codes.status = ?", status)
	}
	if campaignFilter != "" {
		query = query.Where("coupon_codes.campaign_id = ?", campaignFilter)
	}
	if search != "" {
		query = query.Joins("JOIN subscribers ON subscribers.id = coupon_codes.subscriber_id").
			Where("coupon_codes.code ILIKE ? OR subscribers.email ILIKE ? OR coupon_codes.source_code ILIKE ?",
				"%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	var total int64
	query.Model(&models.CouponCode{}).Count(&total)

	var codes []models.CouponCode
	query.Order("coupon_codes.created_at DESC").Offset(offset).Limit(limit).Find(&codes)

	// Auto-expire
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
	user := middleware.GetUser(r)

	var project models.Project
	if err := database.DB.Where("id = ? AND user_id = ?", projectID, user.ID).First(&project).Error; err != nil {
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
	projectID := getAPIProjectID(r)
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

	// Auto-expire
	if coupon.Status == models.CouponActive && coupon.ExpiresAt != nil && coupon.ExpiresAt.Before(time.Now()) {
		coupon.Status = models.CouponExpired
		database.DB.Model(&coupon).Update("status", models.CouponExpired)
	}

	valid := coupon.Status == models.CouponActive

	jsonResponse(w, map[string]interface{}{
		"valid":          valid,
		"code":           coupon.Code,
		"source_code":    coupon.SourceCode,
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
	projectID := getAPIProjectID(r)
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

	if input.Status == "used" {
		go fireWebhooks(projectID, "coupon.redeemed", map[string]interface{}{
			"coupon_code":    coupon.Code,
			"source_code":    coupon.SourceCode,
			"subscriber_id":  coupon.SubscriberID,
			"discount_type":  coupon.DiscountType,
			"discount_value": coupon.DiscountValue,
		})
		// Telegram notification
		go func() {
			var sub models.Subscriber
			database.DB.Where("id = ?", coupon.SubscriberID).First(&sub)
			services.NotifyCouponRedeemed(projectID, coupon.Code, sub.Email)
		}()
	}

	jsonResponse(w, coupon, http.StatusOK)
}

// GenerateCouponForSubscriber creates a coupon code for a new subscriber
// promoCode is the trigger code passed by the subscriber (e.g., "get5")
func GenerateCouponForSubscriber(projectID, subscriberID, promoCode string) *models.CouponCode {
	var campaign models.PromoCampaign

	promoCode = strings.TrimSpace(strings.ToLower(promoCode))

	if promoCode != "" {
		// Try to match specific campaign by promo code
		if err := database.DB.Where("project_id = ? AND promo_code = ? AND enabled = true", projectID, promoCode).
			First(&campaign).Error; err != nil {
			// No matching campaign for this code, try default
			if err := database.DB.Where("project_id = ? AND is_default = true AND enabled = true", projectID).
				First(&campaign).Error; err != nil {
				return nil
			}
		}
	} else {
		// No promo code provided, use default campaign
		if err := database.DB.Where("project_id = ? AND is_default = true AND enabled = true", projectID).
			First(&campaign).Error; err != nil {
			return nil
		}
	}

	// Check max codes limit
	if campaign.MaxCodes > 0 {
		var count int64
		database.DB.Model(&models.CouponCode{}).Where("campaign_id = ?", campaign.ID).Count(&count)
		if int(count) >= campaign.MaxCodes {
			return nil
		}
	}

	code := models.GenerateCouponCode(campaign.CodePrefix, campaign.CodeLength)

	coupon := models.CouponCode{
		ProjectID:     projectID,
		CampaignID:    campaign.ID,
		SubscriberID:  subscriberID,
		Code:          code,
		SourceCode:    promoCode,
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

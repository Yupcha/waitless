package api

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/waitless/waitless/internal/database"
	"github.com/waitless/waitless/internal/middleware"
	"github.com/waitless/waitless/internal/models"
	"github.com/waitless/waitless/internal/services"
	"golang.org/x/oauth2"
)

// ── Gmail OAuth handlers ───────────────────────────────────────────────────────

// GET /api/dashboard/projects/{id}/oauth/gmail/connect
// Generates and returns the Google consent URL for the frontend to redirect to.
func GmailOAuthConnect(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	projectID := chi.URLParam(r, "id")

	if !userOwnsProject(user, projectID) {
		jsonError(w, "project not found", http.StatusNotFound)
		return
	}

	cfg := services.GmailOAuthConfig()
	// state = projectID so callback knows which project to update
	url := cfg.AuthCodeURL(projectID, oauth2.AccessTypeOffline, oauth2.ApprovalForce)
	jsonResponse(w, map[string]string{"url": url}, http.StatusOK)
}

// GET /api/oauth/gmail/callback  (public — no auth middleware, Google redirects here)
func GmailOAuthCallback(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	projectID := r.URL.Query().Get("state")

	if code == "" || projectID == "" {
		http.Error(w, "invalid callback params", http.StatusBadRequest)
		return
	}

	cfg := services.GmailOAuthConfig()
	token, err := cfg.Exchange(context.Background(), code)
	if err != nil {
		http.Error(w, "failed to exchange code: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Fetch the connected Google email address
	client := cfg.Client(context.Background(), token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		http.Error(w, "failed to get user info: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()
	var info struct {
		Email string `json:"email"`
	}
	json.NewDecoder(resp.Body).Decode(&info)

	// Encrypt and persist tokens
	encAccess, _ := services.Encrypt(token.AccessToken)
	encRefresh, _ := services.Encrypt(token.RefreshToken)

	var smtp models.ProjectSMTP
	if err := database.DB.Where("project_id = ?", projectID).First(&smtp).Error; err != nil {
		smtp = models.ProjectSMTP{ProjectID: projectID}
	}
	smtp.Provider = "gmail_oauth"
	smtp.OAuthAccessToken = encAccess
	smtp.OAuthRefreshToken = encRefresh
	smtp.OAuthTokenExpiry = &token.Expiry
	smtp.OAuthEmail = info.Email
	smtp.FromEmail = info.Email // default from = the connected address
	smtp.Verified = true

	if smtp.ID == "" {
		database.DB.Create(&smtp)
	} else {
		database.DB.Save(&smtp)
	}

	// Redirect back to the SMTP settings page in the dashboard
	baseURL := os.Getenv("BASE_URL")
	if baseURL == "" {
		baseURL = "http://localhost:8080"
	}
	http.Redirect(w, r, baseURL+"/dashboard/projects/"+projectID+"/smtp?oauth=gmail_success", http.StatusFound)
}

// DELETE /api/dashboard/projects/{id}/oauth/gmail/disconnect
// Clears OAuth tokens and resets to plain SMTP mode.
func GmailOAuthDisconnect(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	projectID := chi.URLParam(r, "id")

	if !userOwnsProject(user, projectID) {
		jsonError(w, "project not found", http.StatusNotFound)
		return
	}

	var smtp models.ProjectSMTP
	if err := database.DB.Where("project_id = ?", projectID).First(&smtp).Error; err != nil {
		jsonError(w, "no email config found", http.StatusNotFound)
		return
	}
	smtp.Provider = "smtp"
	smtp.OAuthAccessToken = ""
	smtp.OAuthRefreshToken = ""
	smtp.OAuthTokenExpiry = nil
	smtp.OAuthEmail = ""
	smtp.Verified = false
	database.DB.Save(&smtp)

	jsonResponse(w, map[string]string{"message": "disconnected"}, http.StatusOK)
}

// ── Zoho OAuth handlers ────────────────────────────────────────────────────────

// GET /api/dashboard/projects/{id}/oauth/zoho/connect
func ZohoOAuthConnect(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	projectID := chi.URLParam(r, "id")

	if !userOwnsProject(user, projectID) {
		jsonError(w, "project not found", http.StatusNotFound)
		return
	}

	cfg := services.ZohoOAuthConfig()

	// Build the Zoho OAuth URL manually to ensure exact parameter format.
	// Zoho is strict: scope must be comma-separated, access_type must be explicit.
	params := url.Values{}
	params.Set("response_type", "code")
	params.Set("client_id", cfg.ClientID)
	params.Set("scope", "ZohoMail.messages.CREATE,ZohoMail.accounts.READ")
	params.Set("redirect_uri", cfg.RedirectURL)
	params.Set("access_type", "offline")
	params.Set("state", projectID)

	authURL := cfg.Endpoint.AuthURL + "?" + params.Encode()
	log.Printf("[zoho-oauth] connect URL: %s", authURL)
	jsonResponse(w, map[string]string{"url": authURL}, http.StatusOK)
}

// POST /api/dashboard/projects/{id}/oauth/zoho/exchange
// Accepts a manually generated Zoho Self Client authorization code.
// Uses raw HTTP POST because Go's oauth2 library always sends redirect_uri,
// which Zoho Self Client rejects as "invalid_code".
func ZohoExchangeCode(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	projectID := chi.URLParam(r, "id")

	if !userOwnsProject(user, projectID) {
		jsonError(w, "project not found", http.StatusNotFound)
		return
	}

	var req struct {
		Code  string `json:"code"`
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Code == "" {
		jsonError(w, "authorization code is required", http.StatusBadRequest)
		return
	}

	cfg := services.ZohoOAuthConfig()

	// Raw POST to Zoho token endpoint — no redirect_uri for Self Client
	formData := url.Values{
		"grant_type":    {"authorization_code"},
		"client_id":     {cfg.ClientID},
		"client_secret": {cfg.ClientSecret},
		"code":          {req.Code},
	}

	log.Printf("[zoho-exchange] POST %s with client_id=%s code=%s...", cfg.Endpoint.TokenURL, cfg.ClientID, req.Code[:min(10, len(req.Code))])

	resp, err := http.PostForm(cfg.Endpoint.TokenURL, formData)
	if err != nil {
		jsonError(w, "failed to contact Zoho: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	var tokenResp struct {
		AccessToken  string `json:"access_token"`
		RefreshToken string `json:"refresh_token"`
		ExpiresIn    int    `json:"expires_in"`
		TokenType    string `json:"token_type"`
		Error        string `json:"error"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		jsonError(w, "failed to parse Zoho response", http.StatusInternalServerError)
		return
	}
	if tokenResp.Error != "" {
		log.Printf("[zoho-exchange] error from Zoho: %s", tokenResp.Error)
		jsonError(w, "Zoho error: "+tokenResp.Error, http.StatusBadRequest)
		return
	}
	if tokenResp.AccessToken == "" {
		jsonError(w, "Zoho returned empty access token", http.StatusBadRequest)
		return
	}

	log.Printf("[zoho-exchange] success: access_token=%s... refresh=%v", tokenResp.AccessToken[:min(10, len(tokenResp.AccessToken))], tokenResp.RefreshToken != "")

	accountEmail := req.Email
	expiry := time.Now().Add(time.Duration(tokenResp.ExpiresIn) * time.Second)
	if tokenResp.ExpiresIn == 0 {
		expiry = time.Now().Add(1 * time.Hour)
	}

	encAccess, _ := services.Encrypt(tokenResp.AccessToken)
	encRefresh, _ := services.Encrypt(tokenResp.RefreshToken)

	var smtpCfg models.ProjectSMTP
	if err := database.DB.Where("project_id = ?", projectID).First(&smtpCfg).Error; err != nil {
		smtpCfg = models.ProjectSMTP{ProjectID: projectID}
	}
	smtpCfg.Provider = "zoho_oauth"
	smtpCfg.OAuthAccessToken = encAccess
	smtpCfg.OAuthRefreshToken = encRefresh
	smtpCfg.OAuthTokenExpiry = &expiry
	smtpCfg.OAuthEmail = accountEmail
	smtpCfg.FromEmail = accountEmail
	smtpCfg.Verified = true

	if smtpCfg.ID == "" {
		database.DB.Create(&smtpCfg)
	} else {
		database.DB.Save(&smtpCfg)
	}

	jsonResponse(w, map[string]interface{}{
		"message":     "Zoho connected successfully",
		"oauth_email": accountEmail,
	}, http.StatusOK)
}


// GET /api/oauth/zoho/callback  (public — Zoho redirects here)
func ZohoOAuthCallback(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	projectID := r.URL.Query().Get("state")
	// Zoho includes accounts-server in callback e.g. https://accounts.zoho.in
	accountsServer := r.URL.Query().Get("accounts-server")

	log.Printf("[zoho-callback] code=%s... state=%s accounts-server=%s", code[:min(12, len(code))], projectID, accountsServer)

	if code == "" || projectID == "" {
		http.Error(w, "invalid callback params", http.StatusBadRequest)
		return
	}

	cfg := services.ZohoOAuthConfig()

	// Use the accounts-server Zoho gave us, falling back to config
	tokenURL := cfg.Endpoint.TokenURL
	if accountsServer != "" {
		tokenURL = accountsServer + "/oauth/v2/token"
	}

	formData := url.Values{
		"grant_type":    {"authorization_code"},
		"client_id":     {cfg.ClientID},
		"client_secret": {cfg.ClientSecret},
		"code":          {code},
		"redirect_uri":  {cfg.RedirectURL},
	}

	log.Printf("[zoho-callback] POST %s client_id=%s redirect_uri=%s", tokenURL, cfg.ClientID, cfg.RedirectURL)

	resp, err := http.PostForm(tokenURL, formData)
	if err != nil {
		log.Printf("[zoho-callback] HTTP error: %v", err)
		http.Error(w, "failed to contact Zoho: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	// Read the raw body for both parsing and debugging
	bodyBytes, _ := io.ReadAll(resp.Body)
	log.Printf("[zoho-callback] Zoho response (HTTP %d): %s", resp.StatusCode, string(bodyBytes))

	var tokenResp struct {
		AccessToken  string `json:"access_token"`
		RefreshToken string `json:"refresh_token"`
		ExpiresIn    int    `json:"expires_in"`
		Error        string `json:"error"`
		APIDomain    string `json:"api_domain"`
	}
	if err := json.Unmarshal(bodyBytes, &tokenResp); err != nil {
		log.Printf("[zoho-callback] JSON parse error: %v", err)
		http.Error(w, "failed to parse Zoho response: "+string(bodyBytes), http.StatusInternalServerError)
		return
	}
	if tokenResp.Error != "" || tokenResp.AccessToken == "" {
		log.Printf("[zoho-callback] token error: %s", tokenResp.Error)
		http.Error(w, "Zoho token error: "+tokenResp.Error, http.StatusBadRequest)
		return
	}

	log.Printf("[zoho-callback] SUCCESS! access_token=%s... refresh=%v api_domain=%s", tokenResp.AccessToken[:min(10, len(tokenResp.AccessToken))], tokenResp.RefreshToken != "", tokenResp.APIDomain)

	// Fetch Zoho email — try multiple API URL formats
	accountEmail := ""
	apiDomains := []string{}
	if tokenResp.APIDomain != "" {
		// e.g. https://www.zohoapis.in → try mail.zoho.in
		apiDomains = append(apiDomains, tokenResp.APIDomain)
	}
	// Also try mail.zoho.in based on accounts-server
	zohoDomain := services.ZohoDomain()
	if accountsServer != "" {
		parts := strings.Split(accountsServer, "accounts.")
		if len(parts) > 1 {
			zohoDomain = parts[1]
		}
	}
	apiDomains = append(apiDomains, "https://mail."+zohoDomain)

	for _, apiBase := range apiDomains {
		mailURL := apiBase + "/api/accounts"
		log.Printf("[zoho-callback] trying mail API: GET %s", mailURL)
		mailReq, _ := http.NewRequest("GET", mailURL, nil)
		mailReq.Header.Set("Authorization", "Zoho-oauthtoken "+tokenResp.AccessToken)
		mailResp, err := http.DefaultClient.Do(mailReq)
		if err != nil {
			log.Printf("[zoho-callback] mail API error: %v", err)
			continue
		}
		bodyBytes, _ := io.ReadAll(mailResp.Body)
		mailResp.Body.Close()
		log.Printf("[zoho-callback] mail API response (%d): %s", mailResp.StatusCode, string(bodyBytes))

		var zohoResp struct {
			Data []struct {
				MailID      string `json:"mailId"`
				PrimaryAddr string `json:"primaryEmailAddress"`
			} `json:"data"`
		}
		if json.Unmarshal(bodyBytes, &zohoResp) == nil && len(zohoResp.Data) > 0 {
			accountEmail = zohoResp.Data[0].MailID
			if accountEmail == "" {
				accountEmail = zohoResp.Data[0].PrimaryAddr
			}
			if accountEmail != "" {
				log.Printf("[zoho-callback] found email: %s", accountEmail)
				break
			}
		}
	}

	encAccess, _ := services.Encrypt(tokenResp.AccessToken)
	encRefresh, _ := services.Encrypt(tokenResp.RefreshToken)
	expiry := time.Now().Add(time.Duration(tokenResp.ExpiresIn) * time.Second)
	if tokenResp.ExpiresIn == 0 {
		expiry = time.Now().Add(1 * time.Hour)
	}

	var smtpCfg models.ProjectSMTP
	if err := database.DB.Where("project_id = ?", projectID).First(&smtpCfg).Error; err != nil {
		smtpCfg = models.ProjectSMTP{ProjectID: projectID}
	}
	smtpCfg.Provider = "zoho_oauth"
	smtpCfg.OAuthAccessToken = encAccess
	smtpCfg.OAuthRefreshToken = encRefresh
	smtpCfg.OAuthTokenExpiry = &expiry
	smtpCfg.OAuthEmail = accountEmail
	smtpCfg.FromEmail = accountEmail
	smtpCfg.Verified = accountEmail != "" // only verified if we got the email

	if smtpCfg.ID == "" {
		database.DB.Create(&smtpCfg)
	} else {
		database.DB.Save(&smtpCfg)
	}

	baseURL := os.Getenv("BASE_URL")
	if baseURL == "" {
		baseURL = "http://localhost:8080"
	}
	oauthStatus := "zoho_success"
	if accountEmail == "" {
		oauthStatus = "zoho_need_email"
	}
	http.Redirect(w, r, baseURL+"/dashboard/projects/"+projectID+"/smtp?oauth="+oauthStatus, http.StatusFound)
}

// PUT /api/dashboard/projects/{id}/oauth/zoho/email
// Sets the Zoho email after OAuth connect when auto-detection failed.
func ZohoSetEmail(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	projectID := chi.URLParam(r, "id")
	if !userOwnsProject(user, projectID) {
		jsonError(w, "project not found", http.StatusNotFound)
		return
	}
	var req struct {
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Email == "" {
		jsonError(w, "email is required", http.StatusBadRequest)
		return
	}
	var smtpCfg models.ProjectSMTP
	if err := database.DB.Where("project_id = ?", projectID).First(&smtpCfg).Error; err != nil {
		jsonError(w, "no SMTP config found", http.StatusNotFound)
		return
	}
	smtpCfg.OAuthEmail = req.Email
	smtpCfg.FromEmail = req.Email
	smtpCfg.Verified = true
	database.DB.Save(&smtpCfg)
	jsonResponse(w, map[string]string{"message": "email set", "oauth_email": req.Email}, http.StatusOK)
}

// DELETE /api/dashboard/projects/{id}/oauth/zoho/disconnect
func ZohoOAuthDisconnect(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	projectID := chi.URLParam(r, "id")

	if !userOwnsProject(user, projectID) {
		jsonError(w, "project not found", http.StatusNotFound)
		return
	}

	var smtp models.ProjectSMTP
	if err := database.DB.Where("project_id = ?", projectID).First(&smtp).Error; err != nil {
		jsonError(w, "no email config found", http.StatusNotFound)
		return
	}
	smtp.Provider = "smtp"
	smtp.OAuthAccessToken = ""
	smtp.OAuthRefreshToken = ""
	smtp.OAuthTokenExpiry = nil
	smtp.OAuthEmail = ""
	smtp.Verified = false
	database.DB.Save(&smtp)

	jsonResponse(w, map[string]string{"message": "disconnected"}, http.StatusOK)
}

// zohoTokenRefresh is used by email.go to refresh Zoho tokens
func ZohoRefreshToken(s *models.ProjectSMTP) (string, error) {
	refreshToken, err := services.Decrypt(s.OAuthRefreshToken)
	if err != nil {
		return "", fmt.Errorf("failed to decrypt refresh token: %w", err)
	}
	cfg := services.ZohoOAuthConfig()
	ts := cfg.TokenSource(context.Background(), &oauth2.Token{
		RefreshToken: refreshToken,
		Expiry:       time.Now().Add(-1 * time.Hour),
	})
	newToken, err := ts.Token()
	if err != nil {
		return "", fmt.Errorf("failed to refresh Zoho token: %w", err)
	}
	s.OAuthTokenExpiry = &newToken.Expiry
	return newToken.AccessToken, nil
}

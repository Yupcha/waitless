package services

import (
	"os"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

// GmailOAuthConfig returns the OAuth2 config for Gmail.
// Reads GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and BASE_URL from env.
func GmailOAuthConfig() *oauth2.Config {
	return &oauth2.Config{
		ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		RedirectURL:  os.Getenv("BASE_URL") + "/api/oauth/gmail/callback",
		Scopes: []string{
			"https://mail.google.com/",
			"https://www.googleapis.com/auth/userinfo.email",
		},
		Endpoint: google.Endpoint,
	}
}

// ZohoOAuthConfig returns the OAuth2 config for Zoho Mail.
// Uses ZOHO_DOMAIN env var (default: "zoho.in") to select the correct datacenter.
// Common values: zoho.com, zoho.in, zoho.eu, zoho.com.au
func ZohoOAuthConfig() *oauth2.Config {
	domain := os.Getenv("ZOHO_DOMAIN")
	if domain == "" {
		domain = "zoho.in" // default to India datacenter
	}
	return &oauth2.Config{
		ClientID:     os.Getenv("ZOHO_CLIENT_ID"),
		ClientSecret: os.Getenv("ZOHO_CLIENT_SECRET"),
		RedirectURL:  os.Getenv("BASE_URL") + "/api/oauth/zoho/callback",
		Scopes:       []string{"ZohoMail.messages.CREATE,ZohoMail.accounts.READ"},
		Endpoint: oauth2.Endpoint{
			AuthURL:   "https://accounts." + domain + "/oauth/v2/auth",
			TokenURL:  "https://accounts." + domain + "/oauth/v2/token",
			AuthStyle: oauth2.AuthStyleInParams,
		},
	}
}

// ZohoDomain returns the configured Zoho domain for SMTP host etc.
func ZohoDomain() string {
	domain := os.Getenv("ZOHO_DOMAIN")
	if domain == "" {
		domain = "zoho.in"
	}
	return domain
}

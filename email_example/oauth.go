package email

import (
	"context"
	"fmt"
	"log"
	"os"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"golang.org/x/oauth2/microsoft"
)

var (
	googleOAuthConfig    *oauth2.Config
	microsoftOAuthConfig *oauth2.Config
	zohoOAuthConfig      *oauth2.Config
)

// InitOAuth initializes the OAuth2 configs from environment variables.
// It should be called at startup.
func InitOAuth() {
	redirectURL := os.Getenv("EMAIL_OAUTH_REDIRECT_URL")
	if redirectURL == "" {
		redirectURL = "http://localhost:8080/api/email/oauth/callback" // fallback
	}

	if clientID := os.Getenv("GOOGLE_CLIENT_ID"); clientID != "" {
		googleOAuthConfig = &oauth2.Config{
			ClientID:     clientID,
			ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
			RedirectURL:  redirectURL,
			Scopes: []string{
				"https://mail.google.com/",
				"https://www.googleapis.com/auth/userinfo.email",
			},
			Endpoint: google.Endpoint,
		}
	}

	if clientID := os.Getenv("MICROSOFT_CLIENT_ID"); clientID != "" {
		microsoftOAuthConfig = &oauth2.Config{
			ClientID:     clientID,
			ClientSecret: os.Getenv("MICROSOFT_CLIENT_SECRET"),
			RedirectURL:  redirectURL,
			Scopes: []string{
				"https://outlook.office.com/IMAP.AccessAsUser.All",
				"https://outlook.office.com/SMTP.Send",
				"offline_access",
				"User.Read",
			},
			Endpoint: microsoft.AzureADEndpoint("common"),
		}
	}

	if clientID := os.Getenv("ZOHO_CLIENT_ID"); clientID != "" {
		// Zoho uses regional endpoints: .com (US), .in (India), .eu (Europe), etc.
		region := os.Getenv("ZOHO_REGION")
		if region == "" {
			region = "com" // default to US
		}
		zohoOAuthConfig = &oauth2.Config{
			ClientID:     clientID,
			ClientSecret: os.Getenv("ZOHO_CLIENT_SECRET"),
			RedirectURL:  redirectURL,
			Scopes: []string{
				"ZohoMail.messages.ALL",
				"ZohoMail.accounts.READ",
				"ZohoMail.folders.READ",
			},
			Endpoint: oauth2.Endpoint{
				AuthURL:   fmt.Sprintf("https://accounts.zoho.%s/oauth/v2/auth", region),
				TokenURL:  fmt.Sprintf("https://accounts.zoho.%s/oauth/v2/token", region),
				AuthStyle: oauth2.AuthStyleInParams,
			},
		}
		log.Printf("email: Zoho OAuth configured (region=%s, auth=%s, mail_api=%s)",
			region, zohoOAuthConfig.Endpoint.AuthURL, ZohoMailAPIBase())
	}
}

// GetOAuthURL returns the URL to redirect the user to for OAuth authentication
func GetOAuthURL(provider, state string) (string, error) {
	switch provider {
	case "gmail":
		if googleOAuthConfig == nil {
			return "", fmt.Errorf("Google OAuth not configured (missing GOOGLE_CLIENT_ID)")
		}
		// prompt=consent ensures we get a refresh token
		return googleOAuthConfig.AuthCodeURL(state, oauth2.AccessTypeOffline, oauth2.SetAuthURLParam("prompt", "consent")), nil
	case "outlook":
		if microsoftOAuthConfig == nil {
			return "", fmt.Errorf("Microsoft OAuth not configured (missing MICROSOFT_CLIENT_ID)")
		}
		return microsoftOAuthConfig.AuthCodeURL(state, oauth2.AccessTypeOffline), nil
	case "zoho":
		if zohoOAuthConfig == nil {
			return "", fmt.Errorf("Zoho OAuth not configured (missing ZOHO_CLIENT_ID)")
		}
		return zohoOAuthConfig.AuthCodeURL(state, oauth2.AccessTypeOffline, oauth2.SetAuthURLParam("prompt", "consent")), nil
	default:
		return "", fmt.Errorf("unsupported OAuth provider: %s", provider)
	}
}

// ExchangeOAuthCode exchanges the authorization code for tokens
func ExchangeOAuthCode(ctx context.Context, provider, code string) (*oauth2.Token, error) {
	switch provider {
	case "gmail":
		if googleOAuthConfig == nil {
			return nil, fmt.Errorf("Google OAuth not configured")
		}
		return googleOAuthConfig.Exchange(ctx, code)
	case "outlook":
		if microsoftOAuthConfig == nil {
			return nil, fmt.Errorf("Microsoft OAuth not configured")
		}
		return microsoftOAuthConfig.Exchange(ctx, code)
	case "zoho":
		if zohoOAuthConfig == nil {
			return nil, fmt.Errorf("Zoho OAuth not configured")
		}
		return zohoOAuthConfig.Exchange(ctx, code)
	default:
		return nil, fmt.Errorf("unsupported OAuth provider: %s", provider)
	}
}

// RefreshOAuthToken refreshes the OAuth token if necessary
func RefreshOAuthToken(ctx context.Context, provider, refreshToken string) (*oauth2.Token, error) {
	if refreshToken == "" {
		return nil, fmt.Errorf("no refresh token provided")
	}

	t := &oauth2.Token{
		RefreshToken: refreshToken,
	}

	switch provider {
	case "gmail":
		if googleOAuthConfig == nil {
			return nil, fmt.Errorf("Google OAuth not configured")
		}
		return googleOAuthConfig.TokenSource(ctx, t).Token()
	case "outlook":
		if microsoftOAuthConfig == nil {
			return nil, fmt.Errorf("Microsoft OAuth not configured")
		}
		return microsoftOAuthConfig.TokenSource(ctx, t).Token()
	case "zoho":
		if zohoOAuthConfig == nil {
			return nil, fmt.Errorf("Zoho OAuth not configured")
		}
		return zohoOAuthConfig.TokenSource(ctx, t).Token()
	default:
		return nil, fmt.Errorf("unsupported OAuth provider: %s", provider)
	}
}

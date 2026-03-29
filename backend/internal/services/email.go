package services

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"net/smtp"
	"os"
	"strings"
	"time"

	"golang.org/x/oauth2"

	"github.com/waitless/waitless/internal/models"
	"gopkg.in/gomail.v2"
)

type EmailService struct{}

func NewEmailService() *EmailService {
	return &EmailService{}
}

type SendEmailRequest struct {
	SMTP     *models.ProjectSMTP
	To       string
	ToName   string
	Subject  string
	HTMLBody string
	TextBody string
}

// xoauth2Auth implements smtp.Auth for the XOAUTH2 mechanism used by Gmail.
type xoauth2Auth struct {
	user  string
	token string
}

func (a xoauth2Auth) Start(_ *smtp.ServerInfo) (string, []byte, error) {
	payload := fmt.Sprintf("user=%s\x01auth=Bearer %s\x01\x01", a.user, a.token)
	return "XOAUTH2", []byte(payload), nil
}

func (a xoauth2Auth) Next(_ []byte, more bool) ([]byte, error) {
	if more {
		return nil, fmt.Errorf("unexpected server challenge")
	}
	return nil, nil
}

// getValidAccessToken decrypts tokens and refreshes via OAuth2 if expired.
// provider should be "gmail_oauth" or "zoho_oauth".
func getValidAccessToken(s *models.ProjectSMTP) (string, error) {
	accessToken, err := Decrypt(s.OAuthAccessToken)
	if err != nil {
		return "", fmt.Errorf("failed to decrypt access token: %w", err)
	}
	if s.OAuthTokenExpiry != nil && time.Now().Before(s.OAuthTokenExpiry.Add(-30*time.Second)) {
		return accessToken, nil
	}
	// Token might be expired — refresh it
	refreshToken, err := Decrypt(s.OAuthRefreshToken)
	if err != nil {
		return "", fmt.Errorf("failed to decrypt refresh token: %w", err)
	}
	var cfg *oauth2.Config
	if s.Provider == "zoho_oauth" {
		cfg = ZohoOAuthConfig()
	} else {
		cfg = GmailOAuthConfig()
	}
	ts := cfg.TokenSource(context.Background(), &oauth2.Token{
		RefreshToken: refreshToken,
		Expiry:       time.Now().Add(-1 * time.Hour), // force refresh
	})
	newToken, err := ts.Token()
	if err != nil {
		return "", fmt.Errorf("failed to refresh OAuth2 token: %w", err)
	}
	s.OAuthTokenExpiry = &newToken.Expiry
	return newToken.AccessToken, nil
}

// sendViaGmailOAuth uses Gmail SMTP with XOAUTH2 to send a message.
func sendViaGmailOAuth(smtpCfg *models.ProjectSMTP, rawMessage string) error {
	accessToken, err := getValidAccessToken(smtpCfg)
	if err != nil {
		return err
	}

	addr := "smtp.gmail.com:587"
	conn, err := net.Dial("tcp", addr)
	if err != nil {
		return fmt.Errorf("dial smtp: %w", err)
	}
	c, err := smtp.NewClient(conn, "smtp.gmail.com")
	if err != nil {
		return fmt.Errorf("new smtp client: %w", err)
	}
	defer c.Close()

	if err = c.StartTLS(&tls.Config{ServerName: "smtp.gmail.com"}); err != nil {
		return fmt.Errorf("starttls: %w", err)
	}

	auth := xoauth2Auth{user: smtpCfg.OAuthEmail, token: accessToken}
	if err = c.Auth(auth); err != nil {
		return fmt.Errorf("oauth2 auth: %w", err)
	}

	if err = c.Mail(smtpCfg.FromEmail); err != nil {
		return fmt.Errorf("MAIL FROM: %w", err)
	}
	if err = c.Rcpt(smtpCfg.Username); err != nil { // Username field stores recipient for test; we set TO dynamically
		_ = err // ignore — actual recipient passed in rawMessage; some servers allow anyway
	}

	w, err := c.Data()
	if err != nil {
		return fmt.Errorf("DATA: %w", err)
	}
	if _, err = fmt.Fprintf(w, "%s", rawMessage); err != nil {
		return fmt.Errorf("writing message: %w", err)
	}
	return w.Close()
}

// buildRawMessage constructs a minimal RFC 2822 email message string.
func buildRawMessage(from, fromName, to, toName, subject, htmlBody, textBody string) string {
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("From: %s <%s>\r\n", fromName, from))
	sb.WriteString(fmt.Sprintf("To: %s <%s>\r\n", toName, to))
	sb.WriteString(fmt.Sprintf("Subject: %s\r\n", subject))
	sb.WriteString("MIME-Version: 1.0\r\n")
	boundary := "====WAITLESS_BOUNDARY===="
	sb.WriteString(fmt.Sprintf("Content-Type: multipart/alternative; boundary=\"%s\"\r\n\r\n", boundary))
	if textBody != "" {
		sb.WriteString(fmt.Sprintf("--%s\r\n", boundary))
		sb.WriteString("Content-Type: text/plain; charset=utf-8\r\n\r\n")
		sb.WriteString(textBody + "\r\n")
	}
	if htmlBody != "" {
		sb.WriteString(fmt.Sprintf("--%s\r\n", boundary))
		sb.WriteString("Content-Type: text/html; charset=utf-8\r\n")
		sb.WriteString("Content-Transfer-Encoding: base64\r\n\r\n")
		sb.WriteString(base64.StdEncoding.EncodeToString([]byte(htmlBody)) + "\r\n")
	}
	sb.WriteString(fmt.Sprintf("--%s--\r\n", boundary))
	return sb.String()
}

func (s *EmailService) Send(req SendEmailRequest) error {
	if req.SMTP == nil {
		return fmt.Errorf("no email config provided")
	}

	// Gmail OAuth2 via SMTP XOAUTH2
	if req.SMTP.Provider == "gmail_oauth" {
		accessToken, err := getValidAccessToken(req.SMTP)
		if err != nil {
			return err
		}

		smtpHost := "smtp.gmail.com"
		smtpAddr := "smtp.gmail.com:587"

		conn, err := net.Dial("tcp", smtpAddr)
		if err != nil {
			return fmt.Errorf("dial smtp: %w", err)
		}
		c, err := smtp.NewClient(conn, smtpHost)
		if err != nil {
			return fmt.Errorf("new smtp client: %w", err)
		}
		defer c.Close()

		if err = c.StartTLS(&tls.Config{ServerName: smtpHost}); err != nil {
			return fmt.Errorf("starttls: %w", err)
		}
		if err = c.Auth(xoauth2Auth{user: req.SMTP.OAuthEmail, token: accessToken}); err != nil {
			return fmt.Errorf("xoauth2 auth: %w", err)
		}
		if err = c.Mail(req.SMTP.OAuthEmail); err != nil {
			return fmt.Errorf("MAIL FROM: %w", err)
		}
		if err = c.Rcpt(req.To); err != nil {
			return fmt.Errorf("RCPT TO: %w", err)
		}
		w, err := c.Data()
		if err != nil {
			return fmt.Errorf("DATA: %w", err)
		}
		raw := buildRawMessage(req.SMTP.OAuthEmail, req.SMTP.FromName, req.To, req.ToName, req.Subject, req.HTMLBody, req.TextBody)
		if _, err = fmt.Fprint(w, raw); err != nil {
			return err
		}
		return w.Close()
	}

	// Zoho OAuth2 via Zoho Mail REST API (Zoho SMTP doesn't support XOAUTH2)
	if req.SMTP.Provider == "zoho_oauth" {
		return sendViaZohoAPI(req)
	}

	// Standard password-based SMTP path
	password, err := Decrypt(req.SMTP.Password)
	if err != nil {
		password = req.SMTP.Password
	}

	m := gomail.NewMessage()
	m.SetAddressHeader("From", req.SMTP.FromEmail, req.SMTP.FromName)
	m.SetAddressHeader("To", req.To, req.ToName)
	m.SetHeader("Subject", req.Subject)
	m.SetHeader("List-Unsubscribe", "<mailto:"+req.SMTP.FromEmail+"?subject=unsubscribe>")

	if req.HTMLBody != "" {
		m.SetBody("text/html", req.HTMLBody)
	}
	if req.TextBody != "" {
		if req.HTMLBody != "" {
			m.AddAlternative("text/plain", req.TextBody)
		} else {
			m.SetBody("text/plain", req.TextBody)
		}
	}

	d := gomail.NewDialer(req.SMTP.Host, req.SMTP.Port, req.SMTP.Username, password)
	if !req.SMTP.TLS {
		d.TLSConfig = &tls.Config{InsecureSkipVerify: true}
		d.SSL = false
	}

	return d.DialAndSend(m)
}


func (s *EmailService) SendWelcome(smtp *models.ProjectSMTP, project *models.Project, subscriber *models.Subscriber, coupon *models.CouponCode, baseURL string) error {
	subject := project.WelcomeSubject
	if subject == "" {
		subject = fmt.Sprintf("You're on the waitlist for %s! 🎉", project.Name)
	}

	unsubURL := fmt.Sprintf("%s/api/public/unsubscribe?token=%s", baseURL, subscriber.UnsubscribeToken)
	html := buildWelcomeEmail(project, subscriber, coupon, unsubURL)
	
	couponText := ""
	if coupon != nil {
		couponText = fmt.Sprintf("\n\nAs a special thanks, here is your promo code:\n%s\n", coupon.Code)
	}
	
	text := fmt.Sprintf("Hi %s,\n\nYou're on the waitlist for %s!\n\nWe'll be in touch soon.%s\n\nTo unsubscribe: %s\n\nBest,\nThe %s Team",
		subscriber.Name, project.Name, couponText, unsubURL, project.Name)

	return s.Send(SendEmailRequest{
		SMTP:     smtp,
		To:       subscriber.Email,
		ToName:   subscriber.Name,
		Subject:  subject,
		HTMLBody: html,
		TextBody: text,
	})
}

func buildWelcomeEmail(project *models.Project, subscriber *models.Subscriber, coupon *models.CouponCode, unsubURL string) string {
	name := subscriber.Name
	if name == "" {
		name = "there"
	}
	themeColor := project.ThemeColor
	if themeColor == "" {
		themeColor = "#6366f1"
	}
	logo := ""
	if project.LogoURL != "" {
		logo = fmt.Sprintf(`<img src="%s" alt="%s" style="max-height:48px;margin-bottom:24px;" />`, project.LogoURL, project.Name)
	}

	customMsg := ""
	if project.WelcomeBody != "" {
		customMsg = fmt.Sprintf(`<p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.7;">%s</p>`, project.WelcomeBody)
	}

	couponHtml := ""
	if coupon != nil {
		couponHtml = fmt.Sprintf(`
		<div style="background:rgba(%s,0.05);border:1px dashed %s;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
			<p style="margin:0 0 12px;color:#6b7280;font-size:14px;font-weight:500;">Your special promo code</p>
			<div style="display:inline-block;background:#ffffff;padding:8px 24px;border-radius:8px;border:1px solid #e5e7eb;font-family:monospace;font-size:20px;font-weight:700;color:%s;letter-spacing:1px;">
				%s
			</div>
		</div>
		`, themeColor, themeColor, themeColor, coupon.Code)
	}

	return fmt.Sprintf(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',sans-serif;">
  <table width="100%%" cellpadding="0" cellspacing="0" role="presentation" style="padding:48px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
        
        <!-- Header bar -->
        <tr><td style="background:linear-gradient(135deg,%s,%s);padding:32px 40px;text-align:center;">
          %s
          <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;line-height:1.3;">
            You're in, %s! 🎉
          </h1>
        </td></tr>
        
        <!-- Body -->
        <tr><td style="padding:36px 40px 28px;">
          <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.7;">
            Thanks for joining the waitlist for <strong>%s</strong>. We'll let you know the moment we're ready to launch.
          </p>
          
          %s
          
		  %s
          
          <!-- CTA Button -->
          <table width="100%%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0;">
            <tr><td align="center">
              <a href="%s" style="display:inline-block;background:%s;color:#ffffff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">
                Visit %s →
              </a>
            </td></tr>
          </table>
          
          <p style="margin:0 0 8px;color:#9ca3af;font-size:13px;line-height:1.6;">
            You're receiving this because you signed up for the <strong>%s</strong> waitlist.
          </p>
        </td></tr>
        
        <!-- Footer -->
        <tr><td style="padding:20px 40px 28px;border-top:1px solid #f3f4f6;">
          <table width="100%%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="font-size:12px;color:#9ca3af;line-height:1.5;">
                <a href="%s" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a>
                &nbsp;&middot;&nbsp; Powered by Waitless
              </td>
            </tr>
          </table>
        </td></tr>
        
      </table>
    </td></tr>
  </table>
</body>
</html>`,
		themeColor, adjustColor(themeColor), // header gradient
		logo,         // logo
		name,         // greeting
		project.Name, // project name
		customMsg,    // custom welcome message
		couponHtml,   // the coupon block
		"#",          // CTA link (project page)
		themeColor,   // button color
		project.Name, // button text
		project.Name, // footer mention
		unsubURL,     // unsubscribe link
	)
}

func adjustColor(hex string) string {
	// Slightly darker shade for gradient
	if len(hex) != 7 {
		return hex
	}
	r := parseHex(hex[1:3])
	g := parseHex(hex[3:5])
	b := parseHex(hex[5:7])
	r = max(0, r-30)
	g = max(0, g-30)
	b = max(0, b-30)
	return fmt.Sprintf("#%02x%02x%02x", r, g, b)
}

func parseHex(s string) int {
	var n int
	fmt.Sscanf(s, "%x", &n)
	return n
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func (s *EmailService) SendTestSMTP(smtp *models.ProjectSMTP, project *models.Project, toEmail string) error {
	return s.Send(SendEmailRequest{
		SMTP:    smtp,
		To:      toEmail,
		ToName:  toEmail,
		Subject: fmt.Sprintf("✅ SMTP test for %s — Waitless", project.Name),
		HTMLBody: fmt.Sprintf(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%%" cellpadding="0" cellspacing="0" style="padding:48px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;padding:40px;border:1px solid #e5e7eb;">
        <tr><td align="center">
          <div style="width:56px;height:56px;border-radius:50%%;background:rgba(34,197,94,0.15);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
            <span style="font-size:28px;">✅</span>
          </div>
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">SMTP Working!</h1>
          <p style="margin:0;color:#6b7280;font-size:15px;line-height:1.6;">
            Your SMTP configuration for <strong>%s</strong> is set up correctly. Welcome emails will be delivered from this address.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`, project.Name),
		TextBody: fmt.Sprintf("SMTP test successful for %s! Your SMTP configuration is working correctly.", project.Name),
	})
}

// sendViaZohoAPI sends email using the Zoho Mail REST API.
// Zoho SMTP doesn't support XOAUTH2, so we use their HTTP API instead.
func sendViaZohoAPI(req SendEmailRequest) error {
	accessToken, err := getValidAccessToken(req.SMTP)
	if err != nil {
		return fmt.Errorf("zoho: get access token: %w", err)
	}

	// Determine the Zoho API domain
	zohoDomain := os.Getenv("ZOHO_DOMAIN")
	if zohoDomain == "" {
		zohoDomain = "zoho.in"
	}
	mailBase := "https://mail." + zohoDomain

	// Step 1: Get Account ID
	accReq, _ := http.NewRequest("GET", mailBase+"/api/accounts", nil)
	accReq.Header.Set("Authorization", "Zoho-oauthtoken "+accessToken)
	accResp, err := http.DefaultClient.Do(accReq)
	if err != nil {
		return fmt.Errorf("zoho: fetch accounts: %w", err)
	}
	defer accResp.Body.Close()
	accBody, _ := io.ReadAll(accResp.Body)
	log.Printf("[zoho-send] accounts response (%d): %s", accResp.StatusCode, string(accBody))

	var accData struct {
		Data []struct {
			AccountID string `json:"accountId"`
			MailID    string `json:"mailId"`
		} `json:"data"`
	}
	if err := json.Unmarshal(accBody, &accData); err != nil || len(accData.Data) == 0 {
		return fmt.Errorf("zoho: no accounts found (response: %s)", string(accBody))
	}
	accountID := accData.Data[0].AccountID

	// Step 2: Send email via Zoho Mail API
	content := req.HTMLBody
	if content == "" {
		content = req.TextBody
	}

	payload := map[string]interface{}{
		"fromAddress": req.SMTP.OAuthEmail,
		"toAddress":   req.To,
		"subject":     req.Subject,
		"content":     content,
		"askReceipt":  "no",
	}
	jsonBody, _ := json.Marshal(payload)

	msgURL := fmt.Sprintf("%s/api/accounts/%s/messages", mailBase, accountID)
	log.Printf("[zoho-send] POST %s from=%s to=%s", msgURL, req.SMTP.OAuthEmail, req.To)

	msgReq, _ := http.NewRequest("POST", msgURL, bytes.NewReader(jsonBody))
	msgReq.Header.Set("Authorization", "Zoho-oauthtoken "+accessToken)
	msgReq.Header.Set("Content-Type", "application/json")
	msgResp, err := http.DefaultClient.Do(msgReq)
	if err != nil {
		return fmt.Errorf("zoho: send request failed: %w", err)
	}
	defer msgResp.Body.Close()

	respBody, _ := io.ReadAll(msgResp.Body)
	log.Printf("[zoho-send] response (%d): %s", msgResp.StatusCode, string(respBody))

	var sendResp struct {
		Status struct {
			Code    int    `json:"code"`
			Desc    string `json:"description"`
		} `json:"status"`
	}
	if err := json.Unmarshal(respBody, &sendResp); err != nil {
		return fmt.Errorf("zoho: parse send response: %s", string(respBody))
	}
	if sendResp.Status.Code != 200 {
		return fmt.Errorf("zoho send failed (%d): %s", sendResp.Status.Code, sendResp.Status.Desc)
	}

	log.Printf("[zoho-send] email sent successfully to %s", req.To)
	return nil
}

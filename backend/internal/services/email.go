package services

import (
	"crypto/tls"
	"fmt"

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

func (s *EmailService) Send(req SendEmailRequest) error {
	if req.SMTP == nil {
		return fmt.Errorf("no SMTP config provided")
	}

	// Decrypt password
	password, err := Decrypt(req.SMTP.Password)
	if err != nil {
		// Fallback: try using raw password (for legacy/unencrypted)
		password = req.SMTP.Password
	}

	m := gomail.NewMessage()
	m.SetAddressHeader("From", req.SMTP.FromEmail, req.SMTP.FromName)
	m.SetAddressHeader("To", req.To, req.ToName)
	m.SetHeader("Subject", req.Subject)

	// Add List-Unsubscribe header for CAN-SPAM compliance
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

func (s *EmailService) SendWelcome(smtp *models.ProjectSMTP, project *models.Project, subscriber *models.Subscriber, baseURL string) error {
	subject := project.WelcomeSubject
	if subject == "" {
		subject = fmt.Sprintf("You're on the waitlist for %s! 🎉", project.Name)
	}

	unsubURL := fmt.Sprintf("%s/api/public/unsubscribe?token=%s", baseURL, subscriber.UnsubscribeToken)
	html := buildWelcomeEmail(project, subscriber, unsubURL)
	text := fmt.Sprintf("Hi %s,\n\nYou're on the waitlist for %s!\n\nWe'll be in touch soon.\n\nTo unsubscribe: %s\n\nBest,\nThe %s Team",
		subscriber.Name, project.Name, unsubURL, project.Name)

	return s.Send(SendEmailRequest{
		SMTP:     smtp,
		To:       subscriber.Email,
		ToName:   subscriber.Name,
		Subject:  subject,
		HTMLBody: html,
		TextBody: text,
	})
}

func buildWelcomeEmail(project *models.Project, subscriber *models.Subscriber, unsubURL string) string {
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

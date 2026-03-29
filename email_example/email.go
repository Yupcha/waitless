package email

import (
	"context"
	"crypto/tls"
	"encoding/base64"
	"fmt"
	"io"
	"mime/quotedprintable"
	"net/smtp"
	"strings"
	"time"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapclient"
	"github.com/emersion/go-message/mail"
	"github.com/emersion/go-sasl"

	"sentinel/internal/models"
)

// decodeBody reads a MIME body part, explicitly applying Content-Transfer-Encoding decoding
// (quoted-printable and base64) regardless of what the mail reader may have auto-decoded.
// The go-message library should handle this, but some non-standard MIME messages bypass it.
func decodeBody(h *mail.InlineHeader, r io.Reader) ([]byte, error) {
	cte := ""
	if vals := h.Map()["Content-Transfer-Encoding"]; len(vals) > 0 {
		cte = strings.ToLower(strings.TrimSpace(vals[0]))
	}
	switch cte {
	case "quoted-printable":
		return io.ReadAll(quotedprintable.NewReader(r))
	case "base64":
		// Strip whitespace (MIME base64 has line breaks every 76 chars)
		raw, err := io.ReadAll(r)
		if err != nil {
			return nil, err
		}
		clean := strings.Map(func(r rune) rune {
			if r == '\n' || r == '\r' || r == ' ' || r == '\t' {
				return -1
			}
			return r
		}, string(raw))
		return base64.StdEncoding.DecodeString(clean)
	default:
		return io.ReadAll(r)
	}
}

type MessageSummary struct {
	UID         uint32    `json:"uid"`
	Date        time.Time `json:"date"`
	From        string    `json:"from"`
	To          string    `json:"to"`
	Cc          string    `json:"cc"`
	Subject     string    `json:"subject"`
	Snippet     string    `json:"snippet"`
	Unread      bool      `json:"unread"`
	Starred     bool      `json:"starred"`
	ThreadID    string    `json:"thread_id,omitempty"`
	ThreadCount int       `json:"thread_count,omitempty"`
}

type AttachmentInfo struct {
	Filename string `json:"filename"`
	MimeType string `json:"mime_type"`
	Size     int    `json:"size"`
}

type FullMessage struct {
	MessageSummary
	HTMLBody    string            `json:"html_body"`
	TextBody    string            `json:"text_body"`
	Attachments []AttachmentInfo  `json:"attachments"`
	Headers     map[string]string `json:"headers"`
}
// xoauth2Client implements the XOAUTH2 SASL mechanism used by Gmail and Outlook
type xoauth2Client struct {
	Username string
	Token    string
}

func (c *xoauth2Client) Start() (string, []byte, error) {
	// Format: "user=" + user + "\x01auth=Bearer " + token + "\x01\x01"
	resp := fmt.Sprintf("user=%s\x01auth=Bearer %s\x01\x01", c.Username, c.Token)
	return "XOAUTH2", []byte(resp), nil
}

func (c *xoauth2Client) Next(challenge []byte) ([]byte, error) {
	return nil, fmt.Errorf("unexpected challenge")
}

// xoauth2SMTPAuth implements smtp.Auth for XOAUTH2
type xoauth2SMTPAuth struct {
	username string
	token    string
}

func (a *xoauth2SMTPAuth) Start(server *smtp.ServerInfo) (string, []byte, error) {
	resp := fmt.Sprintf("user=%s\x01auth=Bearer %s\x01\x01", a.username, a.token)
	return "XOAUTH2", []byte(resp), nil
}

func (a *xoauth2SMTPAuth) Next(fromServer []byte, more bool) ([]byte, error) {
	if more {
		// Server sent an error challenge — return empty response to get the actual SMTP error
		return []byte{}, nil
	}
	return nil, nil
}

// dialIMAP creates a new IMAP connection (without auth)
func dialIMAP(acct *models.EmailAccount) (*imapclient.Client, error) {
	options := &imapclient.Options{}
	hostPort := fmt.Sprintf("%s:%d", acct.IMAPHost, acct.IMAPPort)

	if acct.UseTLS || acct.IMAPPort == 993 {
		return imapclient.DialTLS(hostPort, options)
	}
	return imapclient.DialStartTLS(hostPort, options)
}

// connectIMAP connects to the IMAP server and authenticates
func connectIMAP(ctx context.Context, acct *models.EmailAccount) (*imapclient.Client, error) {
	c, err := dialIMAP(acct)
	if err != nil {
		return nil, fmt.Errorf("connect error: %w", err)
	}

	if acct.AuthMethod == "oauth" && acct.AccessToken != "" {
		// Refresh token proactively if expired or about to expire
		token := acct.AccessToken
		if !acct.TokenExpiry.IsZero() && time.Now().After(acct.TokenExpiry.Add(-30*time.Second)) {
			if acct.RefreshToken != "" {
				newTok, rerr := RefreshOAuthToken(ctx, acct.Provider, acct.RefreshToken)
				if rerr == nil {
					token = newTok.AccessToken
					acct.AccessToken = token
					acct.TokenExpiry = newTok.Expiry
				}
			}
		}
		// XOAUTH2 for OAuth accounts (Gmail, Outlook)
		err = c.Authenticate(&xoauth2Client{Username: acct.Email, Token: token})
		if err != nil {
			c.Logout()
			return nil, fmt.Errorf("OAuth2 auth failed: %w", err)
		}
		return c, nil
	}

	host := strings.ToLower(acct.IMAPHost)
	isOutlook := strings.Contains(host, "outlook") || strings.Contains(host, "office365")

	// Outlook: go-imap/v2 can't parse Outlook's SASL error responses, use LOGIN directly
	if isOutlook {
		err = c.Login(acct.Email, acct.Password).Wait()
		if err != nil {
			c.Logout()
			return nil, fmt.Errorf("login failed: %s", providerHint(acct))
		}
		return c, nil
	}

	// Other providers: try SASL PLAIN first then LOGIN fallback
	saslClient := sasl.NewPlainClient("", acct.Email, acct.Password)
	err = c.Authenticate(saslClient)
	if err == nil {
		return c, nil
	}

	// SASL PLAIN failed — reconnect for LOGIN fallback
	c.Logout()

	c2, dialErr := dialIMAP(acct)
	if dialErr != nil {
		return nil, fmt.Errorf("auth error: %w. %s", err, providerHint(acct))
	}

	loginErr := c2.Login(acct.Email, acct.Password).Wait()
	if loginErr != nil {
		c2.Logout()
		return nil, fmt.Errorf("auth error: %w. %s", loginErr, providerHint(acct))
	}

	return c2, nil
}

// providerHint returns a helpful hint based on the provider
func providerHint(acct *models.EmailAccount) string {
	host := strings.ToLower(acct.IMAPHost)
	switch {
	case strings.Contains(host, "outlook") || strings.Contains(host, "office365"):
		return "Outlook/Hotmail requires an App Password. Enable 2-Step Verification, then create an App Password at https://account.live.com/proofs/manage/additional. Also enable IMAP in Outlook.com Settings"
	case strings.Contains(host, "gmail") || strings.Contains(host, "google"):
		return "Gmail requires an App Password (not your regular password). Generate one at https://myaccount.google.com/apppasswords"
	case strings.Contains(host, "zoho"):
		return "Make sure IMAP is enabled in Zoho Mail Settings and you're using an App Password"
	default:
		return "Check your credentials and ensure IMAP is enabled for your account"
	}
}

func FetchUnreadCount(ctx context.Context, acct *models.EmailAccount) (int, error) {
	c, err := connectIMAP(ctx, acct)
	if err != nil {
		return 0, err
	}
	defer c.Logout()

	// Select INBOX
	_, err = c.Select("INBOX", &imap.SelectOptions{ReadOnly: true}).Wait()
	if err != nil {
		return 0, fmt.Errorf("select inbox: %w", err)
	}

	criteria := &imap.SearchCriteria{NotFlag: []imap.Flag{imap.FlagSeen}}
	searchData, err := c.UIDSearch(criteria, nil).Wait()
	if err != nil {
		return 0, fmt.Errorf("search unseen: %w", err)
	}

	return len(searchData.AllUIDs()), nil
}

type Mailbox struct {
	Name string `json:"name"`
}

func ListMailboxes(ctx context.Context, acct *models.EmailAccount) ([]Mailbox, error) {
	c, err := connectIMAP(ctx, acct)
	if err != nil {
		return nil, err
	}
	defer c.Logout()

	cmd := c.List("", "*", nil)
	mboxes, err := cmd.Collect()
	if err != nil {
		return nil, err
	}

	var res []Mailbox
	for _, m := range mboxes {
		res = append(res, Mailbox{Name: m.Mailbox})
	}
	return res, nil
}

func FetchMessages(ctx context.Context, acct *models.EmailAccount, mailbox string, page, limit int) ([]MessageSummary, uint32, error) {
	c, err := connectIMAP(ctx, acct)
	if err != nil {
		return nil, 0, err
	}
	defer c.Logout()

	mb, err := c.Select(mailbox, &imap.SelectOptions{ReadOnly: true}).Wait()
	if err != nil {
		return nil, 0, fmt.Errorf("select mailbox: %w", err)
	}

	total := mb.NumMessages
	if total == 0 {
		return []MessageSummary{}, 0, nil
	}

	pageStart := uint32((page - 1) * limit)
	if pageStart >= total {
		return []MessageSummary{}, total, nil
	}

	end := total - pageStart
	var start uint32
	if end > uint32(limit) {
		start = end - uint32(limit) + 1
	} else {
		start = 1
	}

	var seqSet imap.SeqSet
	seqSet.AddRange(start, end)
	fetchOptions := &imap.FetchOptions{
		Flags:       true,
		Envelope:    true,
		UID:         true,
		BodySection: []*imap.FetchItemBodySection{{Specifier: imap.PartSpecifierHeader}},
	}
	
	cmd := c.Fetch(seqSet, fetchOptions)
	defer cmd.Close()

	var msgs []MessageSummary
	for {
		msg := cmd.Next()
		if msg == nil {
			break
		}

		// simplified parsing for now
		summary := MessageSummary{}

		for {
			item := msg.Next()
			if item == nil {
				break
			}
			switch item := item.(type) {
			case imapclient.FetchItemDataUID:
				summary.UID = uint32(item.UID)
			case imapclient.FetchItemDataEnvelope:
				summary.Subject = item.Envelope.Subject
				summary.Date = item.Envelope.Date
				if len(item.Envelope.From) > 0 {
					summary.From = item.Envelope.From[0].Addr()
				}
				var tos []string
				for _, addr := range item.Envelope.To {
					tos = append(tos, addr.Addr())
				}
				summary.To = strings.Join(tos, ", ")
				var ccs []string
				for _, addr := range item.Envelope.Cc {
					ccs = append(ccs, addr.Addr())
				}
				summary.Cc = strings.Join(ccs, ", ")
			case imapclient.FetchItemDataFlags:
				summary.Unread = true
				for _, f := range item.Flags {
					if f == imap.FlagSeen {
						summary.Unread = false
					}
					if f == imap.FlagFlagged {
						summary.Starred = true
					}
				}
			}
		}

		msgs = append(msgs, summary)
	}

	// Reverse so newest is first
	for i, j := 0, len(msgs)-1; i < j; i, j = i+1, j-1 {
		msgs[i], msgs[j] = msgs[j], msgs[i]
	}

	return msgs, total, err
}

func FetchMessage(ctx context.Context, acct *models.EmailAccount, mailbox string, uid uint32) (*FullMessage, error) {
	c, err := connectIMAP(ctx, acct)
	if err != nil {
		return nil, err
	}
	defer c.Logout()

	_, err = c.Select(mailbox, &imap.SelectOptions{ReadOnly: true}).Wait()
	if err != nil {
		return nil, fmt.Errorf("select mailbox: %w", err)
	}

	seqSet := imap.UIDSetNum(imap.UID(uid))
	cmd := c.Fetch(seqSet, &imap.FetchOptions{
		BodySection: []*imap.FetchItemBodySection{
			{}, // entire RFC822 body
		},
		Envelope: true,
		Flags:    true,
		UID:      true,
	})

	msg := cmd.Next()
	if msg == nil {
		return nil, fmt.Errorf("message not found")
	}

	res := &FullMessage{}
	res.UID = uid
	res.Headers = make(map[string]string)

	for {
		item := msg.Next()
		if item == nil {
			break
		}

		switch item := item.(type) {
		case imapclient.FetchItemDataEnvelope:
			res.Subject = item.Envelope.Subject
			res.Date = item.Envelope.Date
			if len(item.Envelope.From) > 0 {
				res.From = item.Envelope.From[0].Addr()
			}
			var tos []string
			for _, addr := range item.Envelope.To {
				tos = append(tos, addr.Addr())
			}
			res.To = strings.Join(tos, ", ")
			var ccs []string
			for _, addr := range item.Envelope.Cc {
				ccs = append(ccs, addr.Addr())
			}
			res.Cc = strings.Join(ccs, ", ")
		case imapclient.FetchItemDataBodySection:
			// Parse MIME using go-message
			mr, err := mail.CreateReader(item.Literal)
			if err != nil {
				// Fallback: read raw
				b, _ := io.ReadAll(item.Literal)
				res.TextBody = string(b)
				continue
			}

			// Extract headers
			if msgID, err := mr.Header.MessageID(); err == nil {
				res.Headers["Message-ID"] = msgID
			}

			for {
				p, err := mr.NextPart()
				if err == io.EOF {
					break
				}
				if err != nil {
					break
				}

				switch h := p.Header.(type) {
				case *mail.InlineHeader:
					ct, _, _ := h.ContentType()
					b, _ := decodeBody(h, p.Body)
					if strings.HasPrefix(ct, "text/html") {
						res.HTMLBody = string(b)
					} else if strings.HasPrefix(ct, "text/plain") {
						res.TextBody = string(b)
					}
				case *mail.AttachmentHeader:
					filename, _ := h.Filename()
					ct, _, _ := h.ContentType()
					b, _ := io.ReadAll(p.Body)
					res.Attachments = append(res.Attachments, AttachmentInfo{
						Filename: filename,
						MimeType: ct,
						Size:     len(b),
					})
				}
			}
		}
	}

	return res, cmd.Close()
}

func SendMessage(ctx context.Context, acct *models.EmailAccount, to, cc, subject, body string, inReplyTo string) error {
	hostPort := fmt.Sprintf("%s:%d", acct.SMTPHost, acct.SMTPPort)

	// Determine SMTP login username: use SMTPUsername if set, else Email
	smtpUser := acct.Email
	if acct.SMTPUsername != "" {
		smtpUser = acct.SMTPUsername
	}

	// Build message
	msg := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\n", acct.Email, to, subject)
	if cc != "" {
		msg += fmt.Sprintf("Cc: %s\r\n", cc)
	}
	if inReplyTo != "" {
		msg += fmt.Sprintf("In-Reply-To: %s\r\n", inReplyTo)
	}
	msg += "Content-Type: text/html; charset=UTF-8\r\n\r\n"
	msg += body

	var auth smtp.Auth
	if acct.AuthMethod == "oauth" && acct.AccessToken != "" {
		// Refresh token if expired
		token := acct.AccessToken
		if !acct.TokenExpiry.IsZero() && time.Now().After(acct.TokenExpiry.Add(-30*time.Second)) {
			if acct.RefreshToken != "" {
				if newTok, err := RefreshOAuthToken(ctx, acct.Provider, acct.RefreshToken); err == nil {
					token = newTok.AccessToken
				}
			}
		}
		auth = &xoauth2SMTPAuth{username: acct.Email, token: token}
	} else if acct.Password != "" {
		host := strings.ToLower(acct.SMTPHost)
		if strings.Contains(host, "zoho") {
			// Zoho requires LOGIN auth, not PLAIN
			auth = &loginAuth{username: smtpUser, password: acct.Password}
		} else {
			auth = smtp.PlainAuth("", smtpUser, acct.Password, acct.SMTPHost)
		}
	}

	if acct.SMTPPort == 465 {
		// Implicit TLS (SSL)
		tlsconfig := &tls.Config{
			InsecureSkipVerify: false,
			ServerName:         acct.SMTPHost,
		}
		conn, err := tls.Dial("tcp", hostPort, tlsconfig)
		if err != nil {
			return err
		}
		c, err := smtp.NewClient(conn, acct.SMTPHost)
		if err != nil {
			return err
		}
		if err = c.Auth(auth); err != nil {
			return err
		}
		if err = c.Mail(acct.Email); err != nil {
			return err
		}
		if err = c.Rcpt(to); err != nil {
			return err
		}
		w, err := c.Data()
		if err != nil {
			return err
		}
		_, err = w.Write([]byte(msg))
		if err != nil {
			return err
		}
		err = w.Close()
		if err != nil {
			return err
		}
		return c.Quit()
	} else {
		// STARTTLS
		return smtp.SendMail(hostPort, auth, acct.Email, []string{to}, []byte(msg))
	}
}

// loginAuth implements smtp.Auth for the LOGIN mechanism.
// Some providers (e.g. Zoho) only support LOGIN, not PLAIN.
type loginAuth struct {
	username, password string
}

func (a *loginAuth) Start(server *smtp.ServerInfo) (string, []byte, error) {
	return "LOGIN", []byte(a.username), nil
}

func (a *loginAuth) Next(fromServer []byte, more bool) ([]byte, error) {
	if more {
		challenge := strings.TrimSpace(string(fromServer))
		switch strings.ToLower(challenge) {
		case "username:":
			return []byte(a.username), nil
		case "password:":
			return []byte(a.password), nil
		default:
			return nil, fmt.Errorf("unexpected LOGIN challenge: %q", challenge)
		}
	}
	return nil, nil
}

func DeleteMessage(ctx context.Context, acct *models.EmailAccount, mailbox string, uid uint32) error {
	c, err := connectIMAP(ctx, acct)
	if err != nil { return err }
	defer c.Logout()
	if _, err := c.Select(mailbox, nil).Wait(); err != nil { return err }
	seqSet := imap.UIDSetNum(imap.UID(uid))
	if err := c.Store(seqSet, &imap.StoreFlags{Op: imap.StoreFlagsAdd, Flags: []imap.Flag{imap.FlagDeleted}}, nil).Close(); err != nil { return err }
	return c.Expunge().Close()
}

func MoveMessage(ctx context.Context, acct *models.EmailAccount, mailbox, targetMailbox string, uid uint32) error {
	c, err := connectIMAP(ctx, acct)
	if err != nil { return err }
	defer c.Logout()
	if _, err := c.Select(mailbox, nil).Wait(); err != nil { return err }
	seqSet := imap.UIDSetNum(imap.UID(uid))
	if _, err := c.Move(seqSet, targetMailbox).Wait(); err != nil { return err }
	return nil
}

func MarkRead(ctx context.Context, acct *models.EmailAccount, mailbox string, uid uint32) error {
	c, err := connectIMAP(ctx, acct)
	if err != nil { return err }
	defer c.Logout()
	if _, err := c.Select(mailbox, nil).Wait(); err != nil { return err }
	seqSet := imap.UIDSetNum(imap.UID(uid))
	return c.Store(seqSet, &imap.StoreFlags{Op: imap.StoreFlagsAdd, Flags: []imap.Flag{imap.FlagSeen}}, nil).Close()
}

func MarkUnread(ctx context.Context, acct *models.EmailAccount, mailbox string, uid uint32) error {
	c, err := connectIMAP(ctx, acct)
	if err != nil { return err }
	defer c.Logout()
	if _, err := c.Select(mailbox, nil).Wait(); err != nil { return err }
	seqSet := imap.UIDSetNum(imap.UID(uid))
	return c.Store(seqSet, &imap.StoreFlags{Op: imap.StoreFlagsDel, Flags: []imap.Flag{imap.FlagSeen}}, nil).Close()
}

func StarMessage(ctx context.Context, acct *models.EmailAccount, mailbox string, uid uint32, star bool) error {
	c, err := connectIMAP(ctx, acct)
	if err != nil { return err }
	defer c.Logout()
	if _, err := c.Select(mailbox, nil).Wait(); err != nil { return err }
	seqSet := imap.UIDSetNum(imap.UID(uid))
	op := imap.StoreFlagsAdd
	if !star { op = imap.StoreFlagsDel }
	return c.Store(seqSet, &imap.StoreFlags{Op: op, Flags: []imap.Flag{imap.FlagFlagged}}, nil).Close()
}

// FetchNewMessages fetches full message content for UIDs > sinceUID.
// Returns populated CachedEmail structs ready for DB upsert.
func FetchNewMessages(ctx context.Context, acct *models.EmailAccount, mailbox string, sinceUID uint32) ([]*models.CachedEmail, error) {
	c, err := connectIMAP(ctx, acct)
	if err != nil {
		return nil, err
	}
	defer c.Logout()

	_, err = c.Select(mailbox, &imap.SelectOptions{ReadOnly: true}).Wait()
	if err != nil {
		return nil, fmt.Errorf("select mailbox: %w", err)
	}

	// Fetch UIDs > sinceUID
	startUID := imap.UID(sinceUID + 1)
	var seqSet imap.UIDSet
	seqSet.AddRange(startUID, 0) // 0 = * (latest)

	cmd := c.Fetch(seqSet, &imap.FetchOptions{
		BodySection: []*imap.FetchItemBodySection{
			{}, // entire RFC822 body
		},
		Envelope: true,
		Flags:    true,
		UID:      true,
	})

	var results []*models.CachedEmail
	for {
		msg := cmd.Next()
		if msg == nil {
			break
		}
		ce := &models.CachedEmail{
			AccountID: acct.ID,
			Mailbox:   mailbox,
			CachedAt:  time.Now(),
		}
		for {
			item := msg.Next()
			if item == nil {
				break
			}
			switch item := item.(type) {
			case imapclient.FetchItemDataUID:
				ce.UID = uint32(item.UID)
			case imapclient.FetchItemDataEnvelope:
				ce.Subject = item.Envelope.Subject
				ce.Date = item.Envelope.Date
				if len(item.Envelope.From) > 0 {
					ce.FromAddr = item.Envelope.From[0].Addr()
				}
				var tos []string
				for _, addr := range item.Envelope.To {
					tos = append(tos, addr.Addr())
				}
				ce.ToAddr = strings.Join(tos, ", ")
				var ccs []string
				for _, addr := range item.Envelope.Cc {
					ccs = append(ccs, addr.Addr())
				}
				ce.Cc = strings.Join(ccs, ", ")
				if item.Envelope.MessageID != "" {
					ce.MessageID = item.Envelope.MessageID
				}
			case imapclient.FetchItemDataFlags:
				ce.IsRead = false
				for _, f := range item.Flags {
					if f == imap.FlagSeen {
						ce.IsRead = true
					}
					if f == imap.FlagFlagged {
						ce.IsStarred = true
					}
				}
			case imapclient.FetchItemDataBodySection:
				mr, parseErr := mail.CreateReader(item.Literal)
				if parseErr != nil {
					b, _ := io.ReadAll(item.Literal)
					ce.TextBody = string(b)
					continue
				}
				for {
					p, pErr := mr.NextPart()
					if pErr == io.EOF {
						break
					}
					if pErr != nil {
						break
					}
					switch h := p.Header.(type) {
					case *mail.InlineHeader:
						ct, _, _ := h.ContentType()
						b, _ := decodeBody(h, p.Body)
						if strings.HasPrefix(ct, "text/html") {
							ce.HTMLBody = string(b)
						} else if strings.HasPrefix(ct, "text/plain") {
							ce.TextBody = string(b)
						}
					case *mail.AttachmentHeader:
						filename, _ := h.Filename()
						ct, _, _ := h.ContentType()
						b, _ := io.ReadAll(p.Body)
						ce.Attachments = append(ce.Attachments, models.EmailAttachment{
							Filename: filename,
							MimeType: ct,
							Size:     len(b),
						})
					}
				}
			}
		}
		// Generate snippet from text body
		if ce.Snippet == "" && ce.TextBody != "" {
			s := ce.TextBody
			if len(s) > 200 {
				s = s[:200]
			}
			ce.Snippet = strings.ReplaceAll(s, "\n", " ")
		}
		if ce.UID > 0 && ce.UID > sinceUID {
			results = append(results, ce)
		}
	}
	return results, cmd.Close()
}

// FetchAndCacheAll fetches the latest N messages from a mailbox and returns them.
func FetchAndCacheAll(ctx context.Context, acct *models.EmailAccount, mailbox string, limit int) ([]*models.CachedEmail, uint32, error) {
	c, err := connectIMAP(ctx, acct)
	if err != nil {
		return nil, 0, err
	}
	defer c.Logout()

	mb, err := c.Select(mailbox, &imap.SelectOptions{ReadOnly: true}).Wait()
	if err != nil {
		return nil, 0, fmt.Errorf("select mailbox: %w", err)
	}
	total := mb.NumMessages
	if total == 0 {
		return nil, 0, nil
	}

	var start uint32
	if total > uint32(limit) {
		start = total - uint32(limit) + 1
	} else {
		start = 1
	}

	var seqSet imap.SeqSet
	seqSet.AddRange(start, total)
	cmd := c.Fetch(seqSet, &imap.FetchOptions{
		BodySection: []*imap.FetchItemBodySection{
			{},
		},
		Envelope: true,
		Flags:    true,
		UID:      true,
	})

	var results []*models.CachedEmail
	for {
		msg := cmd.Next()
		if msg == nil {
			break
		}
		ce := &models.CachedEmail{
			AccountID: acct.ID,
			Mailbox:   mailbox,
			CachedAt:  time.Now(),
		}
		for {
			item := msg.Next()
			if item == nil {
				break
			}
			switch item := item.(type) {
			case imapclient.FetchItemDataUID:
				ce.UID = uint32(item.UID)
			case imapclient.FetchItemDataEnvelope:
				ce.Subject = item.Envelope.Subject
				ce.Date = item.Envelope.Date
				if len(item.Envelope.From) > 0 {
					ce.FromAddr = item.Envelope.From[0].Addr()
				}
				var tos []string
				for _, addr := range item.Envelope.To {
					tos = append(tos, addr.Addr())
				}
				ce.ToAddr = strings.Join(tos, ", ")
				var ccs []string
				for _, addr := range item.Envelope.Cc {
					ccs = append(ccs, addr.Addr())
				}
				ce.Cc = strings.Join(ccs, ", ")
				if item.Envelope.MessageID != "" {
					ce.MessageID = item.Envelope.MessageID
				}
			case imapclient.FetchItemDataFlags:
				ce.IsRead = false
				for _, f := range item.Flags {
					if f == imap.FlagSeen {
						ce.IsRead = true
					}
					if f == imap.FlagFlagged {
						ce.IsStarred = true
					}
				}
			case imapclient.FetchItemDataBodySection:
				mr, parseErr := mail.CreateReader(item.Literal)
				if parseErr != nil {
					b, _ := io.ReadAll(item.Literal)
					ce.TextBody = string(b)
					continue
				}
				for {
					p, pErr := mr.NextPart()
					if pErr == io.EOF {
						break
					}
					if pErr != nil {
						break
					}
					switch h := p.Header.(type) {
					case *mail.InlineHeader:
						ct, _, _ := h.ContentType()
						b, _ := decodeBody(h, p.Body)
						if strings.HasPrefix(ct, "text/html") {
							ce.HTMLBody = string(b)
						} else if strings.HasPrefix(ct, "text/plain") {
							ce.TextBody = string(b)
						}
					case *mail.AttachmentHeader:
						filename, _ := h.Filename()
						ct, _, _ := h.ContentType()
						b, _ := io.ReadAll(p.Body)
						ce.Attachments = append(ce.Attachments, models.EmailAttachment{
							Filename: filename,
							MimeType: ct,
							Size:     len(b),
						})
					}
				}
			}
		}
		if ce.Snippet == "" && ce.TextBody != "" {
			s := ce.TextBody
			if len(s) > 200 {
				s = s[:200]
			}
			ce.Snippet = strings.ReplaceAll(s, "\n", " ")
		}
		if ce.UID > 0 {
			results = append(results, ce)
		}
	}
	return results, total, cmd.Close()
}


package email

import (
	"context"
	"encoding/json"
	"fmt"
	"hash/fnv"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"sentinel/internal/models"
)

// ZohoMailAPIBase() is kept for backward compat but not used
// All code uses ZohoMailAPIBase() instead

// ZohoMailAPIBase returns the regional base URL for Zoho Mail API
func ZohoMailAPIBase() string {
	region := os.Getenv("ZOHO_REGION")
	if region == "" {
		region = "com"
	}
	return fmt.Sprintf("https://mail.zoho.%s/api", region)
}

func zohoDebug() bool {
	return os.Getenv("ZOHO_DEBUG") == "true" || os.Getenv("ZOHO_DEBUG") == "1"
}

// ─── Zoho Mail API types ────────────────────────────────────────────────────

type zohoAccountsResp struct {
	Status struct {
		Code int `json:"code"`
	} `json:"status"`
	Data []struct {
		AccountID   string `json:"accountId"`
		DisplayName string `json:"displayName"`
		Email       string `json:"mailboxAddress"`
	} `json:"data"`
}

type zohoFoldersResp struct {
	Status struct {
		Code int `json:"code"`
	} `json:"status"`
	Data []struct {
		FolderID   string `json:"folderId"`
		FolderName string `json:"folderName"`
		UnreadCount int   `json:"unReadCount"`
	} `json:"data"`
}

type zohoMessagesResp struct {
	Status struct {
		Code int `json:"code"`
	} `json:"status"`
	Data []zohoMessage `json:"data"`
}

type zohoMessage struct {
	MessageID    string      `json:"messageId"`
	FolderID     string      `json:"folderId"`
	Subject      string      `json:"subject"`
	Sender       string      `json:"sender"`
	FromAddress  string      `json:"fromAddress"`
	ToAddress    string      `json:"toAddress"`
	CcAddress    string      `json:"ccAddress"`
	Summary      string      `json:"summary"`
	ReceivedTime json.Number `json:"receivedTime"` // millis — can be string or int
	Status       string      `json:"status"`       // "0"=unread, "1"=read
	Status2      string      `json:"status2"`      // legacy field
	Flagid       string      `json:"flagid"`       // "flag_not_set" or set
	ThreadID     string      `json:"threadId"`
	ThreadCount  string      `json:"threadCount"`
}

type zohoMessageDetailResp struct {
	Status struct {
		Code int `json:"code"`
	} `json:"status"`
	Data struct {
		zohoMessage
		Content string `json:"content"` // HTML body
	} `json:"data"`
}

type ZohoSendReq struct {
	FromAddress string `json:"fromAddress"`
	ToAddress   string `json:"toAddress"`
	CcAddress   string `json:"ccAddress,omitempty"`
	Subject     string `json:"subject"`
	Content     string `json:"content"`
	MailFormat  string `json:"mailFormat"` // "html"
	InReplyTo   string `json:"inReplyTo,omitempty"`
}

// ─── Helpers ────────────────────────────────────────────────────────────────

func zohoAPIGet(ctx context.Context, url, token string) ([]byte, error) {
	if zohoDebug() {
		log.Printf("zoho_api: GET %s", url)
	}
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Zoho-oauthtoken "+token)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("zoho API error %d: %s", resp.StatusCode, string(body))
	}
	return body, nil
}

// GetZohoToken ensures a valid access token, refreshing if needed
func GetZohoToken(ctx context.Context, acct *models.EmailAccount) (string, error) {
	token := acct.AccessToken
	if !acct.TokenExpiry.IsZero() && time.Now().After(acct.TokenExpiry.Add(-30*time.Second)) {
		if acct.RefreshToken != "" {
			newTok, err := RefreshOAuthToken(ctx, "zoho", acct.RefreshToken)
			if err == nil {
				token = newTok.AccessToken
				acct.AccessToken = token
				acct.TokenExpiry = newTok.Expiry
			} else {
				return "", fmt.Errorf("token refresh failed: %w", err)
			}
		}
	}
	return token, nil
}

// ─── Account ────────────────────────────────────────────────────────────────

// ZohoGetAccountID fetches the Zoho Mail account ID for the authenticated user
func ZohoGetAccountID(ctx context.Context, token string) (string, string, error) {
	body, err := zohoAPIGet(ctx, ZohoMailAPIBase()+"/accounts", token)
	if err != nil {
		return "", "", err
	}

	var resp zohoAccountsResp
	json.Unmarshal(body, &resp)

	if len(resp.Data) == 0 {
		return "", "", fmt.Errorf("no Zoho Mail accounts found")
	}

	return resp.Data[0].AccountID, resp.Data[0].Email, nil
}

// ─── Folders ────────────────────────────────────────────────────────────────

// ZohoListFolders returns the mail folders for a Zoho account
func ZohoListFolders(ctx context.Context, token, accountID string) ([]struct {
	Name string `json:"name"`
}, error) {
	body, err := zohoAPIGet(ctx, fmt.Sprintf("%s/accounts/%s/folders", ZohoMailAPIBase(), accountID), token)
	if err != nil {
		return nil, err
	}

	var resp zohoFoldersResp
	json.Unmarshal(body, &resp)

	var folders []struct {
		Name string `json:"name"`
	}
	for _, f := range resp.Data {
		folders = append(folders, struct {
			Name string `json:"name"`
		}{Name: f.FolderName})
	}
	return folders, nil
}

// ZohoGetFolderID resolves a folder name to its Zoho folder ID
func ZohoGetFolderID(ctx context.Context, token, accountID, folderName string) (string, error) {
	body, err := zohoAPIGet(ctx, fmt.Sprintf("%s/accounts/%s/folders", ZohoMailAPIBase(), accountID), token)
	if err != nil {
		return "", err
	}

	var resp zohoFoldersResp
	json.Unmarshal(body, &resp)

	for _, f := range resp.Data {
		if strings.EqualFold(f.FolderName, folderName) {
			return f.FolderID, nil
		}
	}
	return "", fmt.Errorf("folder %q not found", folderName)
}

// ZohoGetUnreadCount returns the unread count from INBOX
func ZohoGetUnreadCount(ctx context.Context, token, accountID string) (int, error) {
	body, err := zohoAPIGet(ctx, fmt.Sprintf("%s/accounts/%s/folders", ZohoMailAPIBase(), accountID), token)
	if err != nil {
		return 0, err
	}

	var resp zohoFoldersResp
	json.Unmarshal(body, &resp)

	for _, f := range resp.Data {
		if strings.EqualFold(f.FolderName, "Inbox") {
			return f.UnreadCount, nil
		}
	}
	return 0, nil
}

// ─── Messages ───────────────────────────────────────────────────────────────

// ZohoListMessages lists messages in a folder.
// Returns summaries, total count, and a map of UID→messageID for resolving future requests.
func ZohoListMessages(ctx context.Context, token, accountID, folderID string, start, limit int) ([]MessageSummary, int, map[uint32]string, error) {
	url := fmt.Sprintf("%s/accounts/%s/messages/view?folderId=%s&start=%d&limit=%d&threadedMails=false",
		ZohoMailAPIBase(), accountID, folderID, start, limit)

	body, err := zohoAPIGet(ctx, url, token)
	if err != nil {
		return nil, 0, nil, err
	}

	if zohoDebug() {
		log.Printf("zoho_api: messages response len=%d body_preview=%.500s", len(body), string(body))
	}

	var resp zohoMessagesResp
	if err := json.Unmarshal(body, &resp); err != nil {
		log.Printf("zoho_api: messages parse error: %v", err)
		return nil, 0, nil, fmt.Errorf("parse messages: %w", err)
	}

	if zohoDebug() {
		log.Printf("zoho_api: parsed %d messages from response", len(resp.Data))
	}

	var msgs []MessageSummary
	uidMap := make(map[uint32]string)
	for _, m := range resp.Data {
		s := zohoToSummary(m)
		msgs = append(msgs, s)
		uidMap[s.UID] = m.MessageID
		if zohoDebug() {
			log.Printf("zoho_api: msg uid=%d id=%s subj=%q status=%s status2=%s flagid=%s unread=%v", s.UID, m.MessageID, m.Subject, m.Status, m.Status2, m.Flagid, s.Unread)
		}
	}
	// Zoho API doesn't return total in list; approximate
	total := start + len(msgs)
	if len(msgs) >= limit {
		total += limit // indicate there's more
	}
	return msgs, total, uidMap, nil
}

// ZohoGetMessageContent fetches only the HTML body of a message
func ZohoGetMessageContent(ctx context.Context, token, accountID, folderID, messageID string) (string, error) {
	url := fmt.Sprintf("%s/accounts/%s/folders/%s/messages/%s/content", ZohoMailAPIBase(), accountID, folderID, messageID)

	body, err := zohoAPIGet(ctx, url, token)
	if err != nil {
		return "", err
	}

	var resp struct {
		Data struct {
			Content string `json:"content"`
		} `json:"data"`
	}
	json.Unmarshal(body, &resp)

	return resp.Data.Content, nil
}

// ZohoSendMessage sends an email via the Zoho Mail API
func ZohoSendMessage(ctx context.Context, token, accountID string, req ZohoSendReq) error {
	url := fmt.Sprintf("%s/accounts/%s/messages", ZohoMailAPIBase(), accountID)

	payload, _ := json.Marshal(req)
	httpReq, err := http.NewRequestWithContext(ctx, "POST", url, strings.NewReader(string(payload)))
	if err != nil {
		return err
	}
	httpReq.Header.Set("Authorization", "Zoho-oauthtoken "+token)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("zoho send error %d: %s", resp.StatusCode, string(body))
	}
	return nil
}

// ZohoMarkRead marks a message as read
func ZohoMarkRead(ctx context.Context, token, accountID, messageID string) error {
	return zohoUpdateMessage(ctx, token, accountID, map[string]interface{}{
		"mode":      "markAsRead",
		"messageId": []string{messageID},
	})
}

// ZohoMarkUnread marks a message as unread
func ZohoMarkUnread(ctx context.Context, token, accountID, messageID string) error {
	return zohoUpdateMessage(ctx, token, accountID, map[string]interface{}{
		"mode":      "markAsUnread",
		"messageId": []string{messageID},
	})
}

// ZohoTrashMessage moves a message to trash via DELETE
func ZohoTrashMessage(ctx context.Context, token, accountID, folderID, messageID string) error {
	url := fmt.Sprintf("%s/accounts/%s/folders/%s/messages/%s", ZohoMailAPIBase(), accountID, folderID, messageID)
	if zohoDebug() {
		log.Printf("zoho_api: DELETE %s", url)
	}

	req, err := http.NewRequestWithContext(ctx, "DELETE", url, nil)
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Zoho-oauthtoken "+token)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("zoho trash error %d: %s", resp.StatusCode, string(respBody))
	}
	return nil
}

func zohoUpdateMessage(ctx context.Context, token, accountID string, payload map[string]interface{}) error {
	url := fmt.Sprintf("%s/accounts/%s/updatemessage", ZohoMailAPIBase(), accountID)
	body, _ := json.Marshal(payload)
	if zohoDebug() {
		log.Printf("zoho_api: PUT %s body=%s", url, string(body))
	}

	req, err := http.NewRequestWithContext(ctx, "PUT", url, strings.NewReader(string(body)))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Zoho-oauthtoken "+token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("zoho update error %d: %s", resp.StatusCode, string(respBody))
	}
	return nil
}

// ─── Conversion ─────────────────────────────────────────────────────────────

// ZohoHashUID computes a uint32 UID from a Zoho messageID using FNV-1a hash
func ZohoHashUID(messageID string) uint32 {
	h := fnv.New32a()
	h.Write([]byte(messageID))
	return h.Sum32()
}

func zohoToSummary(m zohoMessage) MessageSummary {
	millis, _ := m.ReceivedTime.Int64()
	t := time.UnixMilli(millis)
	uid := ZohoHashUID(m.MessageID)

	// status=1 means read, status=0 means unread
	// status2 is a legacy field and seems to always be "0", ignore it
	unread := m.Status != "1"

	threadCount := 0
	fmt.Sscanf(m.ThreadCount, "%d", &threadCount)

	return MessageSummary{
		UID:         uid,
		Date:        t,
		From:        m.FromAddress,
		To:          m.ToAddress,
		Cc:          m.CcAddress,
		Subject:     m.Subject,
		Snippet:     m.Summary,
		Unread:      unread,
		Starred:     m.Flagid != "" && m.Flagid != "flag_not_set",
		ThreadID:    m.ThreadID,
		ThreadCount: threadCount,
	}
}

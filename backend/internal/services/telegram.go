package services

import (
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/waitless/waitless/internal/database"
	"github.com/waitless/waitless/internal/models"
)

var tgClient = &http.Client{Timeout: 5 * time.Second}

// SendTelegramNotification sends a message via Telegram Bot API
func SendTelegramNotification(botToken, chatID, message string) error {
	if botToken == "" || chatID == "" {
		return nil
	}

	apiURL := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", botToken)
	resp, err := tgClient.PostForm(apiURL, url.Values{
		"chat_id":    {chatID},
		"text":       {message},
		"parse_mode": {"HTML"},
	})
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return fmt.Errorf("telegram API returned %d", resp.StatusCode)
	}
	return nil
}

func NotifyNewSubscriber(projectID string, projectName string, email string, name string, promoCode string) {
	var cfg models.TelegramConfig
	if err := database.DB.Where("project_id = ? AND enabled = true AND notify_signup = true", projectID).
		First(&cfg).Error; err != nil {
		return
	}

	// Check campaign filter:
	// If the user specified a CampaignFilter, we ONLY notify if the promoCode matches one in the filter
	if cfg.CampaignFilter != "" {
		if promoCode == "" {
			return // Filter is set, but this is an organic signup (no promo code)
		}
		filters := strings.Split(cfg.CampaignFilter, ",")
		matched := false
		for _, f := range filters {
			if strings.TrimSpace(f) == promoCode {
				matched = true
				break
			}
		}
		if !matched {
			return
		}
	}

	msg := fmt.Sprintf("🔔 <b>New Subscriber</b>\n\n📧 %s", email)
	if name != "" {
		msg += fmt.Sprintf("\n👤 %s", name)
	}
	msg += fmt.Sprintf("\n📋 %s", projectName)
	if promoCode != "" {
		msg += fmt.Sprintf("\n🏷 Promo: <code>%s</code>", promoCode)
	}

	if err := SendTelegramNotification(cfg.BotToken, cfg.ChatID, msg); err != nil {
		fmt.Printf("[Telegram] Failed to send new subscriber notification: %v\n", err)
	}
}

// NotifyCouponRedeemed sends a Telegram notification when a coupon is redeemed
func NotifyCouponRedeemed(projectID, couponCode, email string) {
	var cfg models.TelegramConfig
	if err := database.DB.Where("project_id = ? AND enabled = true AND notify_coupon = true", projectID).
		First(&cfg).Error; err != nil {
		return
	}

	msg := fmt.Sprintf("🎟 <b>Coupon Redeemed</b>\n\n🔑 <code>%s</code>\n📧 %s", couponCode, email)
	SendTelegramNotification(cfg.BotToken, cfg.ChatID, msg)
}

// NotifyUnsubscribe sends a Telegram notification when someone unsubscribes
func NotifyUnsubscribe(projectID, email string) {
	var cfg models.TelegramConfig
	if err := database.DB.Where("project_id = ? AND enabled = true AND notify_unsubscribe = true", projectID).
		First(&cfg).Error; err != nil {
		return
	}

	msg := fmt.Sprintf("👋 <b>Unsubscribed</b>\n\n📧 %s", email)
	SendTelegramNotification(cfg.BotToken, cfg.ChatID, msg)
}

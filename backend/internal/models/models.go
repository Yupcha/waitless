package models

import (
	"time"

	"gorm.io/gorm"
)

type Role string

const (
	RoleUser  Role = "user"
	RoleAdmin Role = "admin"
)

type SubscriberStatus string

const (
	StatusActive       SubscriberStatus = "active"
	StatusUnsubscribed SubscriberStatus = "unsubscribed"
	StatusPending      SubscriberStatus = "pending" // for double opt-in
)

type Source string

const (
	SourceForm   Source = "form"
	SourceAPI    Source = "api"
	SourceWidget Source = "widget"
	SourceImport Source = "import"
)

type ProjectStatus string

const (
	ProjectActive ProjectStatus = "active"
	ProjectPaused ProjectStatus = "paused"
)

type EmailLogStatus string

const (
	EmailSent   EmailLogStatus = "sent"
	EmailFailed EmailLogStatus = "failed"
)

type AnalyticsEvent string

const (
	EventPageView AnalyticsEvent = "page_view"
	EventSignup   AnalyticsEvent = "signup"
)

// User represents an account
type User struct {
	ID           string     `json:"id" gorm:"type:varchar(12);primaryKey"`
	Email        string     `json:"email" gorm:"uniqueIndex;not null"`
	PasswordHash string     `json:"-"`
	Name         string     `json:"name"`
	Role         Role       `json:"role" gorm:"default:'user'"`
	ResetToken   string     `json:"-" gorm:"index"`
	ResetExpiry  *time.Time `json:"-"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
	DeletedAt    *time.Time `json:"-" gorm:"index"`
	Projects     []Project  `json:"projects,omitempty" gorm:"foreignKey:UserID"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == "" {
		u.ID = NewID()
	}
	return nil
}

// Session for server-side auth
type Session struct {
	ID        string    `json:"id" gorm:"type:varchar(12);primaryKey"`
	UserID    string    `json:"user_id" gorm:"type:varchar(12);not null;index"`
	Token     string    `json:"token" gorm:"uniqueIndex;not null"`
	IPAddress string    `json:"ip_address"`
	UserAgent string    `json:"user_agent"`
	ExpiresAt time.Time `json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
	User      User      `json:"-" gorm:"foreignKey:UserID"`
}

func (s *Session) BeforeCreate(tx *gorm.DB) error {
	if s.ID == "" {
		s.ID = NewID()
	}
	return nil
}

// Project is a waitlist
type Project struct {
	ID            string        `json:"id" gorm:"type:varchar(12);primaryKey"`
	UserID        string        `json:"user_id" gorm:"type:varchar(12);not null;index"`
	Name          string        `json:"name" gorm:"not null"`
	Slug          string        `json:"slug" gorm:"uniqueIndex;not null"`
	Description   string        `json:"description"`
	LogoURL       string        `json:"logo_url"`
	LaunchDate    *time.Time    `json:"launch_date"`
	Features      string        `json:"features"` // comma-separated
	CurrentPrice  string        `json:"current_price"`
	DiscountPrice string        `json:"discount_price"`
	OfferTitle    string        `json:"offer_title"`
	ThemeColor    string        `json:"theme_color" gorm:"default:'#6366f1'"`
	Status        ProjectStatus `json:"status" gorm:"default:'active'"`

	// Email customization
	WelcomeSubject string `json:"welcome_subject"`
	WelcomeBody    string `json:"welcome_body"` // Custom welcome message

	// Privacy
	PrivacyPolicy string `json:"privacy_policy"`

	// Double opt-in
	DoubleOptIn bool `json:"double_optin" gorm:"default:false"`

	// Custom form fields
	CustomFields string `json:"custom_fields"` // JSON array of field definitions

	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
	DeletedAt   *time.Time   `json:"-" gorm:"index"`
	User        User         `json:"user,omitempty" gorm:"foreignKey:UserID"`
	SMTP        *ProjectSMTP `json:"smtp,omitempty" gorm:"foreignKey:ProjectID"`
	Subscribers []Subscriber `json:"subscribers,omitempty" gorm:"foreignKey:ProjectID"`
}

func (p *Project) BeforeCreate(tx *gorm.DB) error {
	if p.ID == "" {
		p.ID = NewID()
	}
	return nil
}

// ProjectSMTP holds per-project SMTP config
type ProjectSMTP struct {
	ID        string    `json:"id" gorm:"type:varchar(12);primaryKey"`
	ProjectID string    `json:"project_id" gorm:"type:varchar(12);uniqueIndex;not null"`
	Host      string    `json:"host"`
	Port      int       `json:"port" gorm:"default:587"`
	Username  string    `json:"username"`
	Password  string    `json:"-"` // AES-256-GCM encrypted at rest
	FromEmail string    `json:"from_email"`
	FromName  string    `json:"from_name"`
	TLS       bool      `json:"tls" gorm:"default:true"`
	Verified  bool      `json:"verified" gorm:"default:false"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (s *ProjectSMTP) BeforeCreate(tx *gorm.DB) error {
	if s.ID == "" {
		s.ID = NewID()
	}
	return nil
}

// Subscriber is a waitlist signup
type Subscriber struct {
	ID               string           `json:"id" gorm:"type:varchar(12);primaryKey"`
	ProjectID        string           `json:"project_id" gorm:"type:varchar(12);not null;index"`
	Email            string           `json:"email" gorm:"not null"`
	Name             string           `json:"name"`
	Status           SubscriberStatus `json:"status" gorm:"default:'active'"`
	Source           Source           `json:"source" gorm:"default:'form'"`
	IPAddress        string           `json:"ip_address"`
	Country          string           `json:"country" gorm:"type:varchar(2)"`
	UnsubscribeToken string           `json:"-" gorm:"uniqueIndex"`
	ConfirmedAt      *time.Time       `json:"confirmed_at"` // for double opt-in
	CustomData       string           `json:"custom_data"`  // JSON object
	CreatedAt        time.Time        `json:"created_at"`
	UpdatedAt        time.Time        `json:"updated_at"`
}

func (s *Subscriber) BeforeCreate(tx *gorm.DB) error {
	if s.ID == "" {
		s.ID = NewID()
	}
	// Generate unsubscribe token
	if s.UnsubscribeToken == "" {
		s.UnsubscribeToken = NewToken()
	}
	return nil
}

// APIKey for REST API access
type APIKey struct {
	ID        string     `json:"id" gorm:"type:varchar(12);primaryKey"`
	ProjectID string     `json:"project_id" gorm:"type:varchar(12);not null;index"`
	Name      string     `json:"name"`
	KeyHash   string     `json:"-" gorm:"not null"`
	Prefix    string     `json:"prefix"` // first 8 chars shown to user
	LastUsed  *time.Time `json:"last_used"`
	CreatedAt time.Time  `json:"created_at"`
}

func (k *APIKey) BeforeCreate(tx *gorm.DB) error {
	if k.ID == "" {
		k.ID = NewID()
	}
	return nil
}

// EmailLog tracks sent emails
type EmailLog struct {
	ID           string         `json:"id" gorm:"type:varchar(12);primaryKey"`
	ProjectID    string         `json:"project_id" gorm:"type:varchar(12);not null;index"`
	SubscriberID string         `json:"subscriber_id" gorm:"type:varchar(12);index"`
	Template     string         `json:"template"`
	Subject      string         `json:"subject"`
	Recipient    string         `json:"recipient"`
	Status       EmailLogStatus `json:"status"`
	Error        string         `json:"error"`
	SentAt       time.Time      `json:"sent_at"`
}

func (e *EmailLog) BeforeCreate(tx *gorm.DB) error {
	if e.ID == "" {
		e.ID = NewID()
	}
	return nil
}

// AnalyticsRecord tracks events
type AnalyticsRecord struct {
	ID        string         `json:"id" gorm:"type:varchar(12);primaryKey"`
	ProjectID string         `json:"project_id" gorm:"type:varchar(12);not null;index"`
	Event     AnalyticsEvent `json:"event"`
	IPAddress string         `json:"ip_address"`
	UserAgent string         `json:"user_agent"`
	Referrer  string         `json:"referrer"`
	CreatedAt time.Time      `json:"created_at"`
}

func (a *AnalyticsRecord) BeforeCreate(tx *gorm.DB) error {
	if a.ID == "" {
		a.ID = NewID()
	}
	return nil
}

// Webhook for developer notifications
type Webhook struct {
	ID        string    `json:"id" gorm:"type:varchar(12);primaryKey"`
	ProjectID string    `json:"project_id" gorm:"type:varchar(12);not null;index"`
	URL       string    `json:"url" gorm:"not null"`
	Events    string    `json:"events"` // comma-separated: subscriber.created, subscriber.unsubscribed
	Secret    string    `json:"-"`      // HMAC signing secret
	Active    bool      `json:"active" gorm:"default:true"`
	LastError string    `json:"last_error"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (wh *Webhook) BeforeCreate(tx *gorm.DB) error {
	if wh.ID == "" {
		wh.ID = NewID()
	}
	return nil
}

// TelegramConfig holds per-project Telegram notification settings
type TelegramConfig struct {
	ID               string `json:"id" gorm:"type:varchar(12);primaryKey"`
	ProjectID        string `json:"project_id" gorm:"type:varchar(12);not null;index"`
	BotToken         string `json:"bot_token"`
	ChatID           string `json:"chat_id"`
	Enabled          bool   `json:"enabled" gorm:"default:false"`
	NotifySignup     bool   `json:"notify_signup" gorm:"default:true"`     // new subscriber
	NotifyCoupon     bool   `json:"notify_coupon" gorm:"default:false"`    // coupon redeemed
	NotifyUnsubscribe bool  `json:"notify_unsubscribe" gorm:"default:false"`
	CampaignFilter   string `json:"campaign_filter"`                       // optional: only for specific promo codes (comma-separated), empty = all
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

func (t *TelegramConfig) BeforeCreate(tx *gorm.DB) error {
	if t.ID == "" {
		t.ID = NewID()
	}
	return nil
}

// CouponStatus tracks the lifecycle of a coupon code
type CouponStatus string

const (
	CouponActive  CouponStatus = "active"
	CouponUsed    CouponStatus = "used"
	CouponRevoked CouponStatus = "revoked"
	CouponExpired CouponStatus = "expired"
)

type DiscountType string

const (
	DiscountFlat    DiscountType = "flat"
	DiscountPercent DiscountType = "percent"
)

// PromoCampaign is a per-project promo configuration
type PromoCampaign struct {
	ID            string       `json:"id" gorm:"type:varchar(12);primaryKey"`
	ProjectID     string       `json:"project_id" gorm:"type:varchar(12);not null;index"`
	PromoCode     string       `json:"promo_code" gorm:"type:varchar(50)"` // trigger code (get5, promo6)
	IsDefault     bool         `json:"is_default" gorm:"default:false"`
	Enabled       bool         `json:"enabled" gorm:"default:false"`
	DiscountType  DiscountType `json:"discount_type" gorm:"default:'flat'"`
	DiscountValue float64      `json:"discount_value" gorm:"default:0"`
	Currency      string       `json:"currency" gorm:"default:'USD'"`
	CodePrefix    string       `json:"code_prefix"`
	CodeLength    int          `json:"code_length" gorm:"default:8"`
	MaxCodes      int          `json:"max_codes" gorm:"default:0"` // 0 = unlimited
	ValidDays     int          `json:"valid_days" gorm:"default:0"` // 0 = never expires
	Description   string       `json:"description"`
	CodesIssued   int64        `json:"codes_issued" gorm:"-"` // virtual field
	CreatedAt     time.Time    `json:"created_at"`
	UpdatedAt     time.Time    `json:"updated_at"`
}

func (p *PromoCampaign) BeforeCreate(tx *gorm.DB) error {
	if p.ID == "" {
		p.ID = NewID()
	}
	return nil
}

// CouponCode is a unique code generated per subscriber
type CouponCode struct {
	ID            string       `json:"id" gorm:"type:varchar(12);primaryKey"`
	ProjectID     string       `json:"project_id" gorm:"type:varchar(12);not null;index"`
	CampaignID    string       `json:"campaign_id" gorm:"type:varchar(12);index"`
	SubscriberID  string       `json:"subscriber_id" gorm:"type:varchar(12);not null;index"`
	Code          string       `json:"code" gorm:"uniqueIndex;not null"`
	SourceCode    string       `json:"source_code"` // promo code the subscriber used
	Status        CouponStatus `json:"status" gorm:"default:'active'"`
	DiscountType  DiscountType `json:"discount_type"`
	DiscountValue float64      `json:"discount_value"`
	Currency      string       `json:"currency"`
	UsedAt        *time.Time   `json:"used_at"`
	ExpiresAt     *time.Time   `json:"expires_at"`
	CreatedAt     time.Time    `json:"created_at"`
	UpdatedAt     time.Time    `json:"updated_at"`
	Subscriber    Subscriber   `json:"subscriber,omitempty" gorm:"foreignKey:SubscriberID"`
	Campaign      *PromoCampaign `json:"campaign,omitempty" gorm:"foreignKey:CampaignID"`
}

func (c *CouponCode) BeforeCreate(tx *gorm.DB) error {
	if c.ID == "" {
		c.ID = NewID()
	}
	return nil
}

// GenerateCouponCode creates a random coupon code with optional prefix
func GenerateCouponCode(prefix string, length int) string {
	if length < 6 {
		length = 8
	}
	code := generate(length)
	if prefix != "" {
		return prefix + "-" + code
	}
	return code
}

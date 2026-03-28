package api

import (
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/go-chi/httprate"
	"github.com/waitless/waitless/internal/database"
	authmw "github.com/waitless/waitless/internal/middleware"
)

func NewRouter(version string, startTime time.Time) http.Handler {
	r := chi.NewRouter()

	// Standard middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RealIP)
	r.Use(authmw.SecurityHeaders)
	r.Use(authmw.MaxBodySize)

	// CORS — configurable via env
	allowedOrigins := []string{"*"}
	if origins := os.Getenv("ALLOWED_ORIGINS"); origins != "" {
		allowedOrigins = strings.Split(origins, ",")
	}
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-API-Key"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Enhanced health check with DB connectivity, version, and uptime
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		dbStatus := "ok"
		if err := database.Ping(); err != nil {
			dbStatus = "error: " + err.Error()
		}
		uptime := time.Since(startTime).Truncate(time.Second).String()

		status := http.StatusOK
		overall := "ok"
		if dbStatus != "ok" {
			status = http.StatusServiceUnavailable
			overall = "degraded"
		}

		jsonResponse(w, map[string]interface{}{
			"status":   overall,
			"version":  version,
			"uptime":   uptime,
			"database": dbStatus,
		}, status)
	})

	// Public waitlist API
	r.Route("/api/public", func(r chi.Router) {
		r.Use(httprate.LimitByIP(20, time.Minute))
		r.Get("/w/{slug}", GetProjectBySlug)
		r.Post("/w/{slug}/subscribe", PublicSignup)
		r.Get("/unsubscribe", HandleUnsubscribe)
	})

	// Auth routes
	r.Route("/api/auth", func(r chi.Router) {
		r.Use(httprate.LimitByIP(10, time.Minute))
		r.Post("/register", Register)
		r.Post("/login", Login)
		r.Post("/logout", Logout)
		r.Post("/forgot-password", ForgotPassword)
		r.Post("/reset-password", ResetPassword)
		r.With(authmw.AuthRequired).Get("/me", Me)
		r.With(authmw.AuthRequired).Put("/me", UpdateProfile)
		r.With(authmw.AuthRequired).Put("/me/password", ChangePassword)
	})

	// Dashboard API (authenticated)
	r.Route("/api/dashboard", func(r chi.Router) {
		r.Use(authmw.AuthRequired)

		// Projects
		r.Get("/projects", ListProjects)
		r.Post("/projects", CreateProject)
		r.Get("/projects/{id}", GetProject)
		r.Put("/projects/{id}", UpdateProject)
		r.Delete("/projects/{id}", DeleteProject)
		r.Patch("/projects/{id}/status", UpdateProjectStatus)
		r.Get("/projects/{id}/stats", GetProjectStats)

		// Subscribers
		r.Get("/projects/{id}/subscribers", ListSubscribers)
		r.Get("/projects/{id}/subscribers/export", ExportSubscribersCSV)
		r.Post("/projects/{id}/subscribers/bulk", BulkAction)
		r.Post("/projects/{id}/subscribers/import", ImportSubscribersCSV)
		r.Delete("/projects/{id}/subscribers/{subId}", DeleteSubscriber)
		r.Patch("/projects/{id}/subscribers/{subId}/status", UpdateSubscriberStatus)

		// Email Logs
		r.Get("/projects/{id}/emails", ListEmailLogs)

		// SMTP
		r.Get("/projects/{id}/smtp", GetSMTP)
		r.Put("/projects/{id}/smtp", SaveSMTP)
		r.Post("/projects/{id}/smtp/test", TestSMTP)

		// API Keys
		r.Get("/projects/{id}/keys", ListAPIKeys)
		r.Post("/projects/{id}/keys", CreateAPIKey)
		r.Delete("/projects/{id}/keys/{keyId}", DeleteAPIKey)

		// Webhooks
		r.Get("/projects/{id}/webhooks", ListWebhooks)
		r.Post("/projects/{id}/webhooks", CreateWebhook)
		r.Delete("/projects/{id}/webhooks/{whId}", DeleteWebhook)

		// Widget
		r.Get("/projects/{id}/widget", GetWidgetCode)

		// Coupons / Promo Campaigns
		r.Get("/projects/{id}/campaigns", ListPromoCampaigns)
		r.Post("/projects/{id}/campaigns", CreatePromoCampaign)
		r.Put("/projects/{id}/campaigns/{cid}", UpdatePromoCampaign)
		r.Delete("/projects/{id}/campaigns/{cid}", DeletePromoCampaign)
		r.Get("/projects/{id}/coupons", ListCouponCodes)
		r.Patch("/projects/{id}/coupons/{cid}/revoke", RevokeCouponCode)

		// Telegram
		r.Get("/projects/{id}/telegram", GetTelegramConfig)
		r.Put("/projects/{id}/telegram", SaveTelegramConfig)
		r.Post("/projects/{id}/telegram/test", TestTelegramConfig)
	})

	// Admin API
	r.Route("/api/admin", func(r chi.Router) {
		r.Use(authmw.AuthRequired)
		r.Use(authmw.AdminRequired)

		r.Get("/users", AdminGetAllUsers)
		r.Get("/projects", AdminGetAllProjects)
		r.Get("/stats", AdminGetPlatformStats)
	})

	// REST API v1 (API key auth)
	r.Route("/api/v1", func(r chi.Router) {
		r.Use(httprate.LimitByIP(100, time.Minute))
		r.Use(authmw.APIKeyAuth)
		r.Get("/projects/{projectId}/subscribers", APIListSubscribers)
		r.Post("/projects/{projectId}/subscribers", APIAddSubscriber)
		r.Get("/projects/{projectId}/count", APISubscriberCount)
		r.Get("/projects/{projectId}/coupons/validate", APIValidateCoupon)
		r.Patch("/projects/{projectId}/coupons/{code}/status", APIUpdateCouponStatus)
	})

	return r
}

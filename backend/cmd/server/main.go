package main

import (
	"context"
	"embed"
	"fmt"
	"io/fs"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	"github.com/waitless/waitless/internal/api"
	"github.com/waitless/waitless/internal/database"
	"github.com/waitless/waitless/internal/models"
	"github.com/waitless/waitless/internal/services"
)

//go:embed all:dist
var frontendDist embed.FS

var (
	Version   = "1.0.0"
	StartTime time.Time
)

func main() {
	// Load .env first — before anything else
	godotenv.Load()

	// CLI subcommands
	if len(os.Args) > 1 && os.Args[1] != "serve" {
		runCLI(os.Args[1:])
		return
	}

	StartTime = time.Now()

	// Structured logging
	logLevel := slog.LevelInfo
	if os.Getenv("LOG_LEVEL") == "debug" {
		logLevel = slog.LevelDebug
	}
	var handler slog.Handler
	if os.Getenv("LOG_FORMAT") == "json" || os.Getenv("GO_ENV") == "production" {
		handler = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: logLevel})
	} else {
		handler = slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: logLevel})
	}
	slog.SetDefault(slog.New(handler))

	// Init encryption
	if err := services.InitEncryption(); err != nil {
		slog.Error("Encryption init failed", "error", err)
		os.Exit(1)
	}

	// Connect to database
	if err := database.Connect(); err != nil {
		slog.Error("Database connection failed", "error", err)
		os.Exit(1)
	}

	// Run migrations
	if err := database.Migrate(); err != nil {
		slog.Error("Migration failed", "error", err)
		os.Exit(1)
	}

	// Cleanup expired sessions periodically
	go func() {
		ticker := time.NewTicker(6 * time.Hour)
		defer ticker.Stop()
		for range ticker.C {
			database.DB.Exec("DELETE FROM sessions WHERE expires_at < NOW()")
			slog.Debug("Cleaned up expired sessions")
		}
	}()

	// Build API router
	router := api.NewRouter(Version, StartTime)

	// Serve embedded SPA from dist/
	clientFS, err := fs.Sub(frontendDist, "dist")
	if err != nil {
		slog.Error("Failed to get dist", "error", err)
		os.Exit(1)
	}

	// Read index.html once at startup for SPA fallback
	indexHTML, err := fs.ReadFile(frontendDist, "dist/index.html")
	if err != nil {
		slog.Error("Failed to read index.html", "error", err)
		os.Exit(1)
	}

	fileServer := http.FileServer(http.FS(clientFS))
	mux := http.NewServeMux()
	mux.Handle("/api/", router)
	mux.Handle("/health", router)
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Serve actual files (JS, CSS, images, etc.)
		if strings.Contains(r.URL.Path, ".") {
			fileServer.ServeHTTP(w, r)
			return
		}
		// SPA fallback — serve index.html for all routes
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Write(indexHTML)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      mux,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		slog.Info("Waitless started", "port", port, "version", Version)
		fmt.Printf("🚀 Waitless running on http://localhost:%s\n", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("Server error", "error", err)
			os.Exit(1)
		}
	}()

	// Background cleanup for hard-deleting expired projects
	go func() {
		ticker := time.NewTicker(1 * time.Hour)
		defer ticker.Stop()
		for range ticker.C {
			var projects []models.Project
			database.DB.Where("status = ? AND scheduled_deletion_at < ?", models.ProjectPendingDeletion, time.Now()).Find(&projects)
			for _, project := range projects {
				slog.Info("Permanently deleting expired project", "project_id", project.ID)
				database.DB.Where("project_id = ?", project.ID).Delete(&models.Subscriber{})
				database.DB.Where("project_id = ?", project.ID).Delete(&models.ProjectSMTP{})
				database.DB.Where("project_id = ?", project.ID).Delete(&models.APIKey{})
				database.DB.Where("project_id = ?", project.ID).Delete(&models.EmailLog{})
				database.DB.Where("project_id = ?", project.ID).Delete(&models.AnalyticsRecord{})
				database.DB.Unscoped().Delete(&project)
			}
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("Shutting down gracefully...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		slog.Error("Forced shutdown", "error", err)
		os.Exit(1)
	}
	slog.Info("Server stopped")
}

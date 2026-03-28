package database

import (
	"fmt"
	"log/slog"
	"os"

	"github.com/waitless/waitless/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect() error {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		return fmt.Errorf("DATABASE_URL environment variable is required")
	}

	logLevel := logger.Silent
	if os.Getenv("DB_DEBUG") == "true" {
		logLevel = logger.Info
	}

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	slog.Info("Database connected")
	return nil
}

func Migrate() error {
	err := DB.AutoMigrate(
		&models.User{},
		&models.Session{},
		&models.Project{},
		&models.ProjectSMTP{},
		&models.Subscriber{},
		&models.APIKey{},
		&models.EmailLog{},
		&models.AnalyticsRecord{},
		&models.Webhook{},
		&models.PromoCampaign{},
		&models.CouponCode{},
		&models.TelegramConfig{},
	)
	if err != nil {
		return fmt.Errorf("migration failed: %w", err)
	}
	slog.Info("Database migrated")
	return nil
}

// Ping checks database connectivity
func Ping() error {
	sqlDB, err := DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Ping()
}

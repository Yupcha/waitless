package middleware

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"strings"
	"time"

	"github.com/waitless/waitless/internal/database"
	"github.com/waitless/waitless/internal/models"
)

type projectIDKey struct{}

func APIKeyAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		key := extractAPIKey(r)
		if key == "" {
			http.Error(w, `{"error":"missing api key"}`, http.StatusUnauthorized)
			return
		}

		hash := hashKey(key)
		var apiKey models.APIKey
		if err := database.DB.Where("key_hash = ?", hash).First(&apiKey).Error; err != nil {
			http.Error(w, `{"error":"invalid api key"}`, http.StatusUnauthorized)
			return
		}

		// Update last used
		now := time.Now()
		database.DB.Model(&apiKey).Update("last_used", now)

		ctx := context.WithValue(r.Context(), projectIDKey{}, apiKey.ProjectID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func extractAPIKey(r *http.Request) string {
	auth := r.Header.Get("Authorization")
	if strings.HasPrefix(auth, "Bearer wl_") {
		return strings.TrimPrefix(auth, "Bearer ")
	}
	return r.Header.Get("X-API-Key")
}

func hashKey(key string) string {
	h := sha256.Sum256([]byte(key))
	return hex.EncodeToString(h[:])
}

func GetAPIKeyProjectID(r *http.Request) string {
	id, ok := r.Context().Value(projectIDKey{}).(string)
	if !ok {
		return ""
	}
	return id
}

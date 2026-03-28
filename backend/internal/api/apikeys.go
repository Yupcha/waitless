package api

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/waitless/waitless/internal/database"
	"github.com/waitless/waitless/internal/middleware"
	"github.com/waitless/waitless/internal/models"
)

func ListAPIKeys(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	projectID := chi.URLParam(r, "id")

	if !userOwnsProject(user, projectID) {
		jsonError(w, "project not found", http.StatusNotFound)
		return
	}

	var keys []models.APIKey
	database.DB.Where("project_id = ?", projectID).Order("created_at DESC").Find(&keys)
	jsonResponse(w, keys, http.StatusOK)
}

func CreateAPIKey(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	projectID := chi.URLParam(r, "id")

	if !userOwnsProject(user, projectID) {
		jsonError(w, "project not found", http.StatusNotFound)
		return
	}

	var req struct {
		Name string `json:"name"`
	}
	json.NewDecoder(r.Body).Decode(&req)
	if req.Name == "" {
		req.Name = "Default"
	}

	// Generate key: wl_<32 random hex chars>
	raw := make([]byte, 24)
	rand.Read(raw)
	rawKey := "wl_" + hex.EncodeToString(raw)

	// Hash for storage
	h := sha256.Sum256([]byte(rawKey))
	hash := hex.EncodeToString(h[:])

	key := models.APIKey{
		ProjectID: projectID,
		Name:      req.Name,
		KeyHash:   hash,
		Prefix:    rawKey[:10],
	}

	if err := database.DB.Create(&key).Error; err != nil {
		jsonError(w, "error creating key", http.StatusInternalServerError)
		return
	}

	// Return full key only once
	jsonResponse(w, map[string]interface{}{
		"id":         key.ID,
		"name":       key.Name,
		"prefix":     key.Prefix,
		"key":        rawKey, // shown only once
		"created_at": key.CreatedAt,
	}, http.StatusCreated)
}

func DeleteAPIKey(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	projectID := chi.URLParam(r, "id")
	keyID := chi.URLParam(r, "keyId")

	if !userOwnsProject(user, projectID) {
		jsonError(w, "project not found", http.StatusNotFound)
		return
	}

	database.DB.Where("id = ? AND project_id = ?", keyID, projectID).Delete(&models.APIKey{})
	jsonResponse(w, map[string]string{"message": "deleted"}, http.StatusOK)
}

func GetWidgetCode(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	projectID := chi.URLParam(r, "id")

	if !userOwnsProject(user, projectID) {
		jsonError(w, "project not found", http.StatusNotFound)
		return
	}

	var project models.Project
	database.DB.Where("id = ?", projectID).First(&project)

	baseURL := r.Host
	scheme := "https"
	if r.Header.Get("X-Forwarded-Proto") == "" {
		scheme = "http"
	}

	snippet := fmt.Sprintf(`<!-- Waitless Widget for %s -->
<div id="waitless-widget"></div>
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '%s://%s/widget.js';
    script.setAttribute('data-slug', '%s');
    script.setAttribute('data-container', 'waitless-widget');
    document.head.appendChild(script);
  })();
</script>`, project.Name, scheme, baseURL, project.Slug)

	iframeSnippet := fmt.Sprintf(`<!-- Waitless Embed for %s (iframe) -->
<iframe 
  src="%s://%s/embed/%s"
  width="100%%"
  height="400"
  frameborder="0"
  style="border-radius:12px;"
></iframe>`, project.Name, scheme, baseURL, project.Slug)

	jsonResponse(w, map[string]string{
		"widget_snippet": snippet,
		"iframe_snippet": iframeSnippet,
		"slug":           project.Slug,
	}, http.StatusOK)
}

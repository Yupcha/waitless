package services

import (
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"time"

	"github.com/waitless/waitless/internal/database"
	"github.com/waitless/waitless/internal/models"
)

type geoResponse struct {
	CountryCode string `json:"countryCode"`
}

var geoClient = &http.Client{Timeout: 3 * time.Second}

// LookupCountry returns a 2-letter country code from an IP address
func LookupCountry(ip string) string {
	// Skip private/localhost IPs
	parsed := net.ParseIP(ip)
	if parsed == nil || parsed.IsLoopback() || parsed.IsPrivate() {
		return ""
	}

	resp, err := geoClient.Get(fmt.Sprintf("http://ip-api.com/json/%s?fields=countryCode", ip))
	if err != nil {
		return ""
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return ""
	}

	var geo geoResponse
	if err := json.NewDecoder(resp.Body).Decode(&geo); err != nil {
		return ""
	}
	return geo.CountryCode
}

// UpdateSubscriberCountry looks up and stores the country for a subscriber
func UpdateSubscriberCountry(subscriberID, ip string) {
	country := LookupCountry(ip)
	if country != "" {
		database.DB.Model(&models.Subscriber{}).Where("id = ?", subscriberID).
			Update("country", country)
	}
}

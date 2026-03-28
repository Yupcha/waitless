package services

import (
	"html"
	"regexp"
	"strings"
)

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

func ValidateEmail(email string) bool {
	email = strings.TrimSpace(email)
	if len(email) > 254 || len(email) < 5 {
		return false
	}
	return emailRegex.MatchString(email)
}

func SanitizeString(s string) string {
	s = html.EscapeString(strings.TrimSpace(s))
	if len(s) > 500 {
		s = s[:500]
	}
	return s
}

func SanitizeName(name string) string {
	name = strings.TrimSpace(name)
	// Strip anything that looks like HTML
	name = regexp.MustCompile(`<[^>]*>`).ReplaceAllString(name, "")
	if len(name) > 100 {
		name = name[:100]
	}
	return name
}

// AllowedSortColumns returns true if the column is safe for ORDER BY
var subscriberSortColumns = map[string]bool{
	"created_at": true,
	"email":      true,
	"name":       true,
	"status":     true,
	"source":     true,
}

func ValidateSortColumn(col string) string {
	if subscriberSortColumns[col] {
		return col
	}
	return "created_at"
}

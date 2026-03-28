package api

import (
	"net/http"

	"github.com/waitless/waitless/internal/database"
	"github.com/waitless/waitless/internal/models"
)

func AdminGetAllUsers(w http.ResponseWriter, r *http.Request) {
	var users []models.User
	database.DB.Order("created_at DESC").Find(&users)

	// Count projects per user
	type UserWithStats struct {
		models.User
		ProjectCount    int64 `json:"project_count"`
		SubscriberCount int64 `json:"subscriber_count"`
	}

	result := make([]UserWithStats, len(users))
	for i, u := range users {
		result[i].User = u
		database.DB.Model(&models.Project{}).Where("user_id = ?", u.ID).Count(&result[i].ProjectCount)
		
		var projectIDs []string
		database.DB.Model(&models.Project{}).Where("user_id = ?", u.ID).
			Pluck("id", &projectIDs)
		if len(projectIDs) > 0 {
			database.DB.Model(&models.Subscriber{}).
				Where("project_id IN ?", projectIDs).Count(&result[i].SubscriberCount)
		}
	}

	jsonResponse(w, result, http.StatusOK)
}

func AdminGetAllProjects(w http.ResponseWriter, r *http.Request) {
	var projects []models.Project
	database.DB.Preload("User").Order("created_at DESC").Find(&projects)

	type ProjectWithStats struct {
		models.Project
		SubscriberCount int64 `json:"subscriber_count"`
	}

	result := make([]ProjectWithStats, len(projects))
	for i, p := range projects {
		result[i].Project = p
		database.DB.Model(&models.Subscriber{}).
			Where("project_id = ?", p.ID).Count(&result[i].SubscriberCount)
	}

	jsonResponse(w, result, http.StatusOK)
}

func AdminGetPlatformStats(w http.ResponseWriter, r *http.Request) {
	var totalUsers, totalProjects, totalSubscribers, totalEmailsSent int64

	database.DB.Model(&models.User{}).Count(&totalUsers)
	database.DB.Model(&models.Project{}).Count(&totalProjects)
	database.DB.Model(&models.Subscriber{}).Count(&totalSubscribers)
	database.DB.Model(&models.EmailLog{}).Where("status = ?", models.EmailSent).Count(&totalEmailsSent)

	// Growth: new users per day (last 30 days)
	type DailyStat struct {
		Date  string `json:"date"`
		Count int64  `json:"count"`
	}

	var userGrowth, subscriberGrowth []DailyStat

	database.DB.Raw(`
		SELECT DATE(created_at) as date, COUNT(*) as count
		FROM users
		WHERE created_at > NOW() - INTERVAL '30 days'
		GROUP BY DATE(created_at)
		ORDER BY date ASC
	`).Scan(&userGrowth)

	database.DB.Raw(`
		SELECT DATE(created_at) as date, COUNT(*) as count
		FROM subscribers
		WHERE created_at > NOW() - INTERVAL '30 days'
		GROUP BY DATE(created_at)
		ORDER BY date ASC
	`).Scan(&subscriberGrowth)

	jsonResponse(w, map[string]interface{}{
		"total_users":        totalUsers,
		"total_projects":     totalProjects,
		"total_subscribers":  totalSubscribers,
		"total_emails_sent":  totalEmailsSent,
		"user_growth":        userGrowth,
		"subscriber_growth":  subscriberGrowth,
	}, http.StatusOK)
}

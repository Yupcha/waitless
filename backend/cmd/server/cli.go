package main

import (
	"bufio"
	"fmt"
	"log/slog"
	"os"
	"os/exec"
	"strings"
	"text/tabwriter"

	"github.com/waitless/waitless/internal/database"
	"github.com/waitless/waitless/internal/models"
	"github.com/waitless/waitless/internal/services"
	"golang.org/x/crypto/bcrypt"
)

func runCLI(args []string) {
	if len(args) == 0 {
		printUsage()
		os.Exit(0)
	}

	switch args[0] {
	case "users":
		cmdListUsers()
	case "reset-password":
		if len(args) < 2 {
			fmt.Println("Usage: waitless reset-password <email>")
			os.Exit(1)
		}
		cmdResetPassword(args[1])
	case "backup":
		if len(args) < 2 {
			fmt.Println("Usage: waitless backup <output-file.sql>")
			os.Exit(1)
		}
		cmdBackup(args[1])
	case "restore":
		if len(args) < 2 {
			fmt.Println("Usage: waitless restore <input-file.sql>")
			os.Exit(1)
		}
		cmdRestore(args[1])
	default:
		fmt.Printf("Unknown command: %s\n", args[0])
		printUsage()
		os.Exit(1)
	}
}

func printUsage() {
	fmt.Println(`Waitless CLI

Usage: waitless <command> [args]

Commands:
  serve                      Start the HTTP server (default)
  users                      List all users
  reset-password <email>     Reset password for a user
  backup <file.sql>          Backup database to file
  restore <file.sql>         Restore database from file`)
}

func initDB() {
	if err := services.InitEncryption(); err != nil {
		slog.Error("Encryption init failed", "error", err)
		os.Exit(1)
	}
	if err := database.Connect(); err != nil {
		fmt.Printf("❌ Database connection failed: %v\n", err)
		os.Exit(1)
	}
}

func cmdListUsers() {
	initDB()

	var users []models.User
	database.DB.Order("created_at ASC").Find(&users)

	if len(users) == 0 {
		fmt.Println("No users found.")
		return
	}

	w := tabwriter.NewWriter(os.Stdout, 0, 0, 2, ' ', 0)
	fmt.Fprintln(w, "ID\tEMAIL\tNAME\tROLE\tCREATED")
	fmt.Fprintln(w, "──\t─────\t────\t────\t───────")
	for _, u := range users {
		fmt.Fprintf(w, "%s\t%s\t%s\t%s\t%s\n",
			u.ID, u.Email, u.Name, u.Role,
			u.CreatedAt.Format("2006-01-02 15:04"))
	}
	w.Flush()
	fmt.Printf("\nTotal: %d users\n", len(users))
}

func cmdResetPassword(email string) {
	initDB()

	email = strings.TrimSpace(strings.ToLower(email))

	var user models.User
	if err := database.DB.Where("email = ?", email).First(&user).Error; err != nil {
		fmt.Printf("❌ User not found: %s\n", email)
		os.Exit(1)
	}

	fmt.Printf("User: %s (%s) [%s]\n", user.Name, user.Email, user.Role)
	fmt.Print("New password (min 8 chars): ")

	reader := bufio.NewReader(os.Stdin)
	password, _ := reader.ReadString('\n')
	password = strings.TrimSpace(password)

	if len(password) < 8 {
		fmt.Println("❌ Password must be at least 8 characters")
		os.Exit(1)
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		fmt.Printf("❌ Error hashing password: %v\n", err)
		os.Exit(1)
	}

	database.DB.Model(&user).Updates(map[string]interface{}{
		"password_hash": string(hash),
		"reset_token":   "",
		"reset_expiry":  nil,
	})

	// Invalidate all sessions
	database.DB.Where("user_id = ?", user.ID).Delete(&models.Session{})

	fmt.Printf("✅ Password reset for %s. All sessions invalidated.\n", user.Email)
}

func cmdBackup(file string) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		fmt.Println("❌ DATABASE_URL not set")
		os.Exit(1)
	}

	fmt.Printf("Backing up to %s...\n", file)
	cmd := exec.Command("pg_dump", dsn, "-f", file, "--no-owner", "--no-acl")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		fmt.Printf("❌ Backup failed: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("✅ Backup saved to %s\n", file)
}

func cmdRestore(file string) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		fmt.Println("❌ DATABASE_URL not set")
		os.Exit(1)
	}

	if _, err := os.Stat(file); os.IsNotExist(err) {
		fmt.Printf("❌ File not found: %s\n", file)
		os.Exit(1)
	}

	fmt.Printf("⚠️  This will overwrite the current database. Continue? [y/N]: ")
	reader := bufio.NewReader(os.Stdin)
	answer, _ := reader.ReadString('\n')
	answer = strings.TrimSpace(strings.ToLower(answer))
	if answer != "y" && answer != "yes" {
		fmt.Println("Cancelled.")
		return
	}

	fmt.Printf("Restoring from %s...\n", file)
	cmd := exec.Command("psql", dsn, "-f", file)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		fmt.Printf("❌ Restore failed: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("✅ Database restored from %s\n", file)
}

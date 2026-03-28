.PHONY: dev dev-backend dev-frontend build run kill clean install test

# Production — kill, clean build, run single binary
run: kill clean build
	@nohup ./waitless > /tmp/waitless.log 2>&1 & echo "✅ Waitless running (PID $$!)"
	@sleep 1
	@tail -5 /tmp/waitless.log

# Build production binary
build:
	@echo "Building frontend..."
	@cd frontend && bun install --frozen-lockfile 2>/dev/null || cd frontend && bun install
	@cd frontend && bun run build
	@echo "Copying dist to backend embed..."
	@rm -rf backend/cmd/server/dist
	@cp -r frontend/dist backend/cmd/server/dist
	@echo "Building Go binary..."
	@cd backend && CGO_ENABLED=0 go build -ldflags="-s -w" -o ../waitless ./cmd/server
	@echo "✅ Built: ./waitless"

# Development — runs both backend + frontend
dev:
	@echo "Starting Waitless dev mode..."
	@make -j2 dev-backend dev-frontend

dev-backend:
	cd backend && go run ./cmd/server

dev-frontend:
	cd frontend && bun run dev

# Kill any running waitless server
kill:
	@-lsof -ti:8070 | xargs kill -9 2>/dev/null || true
	@sleep 0.5

# Clean
clean:
	@rm -rf waitless frontend/dist backend/cmd/server/dist

# Logs
logs:
	@tail -f /tmp/waitless.log

# Install dependencies
install:
	cd frontend && bun install
	cd backend && go mod download

# Run tests
test:
	cd backend && go test ./...

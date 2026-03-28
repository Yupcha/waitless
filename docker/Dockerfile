# Build stage: frontend
FROM oven/bun:1.2-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/bun.lock* ./
RUN bun install --frozen-lockfile
COPY frontend/ .
RUN bun run build

# Build stage: backend
FROM golang:1.25-alpine AS backend-builder
WORKDIR /app
RUN apk add --no-cache git ca-certificates
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ .
# Copy built frontend into embed location
COPY --from=frontend-builder /app/frontend/dist ./cmd/server/dist
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /waitless ./cmd/server

# Final stage: minimal runtime
FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
COPY --from=backend-builder /waitless ./waitless
EXPOSE 8080
ENTRYPOINT ["./waitless"]

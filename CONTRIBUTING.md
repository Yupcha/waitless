# Contributing to Waitless

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

### Prerequisites
- Go 1.25+
- Bun 1.2+
- PostgreSQL 16+

### Quick Start

```bash
git clone https://github.com/waitless/waitless
cd waitless

# Configure
cp .env.example .env
# Edit .env with your local database credentials

# Backend
cd backend && go mod download

# Frontend
cd ../frontend && bun install

# Run both dev servers
make dev-backend  # Terminal 1
make dev-frontend # Terminal 2
```

## Project Structure

```
waitless/
├── backend/           # Go API server
│   ├── cmd/server/    # Main entrypoint
│   └── internal/      # Business logic
│       ├── api/       # HTTP handlers
│       ├── database/  # Database connection
│       ├── middleware/ # Auth, security, rate limiting
│       ├── models/    # GORM data models
│       └── services/  # Email, crypto, validation
├── frontend/          # TanStack Start + React
│   └── src/
│       ├── routes/    # File-based routing
│       └── lib/       # API client, utilities
└── docker/            # Dockerfile + compose
```

## Making Changes

1. **Fork the repo** and create a branch from `main`
2. **Write your code** — follow existing patterns
3. **Test your changes** — `make test`
4. **Submit a PR** — describe what you changed and why

## Code Style

- **Go**: `gofmt` + `go vet`
- **TypeScript**: Standard TypeScript, no semicolons in JSX
- **CSS**: Vanilla CSS with design tokens

## What to Contribute

- 🐛 Bug fixes
- 📖 Documentation improvements
- 🌐 Translations
- 🧩 New integrations
- ✅ Tests
- 🎨 UI improvements

## Reporting Issues

Use GitHub Issues. Include:
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Go version, OS, browser)

## License

By contributing, you agree your contributions will be licensed under the MIT License.

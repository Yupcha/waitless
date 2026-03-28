<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/go-1.25+-00ADD8?style=flat-square&logo=go" />
  <img src="https://img.shields.io/badge/bun-1.2+-fbf0df?style=flat-square&logo=bun" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql" />
</p>

<h1 align="center">⚡ Waitless</h1>

<p align="center">
  Open-source waitlist platform — self-hosted, your own SMTP, no lock-in.
</p>

---

## Features

- 🔐 **Your own SMTP** — Gmail, Mailgun, SES, or any SMTP server
- 🏢 **Multi-tenant** — create unlimited waitlist projects
- 👥 **Access control** — admin and user roles
- 📊 **Analytics** — signup trends and platform-wide metrics
- 📋 **Subscriber viewer** — search, filter, sort, bulk actions, CSV export
- 🔌 **REST API** — API key authentication for programmatic access
- 🧩 **Embeddable widget** — drop a form into any website
- 🚀 **Single binary** — Go + embedded frontend, Docker-ready
- 🌐 **Public pages** — beautiful, branded `/w/:slug` landing pages

## Quick Start

### Docker (Recommended)

```bash
git clone https://github.com/waitless/waitless
cd waitless
docker compose -f docker/docker-compose.yml up -d
```

Visit [http://localhost:8080](http://localhost:8080) — the first account you create becomes the platform admin.

### From Source

**Requirements:** Go 1.25+, Bun 1.2+, PostgreSQL 16+

```bash
# Clone
git clone https://github.com/waitless/waitless
cd waitless

# Configure
cp .env.example .env
# Edit .env with your database settings

# Build & run
make build
./waitless
```

### Development

```bash
# Terminal 1: backend
make dev-backend

# Terminal 2: frontend (http://localhost:3000 → proxies /api to :8080)
make dev-frontend
```

## Environment Variables

See `.env.example` for all configuration options.

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | — |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_USER` | Database user | — |
| `DB_PASSWORD` | Database password | — |
| `DB_NAME` | Database name | — |
| `PORT` | Server port | `8080` |

## SMTP Configuration

Each project can configure its own SMTP server from the dashboard. Common providers:

| Provider | Host | Port |
|---|---|---|
| Gmail | `smtp.gmail.com` | 587 |
| Mailgun | `smtp.mailgun.org` | 587 |
| SendGrid | `smtp.sendgrid.net` | 587 |
| Amazon SES | `email-smtp.us-east-1.amazonaws.com` | 587 |
| Self-hosted | your own | any |

## REST API

All API endpoints require a Bearer token or `X-API-Key` header.

```bash
# List subscribers
curl -H "X-API-Key: wl_your_key" \
  https://your-domain.com/api/v1/projects/:projectId/subscribers

# Add subscriber
curl -X POST -H "X-API-Key: wl_your_key" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","name":"User"}' \
  https://your-domain.com/api/v1/projects/:projectId/subscribers
```

## Architecture

```
Single binary: ./waitless
├── Go HTTP server (Chi router)
│   ├── /api/auth/*         Auth (register, login, logout)
│   ├── /api/dashboard/*    Dashboard API (authenticated)
│   ├── /api/admin/*        Admin API (admin role required)
│   ├── /api/v1/*           REST API (API key auth)
│   └── /api/public/*       Public waitlist API
└── Embedded TanStack Start frontend
    ├── / (landing page)
    ├── /dashboard (management UI)
    └── /w/:slug (public waitlist pages)
```

## Deploying to VPS

```bash
# Build binary on your machine
make build

# Copy to server
scp waitless user@server:/opt/waitless/
scp .env user@server:/opt/waitless/

# On server — run with systemd or screen
./waitless
```

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md).

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes
4. Push and open a Pull Request

## License

MIT — see [LICENSE](LICENSE)

# Waitless API Documentation

Waitless provides three API layers:

| Layer | Auth | Use Case |
|-------|------|----------|
| [Public API](./public-api.md) | None (rate limited) | Waitlist signup forms, landing pages |
| [REST API v1](./rest-api-v1.md) | API Key (`Bearer`) | Server-side integrations, automations |
| [Dashboard API](./dashboard-api.md) | Session cookie | Internal dashboard (not for external use) |
| [CLI Tools](./cli.md) | Local access | User management, backups, password reset |

## Quick Start

```bash
# Subscribe someone to a waitlist
curl -X POST https://your-domain/api/public/w/my-project/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","name":"Jane","source":"api"}'

# List subscribers (API key auth)
curl https://your-domain/api/v1/projects/{id}/subscribers \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Public Waitlist Page

Each project gets a public landing page at `/w/{slug}` with a signup form, subscriber count, and project details.

## Webhooks

Configure webhooks per-project in the dashboard. Events:
- `subscriber.created` — new signup
- `subscriber.unsubscribed` — someone unsubscribed

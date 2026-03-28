# Dashboard API

> **Internal use only.** These endpoints are used by the Waitless dashboard UI.
> They require session-based authentication (cookie) and are not intended for external integrations.
> Use the [REST API v1](./rest-api-v1.md) for programmatic access.

## Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/logout` | Logout |
| `GET`  | `/api/auth/me` | Current user |
| `POST` | `/api/auth/forgot-password` | Send password reset email |
| `POST` | `/api/auth/reset-password` | Reset password with token |

## Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard/projects` | List user's projects |
| `POST` | `/api/dashboard/projects` | Create project |
| `GET` | `/api/dashboard/projects/{id}` | Get project |
| `PUT` | `/api/dashboard/projects/{id}` | Update project |
| `DELETE` | `/api/dashboard/projects/{id}` | Delete project |
| `PATCH` | `/api/dashboard/projects/{id}/status` | Update status |

## Subscribers

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard/projects/{id}/subscribers` | List (paginated, searchable) |
| `GET` | `/api/dashboard/projects/{id}/subscribers/export` | CSV export |
| `POST` | `/api/dashboard/projects/{id}/subscribers/import` | CSV import |
| `POST` | `/api/dashboard/projects/{id}/subscribers/bulk` | Bulk action |
| `DELETE` | `/api/dashboard/projects/{id}/subscribers/{subId}` | Delete |
| `PATCH` | `/api/dashboard/projects/{id}/subscribers/{subId}/status` | Update status |

## SMTP, Webhooks, API Keys, Emails, Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/PUT` | `/api/dashboard/projects/{id}/smtp` | SMTP config |
| `POST` | `/api/dashboard/projects/{id}/smtp/test` | Test SMTP |
| `GET/POST` | `/api/dashboard/projects/{id}/webhooks` | Webhooks |
| `DELETE` | `/api/dashboard/projects/{id}/webhooks/{wid}` | Delete webhook |
| `GET/POST` | `/api/dashboard/projects/{id}/api-keys` | API keys |
| `DELETE` | `/api/dashboard/projects/{id}/api-keys/{kid}` | Revoke key |
| `GET` | `/api/dashboard/projects/{id}/emails` | Email logs |
| `GET` | `/api/dashboard/projects/{id}/analytics` | Analytics data |
| `POST` | `/api/dashboard/projects/{id}/emails/broadcast` | Send broadcast |

## Admin (admin role only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/stats` | Platform stats |
| `GET` | `/api/admin/users` | All users |
| `GET` | `/api/admin/projects` | All projects |

## Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server + DB health check |

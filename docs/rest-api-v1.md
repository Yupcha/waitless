# REST API v1

Authenticated via API key. Rate limited to **100 requests/minute** per IP.

## Authentication

```
Authorization: Bearer YOUR_API_KEY
```

API keys are created per-project in the dashboard under **Project → API Keys**.

---

## List Subscribers

```
GET /api/v1/projects/{projectId}/subscribers
```

**Query Parameters:**
| Param | Default | Description |
|-------|---------|-------------|
| `page` | `1` | Page number |
| `limit` | `20` | Items per page (max 100) |
| `status` | — | Filter: `active`, `pending`, `unsubscribed` |
| `search` | — | Search by name or email |
| `sort` | `created_at` | Sort column |
| `order` | `desc` | `asc` or `desc` |

**Response `200`:**
```json
{
  "subscribers": [...],
  "total": 142,
  "page": 1,
  "limit": 20
}
```

---

## Add Subscriber

```
POST /api/v1/projects/{projectId}/subscribers
Content-Type: application/json
```

```json
{
  "email": "user@example.com",
  "name": "Jane Doe"
}
```

**Response `201`:**
```json
{
  "message": "subscribed",
  "subscriber": { ... }
}
```

---

## Subscriber Count

```
GET /api/v1/projects/{projectId}/count
```

**Response `200`:**
```json
{
  "count": 142
}
```

---

## Errors

All errors return:
```json
{
  "error": "description of the error"
}
```

| Code | Meaning |
|------|---------|
| `401` | Invalid or missing API key |
| `403` | API key doesn't belong to this project |
| `404` | Project not found |
| `429` | Rate limit exceeded |

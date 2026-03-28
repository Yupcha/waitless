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

## Validate Coupon Code

```
GET /api/v1/projects/{projectId}/coupons/validate?code=EARLY-xK9mP2qr
```

**Response `200`:**
```json
{
  "valid": true,
  "code": "EARLY-xK9mP2qr",
  "source_code": "get5",
  "status": "active",
  "discount_type": "flat",
  "discount_value": 5.00,
  "currency": "USD",
  "expires_at": "2026-04-28T00:00:00Z",
  "subscriber": {
    "id": "AbPjb8GbmjcJ",
    "email": "user@example.com",
    "name": "Jane"
  }
}
```

---

## Update Coupon Status

```
PATCH /api/v1/projects/{projectId}/coupons/{code}/status
Content-Type: application/json
```

```json
{
  "status": "used"
}
```

Valid statuses: `active`, `used`, `revoked`, `expired`

When status is set to `used`, fires `coupon.redeemed` webhook.

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

# Public API

No authentication required. Rate limited to **20 requests/minute** per IP.

## Subscribe

```
POST /api/public/w/{slug}/subscribe
Content-Type: application/json
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | ✅ | Subscriber email |
| `name` | string | ✅ | Subscriber name |
| `source` | string | — | `"form"` (default), `"api"`, or `"widget"` |
| `promo` | string | — | Promo campaign code (e.g., `get5`) |
| `custom_data` | object | — | Custom field responses. Keys match field `key` from project settings (e.g., `{"city":"NYC","plan":"Pro"}`) |

**Response `201`:**
```json
{
  "message": "subscribed",
  "subscriber": {
    "id": "AbPjb8GbmjcJ",
    "email": "user@example.com",
    "name": "Jane Doe",
    "status": "active",
    "country": "US",
    "created_at": "2026-03-28T12:00:00Z"
  },
  "coupon": {
    "code": "EARLY-xK9mP2qr",
    "discount_type": "flat",
    "discount_value": 5.00,
    "currency": "USD",
    "expires_at": "2026-04-28T00:00:00Z"
  }
}
```

**Errors:**
| Code | Message |
|------|---------|
| `400` | `invalid email address` |
| `404` | `waitlist not found` (bad slug or project paused) |
| `409` | `already subscribed` |

**Features:**
- Email validation and name sanitization
- Honeypot bot protection (hidden `website` field)
- Sends welcome email if SMTP is configured
- Fires `subscriber.created` webhook
- Tracks analytics (referrer, user agent, IP)
- Supports double opt-in if enabled on project
- Auto-generates coupon code if a matching promo campaign is active
- Geo-locates subscriber country from IP

---

## Get Project

```
GET /api/public/w/{slug}
```

Returns public project info and subscriber count for rendering landing pages.

**Response `200`:**
```json
{
  "project": {
    "name": "My Product",
    "slug": "my-product",
    "description": "...",
    "logo_url": "https://...",
    "theme_color": "#6366f1",
    "launch_date": "2026-06-01",
    "features": "Feature 1, Feature 2",
    "offer_title": "Get early access",
    "current_price": "99",
    "discount_price": "49"
  },
  "subscriber_count": 142
}
```

---

## Unsubscribe

```
GET /api/public/unsubscribe?token={unsubscribe_token}
```

Each subscriber has a unique `unsubscribe_token`. This endpoint:
- Marks the subscriber as unsubscribed
- Fires `subscriber.unsubscribed` webhook
- Returns a styled HTML confirmation page

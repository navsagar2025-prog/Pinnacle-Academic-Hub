# Environment Variables Reference

Complete reference for all environment variables used across the Pinnacle Academic Classes platform.

---

## Required Variables

These must be set before the application will start correctly.

| Variable | Where Used | Description |
|----------|-----------|-------------|
| `DATABASE_URL` | API server | PostgreSQL connection string: `postgresql://user:pass@host:5432/db` |
| `CLERK_SECRET_KEY` | API server | Clerk backend secret key (starts with `sk_live_`) |
| `CLERK_PUBLISHABLE_KEY` | API server + Website | Clerk publishable key (starts with `pk_live_`) |
| `VITE_CLERK_PUBLISHABLE_KEY` | Website (build-time) | Same as above — must be injected at build time |
| `SOCIAL_TOKEN_ENCRYPTION_KEY` | API server | 64-char hex string for AES-256-GCM encryption of social tokens. Generate: `openssl rand -hex 32` |

---

## Optional — Google Analytics 4

| Variable | Description |
|----------|-------------|
| `VITE_GA4_MEASUREMENT_ID` | Measurement ID (starts with `G-`) — injected at website build time |
| `GOOGLE_OAUTH_CLIENT_ID` | OAuth 2.0 client ID for GA4 admin panel integration |
| `GOOGLE_OAUTH_CLIENT_SECRET` | OAuth 2.0 client secret |
| `GOOGLE_OAUTH_REFRESH_TOKEN` | Long-lived refresh token for GA4 data API |
| `GOOGLE_GA4_PROPERTY_ID` | Numeric GA4 property ID (from GA4 Admin → Property Settings) |

---

## Optional — Social Media

These can be left blank and configured later through Admin → Social Media panel.

| Variable | Description |
|----------|-------------|
| `FACEBOOK_ACCESS_TOKEN` | Facebook Page long-lived access token |
| `FACEBOOK_PAGE_ID` | Numeric Facebook Page ID |
| `INSTAGRAM_PAGE_ACCESS_TOKEN` | Instagram Graph API token (linked to Facebook Page) |
| `INSTAGRAM_USER_ID` | Instagram Business Account ID |
| `TWITTER_BEARER_TOKEN` | Twitter/X API v2 Bearer token |
| `TWITTER_API_KEY` | Twitter/X API key |
| `TWITTER_API_SECRET` | Twitter/X API key secret |
| `TWITTER_ACCESS_TOKEN` | Twitter/X access token |
| `TWITTER_ACCESS_TOKEN_SECRET` | Twitter/X access token secret |
| `LINKEDIN_ACCESS_TOKEN` | LinkedIn OAuth 2.0 access token |
| `LINKEDIN_PERSON_URN` | LinkedIn Person URN (format: `urn:li:person:xxxxx`) |

---

## Optional — Email / SMTP

Can be left blank and configured through Admin → SMTP Settings panel instead.

| Variable | Description |
|----------|-------------|
| `SMTP_HOST` | SMTP server hostname (e.g., `smtp.gmail.com`) |
| `SMTP_PORT` | SMTP port (587 for STARTTLS, 465 for SSL) |
| `SMTP_USER` | SMTP username / email address |
| `SMTP_PASS` | SMTP password or app password |
| `SMTP_FROM` | Sender address (e.g., `care@paconline.in`) |

---

## Mobile App Variables

Set in `artifacts/pinnacle-mobile/.env` (must be prefixed `EXPO_PUBLIC_`):

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Full URL to the API: `https://yourdomain.com/api` |
| `EXPO_PUBLIC_WEBSITE_URL` | Website URL: `https://yourdomain.com` |

---

## Docker Compose Variables

Additional variables used in `docker-compose.yml`:

| Variable | Description |
|----------|-------------|
| `POSTGRES_PASSWORD` | Password for the Docker Postgres service |
| `WEBSITE_BASE_URL` | Public website URL — used in emails/social posts |

---

## Generating Secrets

```bash
# SOCIAL_TOKEN_ENCRYPTION_KEY (must be exactly 64 hex chars)
openssl rand -hex 32

# Strong database password
openssl rand -base64 24

# Verify key length
echo -n "$SOCIAL_TOKEN_ENCRYPTION_KEY" | wc -c   # must be 64
```

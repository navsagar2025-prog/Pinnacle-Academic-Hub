# Pinnacle Academic Classes — Full-Stack Portal

> JEE / NEET Coaching Institute Management System — Greater Noida

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Environment Variables](#4-environment-variables)
5. [Database](#5-database)
6. [Local Development](#6-local-development)
7. [Building for Production](#7-building-for-production)
8. [Deployment — Docker](#8-deployment--docker)
9. [Deployment — VPS (bare-metal)](#9-deployment--vps-bare-metal)
10. [Deployment — Kubernetes](#10-deployment--kubernetes)
11. [Running Pre-built Image (no build on server)](#11-running-pre-built-image-no-build-on-server)
12. [API Reference](#12-api-reference)
13. [Feature Map](#13-feature-map)
14. [Authentication & Roles](#14-authentication--roles)
15. [Email & Notifications](#15-email--notifications)
16. [Social Media Integration](#16-social-media-integration)
17. [Analytics (GA4)](#17-analytics-ga4)
18. [Background Schedulers](#18-background-schedulers)
19. [Troubleshooting](#19-troubleshooting)

---

## 1. Project Overview

Pinnacle Academic Classes is a **full-stack, multi-role coaching institute portal** serving:

| Role | Portal | Features |
|------|--------|----------|
| **Admin** | `/portal` | Users, batches, courses, notices, results, fees, social media, analytics |
| **Teacher** | `/portal` | Schedule, batches, social post submission, attendance |
| **Student** | `/portal` | Dashboard, study material, assignments, doubt submissions |
| **Parent** | `/portal` | Child's progress, fees, notices, attendance |
| **Public** | `/` | Website, admissions enquiry, blog, leaderboard |

**Branding:** Navy `#0A1F5C` · Teal `#0D7377` · Gold `#C9A84C`

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser / App                        │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS
              ┌─────────────┴──────────────┐
              │    Vite / React Website     │   (serves static HTML/JS/CSS)
              │  artifacts/pinnacle-website │
              └─────────────┬──────────────┘
                            │ /api/v1/*  (REST)
              ┌─────────────┴──────────────┐
              │   Express API Server        │
              │   artifacts/api-server      │   port 8080 (configurable)
              └──────┬───────────┬──────────┘
                     │           │
             ┌───────┴──┐  ┌─────┴──────┐
             │ PostgreSQL│  │  Clerk Auth │
             │ (Supabase │  │  (managed) │
             │  or self- │  └────────────┘
             │  hosted)  │
             └───────────┘
```

- The **React SPA** (Vite build) is served as static files — either by a CDN / Nginx, or by the API server itself in production.
- All data flows through the **Express REST API**. There is no GraphQL layer.
- **Clerk** handles all authentication (JWT issuing, social login, session management). The API verifies Clerk JWTs on every protected route.
- The database is **PostgreSQL** (tested with Supabase and vanilla Postgres 15+).
- Two **background schedulers** run inside the API process: fee reminders and social post publishing.

---

## 3. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, Tailwind CSS 4, Wouter (routing), Framer Motion |
| UI Components | Radix UI, shadcn/ui, Lucide Icons |
| API Server | Node.js 20+, Express 5, TypeScript, esbuild (bundled to single ESM file) |
| Auth | Clerk (React SDK + Express middleware) |
| ORM / DB | Drizzle ORM, PostgreSQL (`pg` pool) |
| Email | SendGrid (`@sendgrid/mail`) |
| Analytics | Google Analytics 4 (via OAuth refresh token) |
| Social Media | OAuth-based platform connections (Facebook, Instagram, Twitter/X, LinkedIn) |
| Mobile | Expo SDK 54, React Native, Expo Router |
| Monorepo | pnpm workspaces |
| Package Manager | pnpm 9+ |

---

## 4. Environment Variables

### API Server (`artifacts/api-server`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | ✅ | Port for the Express server (e.g. `8080`) |
| `DATABASE_URL` | ✅* | PostgreSQL connection string |
| `SUPABASE_DATABASE_URL` | ✅* | Supabase pooler URL — takes priority over `DATABASE_URL` |
| `CLERK_PUBLISHABLE_KEY` | ✅ | Clerk frontend key (`pk_live_…`) |
| `CLERK_SECRET_KEY` | ✅ | Clerk backend secret (`sk_live_…`) |
| `SENDGRID_API_KEY` | ✅ | SendGrid API key for transactional email |
| `WEBSITE_BASE_URL` | ✅ | Public URL of the website (e.g. `https://pinnacle.example.com`) |
| `SOCIAL_TOKEN_ENCRYPTION_KEY` | ✅ | 32-byte hex key for encrypting OAuth tokens at rest |
| `GOOGLE_OAUTH_CLIENT_ID` | ⚠️ | Google OAuth client ID (needed for GA4 + YouTube) |
| `GOOGLE_OAUTH_CLIENT_SECRET` | ⚠️ | Google OAuth client secret |
| `GOOGLE_OAUTH_REFRESH_TOKEN` | ⚠️ | Refresh token for background GA4 reads |
| `GA4_PROPERTY_ID` | ⚠️ | GA4 property ID (e.g. `properties/123456789`) |

> *At least one of `DATABASE_URL` or `SUPABASE_DATABASE_URL` must be set.  
> ⚠️ Optional but required for the feature indicated.

### Website (`artifacts/pinnacle-website`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | ✅ | Same as `CLERK_PUBLISHABLE_KEY` — consumed by Vite build |
| `BASE_PATH` | ⚠️ | URL base path if not served at `/` (default: `/`) |
| `PORT` | ⚠️ | Dev-server port (default: `5173`) |

### Mobile (`artifacts/pinnacle-mobile`)

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_DOMAIN` | ✅ | API domain (e.g. `https://api.pinnacle.example.com`) |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk publishable key for mobile |

---

## 5. Database

### Schema Overview

The database contains **40+ tables** covering:

- `users` — all roles, Clerk-linked, approval workflow
- `courses`, `batches` — course and batch management
- `students`, `parents`, `teachers` — role-specific profiles
- `fee_records` — fee tracking with status lifecycle
- `notices` — admin announcements with categories
- `blog_posts` — CMS blog with draft/published states
- `study_materials`, `practice_papers`, `assignments`, `assignment_schedules`
- `schedules`, `live_classes`, `class_recordings`
- `attendance`, `attendance_low_alerts`
- `student_test_results`, `mock_tests`, `results`
- `enquiries`, `gallery_items`, `promotions`, `seo_overrides`, `site_settings`
- `social_accounts`, `social_posts`, `social_teacher_access`
- `audit_logs`

### Running Migrations

```bash
# Push schema to a fresh database (destructive — for first-time setup)
cd lib/db
pnpm run push

# Force push (drops and recreates conflicting types/tables)
pnpm run push-force
```

The API server also applies **idempotent startup migrations** on boot — creating missing tables and indexes automatically. This covers social media tables and all deduplication indexes.

### Connection

```
postgresql://<user>:<password>@<host>:<port>/<dbname>
```

For Supabase, use the **Session Mode pooler** URL (port 5432) for direct connections, or the **Transaction Mode pooler** (port 6543) for serverless/edge. The API server uses the pooled URL.

---

## 6. Local Development

### Prerequisites

- Node.js 20+
- pnpm 9+ (`npm install -g pnpm`)
- A PostgreSQL database (local or Supabase)
- A Clerk account (free tier works)

### Setup

```bash
# 1. Clone
git clone <repo-url>
cd pinnacle

# 2. Install all dependencies
pnpm install

# 3. Copy and fill environment variables
cp .env.example .env
# Edit .env with your values

# 4. Push database schema
SUPABASE_DATABASE_URL="postgresql://..." pnpm --filter @workspace/db run push

# 5. Start the API server (port 8080)
pnpm --filter @workspace/api-server run dev

# 6. In a second terminal, start the website (port 5173)
pnpm --filter @workspace/pinnacle-website run dev
```

The website proxies `/api/*` to `localhost:8080` automatically (configured in `vite.config.ts`).

---

## 7. Building for Production

```bash
# Build everything (typecheck + all artifacts)
pnpm run build

# Or build individually
pnpm --filter @workspace/api-server run build       # → artifacts/api-server/dist/index.mjs
pnpm --filter @workspace/pinnacle-website run build  # → artifacts/pinnacle-website/dist/public/
```

The API server is **bundled into a single ESM file** (`dist/index.mjs`) by esbuild — no `node_modules` required at runtime for the server itself (except native modules like `pg`).

---

## 8. Deployment — Docker

See [Dockerfile](../Dockerfile) and [docker-compose.yml](../docker-compose.yml) in the project root.

### Quick Start

```bash
# Build and start
docker compose up --build -d

# View logs
docker compose logs -f api
docker compose logs -f web
```

### Environment

Copy `.env.example` to `.env` and fill all required values before running Docker Compose.

### Volume

Uploaded social media files are stored at `/app/uploads` inside the API container. Mount a persistent volume:

```yaml
volumes:
  - uploads_data:/app/uploads
```

---

## 9. Deployment — VPS (bare-metal)

### Requirements

- Ubuntu 22.04+ / Debian 12+
- Nginx (reverse proxy + static file server)
- Node.js 20 LTS
- PM2 (process manager)
- PostgreSQL 15+ (or use Supabase)

### Step-by-Step

```bash
# 1. Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install pnpm
npm install -g pnpm pm2

# 3. Clone repo & install
git clone <repo-url> /opt/pinnacle
cd /opt/pinnacle
pnpm install --frozen-lockfile

# 4. Set environment variables
sudo nano /etc/environment
# Add: DATABASE_URL, CLERK_PUBLISHABLE_KEY, etc.

# 5. Build
pnpm run build

# 6. Start API server with PM2
pm2 start artifacts/api-server/dist/index.mjs \
  --name pinnacle-api \
  --node-args "--enable-source-maps" \
  -e /var/log/pinnacle-api-err.log \
  -o /var/log/pinnacle-api-out.log
pm2 save
pm2 startup

# 7. Configure Nginx
sudo cp docs/nginx.conf /etc/nginx/sites-available/pinnacle
sudo ln -s /etc/nginx/sites-available/pinnacle /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name pinnacle.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name pinnacle.example.com;

    ssl_certificate     /etc/letsencrypt/live/pinnacle.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pinnacle.example.com/privkey.pem;

    # Serve static website files
    root /opt/pinnacle/artifacts/pinnacle-website/dist/public;
    index index.html;

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 10. Deployment — Kubernetes

Helm / raw manifests are not included, but the following structure works:

### Pods

| Deployment | Image | Replicas |
|------------|-------|----------|
| `pinnacle-api` | `pinnacle-api:latest` | 2 |
| `pinnacle-web` | `nginx:alpine` (serving static dist) | 2 |

### Services & Ingress

```yaml
# api-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: pinnacle-api
spec:
  selector:
    app: pinnacle-api
  ports:
    - port: 8080
      targetPort: 8080
---
# Ingress (nginx ingress controller)
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: pinnacle-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
    - host: pinnacle.example.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: pinnacle-api
                port:
                  number: 8080
          - path: /
            pathType: Prefix
            backend:
              service:
                name: pinnacle-web
                port:
                  number: 80
```

### Secrets

```bash
kubectl create secret generic pinnacle-secrets \
  --from-literal=DATABASE_URL="postgresql://..." \
  --from-literal=CLERK_SECRET_KEY="sk_live_..." \
  --from-literal=SENDGRID_API_KEY="SG...." \
  --from-literal=SOCIAL_TOKEN_ENCRYPTION_KEY="..."
```

### PersistentVolumeClaim (uploads)

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pinnacle-uploads
spec:
  accessModes: [ReadWriteOnce]
  resources:
    requests:
      storage: 10Gi
```

---

## 11. Running Pre-built Image (no build on server)

A **pre-built production package** (`pinnacle-production.zip`) is provided. It contains:

```
pinnacle-production/
├── api/                   # Pre-built API server (single ESM bundle)
│   ├── index.mjs
│   ├── index.mjs.map
│   └── pino-worker.mjs    # (pino logger thread worker)
├── web/                   # Pre-built static website
│   ├── index.html
│   └── assets/
├── docker-compose.prebuilt.yml
├── .env.example
└── README-PREBUILT.md
```

### Run with Docker (no build)

```bash
unzip pinnacle-production.zip
cd pinnacle-production

# Copy and fill environment variables
cp .env.example .env
nano .env

# Start
docker compose -f docker-compose.prebuilt.yml up -d
```

### Run directly with Node.js (no Docker, no build)

```bash
# Install only runtime dependencies (pg, googleapis, etc.)
cd api
npm install --production

# Set env vars
export PORT=8080
export DATABASE_URL="postgresql://..."
# ... other env vars

# Start
node --enable-source-maps index.mjs
```

Then serve the `web/` folder with any static file server or Nginx (see Nginx config above).

---

## 12. API Reference

All API routes are mounted at `/api/v1/`.

### Public Routes (no auth)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/healthz` | Health check |
| GET | `/v1/notices` | Published notices |
| GET | `/v1/blog` | Published blog posts |
| GET | `/v1/blog/:slug` | Single blog post |
| GET | `/v1/gallery` | Gallery items |
| GET | `/v1/leaderboard` | Student leaderboard |
| GET | `/v1/courses` | Active courses |
| POST | `/v1/enquiries` | Submit admissions enquiry |
| POST | `/v1/contact` | Contact form |
| GET | `/v1/social/media/:filename` | Serve uploaded social media files |

### Admin Routes (`/v1/admin/*` — requires admin role)

Covers: users, batches, courses, notices, blog, gallery, results, fees, assignments, social media (accounts, posts, approval), promotions, SEO overrides, site settings, fee reminders.

### Portal Routes (`/v1/portal/*` — requires authentication)

| Role | Prefix | Features |
|------|--------|----------|
| All | `/portal/me` | Current user info |
| Student | `/portal/student/…` | Study materials, assignments, doubts, recordings |
| Teacher | `/portal/teacher/…` | Batches, schedule, attendance, social posts |
| Parent | `/portal/parent/…` | Child progress, fees, notices |

---

## 13. Feature Map

| # | Feature | Status |
|---|---------|--------|
| 1 | Public website (courses, blog, gallery, leaderboard) | ✅ Live |
| 2 | Admissions enquiry form → DB + email | ✅ Live |
| 3 | Admin CMS (notices, blog, gallery, courses, batches) | ✅ Live |
| 4 | Multi-role portal (student, teacher, parent, admin) | ✅ Live |
| 5 | Fee tracking, payment records, reminders | ✅ Live |
| 6 | Social media composer, approval queue, scheduler | ✅ Live |
| 7 | Teacher social post submission | ✅ Live |
| 8 | GA4 analytics dashboard (admin) | ✅ Live |
| 9 | Study materials, practice papers, assignments | ✅ Live |
| 10 | Attendance tracking + low-attendance alerts | ✅ Live |
| 11 | Live class and recording links | ✅ Live |
| 12 | Student doubt submission | ✅ Live |
| 13 | Mock tests and leaderboard | ✅ Live |
| 14 | Promotions and banners | ✅ Live |
| 15 | Mobile app (Expo) | ✅ Live |

---

## 14. Authentication & Roles

Authentication is handled entirely by **Clerk**. The API verifies the Clerk JWT on every protected route using `@clerk/express`.

### Role Assignment

New self-registered users get `approvalStatus = "pending"` and `role = "student"` by default. An admin must approve them and can change their role (student / teacher / parent / admin) from the Admin → Users panel.

### Admin-created Users

Admins can create users directly from the portal — these are automatically set to `approvalStatus = "approved"`.

### Teacher Social Media Access

Teachers need explicit social media access granted by an admin (Admin → Social Media → Teacher Access). The `social_teacher_access` table tracks which platforms each teacher can post to.

---

## 15. Email & Notifications

Email is sent via **SendGrid**. The following events trigger emails:

| Event | Template |
|-------|----------|
| Enquiry submitted | Confirmation to applicant + notify admin |
| Fee reminder | Scheduled — 7 days, 3 days, 1 day before due date |
| Fee payment confirmation | On payment recorded |
| Social post rejected | Rejection note sent to teacher |
| Attendance low | Alert to parent |

Configure `SENDGRID_API_KEY` and `WEBSITE_BASE_URL` for emails to work.

---

## 16. Social Media Integration

The social media workflow:

1. Admin connects platform accounts (Admin → Social Media → Accounts)
2. Admin optionally grants teachers posting access (Admin → Social Media → Teacher Access)
3. Teachers or admins compose posts in the portal
4. Admin approves / rejects posts from the Approval Queue
5. Approved posts are published immediately or at a scheduled time
6. The scheduler (`startSocialPostScheduler`) polls every 60 seconds for scheduled posts

**Supported platforms:** Facebook, Instagram, Twitter/X, LinkedIn, YouTube  
**Uploaded media** is stored in `uploads/social/` and served publicly at `/api/v1/social/media/:filename`.

---

## 17. Analytics (GA4)

GA4 integration uses OAuth 2.0 with a long-lived refresh token:

1. Admin navigates to Admin → Analytics → Connect Google Analytics
2. Completes the Google OAuth consent flow
3. The refresh token is stored encrypted in `site_settings`
4. The analytics dashboard reads live data from GA4 Data API

Configure `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, and `GA4_PROPERTY_ID`.

---

## 18. Background Schedulers

Two schedulers run in the API process:

| Scheduler | Interval | Job |
|-----------|----------|-----|
| `startFeeReminderScheduler` | Daily at 8 AM | Sends fee payment reminder emails |
| `startSocialPostScheduler` | Every 60 seconds | Publishes scheduled social posts |

Both start after the API server is listening and after startup migrations have run.

---

## 19. Troubleshooting

### "PORT environment variable is required"
Set `PORT` in your environment (e.g. `PORT=8080`).

### "DATABASE_URL must be set"
Set either `DATABASE_URL` or `SUPABASE_DATABASE_URL`.

### Clerk 401 errors
- Verify `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` match your Clerk instance.
- Ensure the API server's domain is listed in Clerk's allowed origins.

### Social media upload 404
The `uploads/social/` directory must exist and be writable. Docker Compose creates this via a named volume.

### Fee emails not sending
Check `SENDGRID_API_KEY` is set and the sender email is verified in SendGrid.

### GA4 shows "Not connected"
Re-run the OAuth flow from Admin → Analytics. The refresh token may have expired or been revoked.

# Pinnacle Academic Classes — Pre-built Production Package

This package contains **pre-built artifacts** — no Node.js, pnpm, or build tools required on your server.

## Contents

```
pinnacle-production/
├── api/                        API server bundle (Node.js ESM)
│   ├── index.mjs               Main server entry point
│   ├── index.mjs.map           Source maps for readable stack traces
│   └── pino-worker.mjs         Pino logger worker thread
├── web/                        Static website (HTML + JS + CSS)
│   ├── index.html
│   └── assets/
├── docker-compose.prebuilt.yml Docker Compose using pre-built images
├── .env.example                Environment variable template
└── README-PREBUILT.md          This file
```

---

## Option A — Docker (recommended)

### Prerequisites
- Docker Engine 24+
- Docker Compose v2+

### Steps

```bash
# 1. Build the Docker images from the pre-built artifacts
#    (This only copies files into images — no compilation)
docker build -f Dockerfile.prebuilt --target api -t pinnacle-api:latest .
docker build -f Dockerfile.prebuilt --target web -t pinnacle-web:latest .

# 2. Configure environment
cp .env.example .env
nano .env   # fill in DATABASE_URL, CLERK keys, etc.

# 3. Start
docker compose -f docker-compose.prebuilt.yml up -d

# 4. Check health
docker compose -f docker-compose.prebuilt.yml ps
curl http://localhost:8080/api/healthz
```

The website is available at **http://localhost:80** (or your server's IP/domain).  
The API is available at **http://localhost:8080**.

---

## Option B — Node.js (no Docker)

### Prerequisites
- Node.js 20 LTS+

### Steps

```bash
# 1. Configure environment variables
export PORT=8080
export NODE_ENV=production
export DATABASE_URL="postgresql://user:pass@host:5432/dbname"
export CLERK_PUBLISHABLE_KEY="pk_live_..."
export CLERK_SECRET_KEY="sk_live_..."
export SENDGRID_API_KEY="SG...."
export WEBSITE_BASE_URL="https://pinnacle.example.com"
export SOCIAL_TOKEN_ENCRYPTION_KEY="<64 hex chars>"

# 2. Create uploads directory
mkdir -p api/uploads/social

# 3. Start the API server
node --enable-source-maps api/index.mjs
```

To run in the background with auto-restart:

```bash
# Install PM2 globally (one-time)
npm install -g pm2

# Start
PORT=8080 NODE_ENV=production \
  DATABASE_URL="postgresql://..." \
  CLERK_PUBLISHABLE_KEY="pk_live_..." \
  CLERK_SECRET_KEY="sk_live_..." \
  SENDGRID_API_KEY="SG...." \
  WEBSITE_BASE_URL="https://pinnacle.example.com" \
  SOCIAL_TOKEN_ENCRYPTION_KEY="..." \
  pm2 start api/index.mjs \
    --name pinnacle-api \
    --node-args "--enable-source-maps"

pm2 save
pm2 startup   # configure auto-start on reboot
```

Then serve the `web/` folder with Nginx:

```nginx
server {
    listen 443 ssl http2;
    server_name pinnacle.example.com;

    root /path/to/pinnacle-production/web;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto https;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## Option C — Systemd (Linux VPS, no Docker, no PM2)

```bash
# /etc/systemd/system/pinnacle-api.service
[Unit]
Description=Pinnacle Academic Classes API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/pinnacle-production/api
ExecStart=/usr/bin/node --enable-source-maps /opt/pinnacle-production/api/index.mjs
Restart=always
RestartSec=5
Environment=PORT=8080
Environment=NODE_ENV=production
EnvironmentFile=/opt/pinnacle-production/.env

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable pinnacle-api
sudo systemctl start pinnacle-api
sudo systemctl status pinnacle-api
```

---

## Database Setup

On first run, the API server automatically creates all required tables and indexes. You only need an empty PostgreSQL 15+ database.

```bash
# Create a database (if self-hosting Postgres)
psql -U postgres -c "CREATE DATABASE pinnacle;"
psql -U postgres -c "CREATE USER pinnacle_user WITH PASSWORD 'changeme';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE pinnacle TO pinnacle_user;"
```

Then set `DATABASE_URL=postgresql://pinnacle_user:changeme@localhost:5432/pinnacle`.

---

## Generating SOCIAL_TOKEN_ENCRYPTION_KEY

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output (64 hex characters) into your `.env` file.

---

## Health Check

```bash
curl http://localhost:8080/api/healthz
# Expected: {"status":"ok"}
```

# Quick Start — Docker Compose

Get the full Pinnacle Academic Classes stack running in under 5 minutes using Docker.

## Prerequisites
- Docker ≥ 24 and Docker Compose v2
- A domain name (or use `localhost` for local testing)
- Clerk account with a production application (https://clerk.com)

---

## Option A — Build from Source

Use this when deploying fresh from the repository.

### 1. Clone the repository
```bash
git clone https://github.com/navsagar2025-prog/Pinnacle-Academic-Hub.git
cd Pinnacle-Academic-Hub
```

### 2. Configure environment
```bash
cp production-package/.env.example .env
nano .env          # fill in all required values (see docs/06-environment-variables.md)
```

### 3. Generate the encryption key
```bash
openssl rand -hex 32   # paste the output as SOCIAL_TOKEN_ENCRYPTION_KEY in .env
```

### 4. Build and start
```bash
docker compose -f production-package/docker-compose.yml --env-file .env up -d --build
```

### 5. Verify
```bash
docker compose -f production-package/docker-compose.yml ps
curl http://localhost:8080/healthz    # should return {"status":"ok"}
curl http://localhost/                # should return the website HTML
```

---

## Option B — Pre-built (No Build on Server)

Use this when you have already built the project locally or in CI and want zero build time on the server.

### 1. Copy the pre-built files into the package
```bash
cp -r artifacts/api-server/dist  production-package/api-server/dist
cp -r artifacts/pinnacle-website/dist  production-package/website/dist
cp production-package/website/nginx.conf production-package/website/nginx.conf
```

### 2. Configure environment
```bash
cp production-package/.env.example production-package/.env
nano production-package/.env
```

### 3. Run with pre-built compose
```bash
cd production-package
docker compose -f docker-compose.prebuilt.yml --env-file .env up -d
```

No Node.js, no npm, no build tools needed on the server — just Docker.

---

## Stopping / Updating
```bash
# Stop
docker compose -f production-package/docker-compose.yml down

# Update (pull new code, rebuild)
git pull
docker compose -f production-package/docker-compose.yml up -d --build
```

## Logs
```bash
docker compose -f production-package/docker-compose.yml logs -f api-server
docker compose -f production-package/docker-compose.yml logs -f website
```

## Database backup
```bash
docker exec -t $(docker compose ps -q postgres) \
  pg_dump -U pinnacle pinnacle > backup_$(date +%Y%m%d).sql
```

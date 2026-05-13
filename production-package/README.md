# Pinnacle Academic Classes — Production Package

Full-stack JEE/NEET coaching portal for **Pinnacle Academic Classes**, Greater Noida.  
Unit of KCK Corporate Services Pvt. Ltd. | paconline.in

---

## Stack

| Layer | Technology |
|-------|-----------|
| Website | React + Vite + Tailwind CSS (Wouter routing) |
| API | Node.js + Express + TypeScript (Drizzle ORM) |
| Database | PostgreSQL 16 |
| Auth | Clerk (OIDC) |
| Mobile | Expo SDK 54 (React Native) — Android & iOS |
| Web Server | Nginx 1.27 Alpine |

## Package Contents

```
production-package/
├── README.md                       ← this file
├── .env.example                    ← environment variables template
├── docker-compose.yml              ← full build from source
├── docker-compose.prebuilt.yml     ← no-build version (pre-compiled)
│
├── api-server/
│   ├── Dockerfile                  ← multi-stage, minimal Alpine image
│   ├── Dockerfile.prebuilt         ← pre-built (no source needed)
│   └── dist/                       ← pre-compiled API server bundle
│
├── website/
│   ├── Dockerfile                  ← multi-stage build → nginx serve
│   ├── Dockerfile.prebuilt         ← pre-built (no source needed)
│   ├── nginx.conf                  ← production nginx config
│   └── dist/public/                ← pre-built static website
│
├── k8s/                            ← Kubernetes manifests
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secrets.yaml                ← edit with real values before applying
│   ├── postgres-statefulset.yaml
│   ├── api-deployment.yaml
│   ├── website-deployment.yaml
│   ├── ingress.yaml
│   └── hpa.yaml                    ← horizontal pod autoscaler
│
├── scripts/
│   ├── setup.sh                    ← interactive first-run setup
│   ├── backup.sh                   ← database backup
│   └── restore.sh                  ← database restore
│
└── docs/
    ├── 01-quick-start-docker.md    ← fastest path to running
    ├── 02-vps-setup.md             ← Ubuntu VPS deployment
    ├── 03-kubernetes.md            ← GKE / EKS / k3s deployment
    ├── 04-android-build.md         ← Android APK / AAB build
    ├── 05-ios-build.md             ← iOS .ipa build
    └── 06-environment-variables.md ← complete env var reference
```

---

## 5-Minute Quick Start (Pre-built, No Build Required)

Everything is pre-compiled. You only need Docker.

```bash
# 1. Copy and fill in your credentials
cp .env.example .env
nano .env   # set CLERK_SECRET_KEY, CLERK_PUBLISHABLE_KEY, VITE_CLERK_PUBLISHABLE_KEY

# 2. Generate the encryption key (run this, paste output into .env)
openssl rand -hex 32

# 3. Start the full stack
docker compose -f docker-compose.prebuilt.yml --env-file .env up -d

# 4. Verify
curl http://localhost:8080/healthz    # → {"status":"ok"}
open http://localhost/                # → website
```

No Node.js, no npm, no pnpm — just Docker.

---

## Build from Source

```bash
# Clone
git clone https://github.com/navsagar2025-prog/Pinnacle-Academic-Hub.git
cd Pinnacle-Academic-Hub

# Fill credentials
cp production-package/.env.example .env && nano .env

# Build and run
docker compose -f production-package/docker-compose.yml --env-file .env up -d --build
```

---

## Deployment Options

| Method | Guide | Time |
|--------|-------|------|
| Docker Compose (recommended) | docs/01-quick-start-docker.md | 5 min |
| Ubuntu VPS + Nginx | docs/02-vps-setup.md | 20 min |
| Kubernetes (GKE/EKS/k3s) | docs/03-kubernetes.md | 30 min |

---

## Mobile App

| Platform | Guide |
|----------|-------|
| Android (APK/AAB) | docs/04-android-build.md |
| iOS (.ipa / App Store) | docs/05-ios-build.md |

Bundle ID: `com.kck.pinnacleac`  
App scheme: `pinnacleac://`

---

## Docker Image Sizes (approximate)

| Image | Final size |
|-------|-----------|
| API server (Alpine) | ~180 MB |
| Website (Nginx Alpine) | ~25 MB |
| PostgreSQL 16 Alpine | ~85 MB |

---

## Required Credentials

| Credential | Where to get |
|-----------|-------------|
| Clerk keys | https://clerk.com → Your App → API Keys |
| SOCIAL_TOKEN_ENCRYPTION_KEY | `openssl rand -hex 32` |
| DATABASE_URL | Your PostgreSQL connection string |

See `docs/06-environment-variables.md` for the full list.

---

## Support

- Website: https://paconline.in  
- Email: care@paconline.in  
- Phone: +91 99718 62138  
- GitHub: https://github.com/navsagar2025-prog/Pinnacle-Academic-Hub

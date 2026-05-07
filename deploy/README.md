# Pinnacle Platform — Self-Hosting on Oracle Cloud (OCI)

This guide walks an admin through deploying the Pinnacle Academic Classes
platform (website + API + database) on a single Oracle Cloud Infrastructure
(OCI) Compute instance using Docker.

> Mobile app, slide decks, and the design canvas are **not** part of this
> stack — they are excluded by `.dockerignore` and unrelated to this guide.

---

## What you are deploying

```
                    ┌──────────────────────────────────────┐
   Internet  ───▶   │  Caddy proxy   :80 / :443 (TLS)      │
                    └─────────┬──────────────────┬─────────┘
                              │ /api/*           │ everything else
                              ▼                  ▼
                       ┌────────────┐    ┌─────────────────┐
                       │ api server │    │  Next.js website│
                       │ :4000      │    │  :3000          │
                       └─────┬──────┘    └────────┬────────┘
                             │                    │
                             └─────────┬──────────┘
                                       ▼
                              ┌──────────────────┐
                              │  PostgreSQL 16   │
                              │  (named volume)  │
                              └──────────────────┘
```

**Routing rules** (configured in `Caddyfile`):

| Path                                                         | Goes to       |
| ------------------------------------------------------------ | ------------- |
| `/api/health`, `/api/healthz`, `/api/scan*`, `/api/settings*`, `/api/export*` | `api` (Express) |
| Everything else (including `/api/v1/*` Next.js route handlers) | `web` (Next.js) |

Most of the platform's API surface — auth, payments, cron jobs, admin,
students, courses, etc. — lives inside the Next.js app under `/api/v1/*`.
The Express api-server only owns the operational endpoints listed above.

Five containers, one private network:

| Service    | Image                       | Purpose                                       |
| ---------- | --------------------------- | --------------------------------------------- |
| `postgres` | `postgres:16-alpine`        | Primary database, persists to `pgdata` volume |
| `migrate`  | built from `Dockerfile.migrate` | Runs Drizzle schema push on every `up`        |
| `api`      | built from `Dockerfile.api` | Express API on port 4000                      |
| `web`      | built from `Dockerfile.web` | Next.js 15 website on port 3000               |
| `proxy`    | `caddy:2-alpine`            | TLS termination + reverse proxy on 80/443     |

---

## 1. Provision the OCI VM

**Recommended shape:** `VM.Standard.E4.Flex` with **2 OCPU / 16 GB RAM** and a
**100 GB block volume**. The Always-Free `VM.Standard.A1.Flex` (4 OCPU / 24 GB
ARM) also works and is free; both image names below are the ARM/x86 variants
of Oracle Linux 9.

1. **Compute → Instances → Create instance.**
   - Image: **Oracle Linux 9**.
   - Shape: as above.
   - Networking: place it in a public subnet, assign a public IPv4.
   - SSH keys: upload your public key.
2. **Networking → VCN → Security Lists → Default Security List**, add ingress rules:
   - TCP **22** from your admin IP only.
   - TCP **80** from `0.0.0.0/0` (Let's Encrypt HTTP-01 challenge).
   - TCP **443** from `0.0.0.0/0` (HTTPS).
3. SSH in: `ssh opc@<public-ip>`.

---

## 2. Install Docker on Oracle Linux 9

```bash
sudo dnf -y install dnf-plugins-core
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo dnf -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin git
sudo systemctl enable --now docker
sudo usermod -aG docker opc          # log out & back in for group change
```

Open ports 80/443 in the **host** firewall too:

```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

Verify: `docker run --rm hello-world`.

---

## 3. Point DNS to the VM

In your DNS provider, create an **A record** for the chosen hostname (e.g.
`pinnacleacademic.in`) pointing at the VM's public IP. Wait for it to
propagate (`dig +short pinnacleacademic.in` should return your IP) before
attempting TLS issuance.

---

## 4. Clone the repository and configure

```bash
sudo mkdir -p /opt/pinnacle && sudo chown opc:opc /opt/pinnacle
cd /opt/pinnacle
git clone <your-repo-url> app
cd app/deploy
cp .env.example .env
chmod 600 .env
nano .env       # fill in EVERY value
```

The `.env` file lives at `deploy/.env` next to `docker-compose.yml`. See
`deploy/.env.example` for the full list with inline guidance — the must-set
groups are: `PUBLIC_DOMAIN` + `ACME_EMAIL`, the `POSTGRES_*` block + the
matching `DATABASE_URL`, Clerk keys, Razorpay keys, Resend, and any AI
provider keys you want enabled.

### Object storage credentials

The website uses Google Cloud Storage for file uploads (study materials,
faculty photos, mock-test figures, PYQ PDFs, etc.). On OCI you must provide
a GCS service-account credential — the auto-detected Replit sidecar is not
present outside Replit.

Choose one of the two options below in `.env`:

1. **Inline JSON** (simplest, no extra mount):
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS_JSON='{"type":"service_account",...}'
   ```
2. **Mounted key file**: place the key at e.g. `/opt/pinnacle/secrets/gcs-key.json`
   on the host, add a bind mount to the `web` service in `docker-compose.yml`,
   and set:
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=/secrets/gcs-key.json
   ```

The service account needs `roles/storage.objectAdmin` on the bucket
referenced in `PRIVATE_OBJECT_DIR` (format: `/<bucket>/<prefix>`). If both
variables are blank the website falls back to the Replit sidecar mode for
local dev — uploads will fail in production with that fallback active.

> Long-term you may prefer OCI Object Storage via its S3-compatible API.
> That migration is tracked as a separate follow-up task.

---

## 5. First-time bring-up

From `/opt/pinnacle/app/deploy`:

```bash
# Build all images (5–10 min on first run).
docker compose build

# Start everything in the background. Postgres starts first, the migrate
# container runs schema push, then api + web + proxy come up.
docker compose up -d

# Watch the logs until you see "Server listening" from api and "started server
# on 0.0.0.0:3000" from web.
docker compose logs -f
```

Visit `https://<your-domain>/` — Caddy will auto-issue a Let's Encrypt cert on
first request (~30 s). The API is reachable at `https://<your-domain>/api/health`.

### HTTP-only first boot (no DNS yet)

If you want to smoke-test before DNS is ready, set `PUBLIC_DOMAIN=:80` in
`.env` (literally a colon-eighty). Caddy will serve over plain HTTP on the
VM's IP. Switch back to your real hostname before going live.

---

## 6. Day-2 operations

### Tail logs

```bash
docker compose logs -f web         # one service
docker compose logs --tail=200     # everything, last 200 lines
journalctl -u docker               # docker daemon itself
```

Caddy's TLS data lives in the `caddy_data` Docker volume — back it up with
the database below.

### Update to a new release

```bash
cd /opt/pinnacle/app
git pull
cd deploy
docker compose build
docker compose up -d         # recreates only changed containers
```

The `migrate` service is a one-shot job: Compose runs it whenever it needs
to (re)create the container — for example after `docker compose up --build`,
after the migrate image changes, or if its previous run hasn't completed
successfully. It is not guaranteed to re-run on every plain `docker compose up`.
After pulling a release with schema changes, run migrations explicitly:

```bash
docker compose run --rm migrate
```

### Backup the PostgreSQL volume

Daily, automated snapshot to `/opt/pinnacle/backups`:

```bash
mkdir -p /opt/pinnacle/backups
docker compose exec -T postgres \
  pg_dump -U pinnacle -d pinnacle -Fc \
  > /opt/pinnacle/backups/pinnacle-$(date +%F).dump
```

Add to `crontab -e`:

```cron
30 2 * * * cd /opt/pinnacle/app/deploy && docker compose exec -T postgres pg_dump -U pinnacle -d pinnacle -Fc > /opt/pinnacle/backups/pinnacle-$(date +\%F).dump && find /opt/pinnacle/backups -name 'pinnacle-*.dump' -mtime +14 -delete
```

(Also enable OCI Block Volume backups on the boot/data volume for an
infrastructure-level safety net.)

### Restore from backup

```bash
# Stop the apps but keep postgres up.
docker compose stop web api
# Restore (drops + recreates the public schema).
cat /opt/pinnacle/backups/pinnacle-2026-05-07.dump | \
  docker compose exec -T postgres pg_restore -U pinnacle -d pinnacle --clean --if-exists
docker compose start web api
```

### Rotate / inspect the database

```bash
docker compose exec postgres psql -U pinnacle -d pinnacle
```

---

## 7. Troubleshooting checklist

| Symptom                                              | Where to look                                                        |
| ---------------------------------------------------- | -------------------------------------------------------------------- |
| `docker compose build` fails on `pnpm install`       | Check VM has enough RAM (>4 GB free); rerun with `--no-cache`        |
| Caddy can't issue cert (logs show ACME errors)       | DNS A record wrong, or port 80 blocked in OCI Security List/firewall |
| Website loads but `/api/v1/...` calls 404            | Routing regression — `/api/v1/*` must hit the `web` container, not `api`. Check `Caddyfile`. |
| Static assets 404 / homepage broken                  | `BASE_PATH` was non-empty when the web image was built. Rebuild with empty `BASE_PATH` for an apex domain: `docker compose build --build-arg BASE_PATH= web`. |
| `web` container crashes on boot                      | Missing required env var — `docker compose logs web` will say which   |
| Login redirects loop                                 | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` mismatched   |
| File uploads fail                                    | GCS credentials missing — set `GOOGLE_APPLICATION_CREDENTIALS_JSON` (or `GOOGLE_APPLICATION_CREDENTIALS`) and confirm `PRIVATE_OBJECT_DIR` references a bucket the service account can write. See §4. |
| Postgres won't start                                 | `docker volume inspect pinnacle_pgdata` then check disk free          |

---

## 8. Local verification (before shipping)

You can validate the whole stack on any Docker host (laptop, staging VM):

```bash
cd deploy
cp .env.example .env
# Set PUBLIC_DOMAIN=:80 for a local HTTP-only run; fill POSTGRES_PASSWORD &
# DATABASE_URL; the rest can stay as placeholders for a smoke test.
docker compose build
docker compose up -d
curl -fsS http://localhost/api/health         # expect 200
curl -fsSI http://localhost/                  # expect 200 from Next.js
docker compose down                           # leaves the pgdata volume intact
docker compose down -v                        # also wipes the database volume
```

---

## File layout

```
deploy/
├── README.md             ← this file
├── .env.example          ← every required environment variable
├── .dockerignore         ← keeps build context lean
├── docker-compose.yml    ← the stack
├── Caddyfile             ← reverse proxy + TLS rules
├── Dockerfile.web        ← Next.js website image
├── Dockerfile.api        ← Express API image
└── Dockerfile.migrate    ← one-shot Drizzle migration runner
```

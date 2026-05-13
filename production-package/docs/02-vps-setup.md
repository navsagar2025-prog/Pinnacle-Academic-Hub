# VPS / Bare-Metal Setup Guide

Deploy Pinnacle Academic Classes on a Ubuntu 22.04 / 24.04 VPS (DigitalOcean, Hetzner, AWS EC2, etc.).

## Recommended Specs
| Tier | RAM | CPU | Storage | Suitable for |
|------|-----|-----|---------|-------------|
| Starter | 2 GB | 1 vCPU | 40 GB | Up to ~500 students |
| Standard | 4 GB | 2 vCPU | 80 GB | Up to ~2 000 students |
| Production | 8 GB | 4 vCPU | 160 GB | 2 000+ students, high traffic |

---

## Step 1 — Provision the server

```bash
# Connect as root, then create a non-root user
adduser pinnacle
usermod -aG sudo pinnacle
su - pinnacle
```

---

## Step 2 — Install Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
docker --version    # verify
```

---

## Step 3 — Install Nginx as reverse proxy (optional if not using Docker's port 80)

If you want SSL termination at the VPS level (recommended):

```bash
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx
```

Create `/etc/nginx/sites-available/pinnacle`:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto https;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/pinnacle /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Issue SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Step 4 — Deploy with Docker Compose

```bash
git clone https://github.com/navsagar2025-prog/Pinnacle-Academic-Hub.git
cd Pinnacle-Academic-Hub
cp production-package/.env.example .env
nano .env   # fill all values

docker compose -f production-package/docker-compose.yml --env-file .env up -d --build
```

---

## Step 5 — Configure firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## Step 6 — Auto-restart on reboot

Docker already uses `restart: unless-stopped`. To ensure Docker itself starts:
```bash
sudo systemctl enable docker
```

---

## Step 7 — Set up automatic backups

Add to crontab (`crontab -e`):
```cron
0 2 * * * docker exec $(docker ps -q -f name=postgres) pg_dump -U pinnacle pinnacle | gzip > /backups/pinnacle_$(date +\%Y\%m\%d).sql.gz
0 3 * * 0 find /backups -name "*.gz" -mtime +30 -delete
```

---

## Monitoring

```bash
# Check container health
docker compose -f production-package/docker-compose.yml ps

# Live logs
docker compose -f production-package/docker-compose.yml logs -f

# Resource usage
docker stats
```

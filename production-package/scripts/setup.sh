#!/usr/bin/env bash
# setup.sh — Interactive first-run setup for Pinnacle Academic Classes
# Run: bash scripts/setup.sh

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
err()   { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Pinnacle Academic Classes — Production Setup   ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# Check Docker
command -v docker >/dev/null 2>&1 || err "Docker not found. Install from https://docs.docker.com/get-docker/"
command -v docker compose >/dev/null 2>&1 || err "Docker Compose v2 not found."
ok "Docker $(docker --version | awk '{print $3}' | tr -d ',')"

# Create .env if not exists
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

if [[ ! -f "$ROOT_DIR/.env" ]]; then
    cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
    info "Created .env from template"
fi

# Generate encryption key if not set
if ! grep -q "^SOCIAL_TOKEN_ENCRYPTION_KEY=.\{64\}" "$ROOT_DIR/.env" 2>/dev/null; then
    KEY=$(openssl rand -hex 32)
    sed -i "s|^SOCIAL_TOKEN_ENCRYPTION_KEY=.*|SOCIAL_TOKEN_ENCRYPTION_KEY=$KEY|" "$ROOT_DIR/.env"
    ok "Generated SOCIAL_TOKEN_ENCRYPTION_KEY"
fi

# Generate postgres password if not set
if grep -q "^POSTGRES_PASSWORD=yourpassword" "$ROOT_DIR/.env"; then
    PG_PASS=$(openssl rand -base64 24 | tr -d '/+=')
    sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$PG_PASS|" "$ROOT_DIR/.env"
    ok "Generated POSTGRES_PASSWORD"
fi

echo ""
warn "You still need to fill in:"
warn "  • CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY (https://clerk.com)"
warn "  • VITE_CLERK_PUBLISHABLE_KEY (same as CLERK_PUBLISHABLE_KEY)"
warn "  • DATABASE_URL will be auto-set from POSTGRES_PASSWORD if left blank"
echo ""

read -r -p "Open .env in nano to edit now? [Y/n]: " EDIT
if [[ "${EDIT:-Y}" =~ ^[Yy]$ ]]; then
    nano "$ROOT_DIR/.env"
fi

echo ""
info "Building and starting services..."
docker compose -f "$ROOT_DIR/docker-compose.yml" --env-file "$ROOT_DIR/.env" up -d --build

echo ""
ok "Setup complete!"
echo ""
echo "  Website:    http://localhost"
echo "  API health: http://localhost:8080/healthz"
echo ""
echo "  Logs:  docker compose -f docker-compose.yml logs -f"
echo "  Stop:  docker compose -f docker-compose.yml down"

#!/usr/bin/env bash
# backup.sh — Backup the Pinnacle PostgreSQL database
# Usage: bash scripts/backup.sh [backup_dir]

set -euo pipefail

BACKUP_DIR="${1:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="pinnacle_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

CONTAINER=$(docker compose ps -q postgres 2>/dev/null || docker ps -q -f name=postgres)
[[ -z "$CONTAINER" ]] && { echo "Error: postgres container not running"; exit 1; }

echo "Backing up to ${BACKUP_DIR}/${FILENAME}..."
docker exec "$CONTAINER" pg_dump -U pinnacle pinnacle | gzip > "${BACKUP_DIR}/${FILENAME}"
echo "Done: ${BACKUP_DIR}/${FILENAME} ($(du -sh "${BACKUP_DIR}/${FILENAME}" | cut -f1))"

# Keep only last 30 backups
find "$BACKUP_DIR" -name "pinnacle_*.sql.gz" | sort | head -n -30 | xargs -r rm

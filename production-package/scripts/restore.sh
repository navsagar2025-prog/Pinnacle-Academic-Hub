#!/usr/bin/env bash
# restore.sh — Restore a Pinnacle database backup
# Usage: bash scripts/restore.sh backups/pinnacle_20240101_120000.sql.gz

set -euo pipefail

BACKUP_FILE="${1:-}"
[[ -z "$BACKUP_FILE" ]] && { echo "Usage: $0 <backup_file.sql.gz>"; exit 1; }
[[ ! -f "$BACKUP_FILE" ]] && { echo "Error: file not found: $BACKUP_FILE"; exit 1; }

CONTAINER=$(docker compose ps -q postgres 2>/dev/null || docker ps -q -f name=postgres)
[[ -z "$CONTAINER" ]] && { echo "Error: postgres container not running"; exit 1; }

echo "WARNING: This will overwrite the current database!"
read -r -p "Continue? [y/N]: " CONFIRM
[[ "${CONFIRM:-N}" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 0; }

echo "Restoring from $BACKUP_FILE..."
gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER" psql -U pinnacle pinnacle
echo "Restore complete."

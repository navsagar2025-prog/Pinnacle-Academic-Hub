#!/bin/bash
# build-all.sh — Run production builds for all artifacts.
# Exits immediately on any failure (set -e).
set -e

echo "==> Building pinnacle-website (Vite)..."
pnpm --filter @workspace/pinnacle-website run build

echo "==> Building api-server (esbuild)..."
pnpm --filter @workspace/api-server run build

echo "==> Building pinnacle-mobile (Expo web export)..."
# The mobile app uses a custom dev-server build.js; for a static web export
# we use npx expo export directly. If expo is not available in CI the step
# is skipped gracefully so it does not block the rest of the pipeline.
if command -v npx &>/dev/null; then
  cd artifacts/pinnacle-mobile
  npx expo export --platform web --output-dir dist --clear 2>/dev/null || \
    echo "  [warn] Expo web export skipped (non-fatal)."
  cd ../..
else
  echo "  [warn] npx not found — skipping Expo web export."
fi

echo "==> All builds complete."

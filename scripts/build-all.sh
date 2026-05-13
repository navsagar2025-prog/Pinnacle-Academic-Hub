#!/bin/bash
# build-all.sh — Run production builds for all artifacts.
# Exits immediately on any failure (set -e).
set -e

echo "==> Building pinnacle-website (Vite)..."
pnpm --filter @workspace/pinnacle-website run build

echo "==> Building api-server (esbuild)..."
pnpm --filter @workspace/api-server run build

echo "==> Building pinnacle-mobile (Expo web export)..."
pnpm --filter @workspace/pinnacle-mobile run build:web

echo "==> All builds complete."

#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter db push
bash scripts/build-all.sh
bash scripts/package-releases.sh
git push origin main

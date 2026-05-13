# ============================================================
# Pinnacle Academic Classes — API Server
# Multi-stage build for minimal image size.
#
# Stage 1 (builder): installs all deps, builds the TypeScript
#                    source into a single ESM bundle.
# Stage 2 (runtime): only copies the bundle + runtime-only
#                    native deps (pg, googleapis).
#                    Final image is ~150 MB.
# ============================================================

# ── Stage 1: builder ──────────────────────────────────────
FROM node:20-alpine AS builder

# pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /build

# Copy workspace manifests first so layer caching works when
# only source changes (not deps).
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY tsconfig.base.json tsconfig.json ./

# Copy library package manifests
COPY lib/db/package.json             lib/db/package.json
COPY lib/api-spec/package.json       lib/api-spec/package.json
COPY lib/api-zod/package.json        lib/api-zod/package.json
COPY lib/api-client-react/package.json lib/api-client-react/package.json

# Copy api-server manifest
COPY artifacts/api-server/package.json artifacts/api-server/package.json

# Install all dependencies (including dev — needed for esbuild)
RUN pnpm install --frozen-lockfile

# Copy source
COPY lib/                 lib/
COPY artifacts/api-server/ artifacts/api-server/

# Build → artifacts/api-server/dist/index.mjs
RUN pnpm --filter @workspace/api-server run build


# ── Stage 2: website builder (optional — skip if serving static separately) ──
FROM node:20-alpine AS web-builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /build

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY tsconfig.base.json tsconfig.json ./

COPY lib/api-client-react/package.json lib/api-client-react/package.json
COPY lib/api-spec/package.json         lib/api-spec/package.json
COPY lib/api-zod/package.json          lib/api-zod/package.json
COPY lib/db/package.json               lib/db/package.json
COPY artifacts/pinnacle-website/package.json artifacts/pinnacle-website/package.json

RUN pnpm install --frozen-lockfile

COPY lib/                          lib/
COPY artifacts/pinnacle-website/   artifacts/pinnacle-website/
COPY attached_assets/              attached_assets/

ARG VITE_CLERK_PUBLISHABLE_KEY
ARG BASE_PATH=/

ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
ENV BASE_PATH=$BASE_PATH

RUN pnpm --filter @workspace/pinnacle-website run build


# ── Stage 3: runtime (API) ────────────────────────────────
FROM node:20-alpine AS api

# Add non-root user for security
RUN addgroup -S pinnacle && adduser -S pinnacle -G pinnacle

WORKDIR /app

# Only the esbuild output is needed. pino spawns a worker thread
# that reads pino-worker.mjs; include it.
COPY --from=builder /build/artifacts/api-server/dist/ ./dist/

# Install ONLY the packages that survive bundling as external
# (native addons like pg/googleapis that can't be tree-shaken).
COPY --from=builder /build/artifacts/api-server/package.json ./package.json

# Copy the root lockfile + workspace config so plain npm install works
# against the exact locked versions.
RUN npm install --omit=dev --ignore-scripts 2>/dev/null || \
    npm install --omit=dev 2>/dev/null || true

# Create uploads directory with correct ownership
RUN mkdir -p /app/uploads/social && chown -R pinnacle:pinnacle /app

USER pinnacle

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:${PORT}/api/healthz || exit 1

CMD ["node", "--enable-source-maps", "dist/index.mjs"]


# ── Stage 4: web (Nginx serving static files) ────────────
FROM nginx:1.27-alpine AS web

COPY --from=web-builder /build/artifacts/pinnacle-website/dist/public/ /usr/share/nginx/html/

# Nginx config: SPA fallback + gzip
COPY docker/nginx-web.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

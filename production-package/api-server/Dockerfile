# ─── Stage 1: builder ────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /build

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY lib/ ./lib/
COPY artifacts/api-server/package.json ./artifacts/api-server/
RUN pnpm install --frozen-lockfile --filter @workspace/api-server...

COPY artifacts/api-server/ ./artifacts/api-server/
RUN pnpm --filter @workspace/api-server run build

# ─── Stage 2: production ─────────────────────────────────────────────────────
FROM node:22-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /build/artifacts/api-server/dist ./dist

USER appuser

EXPOSE 8080
CMD ["node", "--enable-source-maps", "./dist/index.mjs"]

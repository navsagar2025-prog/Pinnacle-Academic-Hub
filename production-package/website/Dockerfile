# ─── Stage 1: builder ────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /build

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY lib/ ./lib/
COPY artifacts/pinnacle-website/package.json ./artifacts/pinnacle-website/
RUN pnpm install --frozen-lockfile --filter @workspace/pinnacle-website...

COPY artifacts/pinnacle-website/ ./artifacts/pinnacle-website/

ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_GA4_MEASUREMENT_ID
ARG BASE_PATH=/

RUN pnpm --filter @workspace/pinnacle-website run build

# ─── Stage 2: nginx serve ────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

COPY --from=builder /build/artifacts/pinnacle-website/dist/public /usr/share/nginx/html
COPY production-package/website/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

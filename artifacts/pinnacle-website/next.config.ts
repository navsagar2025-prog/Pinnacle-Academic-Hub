import type { NextConfig } from "next";
import path from "node:path";

// BASE_PATH semantics:
//   - undefined  → Replit dev default ("/pinnacle-website")
//   - ""         → apex deployment (Docker/OCI) — serve at "/"
//   - "/foo"     → custom sub-path
const rawBasePath = process.env.BASE_PATH;
const basePath =
  rawBasePath === undefined
    ? "/pinnacle-website"
    : rawBasePath.replace(/\/$/, "");

const isDev = process.env.NODE_ENV !== "production";

// In Docker production builds we emit a self-contained standalone server so the
// runtime image only needs Node.js + the traced dependencies. Opt-in via env to
// avoid affecting the Replit dev workflow.
const useStandalone = process.env.NEXT_OUTPUT_STANDALONE === "true";

// Static security response headers applied to every route.
//
// Content-Security-Policy (static fallback):
//   The app uses per-request nonce-based CSP generated in middleware.ts so
//   that inline scripts (JSON-LD, Clerk UI, Next.js HMR) can carry nonces
//   rather than relying on 'unsafe-inline'. The middleware CSP header takes
//   precedence and overrides this value on all requests that pass through it.
//   This static entry covers edge cases (Next.js error pages, static file
//   responses) that may bypass middleware.
const cspFallback =
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.clerk.accounts.dev https://clerk.paconline.in; " +
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
  "font-src 'self' https://fonts.gstatic.com data:; " +
  "img-src 'self' data: blob: https:; " +
  "connect-src 'self' https://*.clerk.accounts.dev https://clerk.paconline.in https://*.googleapis.com https://storage.googleapis.com; " +
  "frame-src 'self' https://*.clerk.accounts.dev https://clerk.paconline.in; " +
  "object-src 'none'; " +
  "base-uri 'self'; " +
  "form-action 'self'";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self)",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    // Static fallback — middleware.ts emits the nonce-enriched version at runtime.
    key: "Content-Security-Policy",
    value: cspFallback,
  },
];

const nextConfig: NextConfig = {
  basePath,
  assetPrefix: basePath,
  ...(useStandalone
    ? {
        output: "standalone" as const,
        // Trace files from the workspace root so monorepo deps are bundled.
        outputFileTracingRoot: path.join(__dirname, "../.."),
      }
    : {}),
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: isDev ? ["*"] : [],
    },
    // Run middleware in the Node.js runtime instead of the Edge runtime.
    // Required because middleware.ts imports Drizzle/PostgreSQL for IP lockout
    // checks and rate limiting — these are not available in the Edge sandbox.
    // The type definitions for this experimental flag lag behind the runtime
    // support added in Next.js 15.1+ — suppress the stale TS error.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error nodeMiddleware is supported at runtime (Next.js ≥ 15.1)
    nodeMiddleware: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

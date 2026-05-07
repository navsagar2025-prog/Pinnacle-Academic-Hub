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

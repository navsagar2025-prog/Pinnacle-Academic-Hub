// Clerk middleware — route protection, rate limiting, IP lockout, CSP.
// Runtime: Node.js via experimental.nodeMiddleware in next.config.ts.
//
// Execution order per request:
//   1. Global API mutation rate limit (POST/PUT/PATCH/DELETE to /api/v1/*)
//   2. IP lockout enforcement (/portal/*, /api/*, /sign-in/*, /sign-up/*)
//   3. Clerk route protection (portal/* requires authenticated session)
//   4. CSP nonce header
//
// Login-failure tracking is NOT done here to avoid false positives from
// page reloads. See app/sign-in/[[...sign-in]]/ for browser-side trackers
// that call /api/v1/auth/record-failure and /api/v1/auth/record-success
// with the real client IP.

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@workspace/db";
import { securityEvents, ipLockouts } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { rateLimit } from "@/lib/server/rate-limit";

const isProtectedRoute = createRouteMatcher([
  "/portal/student(.*)",
  "/portal/parent(.*)",
  "/portal/teacher(.*)",
  "/portal/admin(.*)",
]);

const isLockoutCheckedRoute = createRouteMatcher([
  "/portal/(.*)",
  "/api/(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const base = process.env.BASE_PATH?.replace(/\/$/, "") ?? "/pinnacle-website";

// Uses the same proxy-hardened strategy as lib/server/rate-limit.ts extractIp:
// prefer x-real-ip (proxy-set), then last x-forwarded-for value (most recently
// appended by our infrastructure). Avoids blindly trusting client-injectable
// leading x-forwarded-for entries.
function getClientIp(req: NextRequest): string | null {
  const xri = req.headers.get("x-real-ip")?.trim();
  if (xri) return xri;
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1]!;
  }
  return null;
}

function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'unsafe-eval' https://*.clerk.accounts.dev https://clerk.paconline.in`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://*.clerk.accounts.dev https://clerk.paconline.in https://*.googleapis.com https://storage.googleapis.com",
    "frame-src 'self' https://*.clerk.accounts.dev https://clerk.paconline.in",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

// When a lockout row has expired, persist unlockedAt so the admin dashboard
// shows the correct lifecycle (auto-expired vs. manually unblocked).
async function isIpLockedOut(ip: string): Promise<boolean> {
  try {
    const [row] = await db.select().from(ipLockouts).where(eq(ipLockouts.ip, ip)).limit(1);
    if (!row || !row.lockedUntil || row.unlockedAt) return false;
    if (row.lockedUntil <= new Date()) {
      db.update(ipLockouts)
        .set({ unlockedAt: new Date(), updatedAt: new Date() })
        .where(eq(ipLockouts.ip, ip))
        .catch(() => {});
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export default clerkMiddleware(async (auth, req) => {
  const ip = getClientIp(req);
  const ua = req.headers.get("user-agent");
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const path = req.nextUrl.pathname;

  // 1. Global API mutation rate limit — delegates to lib/server/rate-limit.ts
  // (same primitive used by per-route handlers; no duplicated logic)
  if (ip && MUTATION_METHODS.has(req.method) && path.includes("/api/v1/")) {
    const { allowed } = await rateLimit(
      `ip:${ip}`, "api.global.mutation", 60, 60_000,
      { ip, userAgent: ua },
    );
    if (!allowed) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "Too many requests. Please slow down.", data: null, meta: null }),
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } },
      );
    }
  }

  // 2. IP lockout enforcement — logs rate_limited (request denied by lockout policy)
  if (ip && isLockoutCheckedRoute(req)) {
    const locked = await isIpLockedOut(ip);
    if (locked) {
      db.insert(securityEvents).values({
        eventType: "rate_limited", ip, userAgent: ua, route: path, outcome: "blocked",
      }).catch(() => {});
      return new NextResponse(
        JSON.stringify({ success: false, error: "Too many requests. Please try again later.", data: null, meta: null }),
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "1800" } },
      );
    }
  }

  // 3. Clerk route protection
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  // 4. CSP nonce
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("x-pathname", path);
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("Content-Security-Policy", buildCsp(nonce));

  const imp = req.cookies.get("pac_imp");
  if (imp?.value) res.headers.set("X-Impersonation-Active", "1");

  return res;
}, { signInUrl: `${base}/sign-in`, signUpUrl: `${base}/sign-up` });

// Required alongside experimental.nodeMiddleware: true in next.config.ts.
// Without this export, Next.js still bundles middleware with edge-runtime
// webpack constraints (which rejects Node.js modules like pg's crypto).
export const runtime = "nodejs";

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

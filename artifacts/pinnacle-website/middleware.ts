/**
 * Clerk middleware — route protection for Pinnacle portals.
 *
 * Runtime: Node.js (enabled via experimental.nodeMiddleware in next.config.ts).
 * Direct Drizzle/PostgreSQL imports work here; no Edge runtime constraints.
 *
 * This is one of two permitted @clerk/nextjs/server import points (see
 * lib/server/portal-auth.ts for the complete auth import inventory).
 *
 * ─── Security layers (in order of execution) ────────────────────────────────
 *
 * 1. Global API mutation rate limit
 *    All POST / PUT / PATCH / DELETE requests to /api/v1/* are rate-limited
 *    per source IP (60 req / min default, tunable via site_settings key
 *    "security_rate_limits" → "api.global.mutation"). This covers every
 *    mutating API route without requiring individual route-handler changes.
 *    Per-route handlers may add tighter limits on top of this.
 *
 * 2. IP lockout enforcement
 *    Covers /portal/*, /api/*, /sign-in/*, /sign-up/* so a locked IP cannot
 *    reach Clerk or any portal/API route. Returns 429 + Retry-After header.
 *    Blocked requests are logged as eventType: "rate_limited", outcome: "blocked".
 *    Auto-unblock: when lockedUntil has passed, the row's unlockedAt is
 *    persisted so the lockout lifecycle is accurate in the admin dashboard.
 *
 * 3. CSP nonce
 *    Per-request nonce forwarded as x-nonce request header and emitted as
 *    Content-Security-Policy response header.
 *
 * 4. Clerk route protection
 *    Portal routes require an authenticated Clerk session.
 *
 * ─── Failed sign-in tracking ─────────────────────────────────────────────────
 * Credential failures are NOT tracked here. Tracking sign-in PAGE VISITS
 * would lock out legitimate users who reload the page. Instead:
 *  - The embedded <SignIn /> page (app/sign-in/[[...sign-in]]/page.tsx) mounts
 *    a <SignInFailureTracker /> that detects real auth failures via useSignIn()
 *    and calls POST /api/v1/auth/record-failure.
 *  - That route has the real client IP in request headers (browser → our server)
 *    and calls logSecurityEvent(eventType: "login_fail", ip: realIp) which
 *    triggers maybeAutoLockIp() after FAIL_THRESHOLD failures.
 *
 * ─── Tunable settings (PUT /api/v1/settings) ────────────────────────────────
 *   security_rate_limits       JSON map of route → {limit, windowMs}
 *   security_fail_threshold    Max login failures before IP lockout (def 10)
 *   security_lockout_minutes   Lockout duration in minutes (default 30)
 *   security_window_minutes    Rolling window for failure counting (default 15)
 */

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@workspace/db";
import { rateLimitHits, securityEvents, ipLockouts, siteSettings } from "@workspace/db/schema";
import { and, eq, gt, sql } from "drizzle-orm";

// ─── Route matchers ──────────────────────────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getClientIp(req: NextRequest): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip");
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

// ─── Settings cache (60 s TTL) ────────────────────────────────────────────────

interface RateLimitConfig { limit: number; windowMs: number }
let rlConfigCache: { value: Record<string, RateLimitConfig>; expiresAt: number } | null = null;

async function getRlConfig(): Promise<Record<string, RateLimitConfig>> {
  if (rlConfigCache && rlConfigCache.expiresAt > Date.now()) return rlConfigCache.value;
  try {
    const [row] = await db.select({ value: siteSettings.value }).from(siteSettings)
      .where(eq(siteSettings.key, "security_rate_limits")).limit(1);
    const value = row?.value ? JSON.parse(row.value) as Record<string, RateLimitConfig> : {};
    rlConfigCache = { value, expiresAt: Date.now() + 60_000 };
    return value;
  } catch {
    return {};
  }
}

// ─── Core security functions ──────────────────────────────────────────────────

/**
 * Global API mutation rate limiter.
 * Covers ALL POST/PUT/PATCH/DELETE to /api/v1/* at the infrastructure level.
 * Per-route handlers may add tighter limits on top.
 * Returns false if the request should be blocked (logs rate_limited event).
 */
async function checkGlobalApiRateLimit(ip: string, ua: string | null): Promise<boolean> {
  try {
    const config = await getRlConfig();
    const override = config["api.global.mutation"];
    const limit = override?.limit ?? 60;
    const windowMs = override?.windowMs ?? 60_000;
    const windowStart = new Date(Date.now() - windowMs);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(rateLimitHits)
      .where(and(
        eq(rateLimitHits.hitKey, `ip:${ip}`),
        eq(rateLimitHits.route, "api.global.mutation"),
        gt(rateLimitHits.createdAt, windowStart),
      ));

    if (count >= limit) {
      // Blocked — log as rate_limited (not ip_blocked; this is a rate limit, not a lockout)
      db.insert(securityEvents).values({
        eventType: "rate_limited",
        ip,
        userAgent: ua,
        route: "api.global.mutation",
        outcome: "blocked",
      }).catch(() => {});
      return false;
    }

    db.insert(rateLimitHits).values({ hitKey: `ip:${ip}`, route: "api.global.mutation" }).catch(() => {});
    return true;
  } catch {
    return true; // fail open
  }
}

/**
 * Check if the given IP is currently locked out.
 * When the lockout has EXPIRED (lockedUntil has passed), persists unlockedAt
 * so the admin dashboard shows the correct lifecycle state.
 * Fails open on DB error.
 */
async function isIpLockedOut(ip: string): Promise<boolean> {
  try {
    const [row] = await db
      .select()
      .from(ipLockouts)
      .where(eq(ipLockouts.ip, ip))
      .limit(1);

    if (!row || !row.lockedUntil) return false;
    if (row.unlockedAt) return false; // already manually unblocked

    const now = new Date();

    if (row.lockedUntil <= now) {
      // Lockout expired — persist auto-unblock so admin dashboard shows correct state
      db.update(ipLockouts)
        .set({ unlockedAt: now, updatedAt: now })
        .where(eq(ipLockouts.ip, ip))
        .catch(() => {});
      return false;
    }

    return true;
  } catch {
    return false; // fail open
  }
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export default clerkMiddleware(async (auth, req) => {
  const ip = getClientIp(req);
  const ua = req.headers.get("user-agent");
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const path = req.nextUrl.pathname;

  // --- 1. Global API mutation rate limit ---
  // Covers ALL POST/PUT/PATCH/DELETE to /api/v1/* at the infrastructure level.
  if (ip && MUTATION_METHODS.has(req.method) && path.includes("/api/v1/")) {
    const allowed = await checkGlobalApiRateLimit(ip, ua);
    if (!allowed) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "Too many requests. Please slow down.", data: null, meta: null }),
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } },
      );
    }
  }

  // --- 2. IP lockout enforcement ---
  // Locked IPs are rejected before Clerk processes the request.
  // Blocked requests are logged as "rate_limited" per spec semantics.
  // When lockedUntil has expired, auto-unblock is persisted to DB.
  if (ip && isLockoutCheckedRoute(req)) {
    const locked = await isIpLockedOut(ip);
    if (locked) {
      db.insert(securityEvents).values({
        eventType: "rate_limited",
        ip,
        userAgent: ua,
        route: path,
        outcome: "blocked",
      }).catch(() => {});

      return new NextResponse(
        JSON.stringify({ success: false, error: "Too many requests. Please try again later.", data: null, meta: null }),
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "1800" } },
      );
    }
  }

  // --- 3. Clerk route protection ---
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  // --- 4. Forward nonce + emit CSP + impersonation signal ---
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("Content-Security-Policy", buildCsp(nonce));

  const imp = req.cookies.get("pac_imp");
  if (imp?.value) {
    res.headers.set("X-Impersonation-Active", "1");
  }

  return res;
}, { signInUrl: `${base}/sign-in`, signUpUrl: `${base}/sign-up` });

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

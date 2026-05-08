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
 * 2. Sign-in attempt tracking with IP auto-lockout
 *    Every request to /sign-in or /sign-up is counted per IP using the
 *    rate_limit_hits table. When a single IP exceeds the configured
 *    security_fail_threshold in the security_window_minutes window, the IP
 *    is immediately locked via lockIpNow(). This is the only place where the
 *    real client IP is available (Clerk webhook payloads carry Clerk's server
 *    IP, not the end-user's). The lockout is then enforced in step 3.
 *
 * 3. IP lockout enforcement
 *    Covers /portal/*, /api/*, /sign-in/*, /sign-up/* so a locked IP cannot
 *    reach Clerk or any portal/API route. Returns 429 + Retry-After header.
 *
 * 4. CSP nonce
 *    Per-request nonce forwarded as x-nonce request header (for RSC pages)
 *    and as Content-Security-Policy response header. next.config.ts also
 *    carries a static fallback CSP without nonces for error pages.
 *
 * 5. Clerk route protection
 *    Portal routes require an authenticated Clerk session.
 *
 * ─── Tunable settings (PUT /api/v1/settings) ────────────────────────────────
 *   security_rate_limits       JSON map of route → {limit, windowMs}
 *   security_fail_threshold    Max sign-in attempts before IP lockout (def 10)
 *   security_lockout_minutes   Lockout duration in minutes (default 30)
 *   security_window_minutes    Rolling window for attempt counting (default 15)
 */

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@workspace/db";
import { rateLimitHits, securityEvents, ipLockouts, siteSettings } from "@workspace/db/schema";
import { and, eq, gt, sql, inArray } from "drizzle-orm";

// ─── Route matchers ──────────────────────────────────────────────────────────

const isProtectedRoute = createRouteMatcher([
  "/portal/student(.*)",
  "/portal/parent(.*)",
  "/portal/teacher(.*)",
  "/portal/admin(.*)",
]);

// Routes checked for IP lockout (after the rate-limit step)
const isLockoutCheckedRoute = createRouteMatcher([
  "/portal/(.*)",
  "/api/(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

// Auth entry routes — sign-in attempt tracking fires here
const isAuthRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

// All API mutation methods (GET is read-only, not rate-limited globally)
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

// ─── Settings helpers ─────────────────────────────────────────────────────────

interface SecurityThresholds { failThreshold: number; lockoutMinutes: number; windowMinutes: number }

/** 60-second in-process cache so we don't hit the DB on every middleware call. */
let thresholdsCache: { value: SecurityThresholds; expiresAt: number } | null = null;

async function getThresholds(): Promise<SecurityThresholds> {
  if (thresholdsCache && thresholdsCache.expiresAt > Date.now()) return thresholdsCache.value;
  try {
    const rows = await db
      .select({ key: siteSettings.key, value: siteSettings.value })
      .from(siteSettings)
      .where(inArray(siteSettings.key, ["security_fail_threshold", "security_lockout_minutes", "security_window_minutes"]));
    const m = Object.fromEntries(rows.map((r) => [r.key, r.value ?? ""]));
    const value: SecurityThresholds = {
      failThreshold: parseInt(m["security_fail_threshold"] ?? "") || 10,
      lockoutMinutes: parseInt(m["security_lockout_minutes"] ?? "") || 30,
      windowMinutes: parseInt(m["security_window_minutes"] ?? "") || 15,
    };
    thresholdsCache = { value, expiresAt: Date.now() + 60_000 };
    return value;
  } catch {
    return { failThreshold: 10, lockoutMinutes: 30, windowMinutes: 15 };
  }
}

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
 * Counts POST/PUT/PATCH/DELETE hits per IP across all /api/v1/* routes.
 * Returns false if the request should be blocked.
 */
async function checkGlobalApiRateLimit(ip: string): Promise<boolean> {
  try {
    const config = await getRlConfig();
    const override = config["api.global.mutation"];
    const limit = override?.limit ?? 60;
    const windowMs = override?.windowMs ?? 60_000;
    const windowStart = new Date(Date.now() - windowMs);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(rateLimitHits)
      .where(and(eq(rateLimitHits.hitKey, `ip:${ip}`), eq(rateLimitHits.route, "api.global.mutation"), gt(rateLimitHits.createdAt, windowStart)));

    if (count >= limit) {
      // Log the block to security events (fire-and-forget)
      db.insert(securityEvents).values({ eventType: "rate_limited", ip, route: "api.global.mutation", outcome: "blocked" }).catch(() => {});
      return false;
    }

    // Record the hit (fire-and-forget, does not pollute security event log)
    db.insert(rateLimitHits).values({ hitKey: `ip:${ip}`, route: "api.global.mutation" }).catch(() => {});
    return true;
  } catch {
    return true; // fail open
  }
}

/**
 * Track sign-in/sign-up page visits per IP and auto-lock when threshold exceeded.
 *
 * WHY HERE: The middleware is the only place with reliable real client IPs.
 * Clerk webhook payloads carry Clerk's infrastructure IPs, not the attacker's.
 * By counting sign-in route visits in the rate_limit_hits table, we can
 * detect excessive auth attempts and create ip_lockouts entries that the
 * lockout check (step 3) will then enforce on subsequent requests.
 */
async function trackSignInAttemptAndMaybeLock(ip: string): Promise<void> {
  try {
    const { failThreshold, lockoutMinutes, windowMinutes } = await getThresholds();
    const windowStart = new Date(Date.now() - windowMinutes * 60_000);

    // Count sign-in page visits from this IP in the rolling window
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(rateLimitHits)
      .where(and(eq(rateLimitHits.hitKey, `ip:${ip}`), eq(rateLimitHits.route, "auth.sign-in"), gt(rateLimitHits.createdAt, windowStart)));

    // Record this visit
    db.insert(rateLimitHits).values({ hitKey: `ip:${ip}`, route: "auth.sign-in" }).catch(() => {});

    // Auto-lock when threshold exceeded
    if (count + 1 >= failThreshold) {
      const lockedUntil = new Date(Date.now() + lockoutMinutes * 60_000);
      await db.insert(ipLockouts)
        .values({ ip, attempts: count + 1, lockedUntil, route: "/sign-in" })
        .onConflictDoUpdate({
          target: ipLockouts.ip,
          set: { attempts: count + 1, lockedUntil, route: "/sign-in", unlockedAt: null, unlockedBy: null, updatedAt: new Date() },
        });
      // Log the auto-lockout
      db.insert(securityEvents).values({ eventType: "ip_blocked", ip, route: "/sign-in", outcome: "blocked" }).catch(() => {});
    }
  } catch {
    // Best-effort — never throw in middleware
  }
}

/**
 * Check if the given IP is currently locked out.
 * Returns true (blocked) or false (allowed). Fails open on DB error.
 */
async function isIpLockedOut(ip: string): Promise<boolean> {
  try {
    const [row] = await db
      .select({ lockedUntil: ipLockouts.lockedUntil, unlockedAt: ipLockouts.unlockedAt })
      .from(ipLockouts)
      .where(eq(ipLockouts.ip, ip))
      .limit(1);

    if (!row || row.unlockedAt || !row.lockedUntil) return false;
    return row.lockedUntil > new Date();
  } catch {
    return false; // fail open
  }
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export default clerkMiddleware(async (auth, req) => {
  const ip = getClientIp(req);
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const path = req.nextUrl.pathname;

  // --- 1. Global API mutation rate limit ---
  // Covers ALL POST/PUT/PATCH/DELETE to /api/v1/* at the infrastructure level.
  // Individual route handlers may add tighter per-route limits on top.
  if (ip && MUTATION_METHODS.has(req.method) && path.includes("/api/v1/")) {
    const allowed = await checkGlobalApiRateLimit(ip);
    if (!allowed) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "Too many requests. Please slow down.", data: null, meta: null }),
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } },
      );
    }
  }

  // --- 2. Sign-in attempt tracking + auto-lockout (uses real IP from middleware) ---
  if (ip && isAuthRoute(req)) {
    await trackSignInAttemptAndMaybeLock(ip);
  }

  // --- 3. IP lockout enforcement ---
  if (ip && isLockoutCheckedRoute(req)) {
    const locked = await isIpLockedOut(ip);
    if (locked) {
      // Log the blocked request (fire-and-forget)
      db.insert(securityEvents)
        .values({ eventType: "ip_blocked", ip, route: path, outcome: "blocked" })
        .catch(() => {});

      return new NextResponse(
        JSON.stringify({ success: false, error: "Too many requests. Please try again later.", data: null, meta: null }),
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "1800" } },
      );
    }
  }

  // --- 4. Clerk route protection ---
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  // --- 5. Forward nonce + emit CSP + impersonation signal ---
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

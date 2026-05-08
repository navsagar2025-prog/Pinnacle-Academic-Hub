/**
 * Database-backed sliding-window rate limiter.
 *
 * Architecture:
 * - Hit tracking: `rate_limit_hits` table (dedicated, not security_events).
 *   Every allowed request writes one row; rows older than the window are
 *   ignored by the count query. Writes are fire-and-forget.
 * - Security event: a single `security_events` row (eventType: "rate_limited",
 *   outcome: "blocked") is written only when a request is actually denied.
 *   This keeps the admin event log clean — it never shows allowed hits.
 * - Per-route limits: read from the `security_rate_limits` site_settings key
 *   (JSON map of route → {limit, windowMs}). Callers supply fallback values
 *   that are used when the key is absent or unparseable.
 *
 * Usage:
 *   const { allowed } = await rateLimit(req, "ip:1.2.3.4", "api.enquiry.submit", 5, 5*60_000);
 *   if (!allowed) return err("Too many requests", 429);
 *
 * settings key format (PUT /api/v1/settings):
 *   {
 *     "security_rate_limits": "{\"api.enquiry.submit\":{\"limit\":5,\"windowMs\":300000}}"
 *   }
 */

import { db } from "@workspace/db";
import { rateLimitHits, securityEvents, siteSettings } from "@workspace/db/schema";
import { and, eq, gt, sql } from "drizzle-orm";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

// ---------------------------------------------------------------------------
// Per-route config resolution from site_settings
// ---------------------------------------------------------------------------

interface RouteLimit { limit: number; windowMs: number }
type RateLimitConfig = Record<string, RouteLimit>;

/** Cache the settings for at most 60 s to avoid a DB round-trip per request. */
let configCache: { value: RateLimitConfig; expiresAt: number } | null = null;

async function getRateLimitConfig(): Promise<RateLimitConfig> {
  if (configCache && configCache.expiresAt > Date.now()) {
    return configCache.value;
  }
  try {
    const [row] = await db
      .select({ value: siteSettings.value })
      .from(siteSettings)
      .where(eq(siteSettings.key, "security_rate_limits"))
      .limit(1);

    if (row?.value) {
      const parsed = JSON.parse(row.value) as RateLimitConfig;
      configCache = { value: parsed, expiresAt: Date.now() + 60_000 };
      return parsed;
    }
  } catch {
    // Fall through to empty config
  }
  configCache = { value: {}, expiresAt: Date.now() + 60_000 };
  return {};
}

// ---------------------------------------------------------------------------
// Main rate-limit function
// ---------------------------------------------------------------------------

export async function rateLimit(
  key: string,       // e.g. "ip:1.2.3.4" or "user:<uuid>"
  route: string,     // e.g. "api.enquiry.submit"
  defaultLimit: number,   // used when no site_setting override exists
  defaultWindowMs: number,
  metadata?: { ip?: string | null; actorEmail?: string | null; userAgent?: string | null },
): Promise<RateLimitResult> {
  // Resolve effective limit + window (settings override > caller default)
  let limit = defaultLimit;
  let windowMs = defaultWindowMs;
  try {
    const config = await getRateLimitConfig();
    const override = config[route];
    if (override) {
      limit = override.limit;
      windowMs = override.windowMs;
    }
  } catch {
    // Use caller defaults
  }

  const resetAt = new Date(Date.now() + windowMs);

  try {
    const windowStart = new Date(Date.now() - windowMs);

    // Count hits in the sliding window from the dedicated tracking table
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(rateLimitHits)
      .where(
        and(
          eq(rateLimitHits.hitKey, key),
          eq(rateLimitHits.route, route),
          gt(rateLimitHits.createdAt, windowStart),
        ),
      );

    if (count >= limit) {
      // Actually blocked — write one security event for admin visibility
      db.insert(securityEvents).values({
        eventType: "rate_limited",
        actorEmail: metadata?.actorEmail ?? key,
        ip: metadata?.ip ?? null,
        userAgent: metadata?.userAgent ?? null,
        route,
        outcome: "blocked",
      }).catch(() => {});

      return { allowed: false, remaining: 0, resetAt };
    }

    // Allowed — record the hit (fire-and-forget, does not pollute security log)
    db.insert(rateLimitHits).values({ hitKey: key, route }).catch(() => {});

    return { allowed: true, remaining: limit - count - 1, resetAt };
  } catch {
    // Fail open — never block legitimate users due to a DB error
    return { allowed: true, remaining: defaultLimit, resetAt };
  }
}

// ---------------------------------------------------------------------------
// Convenience helper: extract client IP from a Next.js Request
// ---------------------------------------------------------------------------

// Derive the client IP from proxy headers.
//
// x-real-ip is preferred: typically set by Nginx/trusted reverse proxy to the
// verified client address and not forwarded from upstream — harder to spoof.
//
// x-forwarded-for is a comma-separated list where each proxy appends the
// upstream address it received the request from. Naively trusting the FIRST
// value is spoof-prone: a client can inject a fake leading IP before the
// request reaches our proxy. We take the LAST non-empty value, which is the
// one most recently appended by our infrastructure layer and therefore
// trustworthy in a single-hop setup.
export function extractIp(request: Request): string {
  const xri = request.headers.get("x-real-ip")?.trim();
  if (xri) return xri;
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1]!;
  }
  return "unknown";
}

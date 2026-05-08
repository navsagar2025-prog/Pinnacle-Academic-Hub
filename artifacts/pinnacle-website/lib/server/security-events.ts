/**
 * Security event logging + IP lockout helpers.
 *
 * Design choices:
 * - All writes are fire-and-forget (swallowed errors) so a DB hiccup never
 *   blocks the auth flow.
 * - Thresholds are read from the `site_settings` table (keys below) so admins
 *   can tune them from the Settings UI without a code deploy. Hard-coded
 *   defaults are used when a key is absent.
 * - `lockIpNow` is exported so the middleware can directly lock an IP when it
 *   detects excessive sign-in page visits — the only reliable place where the
 *   real client IP is always available.
 *
 * Threshold keys in site_settings:
 *   security_fail_threshold    – failures before IP lockout     (default 10)
 *   security_lockout_minutes   – lockout duration in minutes    (default 30)
 *   security_window_minutes    – rolling failure window         (default 15)
 */

import { db } from "@workspace/db";
import { securityEvents, ipLockouts, siteSettings } from "@workspace/db/schema";
import { eq, gt, sql, and, inArray } from "drizzle-orm";

export type SecurityEventType =
  | "login_success"
  | "login_fail"
  | "rate_limited"
  | "ip_blocked"
  | "ip_unblocked";

export type SecurityOutcome = "success" | "fail" | "blocked";

// --- Default thresholds (overridden by site_settings rows) ---
const DEFAULT_FAIL_THRESHOLD = 10;
const DEFAULT_LOCKOUT_MINUTES = 30;
const DEFAULT_WINDOW_MINUTES = 15;

const THRESHOLD_KEYS = [
  "security_fail_threshold",
  "security_lockout_minutes",
  "security_window_minutes",
] as const;

export interface SecurityThresholds {
  failThreshold: number;
  lockoutMinutes: number;
  windowMinutes: number;
}

/** Read security thresholds from site_settings (with hard-coded fallbacks). */
export async function getSecurityThresholds(): Promise<SecurityThresholds> {
  try {
    const rows = await db
      .select({ key: siteSettings.key, value: siteSettings.value })
      .from(siteSettings)
      .where(inArray(siteSettings.key, [...THRESHOLD_KEYS]));

    const map = Object.fromEntries(rows.map((r) => [r.key, r.value ?? ""]));
    return {
      failThreshold: parseInt(map["security_fail_threshold"] ?? "") || DEFAULT_FAIL_THRESHOLD,
      lockoutMinutes: parseInt(map["security_lockout_minutes"] ?? "") || DEFAULT_LOCKOUT_MINUTES,
      windowMinutes: parseInt(map["security_window_minutes"] ?? "") || DEFAULT_WINDOW_MINUTES,
    };
  } catch {
    return {
      failThreshold: DEFAULT_FAIL_THRESHOLD,
      lockoutMinutes: DEFAULT_LOCKOUT_MINUTES,
      windowMinutes: DEFAULT_WINDOW_MINUTES,
    };
  }
}

export async function logSecurityEvent(opts: {
  eventType: SecurityEventType;
  actorEmail?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  route?: string | null;
  outcome: SecurityOutcome;
}) {
  try {
    await db.insert(securityEvents).values({
      eventType: opts.eventType,
      actorEmail: opts.actorEmail ?? null,
      ip: opts.ip ?? null,
      userAgent: opts.userAgent ?? null,
      route: opts.route ?? null,
      outcome: opts.outcome,
    });

    // Auto-lockout: count recent failures from this IP.
    // Only triggered when IP is known — webhook events with ip=null do not
    // trigger this path. IP-based lockout for sign-in activity is instead
    // handled by the middleware via trackSignInAttempt().
    if (opts.eventType === "login_fail" && opts.ip) {
      await maybeAutoLockIp(opts.ip, opts.route ?? null);
    }
  } catch {
    // Never throw — security logging must not break auth flow
  }
}

/** Count login_fail events for an IP in the rolling window and lock if threshold hit. */
async function maybeAutoLockIp(ip: string, route: string | null) {
  try {
    const { failThreshold, lockoutMinutes, windowMinutes } = await getSecurityThresholds();
    const windowStart = new Date(Date.now() - windowMinutes * 60_000);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(securityEvents)
      .where(
        and(
          eq(securityEvents.ip, ip),
          eq(securityEvents.eventType, "login_fail"),
          gt(securityEvents.createdAt, windowStart),
        ),
      );

    if (count >= failThreshold) {
      await lockIpNow(ip, route, count, lockoutMinutes);
    }
  } catch {
    // Best-effort
  }
}

/**
 * Immediately lock an IP address.
 *
 * Called from:
 *   1. maybeAutoLockIp() — after N login_fail events with a known IP
 *   2. middleware.ts → trackSignInAttempt() — after N sign-in page visits
 *      from the same IP (where the middleware has the real client IP, not
 *      the Clerk webhook sender IP).
 *
 * This is the canonical lockout writer; unblockIp() sets unlockedAt to clear it.
 */
export async function lockIpNow(
  ip: string,
  route: string | null,
  attempts: number,
  lockoutMinutes: number,
): Promise<void> {
  try {
    const lockedUntil = new Date(Date.now() + lockoutMinutes * 60_000);
    await db
      .insert(ipLockouts)
      .values({ ip, attempts, lockedUntil, route })
      .onConflictDoUpdate({
        target: ipLockouts.ip,
        set: {
          attempts,
          lockedUntil,
          route,
          unlockedAt: null,
          unlockedBy: null,
          updatedAt: new Date(),
        },
      });

    // Log the lockout event (best-effort; fire-and-forget to avoid recursion)
    db.insert(securityEvents).values({
      eventType: "ip_blocked",
      ip,
      route,
      outcome: "blocked",
    }).catch(() => {});
  } catch {
    // Best-effort — never let lockout creation block the request flow
  }
}

/**
 * Check if an IP is currently locked out.
 * Returns { locked: true, until } or { locked: false }.
 */
export async function checkIpLockout(
  ip: string,
): Promise<{ locked: boolean; until?: Date }> {
  try {
    const [row] = await db
      .select()
      .from(ipLockouts)
      .where(eq(ipLockouts.ip, ip))
      .limit(1);

    if (!row) return { locked: false };
    if (!row.lockedUntil) return { locked: false };
    if (row.unlockedAt) return { locked: false };
    if (row.lockedUntil < new Date()) return { locked: false };

    return { locked: true, until: row.lockedUntil };
  } catch {
    return { locked: false };
  }
}

export async function unblockIp(ip: string, adminEmail: string): Promise<boolean> {
  try {
    const result = await db
      .update(ipLockouts)
      .set({ unlockedAt: new Date(), unlockedBy: adminEmail, updatedAt: new Date() })
      .where(eq(ipLockouts.ip, ip))
      .returning({ id: ipLockouts.id });

    if (result.length > 0) {
      await logSecurityEvent({
        eventType: "ip_unblocked",
        actorEmail: adminEmail,
        ip,
        outcome: "success",
      });
    }
    return result.length > 0;
  } catch {
    return false;
  }
}

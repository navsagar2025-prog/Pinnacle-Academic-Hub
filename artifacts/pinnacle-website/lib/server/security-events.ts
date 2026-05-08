/**
 * Security event logging + IP lockout helpers.
 *
 * Design choices:
 * - All writes are fire-and-forget (swallowed errors) so a DB hiccup never
 *   blocks the auth flow.
 * - Lockout decisions are read synchronously in middleware; the DB lookup is
 *   bounded by Postgres connection pool, not an external call.
 * - Threshold constants are intentionally conservative defaults; they can be
 *   moved to siteSettings later without code changes.
 */

import { db } from "@workspace/db";
import { securityEvents, ipLockouts } from "@workspace/db/schema";
import { eq, gt, sql, and } from "drizzle-orm";

export type SecurityEventType =
  | "login_success"
  | "login_fail"
  | "rate_limited"
  | "ip_blocked"
  | "ip_unblocked";

export type SecurityOutcome = "success" | "fail" | "blocked";

// --- Thresholds ---
const FAIL_THRESHOLD = 10; // failures before lockout
const LOCKOUT_MINUTES = 30; // initial lockout duration
const WINDOW_MINUTES = 15; // rolling window for failure counting

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

    // Auto-lockout: count recent failures from this IP and lock if threshold hit
    if (opts.eventType === "login_fail" && opts.ip) {
      await maybeAutoLockIp(opts.ip, opts.route ?? null);
    }
  } catch {
    // Never throw — security logging must not break auth flow
  }
}

async function maybeAutoLockIp(ip: string, route: string | null) {
  try {
    const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60_000);
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

    if (count >= FAIL_THRESHOLD) {
      const lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60_000);
      await db
        .insert(ipLockouts)
        .values({ ip, attempts: count, lockedUntil, route })
        .onConflictDoUpdate({
          target: ipLockouts.ip,
          set: {
            attempts: count,
            lockedUntil,
            route,
            unlockedAt: null,
            unlockedBy: null,
            updatedAt: new Date(),
          },
        });

      await logSecurityEvent({ eventType: "ip_blocked", ip, route, outcome: "blocked" });
    }
  } catch {
    // Best-effort
  }
}

/**
 * Check if an IP is currently locked out.
 * Returns { locked: true, until } or { locked: false }.
 * Exposed for use in middleware (runs in Node.js runtime, not Edge).
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

    // Already manually unblocked
    if (row.unlockedAt) return { locked: false };

    // Expired lockout — effectively unblocked
    if (row.lockedUntil < new Date()) return { locked: false };

    return { locked: true, until: row.lockedUntil };
  } catch {
    // Fail open — never lock out due to a DB error
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

/**
 * Database-backed sliding-window rate limiter.
 *
 * Stores hit counts in `security_events` (reuses the existing table so we
 * don't need another table). The sliding window counts rows in the last
 * `windowMs` for the given (key, action) pair.
 *
 * All DB writes are fire-and-forget; on DB failure the limiter fails open so
 * a transient DB blip never blocks legitimate users.
 *
 * Usage:
 *   const { allowed, remaining } = await rateLimit("ip:1.2.3.4", "api", 30, 60_000);
 *   if (!allowed) return err("Too many requests", 429);
 */

import { db } from "@workspace/db";
import { securityEvents } from "@workspace/db/schema";
import { and, eq, gt, sql } from "drizzle-orm";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export async function rateLimit(
  key: string, // e.g. "ip:1.2.3.4" or "user:<uuid>"
  route: string, // e.g. "api.enquiry.submit"
  limit: number, // max hits allowed in the window
  windowMs: number, // rolling window in milliseconds
): Promise<RateLimitResult> {
  const resetAt = new Date(Date.now() + windowMs);
  try {
    const windowStart = new Date(Date.now() - windowMs);

    // Count events in the sliding window for this key+route combo.
    // We store the key in actorEmail (repurposed as a generic identifier here)
    // and the route in the route column.
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(securityEvents)
      .where(
        and(
          eq(securityEvents.actorEmail, key),
          eq(securityEvents.route, `rl:${route}`),
          gt(securityEvents.createdAt, windowStart),
        ),
      );

    if (count >= limit) {
      return { allowed: false, remaining: 0, resetAt };
    }

    // Record this hit (fire-and-forget)
    db.insert(securityEvents)
      .values({
        eventType: "rate_limited",
        actorEmail: key,
        route: `rl:${route}`,
        outcome: "success",
      })
      .catch(() => {});

    return { allowed: true, remaining: limit - count - 1, resetAt };
  } catch {
    // Fail open
    return { allowed: true, remaining: limit, resetAt };
  }
}

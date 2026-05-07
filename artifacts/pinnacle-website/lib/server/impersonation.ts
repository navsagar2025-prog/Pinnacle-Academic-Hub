/**
 * Impersonation
 * =============
 *
 * Lets an admin temporarily act as another user to debug exactly what that
 * user sees. Highest-risk piece of the Operations Console — every request
 * during an impersonation is auditable, the session auto-expires after at
 * most 60 minutes, and the "you are impersonating X" banner is rendered
 * server-side from the cookie/DB pair (not from a client-settable flag).
 *
 * Flow:
 *   1. Admin POSTs /api/v1/admin/ops/impersonate/start with a target userId.
 *      Server generates a random 32-byte token, stores SHA-256(token) in
 *      `impersonation_sessions`, sets an HttpOnly cookie containing the raw
 *      token plus the session row id.
 *   2. On every request, getDbUser() in portal-auth.ts checks the cookie,
 *      hashes it, looks up an active row, and substitutes the target user
 *      in place of the admin. The original admin id is exposed via
 *      readImpersonationContext() for audit + banner rendering.
 *   3. Admin POSTs .../impersonate/stop or session expires (60 min hard cap).
 *      Cookie cleared, DB row updated with endedAt + endedReason.
 *
 * Security notes:
 *   - The cookie value is the raw token; only its SHA-256 lives in the DB.
 *     A stolen DB dump cannot forge a valid cookie.
 *   - Cookie is HttpOnly + Secure (in prod) + SameSite=Lax to block JS
 *     access and CSRF reuse.
 *   - Maximum lifetime is enforced server-side; client cannot extend it.
 *   - Banner is rendered from the server-resolved DB row, never from a
 *     client flag, so a user who fakes a cookie name cannot hide the banner.
 */
import { cookies, headers } from "next/headers";
import { randomBytes, createHash } from "crypto";
import { db } from "@workspace/db";
import { impersonationSessions, users } from "@workspace/db/schema";
import { and, eq, isNull, gt } from "drizzle-orm";

export const IMPERSONATION_COOKIE = "pac_imp";
export const MAX_IMPERSONATION_MINUTES = 60;

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export interface ImpersonationContext {
  sessionId: string;
  adminUserId: string;
  adminName: string | null;
  targetUserId: string;
  targetName: string | null;
  expiresAt: Date;
}

/**
 * Resolves the active impersonation, if any. Returns null when:
 *   - no cookie is present
 *   - the cookie hash has no matching active session
 *   - the matching session has expired
 *   - the matching session was already ended
 *
 * Pure read: never mutates the DB. Expired-cleanup happens lazily on the
 * next start/stop call to keep the read path cheap on the hot path.
 */
export async function readImpersonationContext(): Promise<ImpersonationContext | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(IMPERSONATION_COOKIE)?.value;
  if (!raw) return null;

  const tokenHash = hashToken(raw);
  const now = new Date();

  const [row] = await db
    .select({
      id: impersonationSessions.id,
      adminUserId: impersonationSessions.adminUserId,
      targetUserId: impersonationSessions.targetUserId,
      expiresAt: impersonationSessions.expiresAt,
    })
    .from(impersonationSessions)
    .where(
      and(
        eq(impersonationSessions.tokenHash, tokenHash),
        isNull(impersonationSessions.endedAt),
        gt(impersonationSessions.expiresAt, now),
      ),
    )
    .limit(1);

  if (!row) return null;

  const [admin] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, row.adminUserId))
    .limit(1);
  const [target] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, row.targetUserId))
    .limit(1);

  return {
    sessionId: row.id,
    adminUserId: row.adminUserId,
    adminName: admin?.name ?? null,
    targetUserId: row.targetUserId,
    targetName: target?.name ?? null,
    expiresAt: row.expiresAt,
  };
}

/**
 * Starts an impersonation session. The admin caller must already be
 * authorised by the calling route. Returns the raw token to be set as a
 * cookie by the route handler (kept out of this lib so routes own the
 * cookie attributes).
 */
export async function startImpersonation(
  adminUserId: string,
  targetUserId: string,
): Promise<{ rawToken: string; sessionId: string; expiresAt: Date }> {
  if (adminUserId === targetUserId) {
    throw new Error("Cannot impersonate yourself");
  }
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + MAX_IMPERSONATION_MINUTES * 60_000);

  const hdrs = await headers();
  const ipAddress =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? hdrs.get("x-real-ip") ?? null;
  const userAgent = hdrs.get("user-agent") ?? null;

  const [row] = await db
    .insert(impersonationSessions)
    .values({
      tokenHash,
      adminUserId,
      targetUserId,
      expiresAt,
      ipAddress,
      userAgent,
    })
    .returning({ id: impersonationSessions.id });

  return { rawToken, sessionId: row.id, expiresAt };
}

/**
 * Ends an impersonation session by token hash. Idempotent — calling on a
 * session that's already ended is a no-op.
 */
export async function endImpersonationByToken(rawToken: string, reason: string): Promise<string | null> {
  const tokenHash = hashToken(rawToken);
  const [row] = await db
    .update(impersonationSessions)
    .set({ endedAt: new Date(), endedReason: reason })
    .where(and(eq(impersonationSessions.tokenHash, tokenHash), isNull(impersonationSessions.endedAt)))
    .returning({ id: impersonationSessions.id });
  return row?.id ?? null;
}

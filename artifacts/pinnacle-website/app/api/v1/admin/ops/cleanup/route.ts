/**
 * POST /api/v1/admin/ops/cleanup
 * Admin-only. Dry-run or perform bulk deletion of stale rows.
 *
 * Body: { target: CleanupTarget; confirm?: boolean }
 *
 * Without confirm (dry-run): returns { count, description } of rows that would
 *   be deleted.
 * With confirm: deletes the rows and returns { deleted }.
 */
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { ok, err } from "@/lib/server/api-response";
import { getRealAdminUser } from "@/lib/server/portal-auth";

export const runtime = "nodejs";

type CleanupTarget =
  | "expired_stream_tokens"
  | "expired_reset_tokens"
  | "expired_impersonation_sessions"
  | "old_audit_logs"
  | "old_rate_limit_hits"
  | "old_security_events";

interface CleanupSpec {
  description: string;
  /** Count rows that would be deleted. Returns 0 if the backing table does not exist. */
  count: () => Promise<number>;
  /** Delete stale rows. Returns number of rows deleted (0 if table absent). */
  delete: () => Promise<number>;
}

/** Execute a SQL statement; swallows undefined_table errors (PG code 42P01). */
async function safeCount(statement: ReturnType<typeof sql>): Promise<number> {
  try {
    const rows = await db.execute(statement);
    return (rows.rows[0]?.n as number) ?? 0;
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === "42P01") return 0; // table does not exist
    throw e;
  }
}

async function safeDelete(statement: ReturnType<typeof sql>): Promise<number> {
  try {
    const result = await db.execute(statement);
    return (result as unknown as { rowCount?: number }).rowCount ?? 0;
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === "42P01") return 0;
    throw e;
  }
}

const CLEANUP_SPECS: Record<CleanupTarget, CleanupSpec> = {
  expired_stream_tokens: {
    description: "Recording stream tokens past their expiry date",
    count:  () => safeCount(sql`SELECT count(*)::int AS n FROM recording_stream_tokens WHERE expires_at < now()`),
    delete: () => safeDelete(sql`DELETE FROM recording_stream_tokens WHERE expires_at < now()`),
  },
  expired_reset_tokens: {
    description: "Expired password-reset tokens (returns 0 when the app delegates auth to Clerk and has no local reset-token table)",
    count:  () => safeCount(sql`SELECT count(*)::int AS n FROM password_reset_tokens WHERE expires_at < now()`),
    delete: () => safeDelete(sql`DELETE FROM password_reset_tokens WHERE expires_at < now()`),
  },
  expired_impersonation_sessions: {
    description: "Impersonation sessions whose expiry has passed",
    count:  () => safeCount(sql`SELECT count(*)::int AS n FROM impersonation_sessions WHERE expires_at < now()`),
    delete: () => safeDelete(sql`DELETE FROM impersonation_sessions WHERE expires_at < now()`),
  },
  old_audit_logs: {
    description: "Audit log entries older than 180 days",
    count:  () => safeCount(sql`SELECT count(*)::int AS n FROM audit_logs WHERE created_at < now() - interval '180 days'`),
    delete: () => safeDelete(sql`DELETE FROM audit_logs WHERE created_at < now() - interval '180 days'`),
  },
  old_rate_limit_hits: {
    description: "Rate-limit hit records older than 24 hours",
    count:  () => safeCount(sql`SELECT count(*)::int AS n FROM rate_limit_hits WHERE created_at < now() - interval '1 day'`),
    delete: () => safeDelete(sql`DELETE FROM rate_limit_hits WHERE created_at < now() - interval '1 day'`),
  },
  old_security_events: {
    description: "Security events older than 90 days",
    count:  () => safeCount(sql`SELECT count(*)::int AS n FROM security_events WHERE created_at < now() - interval '90 days'`),
    delete: () => safeDelete(sql`DELETE FROM security_events WHERE created_at < now() - interval '90 days'`),
  },
};

export async function POST(request: Request) {
  const actor = await getRealAdminUser();
  if (!actor) return err("Unauthorized", 401);
  if (actor.role !== "admin") return err("Forbidden — admin only", 403);

  let body: { target?: string; confirm?: boolean };
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON body", 400);
  }

  const { target, confirm } = body;
  if (!target || !(target in CLEANUP_SPECS)) {
    return err(`Unknown cleanup target. Valid: ${Object.keys(CLEANUP_SPECS).join(", ")}`, 400);
  }

  const spec = CLEANUP_SPECS[target as CleanupTarget];

  try {
    if (!confirm) {
      const count = await spec.count();
      return ok({ dryRun: true, count, description: spec.description });
    }
    const deleted = await spec.delete();
    return ok({ dryRun: false, deleted, description: spec.description });
  } catch (e) {
    console.error("cleanup error:", e);
    return err("Cleanup failed: " + (e as Error).message);
  }
}

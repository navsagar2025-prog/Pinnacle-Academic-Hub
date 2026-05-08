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
import { getDbUser } from "@/lib/server/portal-auth";

export const runtime = "nodejs";

type CleanupTarget =
  | "expired_stream_tokens"
  | "expired_impersonation_sessions"
  | "old_audit_logs"
  | "old_rate_limit_hits"
  | "old_security_events";

interface CleanupSpec {
  description: string;
  countSql: ReturnType<typeof sql>;
  deleteSql: ReturnType<typeof sql>;
}

const CLEANUP_SPECS: Record<CleanupTarget, CleanupSpec> = {
  expired_stream_tokens: {
    description: "Recording stream tokens past their expiry date",
    countSql: sql`SELECT count(*)::int AS n FROM recording_stream_tokens WHERE expires_at < now()`,
    deleteSql: sql`DELETE FROM recording_stream_tokens WHERE expires_at < now()`,
  },
  expired_impersonation_sessions: {
    description: "Impersonation sessions whose expiry has passed",
    countSql: sql`SELECT count(*)::int AS n FROM impersonation_sessions WHERE expires_at < now()`,
    deleteSql: sql`DELETE FROM impersonation_sessions WHERE expires_at < now()`,
  },
  old_audit_logs: {
    description: "Audit log entries older than 180 days",
    countSql: sql`SELECT count(*)::int AS n FROM audit_logs WHERE created_at < now() - interval '180 days'`,
    deleteSql: sql`DELETE FROM audit_logs WHERE created_at < now() - interval '180 days'`,
  },
  old_rate_limit_hits: {
    description: "Rate-limit hit records older than 24 hours",
    countSql: sql`SELECT count(*)::int AS n FROM rate_limit_hits WHERE created_at < now() - interval '1 day'`,
    deleteSql: sql`DELETE FROM rate_limit_hits WHERE created_at < now() - interval '1 day'`,
  },
  old_security_events: {
    description: "Security events older than 90 days",
    countSql: sql`SELECT count(*)::int AS n FROM security_events WHERE created_at < now() - interval '90 days'`,
    deleteSql: sql`DELETE FROM security_events WHERE created_at < now() - interval '90 days'`,
  },
};

export async function POST(request: Request) {
  const actor = await getDbUser();
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
      // Dry run — return count only.
      const rows = await db.execute(spec.countSql);
      const count = (rows.rows[0]?.n as number) ?? 0;
      return ok({ dryRun: true, count, description: spec.description });
    }

    // Perform the deletion.
    const result = await db.execute(spec.deleteSql);
    const deleted = (result as unknown as { rowCount?: number }).rowCount ?? 0;
    return ok({ dryRun: false, deleted, description: spec.description });
  } catch (e) {
    console.error("cleanup error:", e);
    return err("Cleanup failed: " + (e as Error).message);
  }
}

/**
 * GET /api/v1/admin/ops/db-stats
 * Admin-only. Returns per-table row counts and sizes from pg_stat_user_tables,
 * plus total database size.  A ?vacuum=1 query param triggers ANALYZE on all
 * tables instead of returning stats.
 */
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { ok, err } from "@/lib/server/api-response";
import { getRealAdminUser } from "@/lib/server/portal-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const actor = await getRealAdminUser();
  if (!actor) return err("Unauthorized", 401);
  if (actor.role !== "admin") return err("Forbidden — admin only", 403);

  const { searchParams } = new URL(request.url);

  if (searchParams.get("vacuum") === "1") {
    // Run ANALYZE on all tables (non-blocking stats refresh).
    await db.execute(sql`ANALYZE`);
    return ok({ analyzed: true });
  }

  const [tableRows, totalRows] = await Promise.all([
    db.execute(sql`
      SELECT
        s.relname                                                       AS table_name,
        s.n_live_tup                                                    AS row_count,
        pg_size_pretty(pg_total_relation_size(c.oid))                  AS total_size,
        pg_total_relation_size(c.oid)                                   AS total_size_bytes,
        pg_size_pretty(pg_relation_size(c.oid))                        AS table_size,
        pg_size_pretty(pg_total_relation_size(c.oid)
          - pg_relation_size(c.oid))                                    AS index_size
      FROM pg_stat_user_tables s
      JOIN pg_class c ON c.relname = s.relname
      JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
      ORDER BY pg_total_relation_size(c.oid) DESC
    `),
    db.execute(sql`
      SELECT
        pg_size_pretty(pg_database_size(current_database())) AS db_size,
        pg_database_size(current_database())                  AS db_size_bytes
    `),
  ]);

  const totalMb = totalRows.rows[0]
    ? +((totalRows.rows[0].db_size_bytes as number) / 1_048_576).toFixed(2)
    : 0;

  return ok({
    tables: tableRows.rows,
    total: {
      pretty: totalRows.rows[0]?.db_size ?? "unknown",
      mb: totalMb,
    },
  });
}

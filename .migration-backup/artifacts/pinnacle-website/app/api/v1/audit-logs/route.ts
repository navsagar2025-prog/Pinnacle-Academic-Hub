import { db } from "@workspace/db";
import { auditLogs } from "@workspace/db/schema";
import { sql, desc, and, eq, gte, lte, ilike, or, type SQL } from "drizzle-orm";
import { paginatedOk, ok, err } from "@/lib/server/api-response";
import { getRealAdminUser } from "@/lib/server/portal-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildFilters(searchParams: URLSearchParams): SQL | undefined {
  const filters: SQL[] = [];

  const action = searchParams.get("action")?.trim();
  if (action) filters.push(eq(auditLogs.action, action));

  const entityType = searchParams.get("entityType")?.trim();
  if (entityType) filters.push(eq(auditLogs.entityType, entityType));

  const actorId = searchParams.get("actorId")?.trim();
  if (actorId) filters.push(eq(auditLogs.actorId, actorId));

  const dateFrom = searchParams.get("dateFrom")?.trim();
  if (dateFrom) {
    const d = new Date(dateFrom);
    if (!isNaN(d.getTime())) filters.push(gte(auditLogs.createdAt, d));
  }
  const dateTo = searchParams.get("dateTo")?.trim();
  if (dateTo) {
    const d = new Date(dateTo);
    if (!isNaN(d.getTime())) filters.push(lte(auditLogs.createdAt, d));
  }

  const q = searchParams.get("q")?.trim();
  if (q) {
    const like = `%${q}%`;
    const orClause = or(
      ilike(auditLogs.actorName, like),
      ilike(auditLogs.action, like),
      ilike(auditLogs.entityId, like),
      sql`${auditLogs.details}::text ILIKE ${like}`,
    );
    if (orClause) filters.push(orClause);
  }

  if (filters.length === 0) return undefined;
  return filters.length === 1 ? filters[0] : and(...filters);
}

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = typeof v === "string" ? v : JSON.stringify(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(request: Request) {
  const actor = await getRealAdminUser();
  if (!actor) return err("Unauthorized", 401);
  if (actor.role !== "admin") return err("Forbidden", 403);

  const { searchParams } = new URL(request.url);
  const where = buildFilters(searchParams);
  const format = searchParams.get("format");

  try {
    if (format === "csv") {
      // CSV cap: 10k rows so a runaway export doesn't OOM.
      const rows = await (where
        ? db.select().from(auditLogs).where(where).orderBy(desc(auditLogs.createdAt)).limit(10_000)
        : db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(10_000));
      const header = "createdAt,actorId,actorName,action,entityType,entityId,details\n";
      const body = rows
        .map((r) =>
          [
            r.createdAt.toISOString(),
            r.actorId ?? "",
            r.actorName ?? "",
            r.action,
            r.entityType ?? "",
            r.entityId ?? "",
            r.details ? JSON.stringify(r.details) : "",
          ]
            .map(csvEscape)
            .join(","),
        )
        .join("\n");
      return new Response(header + body, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="audit-logs-${Date.now()}.csv"`,
        },
      });
    }

    if (searchParams.get("facets") === "1") {
      // Lightweight facet query for filter dropdowns.
      const actions = await db
        .select({ action: auditLogs.action, n: sql<number>`count(*)::int` })
        .from(auditLogs)
        .groupBy(auditLogs.action)
        .orderBy(desc(sql`count(*)`))
        .limit(50);
      const entityTypes = await db
        .select({ entityType: auditLogs.entityType, n: sql<number>`count(*)::int` })
        .from(auditLogs)
        .where(sql`${auditLogs.entityType} IS NOT NULL`)
        .groupBy(auditLogs.entityType)
        .orderBy(desc(sql`count(*)`))
        .limit(50);
      const actors = await db
        .select({
          actorId: auditLogs.actorId,
          actorName: auditLogs.actorName,
          n: sql<number>`count(*)::int`,
        })
        .from(auditLogs)
        .where(sql`${auditLogs.actorId} IS NOT NULL`)
        .groupBy(auditLogs.actorId, auditLogs.actorName)
        .orderBy(desc(sql`count(*)`))
        .limit(100);
      return ok({ actions, entityTypes, actors });
    }

    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);
    const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
    const offset = (page - 1) * limit;

    const rowsQ = where
      ? db.select().from(auditLogs).where(where).orderBy(desc(auditLogs.createdAt)).limit(limit).offset(offset)
      : db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit).offset(offset);
    const countQ = where
      ? db.select({ count: sql<number>`count(*)::int` }).from(auditLogs).where(where)
      : db.select({ count: sql<number>`count(*)::int` }).from(auditLogs);
    const [rows, [{ count }]] = await Promise.all([rowsQ, countQ]);
    return paginatedOk(rows, count, page, limit);
  } catch (e) {
    console.error("GET /api/v1/audit-logs error:", e);
    return err("Failed to fetch audit logs");
  }
}

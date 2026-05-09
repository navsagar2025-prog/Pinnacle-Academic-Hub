/**
 * GET /api/v1/admin/ops/security-events
 * Returns paginated security_events rows with optional filters.
 * Admin-only.
 */
import { NextRequest } from "next/server";
import { db } from "@workspace/db";
import { securityEvents } from "@workspace/db/schema";
import { getDbUser } from "@/lib/server/portal-auth";
import { ok, err, paginatedOk } from "@/lib/server/api-response";
import { desc, and, eq, gte, lte, sql } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getDbUser();
  if (!user || user.role !== "admin") return err("Forbidden", 403);

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(sp.get("limit") ?? "50")));
  const outcome = sp.get("outcome") ?? "";
  const eventType = sp.get("eventType") ?? "";
  const ip = sp.get("ip") ?? "";
  const dateFrom = sp.get("dateFrom") ?? "";
  const dateTo = sp.get("dateTo") ?? "";

  const conditions = [];
  if (outcome) conditions.push(eq(securityEvents.outcome, outcome));
  if (eventType) conditions.push(eq(securityEvents.eventType, eventType));
  if (ip) conditions.push(eq(securityEvents.ip, ip));
  if (dateFrom) conditions.push(gte(securityEvents.createdAt, new Date(dateFrom)));
  if (dateTo) conditions.push(lte(securityEvents.createdAt, new Date(dateTo)));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(securityEvents)
      .where(where)
      .orderBy(desc(securityEvents.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(securityEvents)
      .where(where),
  ]);

  return paginatedOk(
    rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
    total,
    page,
    limit,
  );
}

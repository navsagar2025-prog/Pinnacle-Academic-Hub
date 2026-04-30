import { db } from "@workspace/db";
import { auditLogs } from "@workspace/db/schema";
import { sql, desc } from "drizzle-orm";
import { paginatedOk, err } from "@/lib/server/api-response";
import { getDbUser } from "@/lib/server/portal-auth";

export async function GET(request: Request) {
  const actor = await getDbUser();
  if (!actor) return err("Unauthorized", 401);
  if (actor.role !== "admin") return err("Forbidden", 403);

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
  const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
  const offset = (page - 1) * limit;

  try {
    const rows = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(auditLogs);
    return paginatedOk(rows, count, page, limit);
  } catch (e) {
    console.error("GET /api/v1/audit-logs error:", e);
    return err("Failed to fetch audit logs");
  }
}

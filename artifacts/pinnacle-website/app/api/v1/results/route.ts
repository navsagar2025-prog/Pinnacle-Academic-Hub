import { db } from "@workspace/db";
import { results } from "@workspace/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { paginatedOk, err, created } from "@/lib/server/api-response";
import { getDbUser } from "@/lib/server/portal-auth";
import { logAudit } from "@/lib/server/audit";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
  const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
  const offset = (page - 1) * limit;
  const year = searchParams.get("year");

  try {
    const rows = await db
      .select()
      .from(results)
      .where(year ? eq(results.academicYear, year) : undefined)
      .orderBy(desc(results.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(results)
      .where(year ? eq(results.academicYear, year) : undefined);

    return paginatedOk(rows, count, page, limit);
  } catch (e) {
    console.error("GET /api/v1/results error:", e);
    return err("Failed to fetch results");
  }
}

export async function POST(request: Request) {
  const actor = await getDbUser();
  if (!actor) return err("Unauthorized", 401);
  if (actor.role !== "admin") return err("Forbidden", 403);

  try {
    const body = await request.json();
    const { studentName, examName, rank, college, batch, academicYear, quote, initials, isTopper } = body;
    if (!studentName || !examName || !rank || !academicYear || !initials) {
      return err("studentName, examName, rank, academicYear and initials are required", 400);
    }

    const [row] = await db.insert(results).values({
      studentName, examName, rank, college, batch, academicYear, quote,
      initials: initials.toUpperCase().slice(0, 2),
      isTopper: isTopper ?? false,
    }).returning();

    await logAudit(actor.id, actor.name, "result.create", "result", row.id, { studentName, examName });
    return created(row);
  } catch (e) {
    console.error("POST /api/v1/results error:", e);
    return err("Failed to create result");
  }
}

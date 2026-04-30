import { db } from "@workspace/db";
import { courses } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import { paginatedOk, err } from "@/lib/server/api-response";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
  const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
  const offset = (page - 1) * limit;
  const activeOnly = searchParams.get("active") !== "false";

  try {
    const cond = activeOnly ? eq(courses.isActive, true) : undefined;
    const rows = await db.select().from(courses).where(cond).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(courses).where(cond);
    return paginatedOk(rows, count, page, limit);
  } catch (e) {
    console.error("GET /api/v1/courses error:", e);
    return err("Failed to fetch courses");
  }
}

import { NextResponse } from "next/server";
import { db } from "@workspace/db";
import { courses } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
  const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
  const offset = (page - 1) * limit;
  const activeOnly = searchParams.get("active") !== "false";

  try {
    const conditions = activeOnly ? [eq(courses.isActive, true)] : [];

    const rows = await db
      .select()
      .from(courses)
      .where(conditions.length > 0 ? conditions[0] : undefined)
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(courses)
      .where(conditions.length > 0 ? conditions[0] : undefined);

    return NextResponse.json({
      success: true,
      data: rows,
      meta: { total: count, page, limit, pages: Math.ceil(count / limit) },
    });
  } catch (err) {
    console.error("GET /api/v1/courses error:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch courses" }, { status: 500 });
  }
}

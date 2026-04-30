import { auth } from "@clerk/nextjs/server";
import { db } from "@workspace/db";
import { batches, courses } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import { paginatedOk, err } from "@/lib/server/api-response";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return err("Unauthorized", 401);

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
  const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
  const offset = (page - 1) * limit;

  try {
    const rows = await db
      .select({
        id: batches.id,
        name: batches.name,
        timingLabel: batches.timingLabel,
        daysLabel: batches.daysLabel,
        room: batches.room,
        status: batches.status,
        maxStudents: batches.maxStudents,
        courseTitle: courses.title,
        courseSlug: courses.slug,
        startDate: batches.startDate,
        endDate: batches.endDate,
      })
      .from(batches)
      .leftJoin(courses, eq(batches.courseId, courses.id))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(batches);

    return paginatedOk(rows, count, page, limit);
  } catch (e) {
    console.error("GET /api/v1/batches error:", e);
    return err("Failed to fetch batches");
  }
}

import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { students, users, batches, courses } from "@workspace/db/schema";
import { eq, sql, ilike, and } from "drizzle-orm";
import { paginatedOk, err } from "@/lib/server/api-response";

export async function GET(request: Request) {
  const dbUser = await getDbUser();
  if (!dbUser) return err("Unauthorized", 401);
  if (dbUser.role !== "admin") return err("Forbidden", 403);

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
  const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
  const offset = (page - 1) * limit;
  const search = searchParams.get("search");
  const batchId = searchParams.get("batchId");

  try {
    const conditions = [];
    if (batchId) conditions.push(eq(students.batchId, batchId));

    const rows = await db
      .select({
        id: students.id,
        rollNumber: students.rollNumber,
        name: users.name,
        email: users.email,
        phone: users.phone,
        guardianName: students.guardianName,
        guardianPhone: students.guardianPhone,
        batchName: batches.name,
        batchTiming: batches.timingLabel,
        courseName: courses.title,
        isActive: students.isActive,
        enrolledAt: students.enrolledAt,
      })
      .from(students)
      .leftJoin(users, eq(students.userId, users.id))
      .leftJoin(batches, eq(students.batchId, batches.id))
      .leftJoin(courses, eq(batches.courseId, courses.id))
      .where(
        conditions.length > 0
          ? (search ? and(...conditions, ilike(users.name, `%${search}%`)) : and(...conditions))
          : (search ? ilike(users.name, `%${search}%`) : undefined)
      )
      .limit(limit)
      .offset(offset)
      .orderBy(students.enrolledAt);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(students);

    return paginatedOk(rows, count, page, limit);
  } catch (e) {
    console.error("GET /api/v1/students error:", e);
    return err("Failed to fetch students");
  }
}

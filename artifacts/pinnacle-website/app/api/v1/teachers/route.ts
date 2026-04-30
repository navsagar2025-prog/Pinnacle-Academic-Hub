import { db } from "@workspace/db";
import { teachers, users } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import { paginatedOk, err } from "@/lib/server/api-response";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
  const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
  const offset = (page - 1) * limit;

  try {
    const rows = await db
      .select({
        id: teachers.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        designation: teachers.designation,
        qualification: teachers.qualification,
        subjects: teachers.subjects,
        experienceYears: teachers.experienceYears,
        initials: teachers.initials,
        bio: teachers.bio,
        isActive: teachers.isActive,
        joinedAt: teachers.joinedAt,
      })
      .from(teachers)
      .leftJoin(users, eq(teachers.userId, users.id))
      .where(eq(teachers.isActive, true))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(teachers)
      .where(eq(teachers.isActive, true));

    return paginatedOk(rows, count, page, limit);
  } catch (e) {
    console.error("GET /api/v1/teachers error:", e);
    return err("Failed to fetch teachers");
  }
}

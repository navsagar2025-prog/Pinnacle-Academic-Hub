import { db } from "@workspace/db";
import { courses } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import { paginatedOk, err, created } from "@/lib/server/api-response";
import { getDbUser } from "@/lib/server/portal-auth";
import { logAudit } from "@/lib/server/audit";

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

export async function POST(request: Request) {
  const actor = await getDbUser();
  if (!actor) return err("Unauthorized", 401);
  if (actor.role !== "admin") return err("Forbidden", 403);

  try {
    const body = await request.json();
    const { slug, title, description, category, startDate, durationLabel, annualFee, admissionFee, maxBatchSize, eligibility, highlights, featuredImageUrl } = body;
    if (!slug || !title || !annualFee) return err("slug, title and annualFee are required", 400);

    const [row] = await db.insert(courses).values({
      slug,
      title,
      description,
      category: category ?? "General",
      startDate: startDate ? new Date(startDate) : undefined,
      durationLabel,
      annualFee: Number(annualFee),
      admissionFee: admissionFee ? Number(admissionFee) : 2000,
      maxBatchSize: maxBatchSize ? Number(maxBatchSize) : 35,
      eligibility,
      highlights: highlights ?? [],
      featuredImageUrl: featuredImageUrl ?? null,
    }).returning();

    await logAudit(actor.id, actor.name, "course.create", "course", row.id, { title });
    return created(row);
  } catch (e) {
    console.error("POST /api/v1/courses error:", e);
    return err("Failed to create course");
  }
}

import { db } from "@workspace/db";
import { courses } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { ok, err } from "@/lib/server/api-response";
import { getDbUser } from "@/lib/server/portal-auth";
import { logAudit } from "@/lib/server/audit";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getDbUser();
  if (!actor) return err("Unauthorized", 401);
  if (actor.role !== "admin") return err("Forbidden", 403);

  const { id } = await params;
  try {
    const body = await request.json();
    const { title, description, category, startDate, durationLabel, annualFee, admissionFee, maxBatchSize, eligibility, highlights, isActive, featuredImageUrl } = body;

    const [row] = await db.update(courses).set({
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(category !== undefined && { category }),
      ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
      ...(durationLabel !== undefined && { durationLabel }),
      ...(annualFee !== undefined && { annualFee: Number(annualFee) }),
      ...(admissionFee !== undefined && { admissionFee: Number(admissionFee) }),
      ...(maxBatchSize !== undefined && { maxBatchSize: Number(maxBatchSize) }),
      ...(eligibility !== undefined && { eligibility }),
      ...(highlights !== undefined && { highlights }),
      ...(isActive !== undefined && { isActive }),
      ...(featuredImageUrl !== undefined && { featuredImageUrl }),
      updatedAt: new Date(),
    }).where(eq(courses.id, id)).returning();

    if (!row) return err("Course not found", 404);
    await logAudit(actor.id, actor.name, "course.update", "course", id, { title });
    return ok(row);
  } catch (e) {
    console.error("PUT /api/v1/courses/[id] error:", e);
    return err("Failed to update course");
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getDbUser();
  if (!actor) return err("Unauthorized", 401);
  if (actor.role !== "admin") return err("Forbidden", 403);

  const { id } = await params;
  try {
    const [row] = await db.update(courses).set({ isActive: false, updatedAt: new Date() }).where(eq(courses.id, id)).returning();
    if (!row) return err("Course not found", 404);
    await logAudit(actor.id, actor.name, "course.archive", "course", id, { title: row.title });
    return ok({ archived: true });
  } catch (e) {
    console.error("DELETE /api/v1/courses/[id] error:", e);
    return err("Failed to archive course");
  }
}

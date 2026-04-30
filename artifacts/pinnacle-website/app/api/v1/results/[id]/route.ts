import { db } from "@workspace/db";
import { results } from "@workspace/db/schema";
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
    const { studentName, examName, rank, college, batch, academicYear, quote, initials, isTopper } = body;

    const [row] = await db.update(results).set({
      ...(studentName !== undefined && { studentName }),
      ...(examName !== undefined && { examName }),
      ...(rank !== undefined && { rank }),
      ...(college !== undefined && { college }),
      ...(batch !== undefined && { batch }),
      ...(academicYear !== undefined && { academicYear }),
      ...(quote !== undefined && { quote }),
      ...(initials !== undefined && { initials: initials.toUpperCase().slice(0, 2) }),
      ...(isTopper !== undefined && { isTopper }),
      updatedAt: new Date(),
    }).where(eq(results.id, id)).returning();

    if (!row) return err("Result not found", 404);
    await logAudit(actor.id, actor.name, "result.update", "result", id, { studentName });
    return ok(row);
  } catch (e) {
    console.error("PUT /api/v1/results/[id] error:", e);
    return err("Failed to update result");
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getDbUser();
  if (!actor) return err("Unauthorized", 401);
  if (actor.role !== "admin") return err("Forbidden", 403);

  const { id } = await params;
  try {
    await db.delete(results).where(eq(results.id, id));
    await logAudit(actor.id, actor.name, "result.delete", "result", id);
    return ok({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/v1/results/[id] error:", e);
    return err("Failed to delete result");
  }
}

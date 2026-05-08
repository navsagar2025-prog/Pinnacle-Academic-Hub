/**
 * PATCH  /api/v1/promotions/[id]  — Admin. Update a promotion.
 * DELETE /api/v1/promotions/[id]  — Admin. Archive (soft-delete) a promotion.
 */
import { db } from "@workspace/db";
import { promotions } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { ok, err } from "@/lib/server/api-response";
import { getDbUser } from "@/lib/server/portal-auth";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getDbUser();
  if (!actor) return err("Unauthorized", 401);
  if (actor.role !== "admin") return err("Forbidden — admin only", 403);

  const { id } = await params;

  try {
    const body = await request.json();
    const { title, body: bodyText, displayType, audience, startsAt, endsAt, ctaLabel, ctaUrl, bgColour, ctaColour } = body;

    const [existing] = await db.select().from(promotions).where(eq(promotions.id, id));
    if (!existing) return err("Promotion not found", 404);

    const [row] = await db
      .update(promotions)
      .set({
        ...(title !== undefined && { title }),
        ...(bodyText !== undefined && { body: bodyText }),
        ...(displayType !== undefined && { displayType }),
        ...(audience !== undefined && { audience }),
        ...(startsAt !== undefined && { startsAt: new Date(startsAt) }),
        ...(endsAt !== undefined && { endsAt: new Date(endsAt) }),
        ...(ctaLabel !== undefined && { ctaLabel: ctaLabel || null }),
        ...(ctaUrl !== undefined && { ctaUrl: ctaUrl || null }),
        ...(bgColour !== undefined && { bgColour }),
        ...(ctaColour !== undefined && { ctaColour }),
        updatedAt: new Date(),
      })
      .where(eq(promotions.id, id))
      .returning();

    return ok(row);
  } catch (e) {
    console.error("PATCH /api/v1/promotions/:id error:", e);
    return err("Failed to update promotion");
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getDbUser();
  if (!actor) return err("Unauthorized", 401);
  if (actor.role !== "admin") return err("Forbidden — admin only", 403);

  const { id } = await params;

  try {
    const [row] = await db
      .update(promotions)
      .set({ archivedAt: new Date(), updatedAt: new Date() })
      .where(eq(promotions.id, id))
      .returning();

    if (!row) return err("Promotion not found", 404);
    return ok({ archived: true });
  } catch (e) {
    console.error("DELETE /api/v1/promotions/:id error:", e);
    return err("Failed to archive promotion");
  }
}

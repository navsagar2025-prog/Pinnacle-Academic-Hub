import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { galleryItems } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { ok, err } from "@/lib/server/api-response";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const dbUser = await getDbUser();
  if (!dbUser) return err("Unauthorized", 401);
  if (dbUser.role !== "admin") return err("Forbidden", 403);

  const { id } = await params;
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return err("Invalid JSON", 400); }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body.title === "string" && body.title.trim()) updates.title = body.title.trim();
  if (typeof body.caption === "string") updates.caption = body.caption.trim() || null;
  if (typeof body.category === "string" && body.category.trim()) updates.category = body.category.trim();
  if (typeof body.imageUrl === "string" && body.imageUrl.trim()) updates.imageUrl = body.imageUrl.trim();
  if (typeof body.sortOrder === "number") updates.sortOrder = body.sortOrder;
  if (typeof body.isVisible === "boolean") updates.isVisible = body.isVisible;

  try {
    const [item] = await db.update(galleryItems).set(updates).where(eq(galleryItems.id, id)).returning();
    if (!item) return err("Gallery item not found", 404);
    return ok(item);
  } catch (e) {
    console.error("PUT /api/v1/gallery/[id] error:", e);
    return err("Failed to update gallery item");
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const dbUser = await getDbUser();
  if (!dbUser) return err("Unauthorized", 401);
  if (dbUser.role !== "admin") return err("Forbidden", 403);

  const { id } = await params;
  try {
    await db.delete(galleryItems).where(eq(galleryItems.id, id));
    return ok({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/v1/gallery/[id] error:", e);
    return err("Failed to delete gallery item");
  }
}

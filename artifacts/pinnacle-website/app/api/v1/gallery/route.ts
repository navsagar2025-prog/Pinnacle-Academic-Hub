import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { galleryItems } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";
import { ok, created, err } from "@/lib/server/api-response";

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(galleryItems)
      .where(eq(galleryItems.isVisible, true))
      .orderBy(asc(galleryItems.sortOrder), asc(galleryItems.createdAt));
    return ok(rows);
  } catch (e) {
    console.error("GET /api/v1/gallery error:", e);
    return err("Failed to fetch gallery items");
  }
}

export async function POST(request: Request) {
  const dbUser = await getDbUser();
  if (!dbUser) return err("Unauthorized", 401);
  if (dbUser.role !== "admin") return err("Forbidden", 403);

  let body: { title?: string; caption?: string; category?: string; imageUrl?: string; sortOrder?: number };
  try { body = await request.json(); } catch { return err("Invalid JSON", 400); }

  const { title, caption, category, imageUrl, sortOrder } = body;
  if (!title?.trim()) return err("title is required", 400);
  if (!imageUrl?.trim()) return err("imageUrl is required", 400);

  try {
    const [item] = await db
      .insert(galleryItems)
      .values({
        title: title.trim(),
        caption: caption?.trim() || null,
        category: category?.trim() || "General",
        imageUrl: imageUrl.trim(),
        sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
      })
      .returning();
    return created(item);
  } catch (e) {
    console.error("POST /api/v1/gallery error:", e);
    return err("Failed to create gallery item");
  }
}

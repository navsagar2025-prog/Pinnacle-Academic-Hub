import { db } from "@workspace/db";
import { blogPosts } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { ok, err } from "@/lib/server/api-response";
import { getDbUser } from "@/lib/server/portal-auth";
import { logAudit } from "@/lib/server/audit";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getDbUser();
  if (!actor) return err("Unauthorized", 401);
  if (actor.role !== "admin" && actor.role !== "teacher") return err("Forbidden", 403);

  const { id } = await params;
  try {
    const body = await request.json();
    const { title, excerpt, content, category, tags, authorName, featuredImageUrl, readMinutes, status } = body;

    const wasPublished = status === "published";
    const [existing] = await db.select({ status: blogPosts.status, publishedAt: blogPosts.publishedAt }).from(blogPosts).where(eq(blogPosts.id, id));

    const [row] = await db.update(blogPosts).set({
      ...(title !== undefined && { title }),
      ...(excerpt !== undefined && { excerpt }),
      ...(content !== undefined && { content }),
      ...(category !== undefined && { category }),
      ...(tags !== undefined && { tags: Array.isArray(tags) ? tags : [] }),
      ...(authorName !== undefined && { authorName }),
      ...(featuredImageUrl !== undefined && { featuredImageUrl }),
      ...(readMinutes !== undefined && { readMinutes: Number(readMinutes) }),
      ...(status !== undefined && { status }),
      ...(wasPublished && !existing?.publishedAt && { publishedAt: new Date() }),
      updatedAt: new Date(),
    }).where(eq(blogPosts.id, id)).returning();

    if (!row) return err("Blog post not found", 404);
    await logAudit(actor.id, actor.name, "blog.update", "blogPost", id, { title, status });
    return ok(row);
  } catch (e) {
    console.error("PUT /api/v1/blog/[id] error:", e);
    return err("Failed to update blog post");
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getDbUser();
  if (!actor) return err("Unauthorized", 401);
  if (actor.role !== "admin") return err("Forbidden", 403);

  const { id } = await params;
  try {
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
    await logAudit(actor.id, actor.name, "blog.delete", "blogPost", id);
    return ok({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/v1/blog/[id] error:", e);
    return err("Failed to delete blog post");
  }
}

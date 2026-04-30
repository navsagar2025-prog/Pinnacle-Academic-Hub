import { db } from "@workspace/db";
import { blogPosts } from "@workspace/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { paginatedOk, err, created } from "@/lib/server/api-response";
import { getDbUser } from "@/lib/server/portal-auth";
import { logAudit } from "@/lib/server/audit";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
  const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
  const offset = (page - 1) * limit;
  const wantAll = searchParams.get("published") === "false";

  let showAll = false;
  if (wantAll) {
    const actor = await getDbUser();
    if (!actor || (actor.role !== "admin" && actor.role !== "teacher")) {
      return err("Forbidden — only admin/teacher can view unpublished posts", 403);
    }
    showAll = true;
  }

  try {
    const rows = await db
      .select()
      .from(blogPosts)
      .where(showAll ? undefined : eq(blogPosts.status, "published"))
      .orderBy(desc(blogPosts.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(blogPosts)
      .where(showAll ? undefined : eq(blogPosts.status, "published"));

    return paginatedOk(rows, count, page, limit);
  } catch (e) {
    console.error("GET /api/v1/blog error:", e);
    return err("Failed to fetch blog posts");
  }
}

export async function POST(request: Request) {
  const actor = await getDbUser();
  if (!actor) return err("Unauthorized", 401);
  if (actor.role !== "admin" && actor.role !== "teacher") return err("Forbidden", 403);

  try {
    const body = await request.json();
    const { slug, title, excerpt, content, category, tags, authorName, featuredImageUrl, readMinutes, status } = body;
    if (!slug || !title || !authorName) return err("slug, title and authorName are required", 400);

    const [row] = await db.insert(blogPosts).values({
      slug,
      title,
      excerpt,
      content,
      category: category ?? "General",
      tags: Array.isArray(tags) ? tags : [],
      authorName,
      featuredImageUrl,
      readMinutes: readMinutes ? Number(readMinutes) : 5,
      status: status ?? "draft",
      publishedAt: status === "published" ? new Date() : undefined,
    }).returning();

    await logAudit(actor.id, actor.name, "blog.create", "blogPost", row.id, { title, status });
    return created(row);
  } catch (e) {
    console.error("POST /api/v1/blog error:", e);
    return err("Failed to create blog post");
  }
}

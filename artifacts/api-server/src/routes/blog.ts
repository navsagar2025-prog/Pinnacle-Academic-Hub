import { Router } from "express";
import { db } from "@workspace/db";
import { blogPosts } from "@workspace/db/schema";
import { eq, desc, sql } from "drizzle-orm";

const router = Router();

router.get("/blog", async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? "20")), 100);
    const page = Math.max(parseInt(String(req.query.page ?? "1")), 1);
    const offset = (page - 1) * limit;

    const rows = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.status, "published"))
      .orderBy(desc(blogPosts.publishedAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(blogPosts)
      .where(eq(blogPosts.status, "published"));

    res.json({ ok: true, data: rows, total: count, page, limit });
  } catch (e) {
    console.error("GET /blog error:", e);
    res.status(500).json({ error: "Failed to fetch blog posts" });
  }
});

router.get("/blog/:slug", async (req, res) => {
  try {
    const [row] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.slug, req.params.slug))
      .limit(1);
    if (!row) {
      res.status(404).json({ error: "Post not found" });
      return;
    }
    res.json({ ok: true, data: row });
  } catch (e) {
    console.error("GET /blog/:slug error:", e);
    res.status(500).json({ error: "Failed to fetch blog post" });
  }
});

export default router;

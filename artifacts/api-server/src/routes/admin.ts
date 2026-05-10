import { Router } from "express";
import { requireAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { notices, enquiries, blogPosts, galleryItems } from "@workspace/db/schema";
import { desc, eq, sql } from "drizzle-orm";

const router = Router();
router.use(requireAuth());

// ── Stats ──────────────────────────────────────────────────────────────────

router.get("/admin/stats", async (_req, res) => {
  try {
    const [
      [{ noticeCount }],
      [{ enquiryCount }],
      [{ blogCount }],
      [{ galleryCount }],
      [{ newEnquiryCount }],
    ] = await Promise.all([
      db.select({ noticeCount: sql<number>`count(*)::int` }).from(notices),
      db.select({ enquiryCount: sql<number>`count(*)::int` }).from(enquiries),
      db.select({ blogCount: sql<number>`count(*)::int` }).from(blogPosts),
      db.select({ galleryCount: sql<number>`count(*)::int` }).from(galleryItems),
      db
        .select({ newEnquiryCount: sql<number>`count(*)::int` })
        .from(enquiries)
        .where(eq(enquiries.admissionStatus, "new")),
    ]);
    res.json({ ok: true, data: { noticeCount, enquiryCount, blogCount, galleryCount, newEnquiryCount } });
  } catch (e) {
    console.error("GET /admin/stats error:", e);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// ── Notices ────────────────────────────────────────────────────────────────

router.get("/admin/notices", async (_req, res) => {
  try {
    const rows = await db.select().from(notices).orderBy(desc(notices.createdAt)).limit(200);
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch notices" });
  }
});

router.post("/admin/notices", async (req, res) => {
  try {
    const { title, body, category, isPublic, expiresAt } = req.body;
    if (!title || !body) {
      res.status(400).json({ error: "title and body are required" });
      return;
    }
    const [row] = await db
      .insert(notices)
      .values({
        title,
        body,
        category: category ?? "General",
        isPublic: isPublic ?? true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        publishedAt: new Date(),
      })
      .returning();
    res.status(201).json({ ok: true, data: row });
  } catch (e) {
    console.error("POST /admin/notices error:", e);
    res.status(500).json({ error: "Failed to create notice" });
  }
});

router.patch("/admin/notices/:id", async (req, res) => {
  try {
    const { title, body, category, isPublic, expiresAt } = req.body;
    const [row] = await db
      .update(notices)
      .set({
        ...(title !== undefined && { title }),
        ...(body !== undefined && { body }),
        ...(category !== undefined && { category }),
        ...(isPublic !== undefined && { isPublic }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
        updatedAt: new Date(),
      })
      .where(eq(notices.id, req.params.id))
      .returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ok: true, data: row });
  } catch (e) {
    res.status(500).json({ error: "Failed to update notice" });
  }
});

router.delete("/admin/notices/:id", async (req, res) => {
  try {
    await db.delete(notices).where(eq(notices.id, req.params.id));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete notice" });
  }
});

// ── Enquiries ──────────────────────────────────────────────────────────────

router.get("/admin/enquiries", async (_req, res) => {
  try {
    const rows = await db.select().from(enquiries).orderBy(desc(enquiries.createdAt)).limit(500);
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch enquiries" });
  }
});

router.patch("/admin/enquiries/:id", async (req, res) => {
  try {
    const { admissionStatus, isFollowedUp, notes } = req.body;
    const [row] = await db
      .update(enquiries)
      .set({
        ...(admissionStatus !== undefined && { admissionStatus }),
        ...(isFollowedUp !== undefined && { isFollowedUp }),
        ...(notes !== undefined && { notes }),
        updatedAt: new Date(),
      })
      .where(eq(enquiries.id, req.params.id))
      .returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ok: true, data: row });
  } catch (e) {
    res.status(500).json({ error: "Failed to update enquiry" });
  }
});

// ── Blog ───────────────────────────────────────────────────────────────────

router.get("/admin/blog", async (_req, res) => {
  try {
    const rows = await db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt)).limit(200);
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch blog posts" });
  }
});

router.post("/admin/blog", async (req, res) => {
  try {
    const { slug, title, excerpt, content, category, authorName, status, readMinutes, tags } = req.body;
    if (!slug || !title || !authorName) {
      res.status(400).json({ error: "slug, title, and authorName are required" });
      return;
    }
    const [row] = await db
      .insert(blogPosts)
      .values({
        slug,
        title,
        excerpt: excerpt ?? null,
        content: content ?? null,
        category: category ?? "General",
        authorName,
        status: status ?? "draft",
        readMinutes: readMinutes ?? 5,
        tags: tags ?? [],
        publishedAt: status === "published" ? new Date() : null,
      })
      .returning();
    res.status(201).json({ ok: true, data: row });
  } catch (e) {
    console.error("POST /admin/blog error:", e);
    res.status(500).json({ error: "Failed to create blog post" });
  }
});

router.patch("/admin/blog/:id", async (req, res) => {
  try {
    const { title, excerpt, content, category, authorName, status, readMinutes, tags } = req.body;
    const existing = await db.select().from(blogPosts).where(eq(blogPosts.id, req.params.id)).limit(1);
    if (!existing[0]) { res.status(404).json({ error: "Not found" }); return; }

    const [row] = await db
      .update(blogPosts)
      .set({
        ...(title !== undefined && { title }),
        ...(excerpt !== undefined && { excerpt }),
        ...(content !== undefined && { content }),
        ...(category !== undefined && { category }),
        ...(authorName !== undefined && { authorName }),
        ...(readMinutes !== undefined && { readMinutes }),
        ...(tags !== undefined && { tags }),
        ...(status !== undefined && {
          status,
          publishedAt:
            status === "published" && !existing[0].publishedAt ? new Date() : existing[0].publishedAt,
        }),
        updatedAt: new Date(),
      })
      .where(eq(blogPosts.id, req.params.id))
      .returning();
    res.json({ ok: true, data: row });
  } catch (e) {
    res.status(500).json({ error: "Failed to update blog post" });
  }
});

router.delete("/admin/blog/:id", async (req, res) => {
  try {
    await db.delete(blogPosts).where(eq(blogPosts.id, req.params.id));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete blog post" });
  }
});

// ── Gallery ────────────────────────────────────────────────────────────────

router.get("/admin/gallery", async (_req, res) => {
  try {
    const rows = await db.select().from(galleryItems).orderBy(desc(galleryItems.createdAt)).limit(200);
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch gallery items" });
  }
});

router.post("/admin/gallery", async (req, res) => {
  try {
    const { title, imageUrl, caption, sortOrder, isVisible } = req.body;
    if (!title || !imageUrl) {
      res.status(400).json({ error: "title and imageUrl are required" });
      return;
    }
    const { category } = req.body;
    const [row] = await db
      .insert(galleryItems)
      .values({ title, imageUrl, caption: caption ?? null, category: category ?? "General", sortOrder: sortOrder ?? 0, isVisible: isVisible ?? true })
      .returning();
    res.status(201).json({ ok: true, data: row });
  } catch (e) {
    console.error("POST /admin/gallery error:", e);
    res.status(500).json({ error: "Failed to create gallery item" });
  }
});

router.patch("/admin/gallery/:id", async (req, res) => {
  try {
    const { title, imageUrl, caption, sortOrder, isVisible } = req.body;
    const [row] = await db
      .update(galleryItems)
      .set({
        ...(title !== undefined && { title }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(caption !== undefined && { caption }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isVisible !== undefined && { isVisible }),
        updatedAt: new Date(),
      })
      .where(eq(galleryItems.id, req.params.id))
      .returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ok: true, data: row });
  } catch (e) {
    res.status(500).json({ error: "Failed to update gallery item" });
  }
});

router.delete("/admin/gallery/:id", async (req, res) => {
  try {
    await db.delete(galleryItems).where(eq(galleryItems.id, req.params.id));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete gallery item" });
  }
});

export default router;

import { Router } from "express";
import { db } from "@workspace/db";
import { galleryItems } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";

const router = Router();

router.get("/gallery", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(galleryItems)
      .where(eq(galleryItems.isVisible, true))
      .orderBy(asc(galleryItems.sortOrder), asc(galleryItems.createdAt));
    res.json({ ok: true, data: rows });
  } catch (e) {
    console.error("GET /gallery error:", e);
    res.status(500).json({ error: "Failed to fetch gallery items" });
  }
});

export default router;

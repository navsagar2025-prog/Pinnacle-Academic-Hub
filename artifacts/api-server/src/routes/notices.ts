import { Router } from "express";
import { db } from "@workspace/db";
import { notices } from "@workspace/db/schema";
import { eq, desc, and, or, isNull, gte } from "drizzle-orm";

const router = Router();

router.get("/notices", async (_req, res) => {
  try {
    const now = new Date();
    const rows = await db
      .select()
      .from(notices)
      .where(
        and(
          eq(notices.isPublic, true),
          or(isNull(notices.expiresAt), gte(notices.expiresAt, now))
        )
      )
      .orderBy(desc(notices.publishedAt))
      .limit(50);
    res.json({ ok: true, data: rows });
  } catch (e) {
    console.error("GET /notices error:", e);
    res.status(500).json({ error: "Failed to fetch notices" });
  }
});

export default router;

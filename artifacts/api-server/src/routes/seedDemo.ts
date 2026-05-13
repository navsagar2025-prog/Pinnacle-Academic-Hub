import { Router } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { users } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { seedDemo } from "../seed-demo.js";
import { logger } from "../lib/logger.js";

const router = Router();

router.post("/admin/seed-demo", requireAuth(), async (req, res) => {
  if (process.env["NODE_ENV"] === "production") {
    res.status(403).json({ error: "This endpoint is disabled in production." });
    return;
  }

  const { userId: clerkUserId } = getAuth(req);
  if (!clerkUserId) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const [user] = await db.select({ role: users.role, approvalStatus: users.approvalStatus })
      .from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
    if (!user || user.role !== "admin" || user.approvalStatus !== "approved") {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
  } catch {
    res.status(500).json({ error: "Failed to verify role" });
    return;
  }

  try {
    logger.info("Starting demo data seed...");
    const result = await seedDemo();
    if (result.skipped) {
      res.json({ ok: true, skipped: true, message: "Demo data already exists (demo.student@pinnacle.test found). No changes made.", created: [] });
      return;
    }
    logger.info({ count: result.created.length }, "Demo data seed complete");
    res.json({ ok: true, skipped: false, message: `Demo data seeded successfully — ${result.created.length} items created.`, created: result.created });
  } catch (e) {
    logger.error({ e }, "Demo seed failed");
    res.status(500).json({ error: "Seed failed: " + (e instanceof Error ? e.message : String(e)) });
  }
});

export default router;

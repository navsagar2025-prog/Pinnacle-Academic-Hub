import { Router } from "express";
import { db } from "@workspace/db";
import { enquiries } from "@workspace/db/schema";

const router = Router();

router.post("/enquiries", async (req, res) => {
  try {
    const { name, phone, email, courseInterest, message, source } = req.body;
    if (!name || !phone) {
      res.status(400).json({ error: "name and phone are required" });
      return;
    }
    const [row] = await db
      .insert(enquiries)
      .values({ name, phone, email, courseInterest, message, source: source ?? "website" })
      .returning();
    res.status(201).json({ ok: true, data: row });
  } catch (e) {
    console.error("POST /enquiries error:", e);
    res.status(500).json({ error: "Failed to submit enquiry" });
  }
});

router.get("/enquiries", async (_req, res) => {
  try {
    const rows = await db.select().from(enquiries).orderBy(enquiries.createdAt);
    res.json({ ok: true, data: rows });
  } catch (e) {
    console.error("GET /enquiries error:", e);
    res.status(500).json({ error: "Failed to fetch enquiries" });
  }
});

export default router;

import { Router } from "express";
import { db } from "@workspace/db";
import { enquiries } from "@workspace/db/schema";

const router = Router();

router.post("/contact", async (req, res) => {
  try {
    const { name, phone, email, subject, message } = req.body;
    if (!name || !phone) {
      res.status(400).json({ error: "name and phone are required" });
      return;
    }
    const [row] = await db
      .insert(enquiries)
      .values({
        name,
        phone,
        email,
        message: subject ? `[${subject}] ${message}` : message,
        source: "contact-form",
      })
      .returning();
    res.status(201).json({ ok: true, data: row });
  } catch (e) {
    console.error("POST /contact error:", e);
    res.status(500).json({ error: "Failed to submit contact form" });
  }
});

export default router;

import { Router, type IRouter, type Request, type Response } from "express";
import { createReadStream, existsSync } from "fs";
import { join as pathJoin, extname } from "path";
import healthRouter from "./health";
import enquiriesRouter from "./enquiries";
import contactRouter from "./contact";
import blogRouter from "./blog";
import galleryRouter from "./gallery";
import noticesRouter from "./notices";
import leaderboardRouter from "./leaderboard";
import adminRouter from "./admin";
import admin2Router from "./admin2";
import ga4oauthRouter from "./ga4oauth";
import portalRouter from "./portal";
import questionBankRouter from "./questionBank";
import sscPublicRouter from "./ssc";
import seedDemoRouter from "./seedDemo";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/v1", enquiriesRouter);
router.use("/v1", contactRouter);
router.use("/v1", blogRouter);
router.use("/v1", galleryRouter);
router.use("/v1", noticesRouter);
router.use("/v1", leaderboardRouter);
router.use("/v1", ga4oauthRouter);
// ── Public social media file serve (unauthenticated — platforms fetch directly) ─
// Must be registered BEFORE portalRouter, which applies requireAuth() middleware.
router.get("/v1/social/media/:filename", (req: Request, res: Response) => {
  const filename = String(req.params["filename"]);
  if (!/^[\w-]+\.\w+$/.test(filename)) { res.status(400).json({ error: "Invalid filename" }); return; }
  const filePath = pathJoin(process.cwd(), "uploads", "social", filename);
  if (!existsSync(filePath)) { res.status(404).json({ error: "Not found" }); return; }
  const ext = extname(filename).slice(1).toLowerCase();
  const mime: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp", mp4: "video/mp4", mov: "video/quicktime" };
  res.setHeader("Content-Type", mime[ext] ?? "application/octet-stream");
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  createReadStream(filePath).pipe(res);
});

// Public SSC endpoints — must be registered BEFORE portalRouter (which applies
// requireAuth()) so anonymous visitors can browse the SSC question bank.
router.use("/v1", sscPublicRouter);

router.use("/v1", adminRouter);
router.use("/v1", admin2Router);
router.use("/v1", portalRouter);
router.use("/v1", questionBankRouter);
router.use("/v1", seedDemoRouter);

export default router;

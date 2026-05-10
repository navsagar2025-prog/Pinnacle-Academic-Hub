import { Router, type IRouter } from "express";
import healthRouter from "./health";
import enquiriesRouter from "./enquiries";
import contactRouter from "./contact";
import blogRouter from "./blog";
import galleryRouter from "./gallery";
import noticesRouter from "./notices";
import leaderboardRouter from "./leaderboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/v1", enquiriesRouter);
router.use("/v1", contactRouter);
router.use("/v1", blogRouter);
router.use("/v1", galleryRouter);
router.use("/v1", noticesRouter);
router.use("/v1", leaderboardRouter);

export default router;

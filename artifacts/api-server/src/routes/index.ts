import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import scanRouter from "./scan.js";
import settingsRouter from "./settings.js";
import exportRouter from "./export.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(scanRouter);
router.use(settingsRouter);
router.use(exportRouter);

export default router;

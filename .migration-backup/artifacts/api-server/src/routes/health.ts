import { Router, type IRouter } from "express";
import { loadConfig } from "../lib/config-store.js";

const router: IRouter = Router();

router.get("/health", (_req, res) => {
  const config = loadConfig();
  res.json({
    status: "ok",
    activeProvider: config.activeProvider,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

router.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

export default router;

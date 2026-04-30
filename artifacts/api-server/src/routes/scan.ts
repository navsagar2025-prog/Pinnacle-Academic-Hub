import { Router, type IRouter } from "express";
import multer from "multer";
import { createOcrAdapter } from "../ocr/factory.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed (PNG, JPEG, WEBP)"));
    }
  },
});

router.post("/scan", upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No image file provided. Send as multipart/form-data with key 'file'." });
    return;
  }

  try {
    const adapter = createOcrAdapter();
    logger.info({ provider: adapter.name }, "Starting OCR scan");

    const result = await adapter.scan(req.file.buffer, req.file.mimetype);

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown OCR error";
    logger.error({ err }, "OCR scan failed");
    res.status(502).json({
      success: false,
      error: message,
      hint: "Check that the OCR provider endpoint is reachable and credentials are correct in Admin Settings.",
    });
  }
});

export default router;

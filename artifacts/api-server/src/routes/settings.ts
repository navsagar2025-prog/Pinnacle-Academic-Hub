import { Router, type IRouter } from "express";
import { z } from "zod";
import { loadConfig, saveConfig, type OcrProvider } from "../lib/config-store.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

const OcrProviderSchema = z.enum([
  "pix2text",
  "simpletex",
  "latexocr",
  "mathpix",
  "google-vision",
]);

const UpdateOcrSettingsSchema = z.object({
  activeProvider: OcrProviderSchema,
  providers: z
    .object({
      pix2text: z
        .object({ endpointUrl: z.string().url(), apiKey: z.string() })
        .optional(),
      simpletex: z
        .object({ endpointUrl: z.string().url(), apiKey: z.string() })
        .optional(),
      latexocr: z
        .object({ endpointUrl: z.string().url(), apiKey: z.string() })
        .optional(),
      mathpix: z
        .object({
          endpointUrl: z.string().url(),
          appId: z.string(),
          appKey: z.string(),
        })
        .optional(),
      "google-vision": z
        .object({ endpointUrl: z.string().url(), apiKey: z.string() })
        .optional(),
    })
    .optional(),
});

router.get("/settings/ocr", (_req, res) => {
  const config = loadConfig();

  const sanitized = {
    activeProvider: config.activeProvider,
    providers: {
      pix2text: {
        endpointUrl: config.providers.pix2text.endpointUrl,
        hasApiKey: !!config.providers.pix2text.apiKey,
      },
      simpletex: {
        endpointUrl: config.providers.simpletex.endpointUrl,
        hasApiKey: !!config.providers.simpletex.apiKey,
      },
      latexocr: {
        endpointUrl: config.providers.latexocr.endpointUrl,
        hasApiKey: !!config.providers.latexocr.apiKey,
      },
      mathpix: {
        endpointUrl: config.providers.mathpix.endpointUrl,
        hasAppId: !!config.providers.mathpix.appId,
        hasAppKey: !!config.providers.mathpix.appKey,
      },
      "google-vision": {
        endpointUrl: config.providers["google-vision"].endpointUrl,
        hasApiKey: !!config.providers["google-vision"].apiKey,
      },
    },
  };

  res.json({ success: true, config: sanitized });
});

router.put("/settings/ocr", (req, res) => {
  const parsed = UpdateOcrSettingsSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: "Invalid settings payload",
      details: parsed.error.flatten(),
    });
    return;
  }

  const current = loadConfig();
  const update = parsed.data;

  current.activeProvider = update.activeProvider as OcrProvider;

  if (update.providers) {
    for (const [key, val] of Object.entries(update.providers)) {
      if (val && key in current.providers) {
        Object.assign(
          current.providers[key as keyof typeof current.providers],
          val,
        );
      }
    }
  }

  saveConfig(current);
  logger.info({ activeProvider: current.activeProvider }, "OCR settings updated");

  res.json({ success: true, activeProvider: current.activeProvider });
});

export default router;

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../../data");
const CONFIG_FILE = join(DATA_DIR, "ocr-config.json");

export type OcrProvider =
  | "pix2text"
  | "simpletex"
  | "latexocr"
  | "mathpix"
  | "google-vision";

export interface OcrConfig {
  activeProvider: OcrProvider;
  providers: {
    pix2text: { endpointUrl: string; apiKey: string };
    simpletex: { endpointUrl: string; apiKey: string };
    latexocr: { endpointUrl: string; apiKey: string };
    mathpix: { endpointUrl: string; appId: string; appKey: string };
    "google-vision": { endpointUrl: string; apiKey: string };
  };
}

const DEFAULT_CONFIG: OcrConfig = {
  activeProvider: "pix2text",
  providers: {
    pix2text: {
      endpointUrl:
        process.env["PIX2TEXT_URL"] ??
        "https://your-pix2text-space.hf.space/ocr",
      apiKey: process.env["PIX2TEXT_API_KEY"] ?? "",
    },
    simpletex: {
      endpointUrl:
        process.env["SIMPLETEX_URL"] ?? "https://server.simpletex.cn/api/latex_ocr",
      apiKey: process.env["SIMPLETEX_API_KEY"] ?? "",
    },
    latexocr: {
      endpointUrl:
        process.env["LATEXOCR_URL"] ??
        "https://your-latexocr-space.hf.space/predict",
      apiKey: process.env["LATEXOCR_API_KEY"] ?? "",
    },
    mathpix: {
      endpointUrl: "https://api.mathpix.com/v3/text",
      appId: process.env["MATHPIX_APP_ID"] ?? "",
      appKey: process.env["MATHPIX_APP_KEY"] ?? "",
    },
    "google-vision": {
      endpointUrl: "https://vision.googleapis.com/v1/images:annotate",
      apiKey: process.env["GOOGLE_VISION_API_KEY"] ?? "",
    },
  },
};

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadConfig(): OcrConfig {
  ensureDataDir();
  if (!existsSync(CONFIG_FILE)) {
    saveConfig(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  }
  try {
    const raw = readFileSync(CONFIG_FILE, "utf-8");
    return JSON.parse(raw) as OcrConfig;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: OcrConfig): void {
  ensureDataDir();
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
}

export function getActiveProvider(): OcrProvider {
  return loadConfig().activeProvider;
}

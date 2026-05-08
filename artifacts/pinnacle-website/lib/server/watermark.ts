// PDF watermarking — text + optional logo overlay applied server-side via
// pdf-lib. Settings come from `watermark_settings`: one global row plus
// optional per-doc-type overrides. Placeholders are a strict whitelist.
import { db } from "@workspace/db";
import { watermarkSettings, type WatermarkSettings } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  degrees,
  type PDFFont,
  type PDFPage,
  type PDFImage,
} from "pdf-lib";
import { downloadObjectBytes } from "./object-storage";

export const WATERMARK_DOC_TYPES = [
  "receipt",
  "study_material",
  "assignment",
  "practice_paper",
  "question_bank",
] as const;
export type WatermarkDocType = (typeof WATERMARK_DOC_TYPES)[number];
export type WatermarkScopeKey = "global" | WatermarkDocType;

export const WATERMARK_DOC_TYPE_LABELS: Record<WatermarkDocType, string> = {
  receipt: "Fee receipts",
  study_material: "Study materials",
  assignment: "Assignments",
  practice_paper: "Practice papers / PYQs",
  question_bank: "Question-bank exports",
};

export type WatermarkPosition = "tile" | "center" | "footer";

export interface WatermarkConfig {
  enabled: boolean;
  textTemplate: string;
  position: WatermarkPosition;
  opacity: number;
  rotation: number;
  fontSize: number;
  color: string;
  logoObjectPath: string | null;
}

const DEFAULT_GLOBAL: WatermarkConfig = {
  enabled: true,
  textTemplate: "{{centreName}} • {{userName}} • {{date}}",
  position: "tile",
  opacity: 12,
  rotation: 45,  // 0..90 degrees
  fontSize: 36,
  color: "#888888",
  logoObjectPath: null,
};

const PLACEHOLDER_KEYS = [
  "userName",
  "userPhone",
  "userEmail",
  "date",
  "ipAddress",
  "centreName",
] as const;
export type PlaceholderKey = (typeof PLACEHOLDER_KEYS)[number];

export interface WatermarkContext {
  userName: string;
  userPhone: string;
  userEmail: string;
  date: string;
  ipAddress: string;
  centreName: string;
}

// --------------------------------------------------------------------------
// Cache
// --------------------------------------------------------------------------
const cache = new Map<WatermarkScopeKey, WatermarkConfig>();
let cacheLoaded = false;
// Singleton promise that callers await while the cache is being populated.
// Without this, concurrent first-hit requests would each run loadCache and
// briefly observe a partial map.
let inflightLoad: Promise<void> | null = null;


function rowToConfig(row: WatermarkSettings): WatermarkConfig {
  return {
    enabled: row.enabled,
    textTemplate: row.textTemplate,
    position: (row.position as WatermarkPosition) ?? "tile",
    opacity: row.opacity,
    rotation: row.rotation,
    fontSize: row.fontSize,
    color: row.color,
    logoObjectPath: row.logoObjectPath ?? null,
  };
}

async function loadCacheNow() {
  const next = new Map<WatermarkScopeKey, WatermarkConfig>();
  try {
    const rows = await db.select().from(watermarkSettings);
    for (const r of rows) {
      const key = r.docType as WatermarkScopeKey;
      // For non-global rows that are flagged useGlobal, omit from cache so the
      // resolver falls through to the global config automatically.
      if (key !== "global" && r.useGlobal) continue;
      next.set(key, rowToConfig(r));
    }
  } catch {
    // table may not exist yet during boot; fall back to defaults
  }
  cache.clear();
  for (const [k, v] of next) cache.set(k, v);
  cacheLoaded = true;
}

async function loadCache() {
  if (cacheLoaded) return;
  if (!inflightLoad) {
    inflightLoad = loadCacheNow().finally(() => {
      inflightLoad = null;
    });
  }
  await inflightLoad;
}

export function invalidateWatermarkCache() {
  cacheLoaded = false;
  cache.clear();
  inflightLoad = null;
}

/**
 * Logos must come from the public bucket — admins paste these paths in the
 * UI and we never want to allow private-bucket reads through this surface.
 */
export function isAllowedLogoPath(p: string | null | undefined): boolean {
  if (!p) return false;
  return /^\/objects\/public\/[A-Za-z0-9._\-/]+$/.test(p);
}

export async function getWatermarkConfig(docType: WatermarkDocType): Promise<WatermarkConfig> {
  if (!cacheLoaded) await loadCache();
  return cache.get(docType) ?? cache.get("global") ?? DEFAULT_GLOBAL;
}

export async function getAllWatermarkSettings(): Promise<{
  global: WatermarkSettings;
  overrides: Partial<Record<WatermarkDocType, WatermarkSettings>>;
}> {
  const rows = await db.select().from(watermarkSettings);
  const byType = new Map<string, WatermarkSettings>();
  for (const r of rows) byType.set(r.docType, r);
  let global = byType.get("global");
  if (!global) {
    // Lazily create the global row on first read so admins always have
    // something to edit.
    const [created] = await db
      .insert(watermarkSettings)
      .values({ docType: "global" })
      .returning();
    global = created;
  }
  const overrides: Partial<Record<WatermarkDocType, WatermarkSettings>> = {};
  for (const t of WATERMARK_DOC_TYPES) {
    const row = byType.get(t);
    if (row) overrides[t] = row;
  }
  return { global, overrides };
}

export async function upsertWatermarkSetting(
  docType: WatermarkScopeKey,
  // Note: `logoObjectPath` is intentionally three-state — `undefined` means
  // "leave unchanged", `null` means "clear it", and a string sets a new path.
  patch: Partial<Omit<WatermarkConfig, "logoObjectPath">> & {
    logoObjectPath?: string | null;
    useGlobal?: boolean;
  },
  updatedBy: string,
): Promise<WatermarkSettings> {
  const existing = await db
    .select()
    .from(watermarkSettings)
    .where(eq(watermarkSettings.docType, docType))
    .limit(1)
    .then((r) => r[0]);

  // Distinguish "clear" (null) from "leave unchanged" (undefined) for the
  // logo path so admins can actually remove a previously set logo.
  const hasLogoChange = Object.prototype.hasOwnProperty.call(patch, "logoObjectPath");
  const nextLogo = hasLogoChange ? (patch.logoObjectPath ?? null) : (existing?.logoObjectPath ?? null);

  const values = {
    docType,
    enabled: patch.enabled ?? existing?.enabled ?? true,
    textTemplate: patch.textTemplate ?? existing?.textTemplate ?? DEFAULT_GLOBAL.textTemplate,
    position: patch.position ?? (existing?.position as WatermarkPosition | undefined) ?? "tile",
    opacity: patch.opacity ?? existing?.opacity ?? 12,
    rotation: patch.rotation ?? existing?.rotation ?? 45,
    fontSize: patch.fontSize ?? existing?.fontSize ?? 36,
    color: patch.color ?? existing?.color ?? "#888888",
    logoObjectPath: nextLogo,
    useGlobal: docType === "global" ? false : (patch.useGlobal ?? existing?.useGlobal ?? true),
    updatedBy,
    updatedAt: new Date(),
  };

  let row: WatermarkSettings;
  if (existing) {
    [row] = await db
      .update(watermarkSettings)
      .set(values)
      .where(eq(watermarkSettings.docType, docType))
      .returning();
  } else {
    [row] = await db.insert(watermarkSettings).values(values).returning();
  }
  invalidateWatermarkCache();
  return row;
}

// --------------------------------------------------------------------------
// Template expansion (strict whitelist; never `eval`)
// --------------------------------------------------------------------------
const PLACEHOLDER_RX = /\{\{\s*([a-zA-Z_]+)\s*\}\}/g;

export function expandTemplate(template: string, ctx: WatermarkContext): string {
  return template.replace(PLACEHOLDER_RX, (_match, key: string) => {
    if ((PLACEHOLDER_KEYS as readonly string[]).includes(key)) {
      const v = ctx[key as PlaceholderKey];
      return v ? String(v) : "";
    }
    return "";
  });
}

export function configHash(cfg: WatermarkConfig): string {
  return createHash("sha256")
    .update(JSON.stringify(cfg))
    .digest("hex")
    .slice(0, 16);
}

// --------------------------------------------------------------------------
// Color helpers
// --------------------------------------------------------------------------
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return { r: 0.53, g: 0.53, b: 0.53 };
  const n = parseInt(m[1], 16);
  return {
    r: ((n >> 16) & 0xff) / 255,
    g: ((n >> 8) & 0xff) / 255,
    b: (n & 0xff) / 255,
  };
}

// --------------------------------------------------------------------------
// Stamping
// --------------------------------------------------------------------------
async function loadLogoImage(
  pdf: PDFDocument,
  objectPath: string | null,
): Promise<PDFImage | null> {
  // Reject anything that isn't a path under /objects/public/. This prevents
  // an admin (or impersonator) from pointing the watermarker at a private
  // bucket object via this code path.
  if (!isAllowedLogoPath(objectPath)) return null;
  try {
    const { bytes, contentType } = await downloadObjectBytes(objectPath!);
    const ct = contentType.toLowerCase();
    if (ct.includes("png")) return await pdf.embedPng(bytes);
    if (ct.includes("jpeg") || ct.includes("jpg")) return await pdf.embedJpg(bytes);
    if (ct.includes("svg") || objectPath!.toLowerCase().endsWith(".svg")) {
      // pdf-lib has no native SVG support, so we rasterise to PNG via sharp
      // (already a dependency for image processing). This is admin-supplied
      // content from the public bucket so the conversion happens at most
      // once per cache miss.
      const sharp = (await import("sharp")).default;
      const png = await sharp(Buffer.from(bytes), { density: 300 })
        .resize({ width: 1024, withoutEnlargement: true })
        .png()
        .toBuffer();
      return await pdf.embedPng(png);
    }
    return null;
  } catch {
    return null;
  }
}

function drawTextStamp(
  page: PDFPage,
  text: string,
  font: PDFFont,
  cfg: WatermarkConfig,
) {
  if (!text) return;
  const { width, height } = page.getSize();
  const { r, g, b } = hexToRgb(cfg.color);
  const opacity = Math.max(0, Math.min(1, cfg.opacity / 100));
  const size = cfg.fontSize;
  const textWidth = font.widthOfTextAtSize(text, size);
  const baseOpts = {
    font,
    size,
    color: rgb(r, g, b),
    opacity,
  } as const;

  if (cfg.position === "footer") {
    page.drawText(text, {
      ...baseOpts,
      x: Math.max(20, (width - textWidth) / 2),
      y: 24,
      rotate: degrees(0),
    });
    return;
  }

  if (cfg.position === "center") {
    page.drawText(text, {
      ...baseOpts,
      x: width / 2 - (textWidth / 2),
      y: height / 2,
      rotate: degrees(cfg.rotation),
    });
    return;
  }

  // tile mode (default)
  const stepX = Math.max(textWidth + 80, 220);
  const stepY = Math.max(size * 5, 140);
  const rot = degrees(cfg.rotation);
  for (let y = -stepY; y < height + stepY; y += stepY) {
    for (let x = -stepX; x < width + stepX; x += stepX) {
      page.drawText(text, { ...baseOpts, x, y, rotate: rot });
    }
  }
}

function drawLogoStamp(page: PDFPage, image: PDFImage, cfg: WatermarkConfig) {
  const { width, height } = page.getSize();
  const opacity = Math.max(0, Math.min(1, cfg.opacity / 100));
  const maxDim = Math.min(width, height) * 0.4;
  const ratio = image.width / image.height;
  const w = ratio >= 1 ? maxDim : maxDim * ratio;
  const h = ratio >= 1 ? maxDim / ratio : maxDim;
  page.drawImage(image, {
    x: width / 2 - w / 2,
    y: height / 2 - h / 2,
    width: w,
    height: h,
    opacity,
    rotate: degrees(cfg.position === "footer" ? 0 : cfg.rotation),
  });
}

/**
 * Apply the watermark for `docType` onto the given PDF bytes.
 * If the resolved config has `enabled=false` the original bytes are returned.
 */
export class InvalidPdfError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPdfError";
  }
}

export async function withWatermark(
  pdfBytes: Uint8Array | Buffer,
  ctx: WatermarkContext,
  docType: WatermarkDocType,
): Promise<{ bytes: Uint8Array; configHash: string }> {
  const cfg = await getWatermarkConfig(docType);
  if (!cfg.enabled) {
    const passthrough = pdfBytes instanceof Uint8Array ? pdfBytes : new Uint8Array(pdfBytes);
    return { bytes: passthrough, configHash: configHash(cfg) };
  }
  return stampWithConfig(pdfBytes, ctx, cfg);
}

/** Stamp using an explicit config (used by the admin live preview). */
export async function stampWithConfig(
  pdfBytes: Uint8Array | Buffer,
  ctx: WatermarkContext,
  cfg: WatermarkConfig,
): Promise<{ bytes: Uint8Array; configHash: string }> {
  const text = expandTemplate(cfg.textTemplate, ctx);
  let pdf;
  try {
    pdf = await PDFDocument.load(pdfBytes);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new InvalidPdfError(`Cannot stamp watermark: source bytes are not a valid PDF (${msg})`);
  }
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const logo = await loadLogoImage(pdf, cfg.logoObjectPath);
  // Stamp every page — the requirement is that ALL downloaded pages carry
  // the watermark for traceability. Large documents pay a higher CPU cost
  // but never bypass stamping.
  for (const page of pdf.getPages()) {
    if (logo) drawLogoStamp(page, logo, cfg);
    if (text) drawTextStamp(page, text, font, cfg);
  }
  const out = await pdf.save();
  return { bytes: out, configHash: configHash(cfg) };
}

export function buildWatermarkContext(args: {
  userName?: string | null;
  userPhone?: string | null;
  userEmail?: string | null;
  ipAddress?: string | null;
  centreName?: string | null;
  date?: Date;
}): WatermarkContext {
  const d = args.date ?? new Date();
  return {
    userName: args.userName ?? "",
    userPhone: args.userPhone ?? "",
    userEmail: args.userEmail ?? "",
    ipAddress: args.ipAddress ?? "",
    centreName: args.centreName ?? "",
    date: d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
  };
}

export const PLACEHOLDER_DESCRIPTIONS: Record<PlaceholderKey, string> = {
  userName: "Full name of the downloading user",
  userPhone: "Phone number on file",
  userEmail: "Email address on file",
  date: "Date the file was downloaded (DD MMM YYYY)",
  ipAddress: "IP address that initiated the download",
  centreName: "Institute / centre name from settings",
};

export const ALL_PLACEHOLDERS: PlaceholderKey[] = [...PLACEHOLDER_KEYS];

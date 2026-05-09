import { pdfToPng } from "pdf-to-png-converter";
import sharp from "sharp";
import { uploadBufferToCategory } from "./object-storage";

export type FigureSpec = {
  /** Index back into the caller's draft array */
  draftIndex: number;
  /** 1-based page number in the source PDF */
  page: number;
  /** Normalized bounding box [x, y, w, h] with each value in [0, 1]. */
  bbox: [number, number, number, number];
};

export type FigureCropResult = {
  draftIndex: number;
  imageUrl?: string;
  error?: string;
};

const MAX_PAGES_TO_RENDER = 30;
const RENDER_SCALE = 2;
const SERVE_PREFIX = "/api/v1/storage";

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

/**
 * Render the requested PDF pages once each, crop the bounding boxes per figure,
 * upload each crop to object storage under `question_figure`, and return the
 * resulting URLs grouped by draft index.
 *
 * Renders best-effort: any failure for an individual figure is reported but
 * does not abort the whole batch (so the caller can still save other drafts).
 */
export async function cropFiguresFromPdf(
  pdfBytes: Buffer,
  figures: FigureSpec[],
  basePath: string,
): Promise<FigureCropResult[]> {
  if (figures.length === 0) return [];

  // Collect unique pages we actually need (cap to avoid runaway renders).
  const uniquePages = Array.from(new Set(figures.map((f) => f.page)))
    .filter((p) => Number.isInteger(p) && p > 0)
    .slice(0, MAX_PAGES_TO_RENDER);

  if (uniquePages.length === 0) return [];

  const pageBuffers = new Map<number, { width: number; height: number; png: Buffer }>();

  try {
    const rendered = await pdfToPng(pdfBytes, {
      pagesToProcess: uniquePages,
      viewportScale: RENDER_SCALE,
      disableFontFace: true,
      verbosityLevel: 0,
    });
    for (const page of rendered) {
      if (page.kind === "content" && page.content) {
        pageBuffers.set(page.pageNumber, { width: page.width, height: page.height, png: page.content });
      }
    }
  } catch (err) {
    console.error("[pdf-figure-crops] PDF rendering failed:", err);
    // If rendering blows up entirely, mark every figure as failed but still return something.
    return figures.map((f) => ({ draftIndex: f.draftIndex, error: "PDF page rendering failed" }));
  }

  const out: FigureCropResult[] = [];
  for (const fig of figures) {
    const page = pageBuffers.get(fig.page);
    if (!page) {
      out.push({ draftIndex: fig.draftIndex, error: `Page ${fig.page} not rendered` });
      continue;
    }
    const [x, y, w, h] = fig.bbox.map(clamp01) as [number, number, number, number];
    if (w <= 0.01 || h <= 0.01) {
      out.push({ draftIndex: fig.draftIndex, error: "Figure bounding box too small" });
      continue;
    }
    const left = Math.max(0, Math.floor(x * page.width));
    const top = Math.max(0, Math.floor(y * page.height));
    const width = Math.max(1, Math.min(page.width - left, Math.floor(w * page.width)));
    const height = Math.max(1, Math.min(page.height - top, Math.floor(h * page.height)));
    try {
      const cropped = await sharp(page.png)
        .extract({ left, top, width, height })
        .png({ compressionLevel: 9 })
        .toBuffer();
      const { objectPath } = await uploadBufferToCategory("question_figure", "image/png", cropped);
      out.push({
        draftIndex: fig.draftIndex,
        imageUrl: `${basePath}${SERVE_PREFIX}${objectPath}`,
      });
    } catch (err) {
      console.error(`[pdf-figure-crops] Crop/upload failed for draft ${fig.draftIndex}:`, err);
      out.push({ draftIndex: fig.draftIndex, error: "Crop or upload failed" });
    }
  }
  return out;
}

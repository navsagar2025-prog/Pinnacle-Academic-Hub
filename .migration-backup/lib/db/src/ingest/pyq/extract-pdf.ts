// Wraps pdf-parse with safe dynamic import (pdf-parse is CJS, has no
// first-party types in this workspace, and its package root has a debug-mode
// side-effect that reads a non-existent test fixture — so we import the
// underlying module file directly).

import { readFile } from "node:fs/promises";

interface PdfParseResult {
  text: string;
  numpages: number;
  numrender: number;
  info: unknown;
  metadata: unknown;
  version: string;
}

type PdfParseFn = (data: Buffer) => Promise<PdfParseResult>;

interface PdfParseModule {
  default?: PdfParseFn;
}

export async function extractPdfText(filePath: string): Promise<string> {
  const buf = await readFile(filePath);
  const mod = await import("pdf-parse/lib/pdf-parse.js");
  const pdfParse: PdfParseFn =
    typeof mod === "function"
      ? (mod as unknown as PdfParseFn)
      : (mod.default ?? (mod as unknown as PdfParseModule).default!);
  const result = await pdfParse(buf);
  return result.text;
}

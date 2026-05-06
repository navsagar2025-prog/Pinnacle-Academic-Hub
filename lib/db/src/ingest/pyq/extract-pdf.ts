// Wraps pdf-parse with safe dynamic import (pdf-parse is CJS).
// Returns the raw text of the PDF.

import { readFile } from "node:fs/promises";

export async function extractPdfText(filePath: string): Promise<string> {
  const buf = await readFile(filePath);
  // Import the underlying module (not the package root) to avoid pdf-parse's
  // debug-mode side-effect that tries to read a non-existent test fixture.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod: any = await import("pdf-parse/lib/pdf-parse.js");
  const pdfParse = mod.default ?? mod;
  const result = await pdfParse(buf);
  return result.text as string;
}

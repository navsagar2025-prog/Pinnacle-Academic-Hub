import FormData from "form-data";
import type { OcrAdapter, OcrResult } from "./adapter.js";

export class LatexOcrAdapter implements OcrAdapter {
  name = "latexocr";

  constructor(
    private readonly endpointUrl: string,
    private readonly apiKey: string,
  ) {}

  async scan(imageBuffer: Buffer, mimeType: string): Promise<OcrResult> {
    const start = Date.now();

    const form = new FormData();
    form.append("file", imageBuffer, {
      filename: "image.png",
      contentType: mimeType,
    });

    const headers: Record<string, string> = {
      ...form.getHeaders(),
    };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(this.endpointUrl, {
      method: "POST",
      headers,
      body: form.getBuffer(),
    });

    if (!response.ok) {
      throw new Error(
        `LaTeX-OCR API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as {
      latex?: string;
      result?: string;
    };

    const latex = data.latex ?? data.result ?? "";

    return {
      text: latex,
      latex,
      confidence: 0.87,
      provider: "latexocr",
      processingMs: Date.now() - start,
    };
  }
}

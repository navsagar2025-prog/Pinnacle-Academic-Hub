import FormData from "form-data";
import type { OcrAdapter, OcrResult } from "./adapter.js";

export class Pix2TextAdapter implements OcrAdapter {
  name = "pix2text";

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
        `Pix2Text API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as {
      text?: string;
      latex?: string;
      results?: Array<{ text?: string; latex?: string; type?: string }>;
    };

    let text = "";
    let latex = "";

    if (data.results && Array.isArray(data.results)) {
      const parts = data.results.map((r) => {
        if (r.type === "formula" || r.type === "isolated_formula") {
          const eq = r.latex ?? r.text ?? "";
          latex += (latex ? "\n" : "") + eq;
          return `$${eq}$`;
        }
        return r.text ?? "";
      });
      text = parts.join("\n");
    } else {
      text = data.text ?? "";
      latex = data.latex ?? "";
    }

    return {
      text,
      latex,
      confidence: 0.9,
      provider: "pix2text",
      processingMs: Date.now() - start,
    };
  }
}

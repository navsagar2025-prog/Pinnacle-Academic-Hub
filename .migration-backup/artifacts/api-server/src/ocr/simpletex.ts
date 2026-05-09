import FormData from "form-data";
import type { OcrAdapter, OcrResult } from "./adapter.js";

export class SimpletexAdapter implements OcrAdapter {
  name = "simpletex";

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

    const response = await fetch(this.endpointUrl, {
      method: "POST",
      headers: {
        ...form.getHeaders(),
        token: this.apiKey,
      },
      body: form.getBuffer(),
    });

    if (!response.ok) {
      throw new Error(
        `SimpleTex API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as {
      status?: boolean;
      res?: { latex?: string; conf?: number };
    };

    if (!data.status || !data.res) {
      throw new Error("SimpleTex API returned an error response");
    }

    const latex = data.res.latex ?? "";
    const confidence = data.res.conf ?? 0.85;

    return {
      text: latex,
      latex,
      confidence,
      provider: "simpletex",
      processingMs: Date.now() - start,
    };
  }
}

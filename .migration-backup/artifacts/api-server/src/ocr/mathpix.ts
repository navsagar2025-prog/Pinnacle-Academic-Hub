import type { OcrAdapter, OcrResult } from "./adapter.js";

export class MathpixAdapter implements OcrAdapter {
  name = "mathpix";

  constructor(
    private readonly endpointUrl: string,
    private readonly appId: string,
    private readonly appKey: string,
  ) {}

  async scan(imageBuffer: Buffer, _mimeType: string): Promise<OcrResult> {
    const start = Date.now();

    const base64Image = imageBuffer.toString("base64");

    const response = await fetch(this.endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "app_id": this.appId,
        "app_key": this.appKey,
      },
      body: JSON.stringify({
        src: `data:image/png;base64,${base64Image}`,
        formats: ["text", "latex_styled"],
        include_detected_alphabets: true,
        include_line_data: false,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `MathPix API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as {
      text?: string;
      latex_styled?: string;
      confidence?: number;
      error?: string;
    };

    if (data.error) {
      throw new Error(`MathPix error: ${data.error}`);
    }

    return {
      text: data.text ?? "",
      latex: data.latex_styled ?? data.text ?? "",
      confidence: data.confidence ?? 0.95,
      provider: "mathpix",
      processingMs: Date.now() - start,
    };
  }
}

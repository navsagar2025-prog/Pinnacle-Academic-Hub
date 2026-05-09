import type { OcrAdapter, OcrResult } from "./adapter.js";

export class GoogleVisionAdapter implements OcrAdapter {
  name = "google-vision";

  constructor(
    private readonly endpointUrl: string,
    private readonly apiKey: string,
  ) {}

  async scan(imageBuffer: Buffer, _mimeType: string): Promise<OcrResult> {
    const start = Date.now();

    const base64Image = imageBuffer.toString("base64");

    const url = `${this.endpointUrl}?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Image },
            features: [
              { type: "DOCUMENT_TEXT_DETECTION", maxResults: 1 },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Google Vision API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as {
      responses?: Array<{
        fullTextAnnotation?: { text?: string };
        error?: { message?: string };
      }>;
    };

    const firstResponse = data.responses?.[0];
    if (firstResponse?.error) {
      throw new Error(`Google Vision error: ${firstResponse.error.message}`);
    }

    const text = firstResponse?.fullTextAnnotation?.text ?? "";

    return {
      text,
      latex: "",
      confidence: 0.88,
      provider: "google-vision",
      processingMs: Date.now() - start,
    };
  }
}

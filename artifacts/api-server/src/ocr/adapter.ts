export interface OcrResult {
  text: string;
  latex: string;
  confidence: number;
  provider: string;
  processingMs: number;
}

export interface OcrAdapter {
  name: string;
  scan(imageBuffer: Buffer, mimeType: string): Promise<OcrResult>;
}

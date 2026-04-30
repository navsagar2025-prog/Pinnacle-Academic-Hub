export interface OcrResult {
  success: boolean;
  text: string;
  latex: string;
  confidence: number;
  provider: string;
  processingMs: number;
  error?: string;
  hint?: string;
}

export interface OcrSettings {
  activeProvider: string;
  providers: Record<
    string,
    {
      endpointUrl: string;
      hasApiKey?: boolean;
      hasAppId?: boolean;
      hasAppKey?: boolean;
    }
  >;
}

export interface HealthResponse {
  status: string;
  activeProvider: string;
  uptime: number;
}

const BASE = "/api";

export async function scanImage(file: File): Promise<OcrResult> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/scan`, { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) {
    return {
      success: false,
      text: "",
      latex: "",
      confidence: 0,
      provider: "",
      processingMs: 0,
      error: data.error ?? `Server error ${res.status}`,
      hint: data.hint,
    };
  }
  return data as OcrResult;
}

export async function exportPdf(payload: {
  text: string;
  latex: string;
  title: string;
  provider: string;
}): Promise<void> {
  const res = await fetch(`${BASE}/export/pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`PDF export failed: ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${payload.title.replace(/[^a-z0-9]/gi, "_")}_scan.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportDocx(payload: {
  text: string;
  latex: string;
  title: string;
  provider: string;
}): Promise<void> {
  const res = await fetch(`${BASE}/export/docx`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`DOCX export failed: ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${payload.title.replace(/[^a-z0-9]/gi, "_")}_scan.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function fetchOcrSettings(): Promise<OcrSettings> {
  const res = await fetch(`${BASE}/settings/ocr`);
  const data = await res.json();
  return data.config as OcrSettings;
}

export async function saveOcrSettings(payload: {
  activeProvider: string;
  providers?: Record<string, Record<string, string>>;
}): Promise<void> {
  const res = await fetch(`${BASE}/settings/ocr`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Save failed: ${res.status}`);
}

export async function checkApiHealth(): Promise<HealthResponse> {
  const res = await fetch(`${BASE}/health`);
  if (!res.ok) throw new Error("API server not reachable");
  return res.json() as Promise<HealthResponse>;
}

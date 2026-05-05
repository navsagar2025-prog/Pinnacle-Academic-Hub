import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/server/portal-auth";
import { downloadObjectBytes } from "@/lib/server/object-storage";
import { cropFiguresFromPdf, type FigureSpec } from "@/lib/server/pdf-figure-crops";
import { GoogleGenAI } from "@google/genai";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

export const runtime = "nodejs";
export const maxDuration = 120;

const SYSTEM_PROMPT = `You are an expert academic content digitiser for an Indian coaching institute.
You will receive a scanned PDF of a previous-year question paper (JEE Main, JEE Advanced, NEET, CBSE Boards, etc.).
Extract every distinct question into a structured JSON array.

For each question return an object with these fields:
- subject: one of "Physics", "Chemistry", "Mathematics", "Biology", "English", "General Knowledge", or your best guess.
- topic: a short chapter/topic label such as "Kinematics" or "Cell Biology" — null if unknown.
- classGrade: "11", "12", "10", or null if not obvious.
- questionType: "mcq" | "short" | "long" | "numerical" — pick "mcq" when there are 4 lettered choices, "numerical" when the answer is a single number with no choices, otherwise "short".
- difficulty: "easy" | "medium" | "hard" — your best guess.
- questionText: the full question stem in plain UTF-8 text. Preserve mathematical notation as plain text (e.g. "x^2", "sqrt(2)", "v = sqrt(2gh)"). Drop figure callouts like "(see figure)" but keep the meaning.
- options: an object {"A": "...", "B": "...", "C": "...", "D": "..."} when questionType is "mcq", otherwise null.
- correctAnswer: for mcq use the option letter ("A"/"B"/"C"/"D"); for numerical use the numeric answer as a string; for short/long use the expected answer text. If the answer is not provided in the PDF, use the empty string "".
- solution: a brief solution or working if the PDF provides one, otherwise null.
- marks: integer marks for the question (default 4 if not stated).
- hasFigure: boolean — true when the question references or includes a diagram, graph, circuit, structure, or image.
- figureDescription: one-sentence description of the figure (or null when hasFigure is false).
- figurePage: the 1-based PDF page number where the figure appears (or null).
- figureBbox: tight axis-aligned bounding box around the figure on that page, given as [x, y, width, height] where each value is normalized to the page in [0, 1] (origin at top-left). Be tight — exclude the question text. Use null when hasFigure is false or when you cannot place the box reliably.

Rules:
- Skip non-question content (cover pages, instructions, answer keys themselves, blank pages).
- Do not invent answers. Leave correctAnswer = "" when unsure.
- Output ONLY a single JSON object {"questions": [...]} with no prose, no markdown, no code fences.
- If you cannot read any questions, return {"questions": []}.`;

type ExtractedQuestion = {
  subject?: unknown;
  topic?: unknown;
  classGrade?: unknown;
  questionType?: unknown;
  difficulty?: unknown;
  questionText?: unknown;
  options?: unknown;
  correctAnswer?: unknown;
  solution?: unknown;
  marks?: unknown;
  hasFigure?: unknown;
  figureDescription?: unknown;
  figurePage?: unknown;
  figureBbox?: unknown;
};

function asBbox(v: unknown): [number, number, number, number] | null {
  if (!Array.isArray(v) || v.length !== 4) return null;
  const nums = v.map((n) => Number(n));
  if (nums.some((n) => !Number.isFinite(n) || n < 0 || n > 1.05)) return null;
  return [nums[0], nums[1], nums[2], nums[3]] as [number, number, number, number];
}

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();
}

function asOptions(v: unknown): Record<string, string> | null {
  if (!v || typeof v !== "object") return null;
  const obj = v as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const k of ["A", "B", "C", "D"]) {
    const val = asString(obj[k]);
    if (!val) return null;
    out[k] = val;
  }
  return out;
}

function stripCodeFence(s: string): string {
  const trimmed = s.trim();
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```[a-zA-Z]*\n?/, "").replace(/```\s*$/, "").trim();
  }
  return trimmed;
}

export async function POST(req: NextRequest) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  // Admin-only: matches the `pyq_pdf` upload category, since this route
  // dereferences the uploaded PDF object.
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!process.env.AI_INTEGRATIONS_GEMINI_API_KEY || !process.env.AI_INTEGRATIONS_GEMINI_BASE_URL) {
    return NextResponse.json(
      { error: "Gemini AI integration not configured. Set AI_INTEGRATIONS_GEMINI_* secrets." },
      { status: 503 },
    );
  }

  const body = await req.json().catch(() => null) as
    | { objectPath?: string; examName?: string; year?: number | string; defaultSubject?: string; defaultClassGrade?: string }
    | null;
  if (!body?.objectPath || typeof body.objectPath !== "string") {
    return NextResponse.json({ error: "objectPath is required" }, { status: 400 });
  }
  if (!body.objectPath.startsWith("/objects/private/pyq-pdfs/")) {
    return NextResponse.json({ error: "objectPath must point to an uploaded PYQ PDF" }, { status: 400 });
  }

  const examName = asString(body.examName);
  const yearNum = body.year ? Number(body.year) : null;
  if (yearNum != null && (!Number.isFinite(yearNum) || yearNum < 1900 || yearNum > 2100)) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }
  const defaultSubject = asString(body.defaultSubject);
  const defaultClassGrade = asString(body.defaultClassGrade);

  let pdfBytes: Buffer;
  let contentType: string;
  try {
    const obj = await downloadObjectBytes(body.objectPath);
    pdfBytes = obj.bytes;
    contentType = obj.contentType || "application/pdf";
  } catch (err) {
    console.error("[pdf-extract] Failed to download PDF:", err);
    return NextResponse.json({ error: "Could not load uploaded PDF" }, { status: 404 });
  }

  // Tolerant PDF check: prefer the storage metadata, but fall back to a magic-byte
  // sniff for objects served as application/octet-stream by some uploaders.
  const isPdfMime = contentType === "application/pdf";
  const isPdfMagic = pdfBytes.length >= 5 && pdfBytes.slice(0, 5).toString("ascii") === "%PDF-";
  if (!isPdfMime && !isPdfMagic) {
    return NextResponse.json({ error: "Uploaded object is not a PDF" }, { status: 415 });
  }

  // Operational safeguard: Gemini inline PDF requests grow ~33% when base64-encoded
  // and very large scans tend to time out or hit per-request size limits. Reject
  // early with a clear message instead of letting the model call fail.
  const MAX_AI_PDF_BYTES = 25 * 1024 * 1024;
  if (pdfBytes.length > MAX_AI_PDF_BYTES) {
    return NextResponse.json({
      error: `PDF is ${(pdfBytes.length / (1024 * 1024)).toFixed(1)} MB. Please split into chunks under 25 MB before importing.`,
    }, { status: 413 });
  }

  const userPromptParts = [
    `Extract questions from this PYQ paper${examName ? ` (${examName})` : ""}${yearNum ? ` from ${yearNum}` : ""}.`,
    defaultSubject ? `Most questions are from ${defaultSubject}.` : "",
    defaultClassGrade ? `Target class: ${defaultClassGrade}.` : "",
    "Return strict JSON of the form {\"questions\": [...]}.",
  ].filter(Boolean).join(" ");

  const client = new GoogleGenAI({
    apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
    httpOptions: { apiVersion: "", baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL },
  });

  let responseText = "";
  try {
    const result = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: "application/pdf", data: pdfBytes.toString("base64") } },
            { text: userPromptParts },
          ],
        },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        maxOutputTokens: 32768,
        temperature: 0.1,
      },
    });
    responseText = result.text ?? "";
  } catch (err) {
    console.error("[pdf-extract] Gemini call failed:", err);
    const msg = err instanceof Error ? err.message : "AI extraction failed";
    return NextResponse.json({ error: `AI extraction failed: ${msg}` }, { status: 502 });
  }

  let parsed: { questions?: ExtractedQuestion[] };
  try {
    parsed = JSON.parse(stripCodeFence(responseText));
  } catch {
    console.error("[pdf-extract] Could not parse AI JSON. Raw:", responseText.slice(0, 500));
    return NextResponse.json({
      error: "AI returned a non-JSON response. Try a clearer scan or smaller PDF.",
    }, { status: 502 });
  }

  const list = Array.isArray(parsed?.questions) ? parsed.questions : [];

  const drafts = list.map((q, idx) => {
    const questionType = (() => {
      const t = asString(q.questionType).toLowerCase();
      return ["mcq", "short", "long", "numerical"].includes(t) ? t : "mcq";
    })();
    const difficulty = (() => {
      const d = asString(q.difficulty).toLowerCase();
      return ["easy", "medium", "hard"].includes(d) ? d : "medium";
    })();
    const options = questionType === "mcq" ? asOptions(q.options) : null;
    let correct = asString(q.correctAnswer);
    if (questionType === "mcq" && correct) {
      const upper = correct.toUpperCase();
      correct = ["A", "B", "C", "D"].includes(upper) ? upper : "";
    }
    const marks = Number.isFinite(Number(q.marks)) ? Math.max(0, Math.trunc(Number(q.marks))) : 4;
    const subject = asString(q.subject) || defaultSubject || "General Knowledge";
    const classGrade = asString(q.classGrade) || defaultClassGrade || "";
    return {
      draftId: `d${idx + 1}`,
      subject,
      topic: asString(q.topic) || "",
      classGrade,
      year: yearNum,
      examName: examName || "",
      questionType,
      difficulty,
      questionText: asString(q.questionText),
      options,
      correctAnswer: correct,
      solution: asString(q.solution) || "",
      imageUrl: "",
      solutionImageUrl: "",
      marks,
      hasFigure: Boolean(q.hasFigure),
      figureDescription: asString(q.figureDescription) || "",
      figurePage: Number.isFinite(Number(q.figurePage)) ? Number(q.figurePage) : null,
      figureBbox: asBbox(q.figureBbox),
    };
  }).filter((d) => d.questionText.length > 0);

  // Auto-crop any detected figures from the source PDF, upload them to object
  // storage, and prefill imageUrl on each draft. Failures are non-fatal — the
  // admin can still attach a figure manually on the review screen.
  const figureSpecs: FigureSpec[] = [];
  drafts.forEach((d, idx) => {
    if (d.hasFigure && d.figurePage && d.figureBbox) {
      figureSpecs.push({ draftIndex: idx, page: d.figurePage, bbox: d.figureBbox });
    }
  });

  let figuresCropped = 0;
  let figuresFailed = 0;
  if (figureSpecs.length > 0) {
    try {
      const cropResults = await cropFiguresFromPdf(pdfBytes, figureSpecs, BASE_PATH);
      for (const r of cropResults) {
        if (r.imageUrl) {
          drafts[r.draftIndex].imageUrl = r.imageUrl;
          figuresCropped += 1;
        } else {
          figuresFailed += 1;
        }
      }
    } catch (err) {
      console.error("[pdf-extract] cropFiguresFromPdf threw:", err);
      figuresFailed = figureSpecs.length;
    }
  }

  return NextResponse.json({
    success: true,
    drafts,
    extractedCount: drafts.length,
    skippedCount: Math.max(0, list.length - drafts.length),
    figuresCropped,
    figuresFailed,
  });
}

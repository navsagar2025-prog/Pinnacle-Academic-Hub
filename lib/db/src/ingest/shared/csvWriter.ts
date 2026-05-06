// Canonical CSV writer for question-bank ingest scripts.
//
// The import API (`/api/v1/question-bank/import`) accepts JSON, but the
// human-friendly editing format we use to stage batches is CSV. This module
// is the single source of truth for the column order so PYQ/AI/NCERT/third-
// party scripts all produce drop-in-compatible files.

export type IngestRow = {
  subject: string;
  topic?: string | null;
  classGrade?: string | null;
  year?: number | null;
  difficulty: "easy" | "medium" | "hard";
  questionType: "mcq" | "short" | "long" | "numerical";
  questionText: string;
  options?: { A: string; B: string; C: string; D: string } | null;
  correctAnswer: string;
  solution?: string | null;
  imageUrl?: string | null;
  solutionImageUrl?: string | null;
  examName?: string | null;
  marks?: number;
  source: "PYQ" | "AI" | "MANUAL" | "NCERT_EXEMPLAR" | "THIRD_PARTY_FREE";
  reviewStatus?: "pending" | "approved" | "rejected";
  examTarget?: Array<"JEE_MAIN" | "JEE_ADVANCED" | "NEET" | "CBSE_BOARDS" | "FOUNDATION">;
};

export const CSV_COLUMNS = [
  "subject", "topic", "classGrade", "year", "difficulty", "questionType",
  "questionText", "optionA", "optionB", "optionC", "optionD",
  "correctAnswer", "solution", "imageUrl", "solutionImageUrl", "examName",
  "marks", "source", "reviewStatus", "examTarget",
] as const;

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function rowsToCsv(rows: IngestRow[]): string {
  const out: string[] = [CSV_COLUMNS.join(",")];
  for (const r of rows) {
    out.push([
      csvEscape(r.subject),
      csvEscape(r.topic ?? ""),
      csvEscape(r.classGrade ?? ""),
      csvEscape(r.year ?? ""),
      csvEscape(r.difficulty),
      csvEscape(r.questionType),
      csvEscape(r.questionText),
      csvEscape(r.options?.A ?? ""),
      csvEscape(r.options?.B ?? ""),
      csvEscape(r.options?.C ?? ""),
      csvEscape(r.options?.D ?? ""),
      csvEscape(r.correctAnswer),
      csvEscape(r.solution ?? ""),
      csvEscape(r.imageUrl ?? ""),
      csvEscape(r.solutionImageUrl ?? ""),
      csvEscape(r.examName ?? ""),
      csvEscape(r.marks ?? 4),
      csvEscape(r.source),
      // AI rows: leave blank → server forces 'pending'.
      csvEscape(r.source === "AI" ? "" : (r.reviewStatus ?? "approved")),
      csvEscape(r.examTarget && r.examTarget.length ? JSON.stringify(r.examTarget) : ""),
    ].join(","));
  }
  return out.join("\n") + "\n";
}

export function rowsToImportPayload(rows: IngestRow[]): { rows: Record<string, unknown>[] } {
  return {
    rows: rows.map((r) => ({
      subject: r.subject,
      topic: r.topic ?? "",
      classGrade: r.classGrade ?? "",
      year: r.year ?? "",
      difficulty: r.difficulty,
      type: r.questionType,
      question: r.questionText,
      A: r.options?.A ?? "",
      B: r.options?.B ?? "",
      C: r.options?.C ?? "",
      D: r.options?.D ?? "",
      correct: r.correctAnswer,
      solution: r.solution ?? "",
      imageUrl: r.imageUrl ?? "",
      solutionImageUrl: r.solutionImageUrl ?? "",
      examName: r.examName ?? "",
      marks: r.marks ?? 4,
      source: r.source,
      reviewStatus: r.source === "AI" ? "pending" : (r.reviewStatus ?? "approved"),
      examTarget: r.examTarget ?? [],
    })),
  };
}

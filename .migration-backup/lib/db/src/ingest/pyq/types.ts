// Shared types for the PYQ (Previous Year Questions) ingest pipeline.

export type ExamCode =
  | "JEE_MAIN"
  | "JEE_ADVANCED"
  | "NEET"
  | "CBSE_BOARDS"
  | "FOUNDATION";

export const ALLOWED_EXAMS: ExamCode[] = [
  "JEE_MAIN",
  "JEE_ADVANCED",
  "NEET",
  "CBSE_BOARDS",
  "FOUNDATION",
];

export type Subject = "Physics" | "Chemistry" | "Mathematics" | "Biology";

// Output of the regex-based segmenter for one question.
export interface ParsedQuestion {
  num: number;                    // question number as printed in the source PDF
  questionText: string;           // body of the question (options stripped out)
  options: Record<string, string>; // letter → option text. Letters normalised to A/B/C/D.
}

// After joining with the parsed answer-key.
export interface ParsedQuestionWithAnswer extends ParsedQuestion {
  correctAnswer?: string;         // single letter A-D, may be undefined if key not found
}

// What we hand to the ingester.
export interface IngestOptions {
  exam: ExamCode;
  examNameLabel: string;          // e.g. "JEE Main 2023 January Shift 1 Physics"
  year: number;
  subject: Subject;
  classGrade?: string;            // "9" | "10" | "11" | "12" — optional
  reviewStatus: "pending" | "approved"; // PDFs default to 'pending' (review queue)
  dryRun?: boolean;
}

export interface IngestResult {
  parsed: number;                 // total questions parsed from the source
  dedupInBatch: number;           // duplicates dropped within the same source
  merged: number;                 // matched an existing PYQ row → year appended
  inserted: number;               // brand-new rows added
  unanswered: number;             // questions that had no answer-key entry (skipped)
  dryRun: boolean;
  samplePreview?: unknown[];      // first 3 rows that WOULD be inserted (dry-run only)
}

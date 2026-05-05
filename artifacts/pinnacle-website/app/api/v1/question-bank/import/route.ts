import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { questionBank } from "@workspace/db/schema";

const DIFFICULTIES = new Set(["easy", "medium", "hard"]);
const TYPES = new Set(["mcq", "short", "long", "numerical"]);

type RawRow = Record<string, unknown>;
type RowError = { line: number; message: string };
type ValidRow = {
  line: number;
  subject: string;
  topic: string | null;
  classGrade: string | null;
  year: number | null;
  difficulty: "easy" | "medium" | "hard";
  questionType: "mcq" | "short" | "long" | "numerical";
  questionText: string;
  options: Record<string, string> | null;
  correctAnswer: string;
  solution: string | null;
  imageUrl: string | null;
  solutionImageUrl: string | null;
  examName: string | null;
  marks: number;
};

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function validateRow(raw: RawRow, line: number): { row?: ValidRow; error?: RowError } {
  const subject = str(raw.subject);
  const questionText = str(raw.question ?? raw.questionText);
  const correctRaw = str(raw.correct ?? raw.correctAnswer);
  const typeRaw = str(raw.type ?? raw.questionType).toLowerCase() || "mcq";
  const difficultyRaw = str(raw.difficulty).toLowerCase() || "medium";

  if (!subject) return { error: { line, message: "Missing required column 'subject'" } };
  if (!questionText) return { error: { line, message: "Missing required column 'question'" } };
  if (!correctRaw) return { error: { line, message: "Missing required column 'correct'" } };
  if (!TYPES.has(typeRaw)) return { error: { line, message: `Invalid type "${typeRaw}" — must be mcq, short, long, or numerical` } };
  if (!DIFFICULTIES.has(difficultyRaw)) return { error: { line, message: `Invalid difficulty "${difficultyRaw}" — must be easy, medium, or hard` } };

  const questionType = typeRaw as "mcq" | "short" | "long" | "numerical";
  const difficulty = difficultyRaw as "easy" | "medium" | "hard";

  let options: Record<string, string> | null = null;
  let correctAnswer = correctRaw;
  if (questionType === "mcq") {
    const A = str(raw.A); const B = str(raw.B); const C = str(raw.C); const D = str(raw.D);
    if (!A || !B || !C || !D) return { error: { line, message: "MCQ rows require options A, B, C and D" } };
    options = { A, B, C, D };
    const correctKey = correctRaw.toUpperCase();
    if (!["A", "B", "C", "D"].includes(correctKey)) {
      return { error: { line, message: `MCQ 'correct' must be one of A, B, C, D (got "${correctRaw}")` } };
    }
    correctAnswer = correctKey;
  }

  let year: number | null = null;
  const yearRaw = str(raw.year);
  if (yearRaw) {
    const y = Number(yearRaw);
    if (!Number.isFinite(y) || y < 1900 || y > 2100) return { error: { line, message: `Invalid year "${yearRaw}"` } };
    year = Math.trunc(y);
  }

  let marks = 4;
  const marksRaw = str(raw.marks);
  if (marksRaw) {
    const m = Number(marksRaw);
    if (!Number.isFinite(m) || m < 0) return { error: { line, message: `Invalid marks "${marksRaw}"` } };
    marks = Math.trunc(m);
  }

  return {
    row: {
      line,
      subject,
      topic: str(raw.topic) || null,
      classGrade: str(raw.classGrade) || null,
      year,
      difficulty,
      questionType,
      questionText,
      options,
      correctAnswer,
      solution: str(raw.solution) || null,
      imageUrl: str(raw.imageUrl) || null,
      solutionImageUrl: str(raw.solutionImageUrl) || null,
      examName: str(raw.examName) || null,
      marks,
    },
  };
}

export async function POST(req: NextRequest) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  if (user.role !== "admin" && user.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const rows = body?.rows;
  const commit = body?.commit === true;
  if (!Array.isArray(rows)) {
    return NextResponse.json({ error: "Body must include `rows` array" }, { status: 400 });
  }
  if (rows.length === 0) {
    return NextResponse.json({ error: "No rows to import" }, { status: 400 });
  }
  if (rows.length > 2000) {
    return NextResponse.json({ error: "At most 2000 rows per import" }, { status: 400 });
  }

  const valid: ValidRow[] = [];
  const errors: RowError[] = [];
  rows.forEach((raw: RawRow, idx: number) => {
    // Line numbers reflect spreadsheet rows: header is row 1, data starts at row 2.
    const line = idx + 2;
    const { row, error } = validateRow(raw ?? {}, line);
    if (error) errors.push(error);
    else if (row) valid.push(row);
  });

  if (!commit) {
    return NextResponse.json({
      success: true,
      preview: true,
      validCount: valid.length,
      errorCount: errors.length,
      errors,
    });
  }

  if (valid.length === 0) {
    return NextResponse.json({
      success: false,
      inserted: 0,
      validCount: 0,
      errorCount: errors.length,
      errors,
      error: "No valid rows to import",
    }, { status: 400 });
  }

  const inserted = await db.insert(questionBank).values(
    valid.map((r) => ({
      subject: r.subject,
      topic: r.topic,
      classGrade: r.classGrade,
      year: r.year,
      difficulty: r.difficulty,
      questionType: r.questionType,
      questionText: r.questionText,
      options: r.options,
      correctAnswer: r.correctAnswer,
      solution: r.solution,
      imageUrl: r.imageUrl,
      solutionImageUrl: r.solutionImageUrl,
      examName: r.examName,
      marks: r.marks,
      createdBy: user.id,
    })),
  ).returning({ id: questionBank.id });

  return NextResponse.json({
    success: true,
    inserted: inserted.length,
    validCount: valid.length,
    errorCount: errors.length,
    errors,
  });
}

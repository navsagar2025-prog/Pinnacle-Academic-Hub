import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { mockTests, mockTestQuestions } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import { validateMockTestImageUrl } from "@/lib/server/image-url";

const VALID_OPTS = ["A", "B", "C", "D"] as const;
type Opt = (typeof VALID_OPTS)[number];
const isOpt = (v: string): v is Opt => (VALID_OPTS as readonly string[]).includes(v);

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  type State = "FIELD_START" | "UNQUOTED" | "QUOTED" | "QUOTE_IN_QUOTED";
  let state: State = "FIELD_START";

  const endField = () => { row.push(cell); cell = ""; state = "FIELD_START"; };
  const endRow = () => { row.push(cell); rows.push(row); row = []; cell = ""; state = "FIELD_START"; };

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    switch (state) {
      case "FIELD_START":
        if (c === '"') { state = "QUOTED"; }
        else if (c === ",") { row.push(""); }
        else if (c === "\n") { endRow(); }
        else if (c === "\r") { if (text[i + 1] === "\n") i++; endRow(); }
        else { cell += c; state = "UNQUOTED"; }
        break;
      case "UNQUOTED":
        if (c === ",") { endField(); }
        else if (c === "\n") { endRow(); }
        else if (c === "\r") { if (text[i + 1] === "\n") i++; endRow(); }
        else { cell += c; }
        break;
      case "QUOTED":
        if (c === '"') { state = "QUOTE_IN_QUOTED"; }
        else { cell += c; }
        break;
      case "QUOTE_IN_QUOTED":
        if (c === '"') { cell += '"'; state = "QUOTED"; }
        else if (c === ",") { endField(); }
        else if (c === "\n") { endRow(); }
        else if (c === "\r") { if (text[i + 1] === "\n") i++; endRow(); }
        else { cell += c; state = "QUOTED"; }
        break;
    }
  }
  if (cell !== "" || row.length > 0 || state !== "FIELD_START") { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  if (user.role !== "admin" && user.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: testId } = await ctx.params;

  const [test] = await db.select({ createdBy: mockTests.createdBy }).from(mockTests).where(eq(mockTests.id, testId)).limit(1);
  if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });
  if (user.role === "teacher" && test.createdBy !== user.id) {
    return NextResponse.json({ error: "Forbidden — you can only import questions to your own tests" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const csv = typeof body?.csv === "string" ? body.csv : "";
  if (!csv.trim()) return NextResponse.json({ error: "CSV content is required" }, { status: 400 });

  const rows = parseCsv(csv);
  if (rows.length < 2) return NextResponse.json({ error: "CSV must have a header row plus at least one data row" }, { status: 400 });

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  // questionText is always required; for mcq we additionally need optionA-D + correctOption,
  // for multi we need options + correctOptions, for numerical we need numericalAnswer.
  if (!headers.includes("questiontext")) {
    return NextResponse.json({
      error: 'Missing required column "questionText". For numerical questions also provide numericalAnswer; for multi provide correctOptions (e.g. "A|C").',
    }, { status: 400 });
  }

  const idx = (name: string) => headers.indexOf(name);
  const cell = (row: string[], name: string): string => idx(name) >= 0 ? (row[idx(name)] ?? "").trim() : "";
  const cellOrNull = (row: string[], name: string): string | null => {
    const v = cell(row, name);
    return v === "" ? null : v;
  };

  const [{ next }] = await db.select({ next: sql<number>`coalesce(max(${mockTestQuestions.questionNumber}), 0) + 1` })
    .from(mockTestQuestions).where(eq(mockTestQuestions.testId, testId));

  const toInsert: Array<typeof mockTestQuestions.$inferInsert> = [];
  const errors: string[] = [];
  let counter = next;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const questionText = cell(row, "questiontext");
    const rawType = cell(row, "questiontype").toLowerCase();
    const questionType: "mcq" | "multi" | "numerical" =
      rawType === "multi" || rawType === "numerical" ? rawType : "mcq";
    const topic = cellOrNull(row, "topic");
    const explanation = cellOrNull(row, "explanation");

    let imageUrl: string | null;
    let optionAImageUrl: string | null;
    let optionBImageUrl: string | null;
    let optionCImageUrl: string | null;
    let optionDImageUrl: string | null;
    let explanationImageUrl: string | null;
    try {
      imageUrl            = validateMockTestImageUrl(cellOrNull(row, "imageurl"));
      optionAImageUrl     = validateMockTestImageUrl(cellOrNull(row, "optionaimageurl"));
      optionBImageUrl     = validateMockTestImageUrl(cellOrNull(row, "optionbimageurl"));
      optionCImageUrl     = validateMockTestImageUrl(cellOrNull(row, "optioncimageurl"));
      optionDImageUrl     = validateMockTestImageUrl(cellOrNull(row, "optiondimageurl"));
      explanationImageUrl = validateMockTestImageUrl(cellOrNull(row, "explanationimageurl"));
    } catch (err) {
      errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : "invalid image URL"}`);
      continue;
    }

    if (!questionText && !imageUrl) {
      errors.push(`Row ${i + 1}: questionText or imageUrl is required`);
      continue;
    }

    let correctOptions: Opt[] | null = null;
    let numericalAnswer: number | null = null;
    let numericalTolerance: number | null = null;
    let mcqCorrect: Opt | null = null;
    let optionA: string | null = null;
    let optionB: string | null = null;
    let optionC: string | null = null;
    let optionD: string | null = null;

    if (questionType === "mcq" || questionType === "multi") {
      optionA = cell(row, "optiona");
      optionB = cell(row, "optionb");
      optionC = cell(row, "optionc");
      optionD = cell(row, "optiond");
      const optHas = (txt: string, img: string | null) => Boolean(txt || img);
      if (!optHas(optionA, optionAImageUrl) || !optHas(optionB, optionBImageUrl) ||
          !optHas(optionC, optionCImageUrl) || !optHas(optionD, optionDImageUrl)) {
        errors.push(`Row ${i + 1}: each of optionA-D needs text or an image URL`);
        continue;
      }
      if (questionType === "mcq") {
        const co = cell(row, "correctoption").toUpperCase();
        if (!isOpt(co)) {
          errors.push(`Row ${i + 1}: correctOption must be A, B, C, or D (got "${co}")`);
          continue;
        }
        mcqCorrect = co;
      } else {
        const raw = cell(row, "correctoptions");
        const picks = raw.split(/[|,;\s]+/).map((s) => s.trim().toUpperCase()).filter((s) => s !== "");
        const valid = picks.filter(isOpt);
        if (valid.length === 0) {
          errors.push(`Row ${i + 1}: correctOptions must list at least one of A-D, e.g. "A|C"`);
          continue;
        }
        correctOptions = (Array.from(new Set(valid)) as Opt[]).sort();
      }
    } else {
      // numerical
      const rawAns = cell(row, "numericalanswer");
      const n = Number(rawAns);
      if (rawAns === "" || !Number.isFinite(n)) {
        errors.push(`Row ${i + 1}: numericalAnswer is required and must be a number for numerical questions`);
        continue;
      }
      numericalAnswer = n;
      const rawTol = cell(row, "numericaltolerance");
      const tol = rawTol === "" ? 0 : Number(rawTol);
      if (!Number.isFinite(tol) || tol < 0) {
        errors.push(`Row ${i + 1}: numericalTolerance must be a non-negative number`);
        continue;
      }
      numericalTolerance = tol;
    }

    toInsert.push({
      testId, questionNumber: counter++, questionText,
      questionType,
      optionA, optionB, optionC, optionD,
      correctOption: mcqCorrect,
      correctOptions,
      numericalAnswer,
      numericalTolerance,
      topic, explanation,
      imageUrl, optionAImageUrl, optionBImageUrl, optionCImageUrl, optionDImageUrl, explanationImageUrl,
    });
  }

  if (toInsert.length === 0) {
    return NextResponse.json({ error: "No valid rows to import", errors }, { status: 400 });
  }

  await db.insert(mockTestQuestions).values(toInsert);
  return NextResponse.json({ success: true, imported: toInsert.length, skipped: errors.length, errors });
}

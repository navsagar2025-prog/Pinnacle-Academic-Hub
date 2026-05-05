import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { mockTests, mockTestQuestions } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import { validateMockTestImageUrl } from "@/lib/server/image-url";

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
  const required = ["questiontext", "optiona", "optionb", "optionc", "optiond", "correctoption"];
  for (const r of required) {
    if (!headers.includes(r)) {
      return NextResponse.json({
        error: `Missing required column "${r}". Required headers: ${required.join(", ")}, optional: topic, explanation`,
      }, { status: 400 });
    }
  }

  const idx = (name: string) => headers.indexOf(name);
  const [{ next }] = await db.select({ next: sql<number>`coalesce(max(${mockTestQuestions.questionNumber}), 0) + 1` })
    .from(mockTestQuestions).where(eq(mockTestQuestions.testId, testId));

  const toInsert: Array<typeof mockTestQuestions.$inferInsert> = [];
  const errors: string[] = [];
  let counter = next;

  const opt = (name: string) => idx(name) >= 0 ? (row: string[]) => row[idx(name)]?.trim() || null : () => null;
  const getImage = {
    q:  opt("imageurl"),
    a:  opt("optionaimageurl"),
    b:  opt("optionbimageurl"),
    c:  opt("optioncimageurl"),
    d:  opt("optiondimageurl"),
    ex: opt("explanationimageurl"),
  };
  const optHas = (txt: string | undefined, img: string | null) => Boolean((txt && txt.trim()) || img);

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const questionText = row[idx("questiontext")]?.trim() ?? "";
    const optionA = row[idx("optiona")]?.trim() ?? "";
    const optionB = row[idx("optionb")]?.trim() ?? "";
    const optionC = row[idx("optionc")]?.trim() ?? "";
    const optionD = row[idx("optiond")]?.trim() ?? "";
    const correctOption = row[idx("correctoption")]?.trim().toUpperCase();
    const topic = idx("topic") >= 0 ? row[idx("topic")]?.trim() || null : null;
    const explanation = idx("explanation") >= 0 ? row[idx("explanation")]?.trim() || null : null;
    let imageUrl: string | null;
    let optionAImageUrl: string | null;
    let optionBImageUrl: string | null;
    let optionCImageUrl: string | null;
    let optionDImageUrl: string | null;
    let explanationImageUrl: string | null;
    try {
      imageUrl            = validateMockTestImageUrl(getImage.q(row));
      optionAImageUrl     = validateMockTestImageUrl(getImage.a(row));
      optionBImageUrl     = validateMockTestImageUrl(getImage.b(row));
      optionCImageUrl     = validateMockTestImageUrl(getImage.c(row));
      optionDImageUrl     = validateMockTestImageUrl(getImage.d(row));
      explanationImageUrl = validateMockTestImageUrl(getImage.ex(row));
    } catch (err) {
      errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : "invalid image URL"}`);
      continue;
    }

    const hasQuestion = questionText.trim() || imageUrl;
    if (!hasQuestion || !optHas(optionA, optionAImageUrl) || !optHas(optionB, optionBImageUrl) ||
        !optHas(optionC, optionCImageUrl) || !optHas(optionD, optionDImageUrl)) {
      errors.push(`Row ${i + 1}: missing question or option (each needs text or image URL)`);
      continue;
    }
    if (!["A", "B", "C", "D"].includes(correctOption)) {
      errors.push(`Row ${i + 1}: correctOption must be A, B, C, or D (got "${correctOption}")`);
      continue;
    }

    toInsert.push({
      testId, questionNumber: counter++, questionText,
      optionA, optionB, optionC, optionD, correctOption,
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

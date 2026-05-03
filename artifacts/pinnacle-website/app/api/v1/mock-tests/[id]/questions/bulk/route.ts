import { NextRequest, NextResponse } from "next/server";
import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { mockTestQuestions } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";

function parseCsv(text: string): string[][] {
  // RFC 4180-compliant state machine. States: FIELD_START, UNQUOTED, QUOTED, QUOTE_IN_QUOTED.
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
        else { cell += c; state = "QUOTED"; } // tolerate stray chars
        break;
    }
  }
  if (cell !== "" || row.length > 0 || state !== "FIELD_START") { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try { await requirePortalRole("admin"); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const { id: testId } = await ctx.params;

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

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const questionText = row[idx("questiontext")]?.trim();
    const optionA = row[idx("optiona")]?.trim();
    const optionB = row[idx("optionb")]?.trim();
    const optionC = row[idx("optionc")]?.trim();
    const optionD = row[idx("optiond")]?.trim();
    const correctOption = row[idx("correctoption")]?.trim().toUpperCase();
    const topic = idx("topic") >= 0 ? row[idx("topic")]?.trim() || null : null;
    const explanation = idx("explanation") >= 0 ? row[idx("explanation")]?.trim() || null : null;

    if (!questionText || !optionA || !optionB || !optionC || !optionD) {
      errors.push(`Row ${i + 1}: missing question or option`);
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
    });
  }

  if (toInsert.length === 0) {
    return NextResponse.json({ error: "No valid rows to import", errors }, { status: 400 });
  }

  await db.insert(mockTestQuestions).values(toInsert);
  return NextResponse.json({ success: true, imported: toInsert.length, skipped: errors.length, errors });
}

// CLI entry for PYQ ingest.
//
// Usage:
//   pnpm --filter @workspace/db run ingest:pyq -- <file> \
//     --exam JEE_MAIN --year 2023 --subject Physics --class 11 \
//     [--label "JEE Main 2023 Jan Shift 1 Physics"] \
//     [--from-text]      # treat <file> as plain .txt, skip PDF extraction
//     [--dry-run]        # parse + plan inserts, do NOT write to DB
//     [--auto-approve]   # publish immediately (skip review queue) — use with care
//
// Defaults: PDFs land in the review queue (reviewStatus='pending', isPublished=false).
// Re-running with the same year is a no-op (dedup). Re-running with a new year
// merges into existing rows (multi-year tracking).

import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { extractPdfText } from "./extract-pdf.js";
import { ingestParsed } from "./ingest.js";
import { parseExamText } from "./parse.js";
import { ALLOWED_EXAMS, type ExamCode, type Subject } from "./types.js";

const ALLOWED_SUBJECTS: Subject[] = ["Physics", "Chemistry", "Mathematics", "Biology"];

function fail(msg: string): never {
  console.error(`Error: ${msg}`);
  process.exit(1);
}

async function main() {
  // pnpm forwards args after `--`; node:util's parseArgs treats a bare `--`
  // as end-of-options, so strip it out before parsing.
  const rawArgs = process.argv.slice(2).filter((a) => a !== "--");
  const { values, positionals } = parseArgs({
    args: rawArgs,
    options: {
      exam: { type: "string" },
      year: { type: "string" },
      subject: { type: "string" },
      class: { type: "string" },
      label: { type: "string" },
      "from-text": { type: "boolean", default: false },
      "dry-run": { type: "boolean", default: false },
      "auto-approve": { type: "boolean", default: false },
    },
    allowPositionals: true,
  });

  const filePath = positionals[0];
  if (!filePath) fail("missing <file> positional argument. See header of run.ts for usage.");

  const exam = values.exam as ExamCode | undefined;
  if (!exam || !ALLOWED_EXAMS.includes(exam)) {
    fail(`--exam must be one of ${ALLOWED_EXAMS.join(", ")}`);
  }

  const year = parseInt(values.year ?? "", 10);
  if (!Number.isFinite(year) || year < 1990 || year > 2100) {
    fail("--year must be a 4-digit year between 1990 and 2100");
  }

  const subject = values.subject as Subject | undefined;
  if (!subject || !ALLOWED_SUBJECTS.includes(subject)) {
    fail(`--subject must be one of ${ALLOWED_SUBJECTS.join(", ")}`);
  }

  const classGrade = values.class;
  const examNameLabel = values.label ?? `${exam.replace(/_/g, " ")} ${year} ${subject}`;

  console.log(`\n[PYQ ingest] file=${filePath}`);
  console.log(`             exam=${exam}  year=${year}  subject=${subject}  class=${classGrade ?? "(none)"}`);
  console.log(`             label="${examNameLabel}"`);
  console.log(`             dry-run=${values["dry-run"]}  auto-approve=${values["auto-approve"]}\n`);

  // 1. Get raw text.
  let text: string;
  if (values["from-text"]) {
    text = await readFile(filePath, "utf-8");
  } else {
    try {
      text = await extractPdfText(filePath);
    } catch (err) {
      fail(`PDF extraction failed: ${(err as Error).message}. ` +
           `If this is a scanned PDF you'll need to OCR it first. ` +
           `For .txt fixtures pass --from-text.`);
    }
  }

  // 2. Parse.
  const parsed = parseExamText(text);
  const withAnswers = parsed.filter((q) => !!q.correctAnswer).length;
  console.log(`Parsed ${parsed.length} questions. ${withAnswers} have an answer-key entry.`);

  if (parsed.length === 0) {
    console.warn(
      "No questions matched the heuristic patterns. The PDF may be:\n" +
      "  - scanned (image-based) → run OCR first\n" +
      "  - using an unusual numbering style → patch parse.ts\n" +
      "  - multi-column with broken text flow → use a different PDF tool",
    );
    process.exit(0);
  }

  // 3. Dedup + insert.
  const result = await ingestParsed(parsed, {
    exam: exam!,
    examNameLabel,
    year,
    subject: subject!,
    classGrade,
    reviewStatus: values["auto-approve"] ? "approved" : "pending",
    dryRun: values["dry-run"],
  });

  console.log("\n[PYQ ingest result]");
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

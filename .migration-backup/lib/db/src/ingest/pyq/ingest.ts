// Take parsed questions + answer key, dedup against the DB,
// merge multi-year duplicates into a single row, and insert the rest.

import { and, eq, isNull } from "drizzle-orm";
import { db } from "../../index.js";
import { questionBank } from "../../schema/index.js";
import { normalizeForDedup } from "../foundation/types.js";
import type { IngestOptions, IngestResult, ParsedQuestionWithAnswer } from "./types.js";

export async function ingestParsed(
  parsed: ParsedQuestionWithAnswer[],
  opts: IngestOptions,
): Promise<IngestResult> {
  // 1. Drop questions without an answer key — they can't be marked correct.
  const answered = parsed.filter((q) => !!q.correctAnswer);
  const unanswered = parsed.length - answered.length;

  // 2. Drop questions with no parsed options or fewer than 2.
  const wellFormed = answered.filter((q) => Object.keys(q.options).length >= 2);

  // 3. In-batch dedup by normalised text.
  const seen = new Set<string>();
  const unique: ParsedQuestionWithAnswer[] = [];
  for (const q of wellFormed) {
    const key = `${opts.subject}::${normalizeForDedup(q.questionText)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(q);
  }
  const dedupInBatch = wellFormed.length - unique.length;

  // 4. Pull all existing PYQ rows for this subject and build a normalised-text map.
  //    (We pull the full set so multi-year merging works across older imports.)
  const existing = await db
    .select({
      id: questionBank.id,
      questionText: questionBank.questionText,
      examName: questionBank.examName,
      year: questionBank.year,
    })
    .from(questionBank)
    .where(and(
      eq(questionBank.source, "PYQ"),
      eq(questionBank.subject, opts.subject),
      // Don't merge into soft-deleted rows; they need to be re-inserted as
      // fresh rows on a new ingest, not silently revived.
      isNull(questionBank.deletedAt),
    ));

  const existingByKey = new Map<string, (typeof existing)[number]>();
  for (const row of existing) {
    existingByKey.set(normalizeForDedup(row.questionText), row);
  }

  // 5. Sort each question into 'merge' or 'insert'.
  const toInsert: (typeof questionBank.$inferInsert)[] = [];
  const toMerge: { id: string; newExamName: string }[] = [];

  for (const q of unique) {
    const key = normalizeForDedup(q.questionText);
    const match = existingByKey.get(key);
    if (match) {
      // Multi-year repeat. Append our year to the row's examName if it's not
      // already mentioned. Schema has a single `year` column, so we keep the
      // primary year as-is and record secondary years in the label.
      const yearStr = String(opts.year);
      const currentName = match.examName ?? opts.examNameLabel;
      if (!currentName.includes(yearStr)) {
        const newName = currentName.includes("(also appeared")
          ? currentName.replace(/\)$/, `, ${yearStr})`)
          : `${currentName} (also appeared ${yearStr})`;
        toMerge.push({ id: match.id, newExamName: newName });
      }
    } else {
      toInsert.push({
        subject: opts.subject,
        classGrade: opts.classGrade,
        topic: "Unspecified",
        difficulty: "medium",
        questionText: q.questionText,
        questionType: "mcq",
        options: q.options,
        correctAnswer: q.correctAnswer!,
        solution: `Answer: ${q.correctAnswer}. Source: ${opts.examNameLabel}, Q${q.num}.`,
        marks: opts.exam === "JEE_ADVANCED" ? 4 : 4,
        source: "PYQ",
        examTarget: [opts.exam],
        examName: opts.examNameLabel,
        year: opts.year,
        reviewStatus: opts.reviewStatus,
        isPublished: opts.reviewStatus === "approved",
      });
    }
  }

  if (opts.dryRun) {
    return {
      parsed: parsed.length,
      dedupInBatch,
      merged: toMerge.length,
      inserted: toInsert.length,
      unanswered,
      dryRun: true,
      samplePreview: toInsert.slice(0, 3),
    };
  }

  // 6. Persist.
  if (toInsert.length > 0) {
    await db.insert(questionBank).values(toInsert);
  }
  for (const m of toMerge) {
    await db
      .update(questionBank)
      .set({ examName: m.newExamName })
      .where(eq(questionBank.id, m.id));
  }

  return {
    parsed: parsed.length,
    dedupInBatch,
    merged: toMerge.length,
    inserted: toInsert.length,
    unanswered,
    dryRun: false,
  };
}

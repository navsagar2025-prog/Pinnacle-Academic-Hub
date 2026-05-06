// Foundation (Class 9 & 10) seed runner.
//
// Hand-authored questions imported as MANUAL source — they are NOT routed
// through the AI review queue (that exists for AI-generated rows only).
// Inserted with reviewStatus='approved' and isPublished=true so they are
// immediately visible to students.
//
// Run with:  pnpm --filter @workspace/db run seed:foundation
//
// Idempotent: a question is skipped if either (a) another row with the same
// normalised question text + same subject already exists in the DB, or
// (b) the same normalised text appears twice in this batch.

import { db } from "../../index.js";
import { questionBank } from "../../schema/index.js";
import { eq, and, inArray } from "drizzle-orm";
import { CLASS_9_MATHS } from "./data/class-9-maths.js";
import { CLASS_9_SCIENCE } from "./data/class-9-science.js";
import { CLASS_10_MATHS } from "./data/class-10-maths.js";
import { CLASS_10_SCIENCE } from "./data/class-10-science.js";
import { CLASS_9_MATHS_B2 } from "./data/class-9-maths-b2.js";
import { CLASS_9_SCIENCE_B2 } from "./data/class-9-science-b2.js";
import { CLASS_10_MATHS_B2 } from "./data/class-10-maths-b2.js";
import { CLASS_10_SCIENCE_B2 } from "./data/class-10-science-b2.js";
import { normalizeForDedup, type FoundationQuestion } from "./types.js";

async function main() {
  const all: FoundationQuestion[] = [
    ...CLASS_9_MATHS,
    ...CLASS_9_SCIENCE,
    ...CLASS_10_MATHS,
    ...CLASS_10_SCIENCE,
    ...CLASS_9_MATHS_B2,
    ...CLASS_9_SCIENCE_B2,
    ...CLASS_10_MATHS_B2,
    ...CLASS_10_SCIENCE_B2,
  ];

  console.log(`Loaded ${all.length} hand-authored Foundation questions across 4 buckets.`);

  // 1. In-batch dedup.
  const seenInBatch = new Map<string, FoundationQuestion>();
  const inBatchDupes: string[] = [];
  for (const q of all) {
    const key = `${q.subject}::${normalizeForDedup(q.questionText)}`;
    if (seenInBatch.has(key)) {
      inBatchDupes.push(q.questionText.slice(0, 60));
    } else {
      seenInBatch.set(key, q);
    }
  }
  if (inBatchDupes.length > 0) {
    console.log(`Skipped ${inBatchDupes.length} in-batch duplicate(s):`);
    inBatchDupes.forEach((t) => console.log(`  - ${t}…`));
  }
  const unique = Array.from(seenInBatch.values());

  // 2. DB dedup. Pull existing question_text rows for the affected subjects
  //    and skip any whose normalised text matches.
  const subjects = Array.from(new Set(unique.map((q) => q.subject)));
  const existing = await db
    .select({ subject: questionBank.subject, questionText: questionBank.questionText })
    .from(questionBank)
    .where(inArray(questionBank.subject, subjects));

  const existingKeys = new Set(
    existing.map((r) => `${r.subject}::${normalizeForDedup(r.questionText)}`),
  );

  const toInsert = unique.filter((q) => {
    const key = `${q.subject}::${normalizeForDedup(q.questionText)}`;
    return !existingKeys.has(key);
  });

  const skippedAsExisting = unique.length - toInsert.length;
  console.log(`${skippedAsExisting} question(s) already in DB — skipped.`);

  if (toInsert.length === 0) {
    console.log("Nothing new to insert. Done.");
    process.exit(0);
  }

  // 3. Insert. examName is set to the NCERT chapter so the existing exam-name
  //    filter on the admin page can group them; examTarget=['FOUNDATION'] so
  //    the new exam-target filter picks them up; source='MANUAL' keeps them
  //    out of the AI review queue.
  const rows = toInsert.map((q) => ({
    subject: q.subject,
    topic: q.topic,
    classGrade: q.classGrade,
    difficulty: q.difficulty,
    questionType: "mcq" as const,
    questionText: q.questionText,
    options: q.options as Record<string, string>,
    correctAnswer: q.correctAnswer,
    solution: q.solution,
    examName: q.ncertChapter,
    marks: 4,
    source: "MANUAL",
    reviewStatus: "approved",
    isPublished: true,
    examTarget: ["FOUNDATION"],
    language: "en",
  }));

  console.log(`Inserting ${rows.length} new Foundation questions…`);
  const inserted = await db.insert(questionBank).values(rows).returning({ id: questionBank.id });
  console.log(`Inserted ${inserted.length} rows.`);

  // 4. Per-bucket summary so it is obvious what landed where.
  const byBucket = new Map<string, number>();
  for (const q of toInsert) {
    const k = `${q.subject} · Class ${q.classGrade}`;
    byBucket.set(k, (byBucket.get(k) ?? 0) + 1);
  }
  console.log("Inserted by bucket:");
  for (const [k, v] of [...byBucket.entries()].sort()) {
    console.log(`  ${k}: ${v}`);
  }

  // Drizzle's pg pool keeps the process alive; exit explicitly.
  process.exit(0);
}

main().catch((err) => {
  console.error("Foundation seed failed:", err);
  process.exit(1);
});

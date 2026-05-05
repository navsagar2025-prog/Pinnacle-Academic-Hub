import { db } from "@workspace/db";
import { mockTestQuestions, mockTestAnswers, mockTestAttempts } from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";
import type { QuestionRow } from "@/components/portal/QuestionAnalytics";

const VALID_OPTS = ["A", "B", "C", "D"] as const;
type Opt = (typeof VALID_OPTS)[number];
const isOpt = (v: unknown): v is Opt =>
  typeof v === "string" && (VALID_OPTS as readonly string[]).includes(v);

/**
 * Per-question analytics for a mock test, aggregated across all completed
 * attempts. Returns one row per question (in question-number order).
 */
export async function getQuestionAnalytics(testId: string): Promise<QuestionRow[]> {
  const questions = await db
    .select({
      id: mockTestQuestions.id,
      questionNumber: mockTestQuestions.questionNumber,
      topic: mockTestQuestions.topic,
      questionType: mockTestQuestions.questionType,
      questionText: mockTestQuestions.questionText,
    })
    .from(mockTestQuestions)
    .where(eq(mockTestQuestions.testId, testId))
    .orderBy(mockTestQuestions.questionNumber);

  if (questions.length === 0) return [];

  // Distinct completed attempts for this test (denominator for "skipped").
  const [{ completedAttempts }] = await db
    .select({ completedAttempts: sql<number>`count(*)::int` })
    .from(mockTestAttempts)
    .where(and(eq(mockTestAttempts.testId, testId), eq(mockTestAttempts.isCompleted, true)));

  // Aggregate answer rows joined to completed attempts only.
  const stats = await db
    .select({
      questionId: mockTestAnswers.questionId,
      attempted: sql<number>`count(case when ${mockTestAnswers.isCorrect} is not null then 1 end)::int`,
      correct: sql<number>`count(case when ${mockTestAnswers.isCorrect} = true then 1 end)::int`,
      wrong: sql<number>`count(case when ${mockTestAnswers.isCorrect} = false then 1 end)::int`,
      avgTime: sql<number>`coalesce(avg(case when ${mockTestAnswers.timeSpentSeconds} > 0 then ${mockTestAnswers.timeSpentSeconds} end), 0)::float`,
    })
    .from(mockTestAnswers)
    .innerJoin(mockTestAttempts, eq(mockTestAnswers.attemptId, mockTestAttempts.id))
    .where(and(eq(mockTestAttempts.testId, testId), eq(mockTestAttempts.isCompleted, true)))
    .groupBy(mockTestAnswers.questionId);

  // Top wrong selectedOption per MCQ question.
  const wrongOpts = await db
    .select({
      questionId: mockTestAnswers.questionId,
      selectedOption: mockTestAnswers.selectedOption,
      cnt: sql<number>`count(*)::int`,
    })
    .from(mockTestAnswers)
    .innerJoin(mockTestAttempts, eq(mockTestAnswers.attemptId, mockTestAttempts.id))
    .where(and(
      eq(mockTestAttempts.testId, testId),
      eq(mockTestAttempts.isCompleted, true),
      eq(mockTestAnswers.isCorrect, false),
    ))
    .groupBy(mockTestAnswers.questionId, mockTestAnswers.selectedOption);

  const topWrongByQ = new Map<string, { option: string; count: number }>();
  for (const w of wrongOpts) {
    if (!isOpt(w.selectedOption)) continue;
    const prev = topWrongByQ.get(w.questionId);
    if (!prev || w.cnt > prev.count) {
      topWrongByQ.set(w.questionId, { option: w.selectedOption, count: w.cnt });
    }
  }

  const statsByQ = new Map(stats.map((s) => [s.questionId, s]));

  return questions.map((q) => {
    const s = statsByQ.get(q.id);
    const attempted = s?.attempted ?? 0;
    const correct = s?.correct ?? 0;
    const wrong = s?.wrong ?? 0;
    const skipped = Math.max(0, completedAttempts - attempted);
    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
    const avgTime = s?.avgTime ?? 0;
    const top = topWrongByQ.get(q.id);
    const preview = q.questionText
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 140);
    return {
      questionId: q.id,
      questionNumber: q.questionNumber,
      topic: q.topic,
      questionType: q.questionType,
      questionPreview: preview,
      totalAttempts: attempted,
      correctCount: correct,
      wrongCount: wrong,
      skippedCount: skipped,
      accuracy,
      avgTimeSeconds: avgTime,
      topWrongOption: top?.option ?? null,
      topWrongCount: top?.count ?? 0,
    };
  });
}

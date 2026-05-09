import { db } from "@workspace/db";
import {
  mockTestAnswers,
  mockTestAttempts,
  mockTestQuestions,
  questionAttempts,
  questionBank,
} from "@workspace/db/schema";
import { and, eq, sql } from "drizzle-orm";

export type WeakTopic = {
  subject: string;
  topic: string;
  attempted: number;
  correct: number;
  accuracy: number;
  source: "mock" | "bank" | "both";
};

/**
 * Compute a student's weakest topics by combining performance from completed
 * mock-test attempts and question-bank attempts. Topics with too few attempts
 * (< MIN_ATTEMPTS) are excluded so we don't over-recommend after a single
 * unlucky question.
 */
export async function getWeakTopics(
  studentId: string,
  opts?: { limit?: number; minAttempts?: number; maxAccuracy?: number },
): Promise<WeakTopic[]> {
  const limit = opts?.limit ?? 5;
  const minAttempts = opts?.minAttempts ?? 3;
  const maxAccuracy = opts?.maxAccuracy ?? 70;

  // Mock test answers, joined to question (for topic) and attempt (for student
  // + completion flag). Subject is inferred from section name where present —
  // for now we group by question.topic only and bucket subject as "Mock Test".
  const mockRows = await db
    .select({
      topic: mockTestQuestions.topic,
      attempted: sql<number>`count(case when ${mockTestAnswers.isCorrect} is not null then 1 end)::int`,
      correct: sql<number>`count(case when ${mockTestAnswers.isCorrect} = true then 1 end)::int`,
    })
    .from(mockTestAnswers)
    .innerJoin(mockTestQuestions, eq(mockTestAnswers.questionId, mockTestQuestions.id))
    .innerJoin(mockTestAttempts, eq(mockTestAnswers.attemptId, mockTestAttempts.id))
    .where(and(
      eq(mockTestAttempts.studentId, studentId),
      eq(mockTestAttempts.isCompleted, true),
    ))
    .groupBy(mockTestQuestions.topic);

  // Question bank attempts joined to questionBank for subject + topic.
  const bankRows = await db
    .select({
      subject: questionBank.subject,
      topic: questionBank.topic,
      attempted: sql<number>`count(case when ${questionAttempts.isCorrect} is not null then 1 end)::int`,
      correct: sql<number>`count(case when ${questionAttempts.isCorrect} = true then 1 end)::int`,
    })
    .from(questionAttempts)
    .innerJoin(questionBank, eq(questionAttempts.questionId, questionBank.id))
    .where(eq(questionAttempts.studentId, studentId))
    .groupBy(questionBank.subject, questionBank.topic);

  // Merge: key by `subject||topic` (subject "Mock Test" for mock-only).
  type Bucket = { subject: string; topic: string; attempted: number; correct: number; sources: Set<"mock" | "bank"> };
  const buckets = new Map<string, Bucket>();

  for (const r of mockRows) {
    const topic = (r.topic ?? "").trim();
    if (!topic) continue;
    const key = `__mock__::${topic}`;
    const b = buckets.get(key) ?? { subject: "Mock Test", topic, attempted: 0, correct: 0, sources: new Set() };
    b.attempted += r.attempted;
    b.correct += r.correct;
    b.sources.add("mock");
    buckets.set(key, b);
  }

  for (const r of bankRows) {
    const topic = (r.topic ?? "").trim();
    if (!topic) continue;
    const key = `${r.subject}::${topic}`;
    const b = buckets.get(key) ?? { subject: r.subject, topic, attempted: 0, correct: 0, sources: new Set() };
    b.attempted += r.attempted;
    b.correct += r.correct;
    b.sources.add("bank");
    buckets.set(key, b);

    // If this topic also appeared as mock-only, fold into the subject-tagged
    // bucket and drop the placeholder so the recommendation links to the
    // correct subject.
    const mockKey = `__mock__::${topic}`;
    const mock = buckets.get(mockKey);
    if (mock && mockKey !== key) {
      b.attempted += mock.attempted;
      b.correct += mock.correct;
      b.sources.add("mock");
      buckets.delete(mockKey);
    }
  }

  const all: WeakTopic[] = Array.from(buckets.values())
    .filter((b) => b.attempted >= minAttempts)
    .map((b) => {
      const accuracy = Math.round((b.correct / b.attempted) * 100);
      const sources = Array.from(b.sources);
      const source: WeakTopic["source"] =
        sources.length === 2 ? "both" : sources[0]!;
      return {
        subject: b.subject,
        topic: b.topic,
        attempted: b.attempted,
        correct: b.correct,
        accuracy,
        source,
      };
    })
    .filter((b) => b.accuracy < maxAccuracy)
    .sort((a, b) => a.accuracy - b.accuracy || b.attempted - a.attempted);

  return all.slice(0, limit);
}

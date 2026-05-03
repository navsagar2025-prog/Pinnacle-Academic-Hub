import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { mockTests, mockTestQuestions, mockTestAttempts, mockTestAnswers, students } from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: attemptId } = await ctx.params;
  const body = await req.json().catch(() => null);
  const answers = (body?.answers ?? {}) as Record<string, "A" | "B" | "C" | "D" | null>;
  const timeSpentSeconds = Number(body?.timeSpentSeconds) || 0;

  // Atomic claim: lock the attempt row, verify ownership, and mark in-progress
  // by setting submittedAt only if not already completed.
  const result = await db.transaction(async (tx) => {
    const [attempt] = await tx.select().from(mockTestAttempts)
      .where(eq(mockTestAttempts.id, attemptId))
      .for("update")
      .limit(1);
    if (!attempt) return { status: 404, body: { error: "Attempt not found" } };
    if (attempt.isCompleted) return { status: 409, body: { error: "Already submitted", attemptId } };

    // Authorization: if attempt belongs to a student, verify caller owns it.
    // Anonymous attempts (studentId === null) are allowed without auth (public tests).
    if (attempt.studentId) {
      const user = await getDbUser();
      if (!user) return { status: 401, body: { error: "Login required" } };
      const [s] = await tx.select({ id: students.id }).from(students)
        .where(and(eq(students.userId, user.id), eq(students.isActive, true))).limit(1);
      if (!s || s.id !== attempt.studentId) return { status: 403, body: { error: "Not your attempt" } };
    }

    const [test] = await tx.select().from(mockTests).where(eq(mockTests.id, attempt.testId)).limit(1);
    if (!test) return { status: 404, body: { error: "Test not found" } };

    const questions = await tx.select().from(mockTestQuestions).where(eq(mockTestQuestions.testId, attempt.testId));

    const negativeMark = -(test.marksPerQuestion * test.negativeMarkingPercent) / 100;

    let attemptedCount = 0, correctCount = 0, wrongCount = 0, score = 0;
    const answerRows: Array<{ attemptId: string; questionId: string; selectedOption: string | null; isCorrect: boolean | null; marksAwarded: number }> = [];

    for (const q of questions) {
      const sel = answers[q.id] ?? null;
      if (sel === null || sel === undefined) {
        answerRows.push({ attemptId, questionId: q.id, selectedOption: null, isCorrect: null, marksAwarded: 0 });
        continue;
      }
      attemptedCount++;
      const isCorrect = sel === q.correctOption;
      let marks = 0;
      if (isCorrect) { correctCount++; marks = test.marksPerQuestion; }
      else { wrongCount++; marks = negativeMark; }
      score += marks;
      answerRows.push({ attemptId, questionId: q.id, selectedOption: sel, isCorrect, marksAwarded: marks });
    }

    if (answerRows.length > 0) await tx.insert(mockTestAnswers).values(answerRows);

    await tx.update(mockTestAttempts).set({
      submittedAt: new Date(),
      attemptedCount, correctCount, wrongCount,
      score: Math.round(score),
      timeSpentSeconds,
      isCompleted: true,
    }).where(eq(mockTestAttempts.id, attemptId));

    return { status: 200, body: { success: true, attemptId, score: Math.round(score), correctCount, wrongCount, attemptedCount } };
  });

  return NextResponse.json(result.body, { status: result.status });
}

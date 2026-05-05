import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { mockTestAttempts, mockTestAnswers, mockTestQuestions, students } from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";

// Autosave a single answer (or mark-for-review toggle) during an in-progress attempt.
// Idempotent upsert keyed on (attemptId, questionId).
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: attemptId } = await ctx.params;
  const body = await req.json().catch(() => null);
  const questionId = typeof body?.questionId === "string" ? body.questionId : null;
  const rawSel = body?.selectedOption;
  const selectedOption: "A" | "B" | "C" | "D" | null =
    rawSel === "A" || rawSel === "B" || rawSel === "C" || rawSel === "D" ? rawSel : null;
  const isMarkedForReview = body?.isMarkedForReview === true;
  if (!questionId) return NextResponse.json({ error: "questionId required" }, { status: 400 });

  // Run inside a transaction with FOR UPDATE on the attempt row so a concurrent
  // submit cannot complete the attempt between our read and our upsert. This
  // prevents an autosave from clobbering graded values after submission.
  const result = await db.transaction(async (tx) => {
    const [attempt] = await tx.select().from(mockTestAttempts)
      .where(eq(mockTestAttempts.id, attemptId))
      .for("update")
      .limit(1);
    if (!attempt) return { status: 404, body: { error: "Attempt not found" } };
    if (attempt.isCompleted) return { status: 409, body: { error: "Attempt already submitted" } };

    if (attempt.studentId) {
      const user = await getDbUser();
      if (!user) return { status: 401, body: { error: "Login required" } };
      const [s] = await tx.select({ id: students.id }).from(students)
        .where(and(eq(students.userId, user.id), eq(students.isActive, true))).limit(1);
      if (!s || s.id !== attempt.studentId) return { status: 403, body: { error: "Forbidden" } };
    }

    const [q] = await tx.select({ id: mockTestQuestions.id })
      .from(mockTestQuestions)
      .where(and(eq(mockTestQuestions.id, questionId), eq(mockTestQuestions.testId, attempt.testId)))
      .limit(1);
    if (!q) return { status: 400, body: { error: "Question does not belong to this test" } };

    await tx.insert(mockTestAnswers).values({
      attemptId, questionId,
      selectedOption,
      isMarkedForReview,
      isCorrect: null,
      marksAwarded: 0,
    }).onConflictDoUpdate({
      target: [mockTestAnswers.attemptId, mockTestAnswers.questionId],
      set: { selectedOption, isMarkedForReview, updatedAt: new Date() },
    });

    return { status: 200, body: { success: true } };
  });

  return NextResponse.json(result.body, { status: result.status });
}

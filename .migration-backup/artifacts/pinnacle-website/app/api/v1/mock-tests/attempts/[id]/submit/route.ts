import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { mockTests, mockTestQuestions, mockTestAttempts, mockTestAnswers, students } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const VALID_OPTS = ["A", "B", "C", "D"] as const;
type Opt = (typeof VALID_OPTS)[number];
const isOpt = (v: unknown): v is Opt =>
  typeof v === "string" && (VALID_OPTS as readonly string[]).includes(v);

type ClientAnswer = {
  selectedOption?: Opt | null;
  selectedOptions?: Opt[] | null;
  numericalResponse?: number | null;
  timeSpentSeconds?: number | null;
} | Opt | null;

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: attemptId } = await ctx.params;
  const body = await req.json().catch(() => null);
  const answersRaw = (body?.answers ?? {}) as Record<string, ClientAnswer>;
  const timeSpentSeconds = Number(body?.timeSpentSeconds) || 0;

  const result = await db.transaction(async (tx) => {
    const [attempt] = await tx.select().from(mockTestAttempts)
      .where(eq(mockTestAttempts.id, attemptId))
      .for("update")
      .limit(1);
    if (!attempt) return { status: 404, body: { error: "Attempt not found" } };
    if (attempt.isCompleted) return { status: 409, body: { error: "Already submitted", attemptId } };

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

    // Merge autosaved rows with the final body payload (body wins per question).
    const saved = await tx.select().from(mockTestAnswers).where(eq(mockTestAnswers.attemptId, attemptId));
    const savedByQ = new Map(saved.map((r) => [r.questionId, r]));

    let attemptedCount = 0, correctCount = 0, wrongCount = 0, score = 0;

    for (const q of questions) {
      const bodyEntry = answersRaw[q.id];
      const savedRow = savedByQ.get(q.id);

      // Resolve per-type response (body wins over saved row).
      let selectedOption: Opt | null = null;
      let selectedOptions: Opt[] | null = null;
      let numericalResponse: number | null = null;

      if (q.questionType === "mcq") {
        if (typeof bodyEntry === "string" && isOpt(bodyEntry)) {
          selectedOption = bodyEntry;
        } else if (bodyEntry && typeof bodyEntry === "object" && isOpt(bodyEntry.selectedOption ?? undefined)) {
          selectedOption = bodyEntry.selectedOption as Opt;
        } else if (savedRow?.selectedOption && isOpt(savedRow.selectedOption)) {
          selectedOption = savedRow.selectedOption;
        }
      } else if (q.questionType === "multi") {
        const fromBody = bodyEntry && typeof bodyEntry === "object" && Array.isArray(bodyEntry.selectedOptions)
          ? (bodyEntry.selectedOptions.filter(isOpt) as Opt[])
          : null;
        const fromSaved = Array.isArray(savedRow?.selectedOptions)
          ? (savedRow!.selectedOptions!.filter(isOpt) as Opt[])
          : null;
        const picked = fromBody ?? fromSaved ?? [];
        selectedOptions = (Array.from(new Set(picked)) as Opt[]).sort();
        if (selectedOptions.length === 0) selectedOptions = null;
      } else if (q.questionType === "numerical") {
        const fromBody = bodyEntry && typeof bodyEntry === "object" && bodyEntry.numericalResponse !== undefined
          ? bodyEntry.numericalResponse
          : undefined;
        const candidate = fromBody !== undefined ? fromBody : savedRow?.numericalResponse;
        if (candidate !== null && candidate !== undefined && Number.isFinite(Number(candidate))) {
          numericalResponse = Number(candidate);
        }
      }

      // Grade.
      let isCorrect: boolean | null = null;
      let marks = 0;
      let attempted = false;

      if (q.questionType === "mcq" && selectedOption) {
        attempted = true;
        isCorrect = selectedOption === q.correctOption;
      } else if (q.questionType === "multi" && selectedOptions && selectedOptions.length > 0) {
        attempted = true;
        const correct = (q.correctOptions ?? []).filter(isOpt).slice().sort();
        isCorrect =
          correct.length === selectedOptions.length &&
          correct.every((c, i) => c === selectedOptions![i]);
      } else if (q.questionType === "numerical" && numericalResponse !== null) {
        attempted = true;
        const target = q.numericalAnswer;
        const tol = q.numericalTolerance ?? 0;
        if (target !== null && target !== undefined && Number.isFinite(target)) {
          isCorrect = Math.abs(numericalResponse - target) <= tol + 1e-9;
        } else {
          isCorrect = false;
        }
      }

      if (attempted) {
        attemptedCount++;
        if (isCorrect) { correctCount++; marks = test.marksPerQuestion; }
        else { wrongCount++; marks = negativeMark; }
        score += marks;
      }

      // Per-question time: take max of body-supplied cumulative and any saved value.
      const bodyTimeRaw = bodyEntry && typeof bodyEntry === "object" && bodyEntry.timeSpentSeconds != null
        ? Number(bodyEntry.timeSpentSeconds)
        : NaN;
      const bodyTime = Number.isFinite(bodyTimeRaw) && bodyTimeRaw >= 0
        ? Math.min(Math.floor(bodyTimeRaw), 60 * 60 * 24)
        : 0;
      const savedTime = savedRow?.timeSpentSeconds ?? 0;
      const qTime = Math.max(bodyTime, savedTime);

      await tx.insert(mockTestAnswers).values({
        attemptId, questionId: q.id,
        selectedOption, selectedOptions, numericalResponse,
        isCorrect, marksAwarded: marks,
        timeSpentSeconds: qTime,
      }).onConflictDoUpdate({
        target: [mockTestAnswers.attemptId, mockTestAnswers.questionId],
        set: { selectedOption, selectedOptions, numericalResponse, isCorrect, marksAwarded: marks, timeSpentSeconds: qTime, updatedAt: new Date() },
      });
    }

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

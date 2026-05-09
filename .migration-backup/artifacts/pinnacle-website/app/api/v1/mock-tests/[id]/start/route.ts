import { NextRequest, NextResponse } from "next/server";
import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { mockTests, mockTestQuestions, mockTestAttempts, students } from "@workspace/db/schema";
import { eq, and, sql, isNull, desc } from "drizzle-orm";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  let user;
  try { user = await requirePortalRole("student"); } catch { return NextResponse.json({ error: "Login required" }, { status: 401 }); }

  const { id: testId } = await ctx.params;

  const [test] = await db.select().from(mockTests).where(eq(mockTests.id, testId)).limit(1);
  if (!test || !test.isPublished) return NextResponse.json({ error: "Test not available" }, { status: 404 });

  const [student] = await db.select({ id: students.id, batchId: students.batchId })
    .from(students)
    .where(and(eq(students.userId, user.id), eq(students.isActive, true)))
    .limit(1);

  // Audience check: student must belong to the test's batch (or test must be batch-less).
  if (test.batchId && (!student || student.batchId !== test.batchId)) {
    return NextResponse.json({ error: "Test not available" }, { status: 403 });
  }

  // Schedule check: enforce window before creating an attempt.
  const now = Date.now();
  if (test.scheduledStart && new Date(test.scheduledStart).getTime() > now) {
    return NextResponse.json({ error: "Test has not started yet" }, { status: 403 });
  }
  if (test.scheduledEnd && new Date(test.scheduledEnd).getTime() < now) {
    return NextResponse.json({ error: "Test window has closed" }, { status: 403 });
  }

  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` })
    .from(mockTestQuestions).where(eq(mockTestQuestions.testId, testId));
  const totalQuestions = Number(count) || 0;
  if (totalQuestions === 0) return NextResponse.json({ error: "Test has no questions yet" }, { status: 400 });

  const maxScore = totalQuestions * test.marksPerQuestion;

  // Reuse an existing in-progress attempt instead of creating duplicates if
  // the student opens the start endpoint twice (e.g. another tab).
  if (student?.id) {
    const [existing] = await db.select({ id: mockTestAttempts.id })
      .from(mockTestAttempts)
      .where(and(
        eq(mockTestAttempts.testId, testId),
        eq(mockTestAttempts.studentId, student.id),
        eq(mockTestAttempts.isCompleted, false),
        isNull(mockTestAttempts.submittedAt),
      ))
      .orderBy(desc(mockTestAttempts.startedAt))
      .limit(1);
    if (existing) return NextResponse.json({ success: true, attemptId: existing.id, resumed: true });
  }

  const [attempt] = await db.insert(mockTestAttempts).values({
    testId,
    studentId: student?.id ?? null,
    totalQuestions,
    maxScore,
  }).returning();

  return NextResponse.json({ success: true, attemptId: attempt.id });
}

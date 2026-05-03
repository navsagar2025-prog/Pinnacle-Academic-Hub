import { NextRequest, NextResponse } from "next/server";
import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { mockTests, mockTestQuestions, mockTestAttempts, students } from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  let user;
  try { user = await requirePortalRole("student"); } catch { return NextResponse.json({ error: "Login required" }, { status: 401 }); }

  const { id: testId } = await ctx.params;

  const [test] = await db.select().from(mockTests).where(eq(mockTests.id, testId)).limit(1);
  if (!test || !test.isPublished) return NextResponse.json({ error: "Test not available" }, { status: 404 });

  const [student] = await db.select({ id: students.id })
    .from(students)
    .where(and(eq(students.userId, user.id), eq(students.isActive, true)))
    .limit(1);

  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` })
    .from(mockTestQuestions).where(eq(mockTestQuestions.testId, testId));
  const totalQuestions = Number(count) || 0;
  if (totalQuestions === 0) return NextResponse.json({ error: "Test has no questions yet" }, { status: 400 });

  const maxScore = totalQuestions * test.marksPerQuestion;

  const [attempt] = await db.insert(mockTestAttempts).values({
    testId,
    studentId: student?.id ?? null,
    totalQuestions,
    maxScore,
  }).returning();

  return NextResponse.json({ success: true, attemptId: attempt.id });
}

import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { questionAttempts, questionBank, students } from "@workspace/db/schema";
import { and, desc, eq } from "drizzle-orm";

async function studentIdFor(userId: string) {
  const [s] = await db.select({ id: students.id })
    .from(students).where(and(eq(students.userId, userId), eq(students.isActive, true))).limit(1);
  return s?.id ?? null;
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const sid = await studentIdFor(user.id);
  if (!sid) return NextResponse.json({ error: "Active enrollment required" }, { status: 403 });
  const { id: questionId } = await ctx.params;

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const submittedAnswer = body && typeof body.submittedAnswer === "string" ? body.submittedAnswer : null;
  const timeSpentSeconds = body && typeof body.timeSpentSeconds === "number"
    ? Math.max(0, Math.min(60 * 60 * 6, Math.round(body.timeSpentSeconds)))
    : null;

  const [q] = await db.select({
    id: questionBank.id,
    correctAnswer: questionBank.correctAnswer,
    questionType: questionBank.questionType,
  }).from(questionBank).where(eq(questionBank.id, questionId)).limit(1);
  if (!q) return NextResponse.json({ error: "Question not found" }, { status: 404 });

  let isCorrect: boolean | null = null;
  if (submittedAnswer != null) {
    if (q.questionType === "mcq" || q.questionType === "numerical") {
      isCorrect = submittedAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
    }
  }

  const [created] = await db.insert(questionAttempts).values({
    studentId: sid,
    questionId,
    submittedAnswer,
    isCorrect,
    timeSpentSeconds,
  }).returning();

  return NextResponse.json({ success: true, attempt: created });
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const sid = await studentIdFor(user.id);
  if (!sid) return NextResponse.json({ error: "Active enrollment required" }, { status: 403 });
  const { id: questionId } = await ctx.params;

  const rows = await db.select().from(questionAttempts)
    .where(and(eq(questionAttempts.studentId, sid), eq(questionAttempts.questionId, questionId)))
    .orderBy(desc(questionAttempts.createdAt))
    .limit(20);

  return NextResponse.json({ success: true, attempts: rows });
}

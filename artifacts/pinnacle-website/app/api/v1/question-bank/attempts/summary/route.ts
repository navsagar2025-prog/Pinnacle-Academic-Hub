import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { questionAttempts, questionBank, students } from "@workspace/db/schema";
import { and, eq, isNull, sql } from "drizzle-orm";

export async function GET(_req: NextRequest) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const [s] = await db.select({ id: students.id })
    .from(students).where(and(eq(students.userId, user.id), eq(students.isActive, true))).limit(1);
  if (!s) return NextResponse.json({ error: "Active enrollment required" }, { status: 403 });

  const bySubject = await db
    .select({
      subject: questionBank.subject,
      total: sql<number>`count(*)::int`,
      correct: sql<number>`count(*) filter (where ${questionAttempts.isCorrect} = true)::int`,
      gradable: sql<number>`count(*) filter (where ${questionAttempts.isCorrect} is not null)::int`,
    })
    .from(questionAttempts)
    .innerJoin(questionBank, eq(questionAttempts.questionId, questionBank.id))
    .where(and(eq(questionAttempts.studentId, s.id), isNull(questionBank.deletedAt)))
    .groupBy(questionBank.subject);

  const byDifficulty = await db
    .select({
      difficulty: questionBank.difficulty,
      total: sql<number>`count(*)::int`,
      correct: sql<number>`count(*) filter (where ${questionAttempts.isCorrect} = true)::int`,
      gradable: sql<number>`count(*) filter (where ${questionAttempts.isCorrect} is not null)::int`,
    })
    .from(questionAttempts)
    .innerJoin(questionBank, eq(questionAttempts.questionId, questionBank.id))
    .where(and(eq(questionAttempts.studentId, s.id), isNull(questionBank.deletedAt)))
    .groupBy(questionBank.difficulty);

  const [overall] = await db
    .select({
      total: sql<number>`count(*)::int`,
      correct: sql<number>`count(*) filter (where ${questionAttempts.isCorrect} = true)::int`,
      gradable: sql<number>`count(*) filter (where ${questionAttempts.isCorrect} is not null)::int`,
      uniqueQuestions: sql<number>`count(distinct ${questionAttempts.questionId})::int`,
      totalSeconds: sql<number>`coalesce(sum(${questionAttempts.timeSpentSeconds}), 0)::int`,
    })
    .from(questionAttempts)
    .where(eq(questionAttempts.studentId, s.id));

  return NextResponse.json({ success: true, overall, bySubject, byDifficulty });
}

import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { questionAttempts, questionBank, students } from "@workspace/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";

const PAGE_SIZE = 25;

export async function GET(req: NextRequest) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const [s] = await db
    .select({ id: students.id })
    .from(students)
    .where(and(eq(students.userId, user.id), eq(students.isActive, true)))
    .limit(1);
  if (!s) return NextResponse.json({ error: "Active enrollment required" }, { status: 403 });

  const url = new URL(req.url);
  const subject = url.searchParams.get("subject")?.trim() || null;
  const pageRaw = parseInt(url.searchParams.get("page") || "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const offset = (page - 1) * PAGE_SIZE;

  const where = subject
    ? and(eq(questionAttempts.studentId, s.id), eq(questionBank.subject, subject))
    : eq(questionAttempts.studentId, s.id);

  const [{ total } = { total: 0 }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(questionAttempts)
    .innerJoin(questionBank, eq(questionAttempts.questionId, questionBank.id))
    .where(where);

  const rows = await db
    .select({
      id: questionAttempts.id,
      questionId: questionAttempts.questionId,
      submittedAnswer: questionAttempts.submittedAnswer,
      isCorrect: questionAttempts.isCorrect,
      timeSpentSeconds: questionAttempts.timeSpentSeconds,
      createdAt: questionAttempts.createdAt,
      practiceSetId: questionAttempts.practiceSetId,
      subject: questionBank.subject,
      topic: questionBank.topic,
      difficulty: questionBank.difficulty,
      questionText: sql<string>`case when ${questionBank.deletedAt} is null then ${questionBank.questionText} else '' end`,
      isDeleted: sql<boolean>`${questionBank.deletedAt} is not null`,
    })
    .from(questionAttempts)
    .innerJoin(questionBank, eq(questionAttempts.questionId, questionBank.id))
    .where(where)
    .orderBy(desc(questionAttempts.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  const subjectRows = await db
    .selectDistinct({ subject: questionBank.subject })
    .from(questionAttempts)
    .innerJoin(questionBank, eq(questionAttempts.questionId, questionBank.id))
    .where(eq(questionAttempts.studentId, s.id));

  return NextResponse.json({
    success: true,
    page,
    pageSize: PAGE_SIZE,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    subjects: subjectRows.map((r) => r.subject).filter(Boolean).sort(),
    attempts: rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

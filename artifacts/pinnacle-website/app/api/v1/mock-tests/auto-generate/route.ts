import { NextRequest, NextResponse } from "next/server";
import { getDbUser, getTeacherPermissions } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { mockTests, mockTestQuestions, questionBank } from "@workspace/db/schema";
import { and, eq, sql, type SQL } from "drizzle-orm";

type Opt = { A?: string; B?: string; C?: string; D?: string } | null;

export async function POST(req: NextRequest) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  if (user.role !== "admin" && user.role !== "teacher") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.subject) return NextResponse.json({ error: "title and subject are required" }, { status: 400 });

  if (user.role === "teacher") {
    const perms = await getTeacherPermissions(user.id);
    if (!perms) return NextResponse.json({ error: "Teacher record not found" }, { status: 403 });
    if (!perms.allowedSubjects.includes(body.subject)) {
      return NextResponse.json({ error: `You can only create tests for: ${perms.allowedSubjects.join(", ")}` }, { status: 403 });
    }
  }

  const count = Math.min(100, Math.max(1, Number(body.count) || 20));

  const conds: SQL[] = [eq(questionBank.isPublished, true), eq(questionBank.questionType, "mcq")];
  if (body.subject !== "Mixed") conds.push(eq(questionBank.subject, String(body.subject)));
  if (body.classGrade) conds.push(eq(questionBank.classGrade, String(body.classGrade)));
  if (body.difficulty && body.difficulty !== "mixed") conds.push(eq(questionBank.difficulty, body.difficulty));
  if (body.fromYear) conds.push(sql`${questionBank.year} >= ${Number(body.fromYear)}`);
  if (body.toYear) conds.push(sql`${questionBank.year} <= ${Number(body.toYear)}`);

  const where = conds.length === 1 ? conds[0] : and(...conds);
  const picks = await db.select().from(questionBank).where(where).orderBy(sql`random()`).limit(count);

  if (picks.length === 0) {
    return NextResponse.json({ error: "No questions in the bank match those filters. Add MCQs first." }, { status: 400 });
  }

  const startDate = body.scheduledStart ? new Date(body.scheduledStart) : null;
  const endDate = body.scheduledEnd ? new Date(body.scheduledEnd) : null;
  if (startDate && isNaN(startDate.getTime())) return NextResponse.json({ error: "Invalid scheduledStart" }, { status: 400 });
  if (endDate && isNaN(endDate.getTime())) return NextResponse.json({ error: "Invalid scheduledEnd" }, { status: 400 });
  if (startDate && endDate && endDate.getTime() <= startDate.getTime()) {
    return NextResponse.json({ error: "Schedule end must be after start" }, { status: 400 });
  }

  const [test] = await db.insert(mockTests).values({
    title: String(body.title),
    subject: String(body.subject),
    examType: body.examType ?? "Mixed",
    batchId: body.batchId || null,
    durationMinutes: Number(body.durationMinutes) || 60,
    marksPerQuestion: Number(body.marksPerQuestion) || 4,
    negativeMarkingPercent: Number(body.negativeMarkingPercent) || 25,
    instructions: body.instructions ?? null,
    isPublic: Boolean(body.isPublic),
    isPublished: Boolean(body.isPublished),
    scheduledStart: startDate,
    scheduledEnd: endDate,
    createdBy: user.id,
  }).returning();

  let n = 1;
  for (const q of picks) {
    const opts = (q.options as Opt) ?? null;
    if (!opts?.A || !opts?.B || !opts?.C || !opts?.D) continue;
    await db.insert(mockTestQuestions).values({
      testId: test.id,
      questionNumber: n++,
      questionText: q.questionText,
      optionA: opts.A,
      optionB: opts.B,
      optionC: opts.C,
      optionD: opts.D,
      correctOption: q.correctAnswer.toUpperCase(),
      topic: q.topic,
      explanation: q.solution,
      imageUrl: q.imageUrl,
    });
  }

  return NextResponse.json({ success: true, test, questionCount: n - 1 });
}

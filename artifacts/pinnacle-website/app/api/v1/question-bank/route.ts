import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { questionBank, questionBookmarks, students } from "@workspace/db/schema";
import { and, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const subject = url.searchParams.get("subject");
  const topic = url.searchParams.get("topic");
  const classGrade = url.searchParams.get("classGrade");
  const year = url.searchParams.get("year");
  const difficulty = url.searchParams.get("difficulty");
  const type = url.searchParams.get("type");
  const search = url.searchParams.get("q");
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? "20")));

  const conds: SQL[] = [eq(questionBank.isPublished, true)];
  if (subject && subject !== "All") conds.push(eq(questionBank.subject, subject));
  if (topic) conds.push(eq(questionBank.topic, topic));
  if (classGrade) conds.push(eq(questionBank.classGrade, classGrade));
  if (year) conds.push(eq(questionBank.year, Number(year)));
  if (difficulty) conds.push(eq(questionBank.difficulty, difficulty as "easy" | "medium" | "hard"));
  if (type) conds.push(eq(questionBank.questionType, type as "mcq" | "short" | "long" | "numerical"));
  if (search) {
    const searchCond = or(ilike(questionBank.questionText, `%${search}%`), ilike(questionBank.topic, `%${search}%`));
    if (searchCond) conds.push(searchCond);
  }

  const where = conds.length === 1 ? conds[0] : and(...conds);

  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(questionBank).where(where);

  const items = await db.select().from(questionBank)
    .where(where)
    .orderBy(desc(questionBank.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  // Per-user bookmark IDs (only when signed-in as an active student).
  let bookmarkedIds: string[] = [];
  const viewer = await getDbUser().catch(() => null);
  if (viewer && items.length > 0) {
    const [s] = await db.select({ id: students.id }).from(students)
      .where(and(eq(students.userId, viewer.id), eq(students.isActive, true))).limit(1);
    if (s) {
      const bms = await db.select({ questionId: questionBookmarks.questionId })
        .from(questionBookmarks)
        .where(and(
          eq(questionBookmarks.studentId, s.id),
          inArray(questionBookmarks.questionId, items.map((q) => q.id)),
        ));
      bookmarkedIds = bms.map((b) => b.questionId);
    }
  }

  return NextResponse.json({ success: true, items, total, page, pageSize, bookmarkedIds });
}

export async function POST(req: NextRequest) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  if (user.role !== "admin" && user.role !== "teacher") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body?.subject || !body?.questionText || !body?.correctAnswer) {
    return NextResponse.json({ error: "subject, questionText and correctAnswer are required" }, { status: 400 });
  }

  const [created] = await db.insert(questionBank).values({
    subject: String(body.subject),
    topic: body.topic || null,
    classGrade: body.classGrade || null,
    year: body.year ? Number(body.year) : null,
    difficulty: (body.difficulty as "easy" | "medium" | "hard") ?? "medium",
    questionType: (body.questionType as "mcq" | "short" | "long" | "numerical") ?? "mcq",
    questionText: String(body.questionText),
    options: body.options ?? null,
    correctAnswer: String(body.correctAnswer),
    solution: body.solution || null,
    imageUrl: body.imageUrl || null,
    solutionImageUrl: body.solutionImageUrl || null,
    marks: body.marks ? Number(body.marks) : 4,
    createdBy: user.id,
  }).returning();

  return NextResponse.json({ success: true, question: created });
}

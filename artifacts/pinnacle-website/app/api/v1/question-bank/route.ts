import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { questionBank, questionBookmarks, students } from "@workspace/db/schema";
import { and, desc, eq, inArray, sql, type SQL } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const subject = url.searchParams.get("subject");
  const topic = url.searchParams.get("topic");
  const classGrade = url.searchParams.get("classGrade");
  const year = url.searchParams.get("year");
  const examName = url.searchParams.get("examName");
  const pyq = url.searchParams.get("pyq");
  const difficulty = url.searchParams.get("difficulty");
  const type = url.searchParams.get("type");
  // Accept both `search` (preferred) and the legacy `q` parameter.
  const search = (url.searchParams.get("search") ?? url.searchParams.get("q") ?? "").trim();
  // Defensive numeric parsing — invalid strings (NaN, "abc") fall back to
  // sane defaults instead of cascading into offset/limit and crashing.
  const rawPage = Number(url.searchParams.get("page") ?? "1");
  const rawPageSize = Number(url.searchParams.get("pageSize") ?? "20");
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
  const pageSize = Number.isFinite(rawPageSize) && rawPageSize >= 1
    ? Math.min(100, Math.floor(rawPageSize))
    : 20;

  const conds: SQL[] = [eq(questionBank.isPublished, true)];
  if (subject && subject !== "All") conds.push(eq(questionBank.subject, subject));
  if (topic) conds.push(eq(questionBank.topic, topic));
  if (classGrade) conds.push(eq(questionBank.classGrade, classGrade));
  if (year) conds.push(eq(questionBank.year, Number(year)));
  if (examName) conds.push(eq(questionBank.examName, examName));
  if (pyq === "1") conds.push(sql`${questionBank.year} is not null`);
  if (difficulty) conds.push(eq(questionBank.difficulty, difficulty as "easy" | "medium" | "hard"));
  if (type) conds.push(eq(questionBank.questionType, type as "mcq" | "short" | "long" | "numerical"));
  if (search) {
    // plainto_tsquery is forgiving of arbitrary user input (no syntax errors).
    conds.push(sql`search_vector @@ plainto_tsquery('english', ${search})`);
  }

  const where = conds.length === 1 ? conds[0] : and(...conds);

  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(questionBank).where(where);

  // When searching, rank by relevance with newest-first as a stable tie-breaker.
  const items = await db.select().from(questionBank)
    .where(where)
    .orderBy(
      ...(search
        ? [sql`ts_rank(search_vector, plainto_tsquery('english', ${search})) DESC`, desc(questionBank.createdAt)]
        : [desc(questionBank.createdAt)]),
    )
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
    examName: body.examName || null,
    marks: body.marks ? Number(body.marks) : 4,
    createdBy: user.id,
  }).returning();

  return NextResponse.json({ success: true, question: created });
}

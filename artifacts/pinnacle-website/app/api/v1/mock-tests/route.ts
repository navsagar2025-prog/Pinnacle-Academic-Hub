import { NextRequest, NextResponse } from "next/server";
import { getDbUser, requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { mockTests, mockTestQuestions, students } from "@workspace/db/schema";
import { and, desc, eq, isNull, or, sql, type SQL } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const subject = url.searchParams.get("subject");

  const viewer = await getDbUser().catch(() => null);

  // Resolve audience filter:
  // - Anonymous + parent viewers: only public tests with no batch.
  // - Signed-in students: their batch's tests + tests with no batch.
  // - Signed-in staff (teacher/admin): all published tests (no extra filter).
  let audience: SQL | undefined;
  if (!viewer || viewer.role === "parent") {
    audience = and(eq(mockTests.isPublic, true), isNull(mockTests.batchId));
  } else if (viewer.role === "student") {
    const [enrollment] = await db
      .select({ batchId: students.batchId })
      .from(students)
      .where(and(eq(students.userId, viewer.id), eq(students.isActive, true)))
      .limit(1);
    audience = enrollment?.batchId
      ? or(eq(mockTests.batchId, enrollment.batchId), isNull(mockTests.batchId))
      : isNull(mockTests.batchId);
  } else if (viewer.role !== "teacher" && viewer.role !== "admin") {
    // Unknown role: deny by default — only public, null-batch tests.
    audience = and(eq(mockTests.isPublic, true), isNull(mockTests.batchId));
  }

  const conds: SQL[] = [eq(mockTests.isPublished, true)];
  if (audience) conds.push(audience);
  if (subject && subject !== "All") conds.push(eq(mockTests.subject, subject));

  const items = await db
    .select({
      id: mockTests.id,
      title: mockTests.title,
      subject: mockTests.subject,
      examType: mockTests.examType,
      durationMinutes: mockTests.durationMinutes,
      marksPerQuestion: mockTests.marksPerQuestion,
      isPublic: mockTests.isPublic,
      scheduledStart: mockTests.scheduledStart,
      scheduledEnd: mockTests.scheduledEnd,
      questionCount: sql<number>`(select count(*)::int from ${mockTestQuestions} where ${mockTestQuestions.testId} = ${mockTests.id})`,
    })
    .from(mockTests)
    .where(and(...conds))
    .orderBy(desc(mockTests.createdAt))
    .limit(100);

  return NextResponse.json({ success: true, items });
}

export async function POST(req: NextRequest) {
  let user;
  try { user = await requirePortalRole("admin"); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

  const body = await req.json().catch(() => null);
  const { title, subject, examType, batchId, durationMinutes, marksPerQuestion, negativeMarkingPercent, instructions, isPublic } = body ?? {};
  if (!title || !subject) return NextResponse.json({ error: "title and subject are required" }, { status: 400 });

  const [created] = await db.insert(mockTests).values({
    title,
    subject,
    examType: examType ?? "Mixed",
    batchId: batchId || null,
    durationMinutes: Number(durationMinutes) || 60,
    marksPerQuestion: Number(marksPerQuestion) || 4,
    negativeMarkingPercent: Number(negativeMarkingPercent) || 25,
    instructions: instructions ?? null,
    isPublic: Boolean(isPublic),
    createdBy: user.id,
  }).returning();

  return NextResponse.json({ success: true, test: created });
}

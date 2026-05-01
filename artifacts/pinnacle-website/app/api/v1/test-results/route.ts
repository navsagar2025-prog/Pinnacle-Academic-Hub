import { NextRequest, NextResponse } from "next/server";
import { db } from "@workspace/db";
import { studentTestResults, students, batches, users, teachers, schedules } from "@workspace/db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import { getDbUser } from "@/lib/server/portal-auth";
import { logAudit } from "@/lib/server/audit";

export async function GET(req: NextRequest) {
  const user = await getDbUser();
  if (!user || (user.role !== "admin" && user.role !== "teacher")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const clientBatchId = searchParams.get("batchId");

  // Determine which batch IDs this caller may access
  let allowedBatchIds: string[] | null = null; // null = admin (unrestricted)

  if (user.role === "teacher") {
    // Scope teacher reads to their own assigned batches via teachers → schedules
    const [teacherRow] = await db
      .select({ id: teachers.id })
      .from(teachers)
      .where(and(eq(teachers.userId, user.id), eq(teachers.isActive, true)))
      .limit(1);

    if (!teacherRow) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 403 });
    }

    const assignedSchedules = await db
      .selectDistinct({ batchId: schedules.batchId })
      .from(schedules)
      .where(eq(schedules.teacherId, teacherRow.id));

    allowedBatchIds = assignedSchedules
      .map((s) => s.batchId)
      .filter((id): id is string => id !== null);

    if (allowedBatchIds.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // If client supplied a batchId filter, verify it is within the allowed set
    if (clientBatchId && !allowedBatchIds.includes(clientBatchId)) {
      return NextResponse.json({ error: "Forbidden — not assigned to that batch" }, { status: 403 });
    }
  }

  // Build WHERE condition
  const effectiveBatchId = clientBatchId ?? null;
  let whereCondition;
  if (allowedBatchIds !== null) {
    // Teacher: restrict to assigned batches; optionally further filtered by requested batch
    whereCondition = effectiveBatchId
      ? and(inArray(studentTestResults.batchId, allowedBatchIds), eq(studentTestResults.batchId, effectiveBatchId))
      : inArray(studentTestResults.batchId, allowedBatchIds);
  } else {
    // Admin: unrestricted, optional client filter
    whereCondition = effectiveBatchId ? eq(studentTestResults.batchId, effectiveBatchId) : undefined;
  }

  const rows = await db
    .select({
      id: studentTestResults.id,
      studentId: studentTestResults.studentId,
      studentName: users.name,
      rollNumber: students.rollNumber,
      batchId: studentTestResults.batchId,
      batchName: batches.name,
      examName: studentTestResults.examName,
      subject: studentTestResults.subject,
      totalMarks: studentTestResults.totalMarks,
      marksObtained: studentTestResults.marksObtained,
      rank: studentTestResults.rank,
      examDate: studentTestResults.examDate,
      createdAt: studentTestResults.createdAt,
    })
    .from(studentTestResults)
    .leftJoin(students, eq(studentTestResults.studentId, students.id))
    .leftJoin(users, eq(students.userId, users.id))
    .leftJoin(batches, eq(studentTestResults.batchId, batches.id))
    .where(whereCondition)
    .orderBy(desc(studentTestResults.examDate), desc(studentTestResults.createdAt));

  return NextResponse.json({ success: true, data: rows });
}

export async function POST(req: NextRequest) {
  const user = await getDbUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized — admin only" }, { status: 403 });
  }

  let body: {
    entries?: Array<{
      studentId: string;
      batchId?: string;
      examName: string;
      subject: string;
      totalMarks: number;
      marksObtained: number;
      rank?: string;
      examDate: string;
    }>;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { entries } = body;
  if (!Array.isArray(entries) || entries.length === 0) {
    return NextResponse.json({ error: "entries array is required" }, { status: 400 });
  }

  // Validate each entry
  for (const e of entries) {
    if (!e.studentId || !e.examName?.trim() || !e.subject?.trim() || !e.examDate) {
      return NextResponse.json({ error: "Each entry must have studentId, examName, subject, examDate" }, { status: 400 });
    }
    if (typeof e.totalMarks !== "number" || typeof e.marksObtained !== "number") {
      return NextResponse.json({ error: "totalMarks and marksObtained must be numbers" }, { status: 400 });
    }
    if (e.marksObtained < 0 || e.marksObtained > e.totalMarks) {
      return NextResponse.json({ error: "marksObtained must be between 0 and totalMarks" }, { status: 400 });
    }
  }

  // Verify all studentIds exist
  const studentIds = [...new Set(entries.map((e) => e.studentId))];
  const existingStudents = await db
    .select({ id: students.id })
    .from(students)
    .where(inArray(students.id, studentIds));
  const existingIds = new Set(existingStudents.map((s) => s.id));
  const missing = studentIds.filter((id) => !existingIds.has(id));
  if (missing.length > 0) {
    return NextResponse.json({ error: `Unknown student IDs: ${missing.join(", ")}` }, { status: 400 });
  }

  const inserted = await db
    .insert(studentTestResults)
    .values(
      entries.map((e) => ({
        studentId: e.studentId,
        batchId: e.batchId ?? null,
        examName: e.examName.trim(),
        subject: e.subject.trim(),
        totalMarks: e.totalMarks,
        marksObtained: e.marksObtained,
        rank: e.rank?.trim() || null,
        examDate: new Date(e.examDate),
      })),
    )
    .returning({ id: studentTestResults.id });

  logAudit(
    user.id,
    user.name ?? "admin",
    "bulk_create",
    "student_test_result",
    undefined,
    { count: inserted.length, examName: entries[0].examName },
  ).catch(console.error);

  return NextResponse.json({ success: true, inserted: inserted.length });
}

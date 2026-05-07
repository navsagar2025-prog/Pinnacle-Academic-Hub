import { NextRequest, NextResponse } from "next/server";
import { db } from "@workspace/db";
import { assignments, assignmentSchedules, batches, students, parents } from "@workspace/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { getDbUser } from "@/lib/server/portal-auth";
import { logAudit } from "@/lib/server/audit";
import {
  validateSchedule,
  materialiseSchedule,
  type ScheduleInput,
} from "@/lib/server/recurring-assignments";

export async function GET(req: NextRequest) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const batchIdParam = searchParams.get("batchId");

  // Build role-appropriate where conditions
  if (user.role === "admin") {
    // Admins see all assignments; optional batchId filter
    const rows = await db
      .select({
        id: assignments.id,
        title: assignments.title,
        subject: assignments.subject,
        description: assignments.description,
        fileUrl: assignments.fileUrl,
        dueDate: assignments.dueDate,
        maxMarks: assignments.maxMarks,
        isVisible: assignments.isVisible,
        createdAt: assignments.createdAt,
        batchId: assignments.batchId,
        batchName: batches.name,
      })
      .from(assignments)
      .leftJoin(batches, eq(assignments.batchId, batches.id))
      .where(batchIdParam ? eq(assignments.batchId, batchIdParam) : undefined)
      .orderBy(desc(assignments.createdAt));
    return NextResponse.json({ success: true, data: rows });
  }

  if (user.role === "teacher") {
    // Teachers only see assignments they created; optional batchId filter
    const condition =
      batchIdParam
        ? and(eq(assignments.postedBy, user.id), eq(assignments.batchId, batchIdParam))
        : eq(assignments.postedBy, user.id);
    const rows = await db
      .select({
        id: assignments.id,
        title: assignments.title,
        subject: assignments.subject,
        description: assignments.description,
        fileUrl: assignments.fileUrl,
        dueDate: assignments.dueDate,
        maxMarks: assignments.maxMarks,
        isVisible: assignments.isVisible,
        createdAt: assignments.createdAt,
        batchId: assignments.batchId,
        batchName: batches.name,
      })
      .from(assignments)
      .leftJoin(batches, eq(assignments.batchId, batches.id))
      .where(condition)
      .orderBy(desc(assignments.createdAt));
    return NextResponse.json({ success: true, data: rows });
  }

  if (user.role === "student") {
    // Students see only visible assignments for their batch
    const [studentRow] = await db
      .select({ batchId: students.batchId })
      .from(students)
      .where(eq(students.userId, user.id))
      .limit(1);

    if (!studentRow?.batchId) {
      return NextResponse.json({ success: true, data: [] });
    }

    const rows = await db
      .select({
        id: assignments.id,
        title: assignments.title,
        subject: assignments.subject,
        description: assignments.description,
        fileUrl: assignments.fileUrl,
        dueDate: assignments.dueDate,
        maxMarks: assignments.maxMarks,
        createdAt: assignments.createdAt,
        batchId: assignments.batchId,
        batchName: batches.name,
      })
      .from(assignments)
      .leftJoin(batches, eq(assignments.batchId, batches.id))
      .where(
        and(
          eq(assignments.batchId, studentRow.batchId),
          eq(assignments.isVisible, true),
        ),
      )
      .orderBy(desc(assignments.createdAt));
    return NextResponse.json({ success: true, data: rows });
  }

  if (user.role === "parent") {
    // Parents see visible assignments for their linked child's batch
    const [parentRow] = await db
      .select({ studentId: parents.studentId })
      .from(parents)
      .where(eq(parents.userId, user.id))
      .limit(1);

    if (!parentRow?.studentId) {
      return NextResponse.json({ success: true, data: [] });
    }

    const [studentRow] = await db
      .select({ batchId: students.batchId })
      .from(students)
      .where(eq(students.id, parentRow.studentId))
      .limit(1);

    if (!studentRow?.batchId) {
      return NextResponse.json({ success: true, data: [] });
    }

    const rows = await db
      .select({
        id: assignments.id,
        title: assignments.title,
        subject: assignments.subject,
        description: assignments.description,
        fileUrl: assignments.fileUrl,
        dueDate: assignments.dueDate,
        maxMarks: assignments.maxMarks,
        createdAt: assignments.createdAt,
        batchId: assignments.batchId,
        batchName: batches.name,
      })
      .from(assignments)
      .leftJoin(batches, eq(assignments.batchId, batches.id))
      .where(
        and(
          eq(assignments.batchId, studentRow.batchId),
          eq(assignments.isVisible, true),
        ),
      )
      .orderBy(desc(assignments.createdAt));
    return NextResponse.json({ success: true, data: rows });
  }

  return NextResponse.json({ error: "Unauthorized role" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  const user = await getDbUser();
  if (!user || (user.role !== "teacher" && user.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    title?: string;
    subject?: string;
    batchId?: string;
    description?: string;
    fileUrl?: string;
    dueDate?: string;
    maxMarks?: number;
    schedule?: ScheduleInput;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, subject, batchId, description, fileUrl, dueDate, maxMarks, schedule } = body;
  if (!title || !subject || !batchId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Recurring path: create a schedule + materialise its first occurrences immediately
  if (schedule) {
    const v = validateSchedule(schedule);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }
    const [sched] = await db
      .insert(assignmentSchedules)
      .values({
        batchId,
        postedBy: user.id,
        title,
        subject,
        description: description ?? null,
        fileUrl: fileUrl ?? null,
        maxMarks: maxMarks ?? null,
        frequency: schedule.frequency,
        daysOfWeek: schedule.daysOfWeek ?? null,
        dayOfMonth: schedule.dayOfMonth ?? null,
        intervalDays: schedule.intervalDays ?? null,
        dueTimeOfDay: schedule.dueTimeOfDay || "23:59",
        startDate: new Date(schedule.startDate),
        endDate: schedule.endDate ? new Date(schedule.endDate) : null,
        status: "active",
      })
      .returning({ id: assignmentSchedules.id });

    const result = await materialiseSchedule(sched.id);

    logAudit(user.id, user.name ?? "unknown", "create", "assignment_schedule", sched.id, {
      title,
      frequency: schedule.frequency,
      created: result.created,
    }).catch(console.error);

    return NextResponse.json({
      success: true,
      scheduleId: sched.id,
      createdOccurrences: result.created,
    });
  }

  // One-off path (legacy)
  if (!dueDate) {
    return NextResponse.json({ error: "dueDate is required for one-off assignments" }, { status: 400 });
  }

  const [row] = await db
    .insert(assignments)
    .values({
      title,
      subject,
      batchId,
      description: description ?? null,
      fileUrl: fileUrl ?? null,
      dueDate: new Date(dueDate),
      maxMarks: maxMarks ?? null,
      postedBy: user.id,
      isVisible: true,
    })
    .returning({ id: assignments.id });

  logAudit(user.id, user.name ?? "unknown", "create", "assignment", row.id, { title }).catch(
    console.error,
  );

  return NextResponse.json({ success: true, id: row.id });
}

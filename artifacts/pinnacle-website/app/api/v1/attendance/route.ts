import { authUserId } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { attendance, students, teachers, schedules, users, batches, courses } from "@workspace/db/schema";
import { eq, and, inArray, sql, gte, lte, desc } from "drizzle-orm";
import { ok, err } from "@/lib/server/api-response";

export async function GET(request: Request) {
  const userId = await authUserId();
  if (!userId) return err("Unauthorized", 401);

  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get("batchId") ?? undefined;
    const fromDate = searchParams.get("from") ?? undefined;
    const toDate = searchParams.get("to") ?? undefined;

    const [teacher] = await db
      .select({ id: teachers.id })
      .from(teachers)
      .where(and(eq(teachers.userId, userId), eq(teachers.isActive, true)))
      .limit(1);

    if (!teacher) return err("Teacher profile not found", 403);

    // Get all batches this teacher is assigned to (for filtering)
    const assignedBatchRows = await db
      .selectDistinct({
        batchId: batches.id,
        batchName: batches.name,
        timingLabel: batches.timingLabel,
        courseTitle: courses.title,
      })
      .from(schedules)
      .leftJoin(batches, eq(schedules.batchId, batches.id))
      .leftJoin(courses, eq(batches.courseId, courses.id))
      .where(eq(schedules.teacherId, teacher.id))
      .groupBy(batches.id, batches.name, batches.timingLabel, courses.title);

    const assignedBatchIds = assignedBatchRows
      .map((r) => r.batchId)
      .filter((id): id is string => id !== null);

    if (assignedBatchIds.length === 0) {
      return ok({ sessions: [], batches: [] });
    }

    const targetBatchIds = batchId && assignedBatchIds.includes(batchId)
      ? [batchId]
      : assignedBatchIds;

    // Get all students (including inactive) in target batches so historical
    // records for students who later became inactive remain visible.
    const studentRows = await db
      .select({
        id: students.id,
        name: users.name,
        rollNumber: students.rollNumber,
        batchId: students.batchId,
      })
      .from(students)
      .leftJoin(users, eq(students.userId, users.id))
      .where(inArray(students.batchId, targetBatchIds));

    const studentMap = new Map(studentRows.map((s) => [s.id, s]));
    const allStudentIds = studentRows.map((s) => s.id);
    if (allStudentIds.length === 0) {
      return ok({ sessions: [], batches: assignedBatchRows.filter((b) => b.batchId !== null) });
    }

    // Build attendance query conditions — only records this teacher submitted
    const conditions = [
      inArray(attendance.studentId, allStudentIds),
      eq(attendance.markedBy, userId),
    ];
    if (fromDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      if (!isNaN(from.getTime())) conditions.push(gte(attendance.date, from));
    }
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      if (!isNaN(to.getTime())) conditions.push(lte(attendance.date, to));
    }

    const records = await db
      .select({
        id: attendance.id,
        studentId: attendance.studentId,
        date: attendance.date,
        subject: attendance.subject,
        status: attendance.status,
      })
      .from(attendance)
      .where(and(...conditions))
      .orderBy(desc(attendance.date));

    // Group by date + subject + batchId
    type SessionKey = string;
    const sessionMap = new Map<SessionKey, {
      date: string;
      subject: string;
      batchId: string;
      batchName: string;
      records: { studentId: string; studentName: string; rollNumber: string; status: string }[];
    }>();

    // Build a map from studentId -> batchId
    const studentBatchMap = new Map(studentRows.map((s) => [s.id, s.batchId ?? ""]));
    // Build a map from batchId -> batchName
    const batchNameMap = new Map(
      assignedBatchRows
        .filter((b) => b.batchId !== null)
        .map((b) => [b.batchId!, b.batchName ?? ""])
    );

    for (const r of records) {
      const dateStr = r.date.toISOString().split("T")[0];
      const bId = studentBatchMap.get(r.studentId) ?? "";
      const key: SessionKey = `${dateStr}__${r.subject}__${bId}`;

      if (!sessionMap.has(key)) {
        sessionMap.set(key, {
          date: dateStr,
          subject: r.subject,
          batchId: bId,
          batchName: batchNameMap.get(bId) ?? "",
          records: [],
        });
      }

      const student = studentMap.get(r.studentId);
      sessionMap.get(key)!.records.push({
        studentId: r.studentId,
        studentName: student?.name ?? "Unknown",
        rollNumber: student?.rollNumber ?? "",
        status: r.status,
      });
    }

    // Sort sessions by date descending
    const sessions = Array.from(sessionMap.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const batchList = assignedBatchRows
      .filter((b) => b.batchId !== null)
      .map((b) => ({ id: b.batchId!, name: b.batchName ?? "", timingLabel: b.timingLabel, courseTitle: b.courseTitle }));

    return ok({ sessions, batches: batchList });
  } catch (e) {
    console.error("GET /api/v1/attendance error:", e);
    return err("Failed to fetch attendance history");
  }
}

export async function POST(request: Request) {
  const userId = await authUserId();
  if (!userId) return err("Unauthorized", 401);

  try {
    const body = await request.json();
    const { batchId, date, subject, records } = body as {
      batchId: string;
      date: string;
      subject: string;
      records: { studentId: string; status: "present" | "absent" | "late" }[];
    };

    if (!batchId || !date || !subject || !Array.isArray(records) || records.length === 0) {
      return err("Missing required fields", 400);
    }

    const [teacher] = await db
      .select({ id: teachers.id })
      .from(teachers)
      .where(and(eq(teachers.userId, userId), eq(teachers.isActive, true)))
      .limit(1);

    if (!teacher) return err("Teacher profile not found", 403);

    const batchSchedules = await db
      .select({ id: schedules.id, subject: schedules.subject })
      .from(schedules)
      .where(and(eq(schedules.teacherId, teacher.id), eq(schedules.batchId, batchId)));

    if (batchSchedules.length === 0) return err("Not authorised for this batch", 403);

    const scheduledSubjects = new Set(batchSchedules.map((s) => s.subject));
    if (!scheduledSubjects.has(subject)) {
      return err("Subject not in your schedule for this batch", 403);
    }

    const sessionDate = new Date(date);
    if (isNaN(sessionDate.getTime())) return err("Invalid date", 400);

    sessionDate.setHours(12, 0, 0, 0);

    const enrolledStudents = await db
      .select({ id: students.id })
      .from(students)
      .where(and(eq(students.batchId, batchId), eq(students.isActive, true)));

    const enrolledIds = new Set(enrolledStudents.map((s) => s.id));

    const validRecords = records.filter((r) => enrolledIds.has(r.studentId));

    if (validRecords.length === 0) {
      return err("No valid students found for this batch", 400);
    }

    if (validRecords.length !== records.length) {
      const invalid = records.filter((r) => !enrolledIds.has(r.studentId)).map((r) => r.studentId);
      console.warn(`Attendance POST: rejected ${invalid.length} student IDs not in batch ${batchId}`);
    }

    const validStudentIds = validRecords.map((r) => r.studentId);

    await db
      .delete(attendance)
      .where(
        and(
          inArray(attendance.studentId, validStudentIds),
          eq(attendance.subject, subject),
          sql`DATE(${attendance.date}) = DATE(${sessionDate.toISOString()})`
        )
      );

    const rows = validRecords.map((r) => ({
      studentId: r.studentId,
      date: sessionDate,
      subject,
      status: r.status,
      markedBy: userId,
    }));

    await db.insert(attendance).values(rows);

    return ok({ saved: rows.length });
  } catch (e) {
    console.error("POST /api/v1/attendance error:", e);
    return err("Failed to save attendance");
  }
}

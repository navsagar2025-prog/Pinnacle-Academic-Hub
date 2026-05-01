import { authUserId } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { attendance, students, teachers, schedules } from "@workspace/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { ok, err } from "@/lib/server/api-response";

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

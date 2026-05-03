import { authUserId } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { attendance, students, teachers, schedules, users, batches, courses, parents, attendanceLowAlerts } from "@workspace/db/schema";
import { eq, and, inArray, sql, gte, lte, desc, count } from "drizzle-orm";
import { ok, err } from "@/lib/server/api-response";
import { sendLowAttendanceAlert } from "@/lib/server/email";

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
        isActive: students.isActive,
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
      records: { studentId: string; studentName: string; rollNumber: string; status: string; isActive: boolean }[];
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
        isActive: student?.isActive ?? false,
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

    // Fire-and-forget: check attendance thresholds and notify parents if needed
    checkAndNotifyLowAttendance(validStudentIds).catch((e) =>
      console.error("[attendance-alert] background check failed:", e)
    );

    return ok({ saved: rows.length });
  } catch (e) {
    console.error("POST /api/v1/attendance error:", e);
    return err("Failed to save attendance");
  }
}

async function checkAndNotifyLowAttendance(studentIds: string[]): Promise<void> {
  if (studentIds.length === 0) return;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  // Compute rolling 30-day attendance pct for each student
  const totalRows = await db
    .select({
      studentId: attendance.studentId,
      total: count(),
    })
    .from(attendance)
    .where(
      and(
        inArray(attendance.studentId, studentIds),
        gte(attendance.date, thirtyDaysAgo)
      )
    )
    .groupBy(attendance.studentId);

  const presentRows = await db
    .select({
      studentId: attendance.studentId,
      present: count(),
    })
    .from(attendance)
    .where(
      and(
        inArray(attendance.studentId, studentIds),
        gte(attendance.date, thirtyDaysAgo),
        sql`${attendance.status} IN ('present', 'late')`
      )
    )
    .groupBy(attendance.studentId);

  const totalMap = new Map(totalRows.map((r) => [r.studentId, Number(r.total)]));
  const presentMap = new Map(presentRows.map((r) => [r.studentId, Number(r.present)]));

  // Fetch existing alert records for these students
  const alertRecords = await db
    .select()
    .from(attendanceLowAlerts)
    .where(inArray(attendanceLowAlerts.studentId, studentIds));
  const alertMap = new Map(alertRecords.map((a) => [a.studentId, a]));

  const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";
  const SITE_URL = `https://${process.env.REPLIT_DEV_DOMAIN ?? "pinnacleacademic.in"}${BASE_PATH}`;
  const parentPortalUrl = `${SITE_URL}/portal/parent`;

  for (const studentId of studentIds) {
    const total = totalMap.get(studentId) ?? 0;
    if (total === 0) continue;

    const present = presentMap.get(studentId) ?? 0;
    const pct = Math.round((present / total) * 100);
    const isBelow = pct < 75;
    const alert = alertMap.get(studentId);

    if (!isBelow) {
      // Student is at or above 75% — mark as recovered if they had an unrecovered alert
      if (alert && !alert.hasRecovered) {
        await db
          .update(attendanceLowAlerts)
          .set({ hasRecovered: true, updatedAt: new Date() })
          .where(eq(attendanceLowAlerts.studentId, studentId));
      }
      continue;
    }

    // Student is below 75%.
    // Atomically claim this crossing before doing any work:
    //   - INSERT succeeds (new row)           → RETURNING gives a row → we claimed it
    //   - conflict + hasRecovered=true         → UPDATE fires → RETURNING gives a row → we claimed it
    //   - conflict + hasRecovered=false        → UPDATE skipped by setWhere → RETURNING gives nothing → skip
    // This guarantees at-most-one email per crossing even under concurrent attendance saves.
    const now = new Date();
    const claimed = await db
      .insert(attendanceLowAlerts)
      .values({
        studentId,
        notifiedAt: now,
        notifiedPct: pct,
        hasRecovered: false,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: attendanceLowAlerts.studentId,
        set: {
          notifiedAt: now,
          notifiedPct: pct,
          hasRecovered: false,
          updatedAt: now,
        },
        setWhere: eq(attendanceLowAlerts.hasRecovered, true),
      })
      .returning({ id: attendanceLowAlerts.id });

    if (claimed.length === 0) {
      // Another process already claimed this crossing, or student is still in unrecovered state
      continue;
    }

    // We claimed the crossing — look up the parent's email on record
    const parentRows = await db
      .select({
        parentEmail: users.email,
        parentName: users.name,
      })
      .from(parents)
      .leftJoin(users, eq(parents.userId, users.id))
      .where(eq(parents.studentId, studentId))
      .limit(1);

    if (parentRows.length === 0 || !parentRows[0].parentEmail) {
      console.warn(
        `[attendance-alert] No parent record found for student ${studentId} — alert claimed but no email sent. ` +
        `Link a parent account in the admin portal to enable notifications.`
      );
      // Roll back the claim so the alert can fire once a parent is linked
      await db
        .delete(attendanceLowAlerts)
        .where(eq(attendanceLowAlerts.studentId, studentId));
      continue;
    }

    const recipientEmail = parentRows[0].parentEmail;
    const recipientName = parentRows[0].parentName ?? "Parent/Guardian";

    // Fetch student name for the email body
    const [studentRow] = await db
      .select({ name: users.name })
      .from(students)
      .leftJoin(users, eq(students.userId, users.id))
      .where(eq(students.id, studentId))
      .limit(1);

    const studentName = studentRow?.name ?? "your child";

    const result = await sendLowAttendanceAlert({
      to: recipientEmail,
      parentName: recipientName,
      studentName,
      attendancePct: pct,
      parentPortalUrl,
    });

    if (!result.ok) {
      console.error(`[attendance-alert] Failed to send alert for student ${studentId}: ${result.error}`);
      // Roll back the claim so we retry on the next attendance save
      await db
        .delete(attendanceLowAlerts)
        .where(eq(attendanceLowAlerts.studentId, studentId));
      continue;
    }

    console.info(`[attendance-alert] Sent low-attendance alert for student ${studentId} (${pct}%) to ${recipientEmail}`);
  }
}

import { Router } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import {
  users, students, parents, teachers, batches, courses,
  notices, studyMaterials, assignments, feeRecords,
  attendance, studentTestResults, schedules, mockTests, mockTestAttempts,
} from "@workspace/db/schema";
import { eq, and, or, isNull, gte, desc, asc, inArray } from "drizzle-orm";

const router = Router();
router.use(requireAuth());

// ── Me ────────────────────────────────────────────────────────────────────────
router.get("/portal/me", async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);
  if (!clerkUserId) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const [user] = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
    if (!user) { res.json({ ok: true, data: null }); return; }

    let roleRecord = null;
    if (user.role === "student") {
      const rows = await db
        .select({
          id: students.id, rollNumber: students.rollNumber, guardianName: students.guardianName,
          guardianPhone: students.guardianPhone, feePlan: students.feePlan,
          isActive: students.isActive, enrolledAt: students.enrolledAt,
          batchId: students.batchId, batchName: batches.name, batchTiming: batches.timingLabel,
          batchDays: batches.daysLabel, courseName: courses.title,
        })
        .from(students).leftJoin(batches, eq(students.batchId, batches.id))
        .leftJoin(courses, eq(batches.courseId, courses.id))
        .where(eq(students.userId, user.id)).limit(1);
      roleRecord = rows[0] ?? null;
    } else if (user.role === "teacher") {
      const rows = await db.select().from(teachers).where(eq(teachers.userId, user.id)).limit(1);
      roleRecord = rows[0] ?? null;
    } else if (user.role === "parent") {
      const rows = await db
        .select({ id: parents.id, relation: parents.relation, studentId: parents.studentId })
        .from(parents).where(eq(parents.userId, user.id)).limit(1);
      roleRecord = rows[0] ?? null;
    }
    res.json({ ok: true, data: { user, roleRecord } });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────
async function getStudentRecord(clerkUserId: string) {
  const [user] = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
  if (!user) return null;
  const [student] = await db.select().from(students).where(eq(students.userId, user.id)).limit(1);
  return student ?? null;
}
async function getTeacherRecord(clerkUserId: string) {
  const [user] = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
  if (!user) return null;
  const [teacher] = await db.select().from(teachers).where(eq(teachers.userId, user.id)).limit(1);
  return teacher ?? null;
}

// ── Student routes ────────────────────────────────────────────────────────────
router.get("/portal/student/notices", async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);
  const now = new Date();
  try {
    const student = await getStudentRecord(clerkUserId!);
    const batchId = student?.batchId;
    const rows = await db.select().from(notices)
      .where(and(
        or(isNull(notices.expiresAt), gte(notices.expiresAt, now)),
        batchId
          ? or(eq(notices.isPublic, true), eq(notices.targetBatchId, batchId))
          : eq(notices.isPublic, true)
      ))
      .orderBy(desc(notices.publishedAt)).limit(20);
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ error: "Failed" }); }
});

router.get("/portal/student/materials", async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);
  try {
    const student = await getStudentRecord(clerkUserId!);
    if (!student?.batchId) { res.json({ ok: true, data: [] }); return; }
    const rows = await db.select().from(studyMaterials)
      .where(and(eq(studyMaterials.batchId, student.batchId), eq(studyMaterials.isVisible, true)))
      .orderBy(desc(studyMaterials.createdAt));
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ error: "Failed" }); }
});

router.get("/portal/student/assignments", async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);
  try {
    const student = await getStudentRecord(clerkUserId!);
    if (!student?.batchId) { res.json({ ok: true, data: [] }); return; }
    const rows = await db.select().from(assignments)
      .where(and(eq(assignments.batchId, student.batchId), eq(assignments.isVisible, true)))
      .orderBy(desc(assignments.dueDate)).limit(20);
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ error: "Failed" }); }
});

router.get("/portal/student/fee-records", async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);
  try {
    const student = await getStudentRecord(clerkUserId!);
    if (!student) { res.json({ ok: true, data: [] }); return; }
    const rows = await db.select().from(feeRecords)
      .where(eq(feeRecords.studentId, student.id))
      .orderBy(desc(feeRecords.dueDate));
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ error: "Failed" }); }
});

router.get("/portal/student/test-results", async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);
  try {
    const student = await getStudentRecord(clerkUserId!);
    if (!student) { res.json({ ok: true, data: [] }); return; }
    const rows = await db.select().from(studentTestResults)
      .where(eq(studentTestResults.studentId, student.id))
      .orderBy(desc(studentTestResults.examDate)).limit(20);
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ error: "Failed" }); }
});

router.get("/portal/student/attendance", async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);
  try {
    const student = await getStudentRecord(clerkUserId!);
    if (!student) { res.json({ ok: true, data: [], stats: null }); return; }
    const rows = await db.select().from(attendance)
      .where(eq(attendance.studentId, student.id))
      .orderBy(desc(attendance.date)).limit(60);
    const present = rows.filter(r => r.status === "present").length;
    const total = rows.length;
    res.json({ ok: true, data: rows, stats: { present, total, pct: total ? Math.round(present / total * 100) : 0 } });
  } catch (e) { res.status(500).json({ error: "Failed" }); }
});

router.get("/portal/student/mock-tests", async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);
  try {
    const student = await getStudentRecord(clerkUserId!);
    const batchId = student?.batchId;
    const rows = await db.select().from(mockTests)
      .where(and(
        eq(mockTests.isPublished, true),
        batchId ? or(eq(mockTests.batchId, batchId), eq(mockTests.isPublic, true)) : eq(mockTests.isPublic, true)
      ))
      .orderBy(desc(mockTests.createdAt)).limit(20);

    let attempts: typeof mockTestAttempts.$inferSelect[] = [];
    if (student) {
      attempts = await db.select().from(mockTestAttempts)
        .where(eq(mockTestAttempts.studentId, student.id));
    }
    res.json({ ok: true, data: rows, attempts });
  } catch (e) { res.status(500).json({ error: "Failed" }); }
});

// ── Teacher routes ────────────────────────────────────────────────────────────
router.get("/portal/teacher/batches", async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);
  try {
    const teacher = await getTeacherRecord(clerkUserId!);
    if (!teacher) { res.json({ ok: true, data: [] }); return; }
    const scheduleRows = await db.select({ batchId: schedules.batchId }).from(schedules)
      .where(eq(schedules.teacherId, teacher.id));
    const batchIds = [...new Set(scheduleRows.map(r => r.batchId).filter(Boolean))] as string[];
    if (!batchIds.length) { res.json({ ok: true, data: [] }); return; }
    const rows = await db
      .select({ id: batches.id, name: batches.name, timingLabel: batches.timingLabel, daysLabel: batches.daysLabel, status: batches.status, maxStudents: batches.maxStudents, courseName: courses.title })
      .from(batches).leftJoin(courses, eq(batches.courseId, courses.id))
      .where(inArray(batches.id, batchIds));
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ error: "Failed" }); }
});

router.get("/portal/teacher/schedule", async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);
  try {
    const teacher = await getTeacherRecord(clerkUserId!);
    if (!teacher) { res.json({ ok: true, data: [] }); return; }
    const rows = await db
      .select({ id: schedules.id, subject: schedules.subject, topic: schedules.topic, dayOfWeek: schedules.dayOfWeek, startTime: schedules.startTime, endTime: schedules.endTime, room: schedules.room, batchName: batches.name })
      .from(schedules).leftJoin(batches, eq(schedules.batchId, batches.id))
      .where(eq(schedules.teacherId, teacher.id))
      .orderBy(asc(schedules.dayOfWeek), asc(schedules.startTime));
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ error: "Failed" }); }
});

router.get("/portal/teacher/notices", async (req, res) => {
  const now = new Date();
  try {
    const rows = await db.select().from(notices)
      .where(and(eq(notices.isPublic, true), or(isNull(notices.expiresAt), gte(notices.expiresAt, now))))
      .orderBy(desc(notices.publishedAt)).limit(20);
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ error: "Failed" }); }
});

// ── Parent routes ─────────────────────────────────────────────────────────────
router.get("/portal/parent/child", async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);
  try {
    const [user] = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId!)).limit(1);
    if (!user) { res.json({ ok: true, data: null }); return; }
    const [parent] = await db.select().from(parents).where(eq(parents.userId, user.id)).limit(1);
    if (!parent?.studentId) { res.json({ ok: true, data: null }); return; }
    const rows = await db
      .select({
        id: students.id, rollNumber: students.rollNumber, enrolledAt: students.enrolledAt,
        batchName: batches.name, batchTiming: batches.timingLabel, batchDays: batches.daysLabel,
        courseName: courses.title, userName: users.name, userEmail: users.email, userPhone: users.phone,
      })
      .from(students).leftJoin(users, eq(students.userId, users.id))
      .leftJoin(batches, eq(students.batchId, batches.id))
      .leftJoin(courses, eq(batches.courseId, courses.id))
      .where(eq(students.id, parent.studentId)).limit(1);
    res.json({ ok: true, data: rows[0] ?? null });
  } catch (e) { res.status(500).json({ error: "Failed" }); }
});

router.get("/portal/parent/fees", async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);
  try {
    const [user] = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId!)).limit(1);
    if (!user) { res.json({ ok: true, data: [] }); return; }
    const [parent] = await db.select().from(parents).where(eq(parents.userId, user.id)).limit(1);
    if (!parent?.studentId) { res.json({ ok: true, data: [] }); return; }
    const rows = await db.select().from(feeRecords)
      .where(eq(feeRecords.studentId, parent.studentId))
      .orderBy(desc(feeRecords.dueDate));
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ error: "Failed" }); }
});

router.get("/portal/parent/notices", async (req, res) => {
  const now = new Date();
  try {
    const rows = await db.select().from(notices)
      .where(and(eq(notices.isPublic, true), or(isNull(notices.expiresAt), gte(notices.expiresAt, now))))
      .orderBy(desc(notices.publishedAt)).limit(15);
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ error: "Failed" }); }
});

export default router;

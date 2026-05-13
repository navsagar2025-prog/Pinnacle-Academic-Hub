import { Router, type Request, type Response } from "express";
import { requireAuth, getAuth, clerkClient } from "@clerk/express";
import { db } from "@workspace/db";
import {
  users, students, parents, teachers, batches, courses,
  notices, studyMaterials, assignments, feeRecords,
  attendance, studentTestResults, schedules, mockTests, mockTestAttempts,
  classRecordings, doubts, doubtAnswers,
  watermarkSettings, siteSettings,
  socialTeacherAccess, socialPosts, socialAccounts, blogPosts,
} from "@workspace/db/schema";
import { eq, and, or, isNull, gte, desc, asc, inArray, sql } from "drizzle-orm";
import busboy from "busboy";
import { createWriteStream, createReadStream, existsSync, mkdirSync } from "fs";
import { join as pathJoin, extname } from "path";
import { randomUUID } from "crypto";

const router = Router();
router.use(requireAuth());

// ── Me (with auto-sync on first Clerk login) ───────────────────────────────────
router.get("/portal/me", async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);
  if (!clerkUserId) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    let [user] = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);

    if (!user) {
      // Fetch Clerk profile to get name + email
      const clerkUser = await clerkClient.users.getUser(clerkUserId);
      const email = (clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)
        ?? clerkUser.emailAddresses[0])?.emailAddress ?? "";
      const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || email || "User";

      if (email) {
        // Check if admin pre-created this user by email (sentinel clerkUserId starts with "admin_created_")
        const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (existing) {
          // Link real Clerk ID → user was pre-approved by admin
          [user] = await db.update(users).set({ clerkUserId, updatedAt: new Date() }).where(eq(users.id, existing.id)).returning();
        }
      }

      if (!user) {
        // Completely new self-registration → pending until admin approves
        if (!email) { res.status(400).json({ error: "No email on Clerk account" }); return; }
        try {
          [user] = await db.insert(users).values({ clerkUserId, name, email, role: "student", approvalStatus: "pending" }).returning();
        } catch {
          // Email unique violation (race) → try to link by email
          const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
          if (existing) {
            [user] = await db.update(users).set({ clerkUserId, updatedAt: new Date() }).where(eq(users.id, existing.id)).returning();
          } else { res.status(500).json({ error: "Failed to sync user" }); return; }
        }
      }
    }

    // For pending/rejected users, return immediately without role record
    if (user.approvalStatus !== "approved") {
      res.json({ ok: true, data: { user, roleRecord: null } });
      return;
    }

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

// ── Student: recordings ───────────────────────────────────────────────────────
router.get("/portal/student/recordings", async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);
  try {
    const student = await getStudentRecord(clerkUserId!);
    const batchId = student?.batchId;
    if (!batchId) { res.json({ ok: true, data: [] }); return; }
    const rows = await db
      .select({
        id: classRecordings.id, title: classRecordings.title, subject: classRecordings.subject,
        teacherName: classRecordings.teacherName, recordingUrl: classRecordings.recordingUrl,
        sourceProvider: classRecordings.sourceProvider, classDate: classRecordings.classDate,
        durationMinutes: classRecordings.durationMinutes, viewCount: classRecordings.viewCount,
      })
      .from(classRecordings)
      .where(and(
        eq(classRecordings.isVisible, true),
        isNull(classRecordings.archivedAt),
        or(
          eq(classRecordings.batchId, batchId),
          sql`${classRecordings.batchIds}::jsonb @> ${JSON.stringify([batchId])}::jsonb`,
        ),
      ))
      .orderBy(desc(classRecordings.classDate))
      .limit(30);
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ error: "Failed to fetch recordings" }); }
});

// ── Student: doubts ───────────────────────────────────────────────────────────
router.get("/portal/student/doubts", async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);
  try {
    const student = await getStudentRecord(clerkUserId!);
    if (!student) { res.json({ ok: true, data: [] }); return; }
    const rows = await db.select({
      id: doubts.id, subject: doubts.subject, topic: doubts.topic,
      questionText: doubts.questionText, isResolved: doubts.isResolved,
      answerCount: doubts.answerCount, createdAt: doubts.createdAt,
    }).from(doubts)
      .where(eq(doubts.studentId, student.id))
      .orderBy(desc(doubts.createdAt))
      .limit(30);
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ error: "Failed to fetch doubts" }); }
});

router.post("/portal/student/doubts", async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);
  const { subject, topic, questionText } = req.body as { subject?: string; topic?: string; questionText?: string };
  if (!subject || !questionText) { res.status(400).json({ error: "subject and questionText required" }); return; }
  try {
    const student = await getStudentRecord(clerkUserId!);
    if (!student) { res.status(403).json({ error: "Student profile not found" }); return; }
    const [row] = await db.insert(doubts).values({
      studentId: student.id,
      batchId: student.batchId ?? null,
      subject,
      topic: topic ?? null,
      questionText,
    }).returning();
    res.json({ ok: true, data: row });
  } catch (e) { res.status(500).json({ error: "Failed to submit doubt" }); }
});

// ── Student: mock test submission ─────────────────────────────────────────────
router.post("/portal/student/mock-tests/:id/submit", async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);
  const { score } = req.body as { score?: number };
  if (score === undefined || typeof score !== "number") { res.status(400).json({ error: "score (number) is required" }); return; }
  try {
    const student = await getStudentRecord(clerkUserId!);
    if (!student) { res.status(403).json({ error: "Student profile not found" }); return; }

    const batchId = student.batchId;
    const [test] = await db.select().from(mockTests)
      .where(and(
        eq(mockTests.id, req.params.id),
        eq(mockTests.isPublished, true),
        batchId ? or(eq(mockTests.batchId, batchId), eq(mockTests.isPublic, true)) : eq(mockTests.isPublic, true),
      )).limit(1);
    if (!test) { res.status(404).json({ error: "Test not found or not accessible" }); return; }

    const maxScore = test.marksPerQuestion * 40;
    if (score < 0 || score > maxScore) {
      res.status(400).json({ error: `score must be between 0 and ${maxScore}` });
      return;
    }

    const [existing] = await db.select().from(mockTestAttempts)
      .where(and(eq(mockTestAttempts.testId, req.params.id), eq(mockTestAttempts.studentId, student.id)))
      .limit(1);
    let row;
    if (existing) {
      [row] = await db.update(mockTestAttempts)
        .set({ score, maxScore, isCompleted: true, submittedAt: new Date() })
        .where(eq(mockTestAttempts.id, existing.id))
        .returning();
    } else {
      [row] = await db.insert(mockTestAttempts).values({
        testId: req.params.id, studentId: student.id, score, maxScore, isCompleted: true, submittedAt: new Date(),
      }).returning();
    }
    res.json({ ok: true, data: row });
  } catch (e) { res.status(500).json({ error: "Failed to submit attempt" }); }
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

router.get("/portal/parent/overview", async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);
  try {
    const [user] = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId!)).limit(1);
    if (!user) { res.json({ ok: true, data: null }); return; }
    if (user.role !== "parent") { res.status(403).json({ error: "Forbidden" }); return; }
    const [parent] = await db.select().from(parents).where(eq(parents.userId, user.id)).limit(1);
    if (!parent?.studentId) { res.json({ ok: true, data: null }); return; }

    const studentId = parent.studentId;

    // Child info
    const [child] = await db
      .select({
        id: students.id, rollNumber: students.rollNumber, enrolledAt: students.enrolledAt,
        batchId: students.batchId,
        batchName: batches.name, batchTiming: batches.timingLabel, batchDays: batches.daysLabel,
        courseName: courses.title, userName: users.name, userEmail: users.email, userPhone: users.phone,
      })
      .from(students).leftJoin(users, eq(students.userId, users.id))
      .leftJoin(batches, eq(students.batchId, batches.id))
      .leftJoin(courses, eq(batches.courseId, courses.id))
      .where(eq(students.id, studentId)).limit(1);

    // Attendance (last 60 records)
    const attendanceRows = await db.select().from(attendance)
      .where(eq(attendance.studentId, studentId))
      .orderBy(desc(attendance.date)).limit(60);
    const present = attendanceRows.filter(r => r.status === "present").length;
    const total = attendanceRows.length;
    const attendanceStats = { present, total, pct: total ? Math.round(present / total * 100) : 0 };

    // All assignments for student's batch (pending + overdue — no date floor so nothing is hidden)
    let pendingAssignments: typeof assignments.$inferSelect[] = [];
    if (child?.batchId) {
      pendingAssignments = await db.select().from(assignments)
        .where(and(
          eq(assignments.batchId, child.batchId),
          eq(assignments.isVisible, true),
        ))
        .orderBy(asc(assignments.dueDate)).limit(20);
    }

    // Fee records
    const feeRows = await db.select().from(feeRecords)
      .where(eq(feeRecords.studentId, studentId))
      .orderBy(desc(feeRecords.dueDate));
    const totalDue = feeRows
      .filter(f => f.status === "due" || f.status === "overdue")
      .reduce((s, f) => s + (f.amount - f.paidAmount), 0);

    // Recent test results (last 10)
    const results = await db.select().from(studentTestResults)
      .where(eq(studentTestResults.studentId, studentId))
      .orderBy(desc(studentTestResults.examDate)).limit(10);

    res.json({
      ok: true,
      data: {
        child: child ?? null,
        attendance: { stats: attendanceStats, recent: attendanceRows.slice(0, 10) },
        assignments: pendingAssignments,
        fees: { records: feeRows, totalDue },
        results,
      },
    });
  } catch (e) {
    res.status(500).json({ error: "Failed to load overview" });
  }
});

// ── Unified fees route (student or parent) ────────────────────────────────────
router.get("/portal/fees", async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);
  try {
    const [user] = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId!)).limit(1);
    if (!user) { res.json({ ok: true, data: [], summary: { totalFee: 0, totalPaid: 0, totalDue: 0, nextDue: null } }); return; }

    if (!["student", "parent"].includes(user.role)) {
      res.status(403).json({ error: "Forbidden" }); return;
    }

    let studentId: string | null = null;

    if (user.role === "parent") {
      const [parent] = await db.select().from(parents).where(eq(parents.userId, user.id)).limit(1);
      if (!parent?.studentId) { res.json({ ok: true, data: [], summary: { totalFee: 0, totalPaid: 0, totalDue: 0, nextDue: null } }); return; }
      studentId = parent.studentId;
    } else {
      const [student] = await db.select().from(students).where(eq(students.userId, user.id)).limit(1);
      if (!student) { res.json({ ok: true, data: [], summary: { totalFee: 0, totalPaid: 0, totalDue: 0, nextDue: null } }); return; }
      studentId = student.id;
    }

    const rows = await db.select().from(feeRecords)
      .where(eq(feeRecords.studentId, studentId))
      .orderBy(desc(feeRecords.dueDate));

    const totalFee = rows.reduce((s, f) => s + f.amount, 0);
    const totalPaid = rows.reduce((s, f) => s + f.paidAmount, 0);
    const dueRows = rows.filter(f => f.status === "due" || f.status === "overdue");
    const totalDue = dueRows.reduce((s, f) => s + (f.amount - f.paidAmount), 0);
    const nextDue = [...dueRows].sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())[0]?.dueDate ?? null;

    res.json({ ok: true, data: rows, summary: { totalFee, totalPaid, totalDue, nextDue } });
  } catch (e) { res.status(500).json({ error: "Failed" }); }
});

// ── HTML escape helper (prevents XSS in receipt) ─────────────────────────────
function he(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// CSS string escape — used only for content: "..." in style blocks
function csse(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\A ");
}

// ── Fee receipt (watermarked HTML) ───────────────────────────────────────────
router.get("/portal/fees/receipt/:id", async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);
  try {
    const [user] = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId!)).limit(1);
    if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }

    const [record] = await db.select().from(feeRecords).where(eq(feeRecords.id, req.params.id)).limit(1);
    if (!record) { res.status(404).json({ error: "Record not found" }); return; }

    let authorized = false;
    let studentName = user.name;

    if (user.role === "student") {
      const [student] = await db.select().from(students).where(eq(students.userId, user.id)).limit(1);
      if (student?.id === record.studentId) { authorized = true; }
    } else if (user.role === "parent") {
      const [parent] = await db.select().from(parents).where(eq(parents.userId, user.id)).limit(1);
      if (parent?.studentId && parent.studentId === record.studentId) {
        authorized = true;
        const sid = record.studentId as string;
        const [sw] = await db
          .select({ name: users.name })
          .from(students)
          .leftJoin(users, eq(students.userId, users.id))
          .where(eq(students.id, sid))
          .limit(1);
        if (sw?.name) studentName = sw.name;
      }
    } else if (user.role === "admin") {
      authorized = true;
    }

    if (!authorized) { res.status(403).json({ error: "Forbidden" }); return; }

    const wmRows = await db.select().from(watermarkSettings)
      .where(or(eq(watermarkSettings.docType, "receipt"), eq(watermarkSettings.docType, "global")));
    let wm = wmRows.find(w => w.docType === "receipt");
    if (!wm || wm.useGlobal) wm = wmRows.find(w => w.docType === "global") ?? wm;

    const [siteRow] = await db.select().from(siteSettings).where(eq(siteSettings.key, "site_name")).limit(1);
    const centreName = siteRow?.value ?? "Pinnacle Academic Classes";

    const today = new Date().toLocaleDateString("en-IN");
    const rawTemplate = wm?.textTemplate ?? "{{centreName}} • {{date}}";
    const wmText = rawTemplate
      .replace(/\{\{centreName\}\}/g, centreName)
      .replace(/\{\{userName\}\}/g, studentName)
      .replace(/\{\{date\}\}/g, today);

    const wmEnabled = wm?.enabled ?? true;
    const wmOpacity = ((wm?.opacity ?? 12) / 100).toFixed(2);
    const wmRotation = wm?.rotation ?? -45;
    const wmFontSize = wm?.fontSize ?? 36;
    const wmColor = wm?.color ?? "#888888";
    const wmPosition = wm?.position ?? "tile";

    // CSS content: "..." values must use CSS string escaping, not HTML escaping
    const cssWmText = csse(wmText);

    // Validate wmColor is a safe hex/named color (prevent CSS injection)
    const safeColor = /^#[0-9a-fA-F]{3,8}$/.test(wmColor) ? wmColor : "#888888";

    let wmCss = "";
    if (wmEnabled) {
      if (wmPosition === "tile") {
        wmCss = `
          .watermark { position: fixed; inset: 0; pointer-events: none; z-index: 1000; overflow: hidden; }
          .watermark::after {
            content: "${cssWmText}";
            font-size: ${wmFontSize}px; color: ${safeColor}; opacity: ${wmOpacity};
            position: fixed; top: 50%; left: 50%;
            transform: translate(-50%, -50%) rotate(${wmRotation}deg);
            white-space: nowrap; pointer-events: none;
          }`;
      } else if (wmPosition === "center") {
        wmCss = `
          .watermark { position: fixed; inset: 0; pointer-events: none; z-index: 1000; display: flex; align-items: center; justify-content: center; }
          .watermark::after {
            content: "${cssWmText}";
            font-size: ${wmFontSize}px; color: ${safeColor}; opacity: ${wmOpacity};
            transform: rotate(${wmRotation}deg); white-space: nowrap; pointer-events: none;
          }`;
      } else {
        wmCss = `
          .watermark {
            position: fixed; bottom: 20px; left: 0; right: 0; text-align: center;
            pointer-events: none; z-index: 1000;
            font-size: ${Math.round(wmFontSize * 0.6)}px; color: ${safeColor}; opacity: ${wmOpacity};
          }`;
      }
    }

    const statusLabel: Record<string, string> = {
      paid: "Paid", partial: "Partially Paid", due: "Due", overdue: "Overdue", waived: "Waived",
    };

    // All user-controlled values are HTML-escaped via he() before interpolation
    const safeStatus = ["paid", "partial", "due", "overdue", "waived"].includes(record.status) ? record.status : "due";
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Fee Receipt &mdash; ${he(centreName)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 40px; }
    .page { max-width: 680px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .hdr { background: #0A1F5C; color: white; padding: 32px; text-align: center; }
    .hdr h1 { font-size: 22px; font-weight: 800; }
    .hdr p { font-size: 13px; opacity: 0.7; margin-top: 6px; }
    .hdr .ref { display: inline-block; background: rgba(255,255,255,0.15); border-radius: 20px; padding: 4px 16px; font-size: 12px; margin-top: 10px; }
    .body { padding: 32px; }
    .sec-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 12px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; margin-bottom: 24px; }
    .info-item label { font-size: 11px; color: #94a3b8; display: block; margin-bottom: 2px; }
    .info-item span { font-size: 14px; font-weight: 600; color: #1e293b; }
    .divider { height: 1px; background: #e2e8f0; margin: 20px 0; }
    .amt-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 24px; }
    .amt-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 14px; }
    .amt-row:last-child { margin-bottom: 0; padding-top: 10px; border-top: 1px dashed #cbd5e1; margin-top: 10px; font-size: 16px; font-weight: 700; }
    .amt-row label { color: #64748b; }
    .amt-row span { font-weight: 600; color: #1e293b; }
    .badge { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; }
    .badge-paid { background: #dcfce7; color: #166534; }
    .badge-partial { background: #fef9c3; color: #854d0e; }
    .badge-due { background: #fee2e2; color: #991b1b; }
    .badge-overdue { background: #fecaca; color: #7f1d1d; }
    .badge-waived { background: #f1f5f9; color: #475569; }
    .ftr { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 32px; text-align: center; }
    .ftr p { font-size: 11px; color: #94a3b8; line-height: 1.6; }
    .print-btn { background: #0A1F5C; color: white; border: none; padding: 10px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; display: block; margin: 0 auto; }
    ${wmCss}
    @media print { body { background: white; padding: 0; } .page { box-shadow: none; border-radius: 0; } .print-btn { display: none !important; } }
  </style>
</head>
<body>
  ${wmEnabled ? `<div class="watermark">${wmPosition === "footer" ? he(wmText) : ""}</div>` : ""}
  <div class="page">
    <div class="hdr">
      <h1>${he(centreName)}</h1>
      <p>Fee Payment Receipt</p>
      <div class="ref">Ref: ${he(record.transactionRef ?? record.id.slice(0, 12).toUpperCase())}</div>
    </div>
    <div class="body">
      <p class="sec-title">Student Details</p>
      <div class="info-grid">
        <div class="info-item"><label>Name</label><span>${he(studentName)}</span></div>
        <div class="info-item"><label>Period</label><span>${he(record.period)}</span></div>
        <div class="info-item"><label>Due Date</label><span>${record.dueDate ? he(new Date(record.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })) : "—"}</span></div>
        ${record.paidDate ? `<div class="info-item"><label>Payment Date</label><span>${he(new Date(record.paidDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }))}</span></div>` : ""}
        ${record.paymentMethod ? `<div class="info-item"><label>Payment Mode</label><span>${he(record.paymentMethod)}</span></div>` : ""}
        <div class="info-item"><label>Status</label><span class="badge badge-${safeStatus}">${he(statusLabel[record.status] ?? record.status)}</span></div>
      </div>
      <div class="divider"></div>
      <p class="sec-title">Amount Details</p>
      <div class="amt-box">
        <div class="amt-row"><label>Total Fee</label><span>&#x20B9;${record.amount.toLocaleString("en-IN")}</span></div>
        <div class="amt-row"><label>Amount Paid</label><span>&#x20B9;${record.paidAmount.toLocaleString("en-IN")}</span></div>
        ${record.paidAmount < record.amount ? `<div class="amt-row"><label>Balance Due</label><span style="color:#dc2626">&#x20B9;${(record.amount - record.paidAmount).toLocaleString("en-IN")}</span></div>` : ""}
        <div class="amt-row"><label>Net Amount Paid</label><span style="color:#0A1F5C">&#x20B9;${record.paidAmount.toLocaleString("en-IN")}</span></div>
      </div>
      ${record.notes ? `<p style="font-size:12px;color:#64748b;margin-bottom:16px;line-height:1.5">Note: ${he(record.notes)}</p>` : ""}
      <button class="print-btn" onclick="window.print()">&#128424; Print / Save as PDF</button>
    </div>
    <div class="ftr">
      <p>${he(centreName)} &bull; Computer-generated receipt. No signature required.<br>For queries, contact the Pinnacle office.</p>
    </div>
  </div>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (e) { res.status(500).json({ error: "Failed to generate receipt" }); }
});

// ── Teacher: Social Media Posts ───────────────────────────────────────────────

// Returns the teacher's social media access settings so the UI can show/hide the composer.
router.get("/portal/teacher/social/access", async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);
  try {
    const [user] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.clerkUserId, clerkUserId!)).limit(1);
    if (!user || user.role !== "teacher") {
      res.json({ ok: true, data: { isEnabled: false, platformsAllowed: [], connectedPlatforms: [] } }); return;
    }
    const [access] = await db.select().from(socialTeacherAccess).where(eq(socialTeacherAccess.userId, user.id)).limit(1);
    const connected = await db
      .select({ platform: socialAccounts.platform })
      .from(socialAccounts)
      .where(eq(socialAccounts.status, "connected"));
    res.json({
      ok: true,
      data: {
        isEnabled: access?.isEnabled ?? false,
        platformsAllowed: access?.platformsAllowed ?? [],
        connectedPlatforms: connected.map(c => c.platform),
      },
    });
  } catch (e) { res.status(500).json({ error: "Failed" }); }
});

// Returns the teacher's own posts so they can track status.
router.get("/portal/teacher/social/posts", async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);
  try {
    const [user] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.clerkUserId, clerkUserId!)).limit(1);
    if (!user || user.role !== "teacher") { res.json({ ok: true, data: [] }); return; }
    const rows = await db.select().from(socialPosts)
      .where(eq(socialPosts.postedByUserId, user.id))
      .orderBy(desc(socialPosts.createdAt)).limit(50);
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ error: "Failed" }); }
});

// Media upload for teacher posts. Accepts a multipart file (field: "file"),
// stores it in the uploads directory, and returns a public URL.
router.post("/portal/teacher/social/media-upload", async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);
  try {
    const [user] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.clerkUserId, clerkUserId!)).limit(1);
    if (!user || (user.role !== "teacher" && user.role !== "admin")) { res.status(403).json({ error: "Staff access required" }); return; }

    const bb = busboy({ headers: req.headers, limits: { files: 1, fileSize: 10 * 1024 * 1024 } });

    let savedUrl: string | null = null;
    let fileErr: string | null = null;

    const uploadDir = pathJoin(process.cwd(), "uploads", "social");
    if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

    // writeFinished is awaited after busboy.finish to avoid a race where savedUrl is still null.
    let writeFinished: Promise<void> = Promise.resolve();

    await new Promise<void>((resolve, reject) => {
      bb.on("file", (_field, file, info) => {
        const ext = info.filename.split(".").pop()?.toLowerCase() ?? "bin";
        const allowed = ["jpg", "jpeg", "png", "gif", "webp", "mp4", "mov"];
        if (!allowed.includes(ext)) { fileErr = "Unsupported file type"; file.resume(); return; }
        const filename = `${randomUUID()}.${ext}`;
        const savePath = pathJoin(uploadDir, filename);
        const ws = createWriteStream(savePath);
        writeFinished = new Promise<void>((wsResolve, wsReject) => {
          ws.on("finish", () => {
            const base = process.env.WEBSITE_BASE_URL ?? `${req.protocol}://${req.get("host")}`;
            savedUrl = `${base.replace(/\/$/, "")}/api/v1/social/media/${filename}`;
            wsResolve();
          });
          ws.on("error", wsReject);
        });
        file.pipe(ws);
      });
      bb.on("finish", resolve);
      bb.on("error", reject);
      req.pipe(bb);
    });
    await writeFinished;

    if (fileErr) { res.status(400).json({ error: fileErr }); return; }
    if (!savedUrl) { res.status(400).json({ error: "No file received" }); return; }
    res.json({ ok: true, url: savedUrl });
  } catch (e) {
    console.error("Teacher media upload error:", e);
    res.status(500).json({ error: "Upload failed" });
  }
});

// GET /portal/teacher/social/blog-posts — published blog posts list for link-to-blog in composer
router.get("/portal/teacher/social/blog-posts", async (_req, res) => {
  try {
    const rows = await db
      .select({ id: blogPosts.id, title: blogPosts.title })
      .from(blogPosts)
      .where(eq(blogPosts.status, "published"))
      .orderBy(desc(blogPosts.createdAt))
      .limit(50);
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch blog posts" });
  }
});

// GET /portal/teacher/social/unread-rejections — rejected posts NOT yet seen by teacher
// Filters by teacher_seen_at IS NULL so the badge clears after acknowledgement.
router.get("/portal/teacher/social/unread-rejections", async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);
  try {
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.clerkUserId, clerkUserId!)).limit(1);
    if (!user) { res.json({ ok: true, data: { count: 0, posts: [] } }); return; }
    const rows = await db
      .select({ id: socialPosts.id, content: socialPosts.content, rejectionNote: socialPosts.rejectionNote, createdAt: socialPosts.createdAt })
      .from(socialPosts)
      .where(and(
        eq(socialPosts.postedByUserId, user.id),
        eq(socialPosts.status, "rejected"),
        isNull(socialPosts.teacherSeenAt),
      ))
      .orderBy(desc(socialPosts.createdAt))
      .limit(10);
    res.json({ ok: true, data: { count: rows.length, posts: rows } });
  } catch (e) {
    res.status(500).json({ error: "Failed" });
  }
});

// POST /portal/teacher/social/rejections/mark-seen — clear the unread badge
// Sets teacher_seen_at = NOW() on all unseen rejected posts for this teacher.
router.post("/portal/teacher/social/rejections/mark-seen", async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);
  try {
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.clerkUserId, clerkUserId!)).limit(1);
    if (!user) { res.json({ ok: true }); return; }
    await db.update(socialPosts)
      .set({ teacherSeenAt: new Date(), updatedAt: new Date() })
      .where(and(
        eq(socialPosts.postedByUserId, user.id),
        eq(socialPosts.status, "rejected"),
        isNull(socialPosts.teacherSeenAt),
      ));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Failed" });
  }
});

// Submit a social post for admin approval. Enforces teacher access + platform allowlist.
router.post("/portal/teacher/social/posts", async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);
  const { content, mediaUrls, platformTargets, linkedBlogId, linkedNoticeId } = req.body;
  if (!content || !platformTargets?.length) {
    res.status(400).json({ error: "content and platformTargets are required" }); return;
  }
  try {
    const [user] = await db.select({ id: users.id, name: users.name, role: users.role }).from(users).where(eq(users.clerkUserId, clerkUserId!)).limit(1);
    if (!user || user.role !== "teacher") { res.status(403).json({ error: "Teacher access required" }); return; }

    const [access] = await db.select().from(socialTeacherAccess).where(eq(socialTeacherAccess.userId, user.id)).limit(1);
    if (!access?.isEnabled) { res.status(403).json({ error: "Social media access not granted for your account. Contact admin." }); return; }

    const allowed: string[] = access.platformsAllowed ?? [];
    const disallowed = (platformTargets as string[]).filter(p => !allowed.includes(p));
    if (disallowed.length > 0) {
      res.status(403).json({ error: `You do not have access to post on: ${disallowed.join(", ")}` }); return;
    }

    const connectedAccounts = await db
      .select({ platform: socialAccounts.platform })
      .from(socialAccounts)
      .where(eq(socialAccounts.status, "connected"));
    const connectedPlatforms = new Set(connectedAccounts.map(a => a.platform));
    const disconnected = (platformTargets as string[]).filter(p => !connectedPlatforms.has(p));
    if (disconnected.length > 0) {
      res.status(400).json({ error: `The following platforms are not connected yet: ${disconnected.join(", ")}. Ask your admin to connect them first.` }); return;
    }

    const [row] = await db.insert(socialPosts).values({
      content, mediaUrls: mediaUrls || [], platformTargets,
      status: "pending",
      postedByUserId: user.id, postedByName: user.name,
      linkedBlogId: linkedBlogId || null, linkedNoticeId: linkedNoticeId || null,
    }).returning();

    res.status(201).json({ ok: true, data: row });
  } catch (e) {
    console.error("POST /portal/teacher/social/posts error:", e);
    res.status(500).json({ error: "Failed to submit post" });
  }
});

// NOTE: /social/media/:filename is intentionally NOT registered here.
// It is a PUBLIC unauthenticated route registered directly in routes/index.ts
// so that social platforms (Instagram, Facebook, etc.) can fetch uploaded media
// without needing a Clerk session cookie or Bearer token.

export default router;

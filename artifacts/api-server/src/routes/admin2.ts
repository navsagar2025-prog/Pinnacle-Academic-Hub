import { Router, type Request, type Response, type NextFunction } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import {
  schedules, assignments, studyMaterials, attendance, attendanceLowAlerts,
  liveClasses, classRecordings,
  doubts, doubtAnswers, promotions, practiceSets, practiceSetQuestions,
  questionBank, siteSettings, seoOverrides, watermarkSettings, pageViews,
  securityEvents, ipLockouts, auditLogs, users, students, batches, courses, teachers,
} from "@workspace/db/schema";
import { desc, eq, sql, asc, isNull, isNotNull, and, gte, lte, ilike, or, inArray } from "drizzle-orm";
import { getEffectiveCreds, runReportWithCreds } from "../lib/ga4.js";
import { emailAvailableAsync, sendEmail, buildApprovalEmail, buildRejectionEmail } from "../lib/email.js";

const router = Router();
router.use(requireAuth());

async function requireAdminRole(req: Request, res: Response, next: NextFunction) {
  const { userId: clerkUserId } = getAuth(req);
  if (!clerkUserId) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const [user] = await db.select({ role: users.role, approvalStatus: users.approvalStatus })
      .from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
    if (!user || user.role !== "admin" || user.approvalStatus !== "approved") {
      res.status(403).json({ error: "Forbidden: admin access required" }); return;
    }
    next();
  } catch {
    res.status(500).json({ error: "Failed to verify role" });
  }
}

router.use(requireAdminRole);

// ── Schedules (Timetable) ─────────────────────────────────────────────────────

router.get("/admin/schedules", async (req, res) => {
  try {
    const { batchId } = req.query as { batchId?: string };
    const rows = await db
      .select({
        id: schedules.id, subject: schedules.subject, topic: schedules.topic,
        dayOfWeek: schedules.dayOfWeek, startTime: schedules.startTime,
        endTime: schedules.endTime, room: schedules.room, isRecurring: schedules.isRecurring,
        batchId: schedules.batchId, batchName: batches.name,
        teacherId: schedules.teacherId, teacherName: users.name,
        createdAt: schedules.createdAt,
      })
      .from(schedules)
      .leftJoin(batches, eq(schedules.batchId, batches.id))
      .leftJoin(teachers, eq(schedules.teacherId, teachers.id))
      .leftJoin(users, eq(teachers.userId, users.id))
      .where(batchId ? eq(schedules.batchId, batchId) : undefined)
      .orderBy(asc(schedules.dayOfWeek), asc(schedules.startTime));
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ error: "Failed to fetch schedules" }); }
});

router.post("/admin/schedules", async (req, res) => {
  const { batchId, teacherId, subject, topic, dayOfWeek, startTime, endTime, room, isRecurring } = req.body;
  if (!subject || dayOfWeek == null || !startTime || !endTime) {
    res.status(400).json({ error: "subject, dayOfWeek, startTime, endTime required" }); return;
  }
  try {
    const [row] = await db.insert(schedules).values({ batchId, teacherId, subject, topic, dayOfWeek, startTime, endTime, room, isRecurring: isRecurring ?? true }).returning();
    res.json({ ok: true, data: row });
  } catch (e) { res.status(500).json({ error: "Failed to create schedule" }); }
});

router.patch("/admin/schedules/:id", async (req, res) => {
  const { batchId, teacherId, subject, topic, dayOfWeek, startTime, endTime, room, isRecurring } = req.body;
  try {
    const [row] = await db.update(schedules).set({ batchId, teacherId, subject, topic, dayOfWeek, startTime, endTime, room, isRecurring, updatedAt: new Date() }).where(eq(schedules.id, req.params.id)).returning();
    res.json({ ok: true, data: row });
  } catch (e) { res.status(500).json({ error: "Failed to update schedule" }); }
});

router.delete("/admin/schedules/:id", async (req, res) => {
  try {
    await db.delete(schedules).where(eq(schedules.id, req.params.id));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "Failed to delete schedule" }); }
});

// ── Assignments ───────────────────────────────────────────────────────────────

router.get("/admin/assignments", async (req, res) => {
  try {
    const { batchId } = req.query as { batchId?: string };
    const rows = await db
      .select({
        id: assignments.id, title: assignments.title, subject: assignments.subject,
        description: assignments.description, dueDate: assignments.dueDate,
        maxMarks: assignments.maxMarks, isVisible: assignments.isVisible,
        fileUrl: assignments.fileUrl, batchId: assignments.batchId,
        batchName: batches.name, createdAt: assignments.createdAt,
      })
      .from(assignments)
      .leftJoin(batches, eq(assignments.batchId, batches.id))
      .where(batchId ? eq(assignments.batchId, batchId) : undefined)
      .orderBy(desc(assignments.dueDate));
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ error: "Failed to fetch assignments" }); }
});

router.post("/admin/assignments", async (req, res) => {
  const { batchId, title, subject, description, dueDate, maxMarks, fileUrl } = req.body;
  if (!title || !subject || !dueDate) { res.status(400).json({ error: "title, subject, dueDate required" }); return; }
  try {
    const { userId: clerkUserId } = getAuth(req);
    if (!clerkUserId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const [adminUser] = await db.select({ id: users.id }).from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
    if (!adminUser) { res.status(500).json({ error: "Admin user record not found" }); return; }
    const [row] = await db.insert(assignments).values({
      batchId, title, subject, description, dueDate: new Date(dueDate), maxMarks, fileUrl,
      postedBy: adminUser.id,
    }).returning();
    res.json({ ok: true, data: row });
  } catch (e) { console.error(e); res.status(500).json({ error: "Failed to create assignment" }); }
});

router.patch("/admin/assignments/:id", async (req, res) => {
  const { title, subject, description, dueDate, maxMarks, isVisible, fileUrl } = req.body;
  try {
    const [row] = await db.update(assignments).set({ title, subject, description, dueDate: dueDate ? new Date(dueDate) : undefined, maxMarks, isVisible, fileUrl, updatedAt: new Date() }).where(eq(assignments.id, req.params.id)).returning();
    res.json({ ok: true, data: row });
  } catch (e) { res.status(500).json({ error: "Failed to update assignment" }); }
});

router.delete("/admin/assignments/:id", async (req, res) => {
  try {
    await db.delete(assignments).where(eq(assignments.id, req.params.id));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "Failed to delete assignment" }); }
});

// ── Study Materials ────────────────────────────────────────────────────────────

router.get("/admin/study-materials", async (req, res) => {
  try {
    const { batchId } = req.query as { batchId?: string };
    const rows = await db
      .select({
        id: studyMaterials.id, title: studyMaterials.title, subject: studyMaterials.subject,
        type: studyMaterials.type, fileUrl: studyMaterials.fileUrl, fileSize: studyMaterials.fileSize,
        downloadCount: studyMaterials.downloadCount, isVisible: studyMaterials.isVisible,
        batchId: studyMaterials.batchId, batchName: batches.name, createdAt: studyMaterials.createdAt,
      })
      .from(studyMaterials)
      .leftJoin(batches, eq(studyMaterials.batchId, batches.id))
      .where(batchId ? eq(studyMaterials.batchId, batchId) : undefined)
      .orderBy(desc(studyMaterials.createdAt));
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ error: "Failed to fetch study materials" }); }
});

router.post("/admin/study-materials", async (req, res) => {
  const { batchId, title, subject, type, fileUrl, fileSize } = req.body;
  if (!title || !subject || !type) { res.status(400).json({ error: "title, subject, type required" }); return; }
  try {
    const { userId: clerkUserId } = getAuth(req);
    if (!clerkUserId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const [adminUser] = await db.select({ id: users.id }).from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
    if (!adminUser) { res.status(500).json({ error: "Admin user record not found" }); return; }
    const [row] = await db.insert(studyMaterials).values({
      batchId, title, subject, type, fileUrl, fileSize,
      uploadedBy: adminUser.id,
    }).returning();
    res.json({ ok: true, data: row });
  } catch (e) { res.status(500).json({ error: "Failed to create study material" }); }
});

router.patch("/admin/study-materials/:id", async (req, res) => {
  const { title, subject, type, fileUrl, fileSize, isVisible } = req.body;
  try {
    const [row] = await db.update(studyMaterials).set({ title, subject, type, fileUrl, fileSize, isVisible, updatedAt: new Date() }).where(eq(studyMaterials.id, req.params.id)).returning();
    res.json({ ok: true, data: row });
  } catch (e) { res.status(500).json({ error: "Failed to update study material" }); }
});

router.delete("/admin/study-materials/:id", async (req, res) => {
  try {
    await db.delete(studyMaterials).where(eq(studyMaterials.id, req.params.id));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "Failed to delete study material" }); }
});

// ── Attendance ─────────────────────────────────────────────────────────────────

router.get("/admin/attendance/low-alerts", async (_req, res) => {
  try {
    const alerts = await db
      .select({
        id: attendanceLowAlerts.id,
        notifiedPct: attendanceLowAlerts.notifiedPct,
        notifiedAt: attendanceLowAlerts.notifiedAt,
        hasRecovered: attendanceLowAlerts.hasRecovered,
        studentId: students.id,
        rollNumber: students.rollNumber,
        batchId: students.batchId,
        batchName: batches.name,
        studentName: users.name,
      })
      .from(attendanceLowAlerts)
      .leftJoin(students, eq(attendanceLowAlerts.studentId, students.id))
      .leftJoin(users, eq(students.userId, users.id))
      .leftJoin(batches, eq(students.batchId, batches.id))
      .where(eq(attendanceLowAlerts.hasRecovered, false))
      .orderBy(asc(attendanceLowAlerts.notifiedPct));
    res.json({ ok: true, data: alerts });
  } catch (e) {
    console.error("GET /admin/attendance/low-alerts error:", e);
    res.status(500).json({ error: "Failed to fetch low-attendance alerts" });
  }
});

router.get("/admin/attendance", async (req, res) => {
  try {
    const { batchId, date, subject } = req.query as { batchId?: string; date?: string; subject?: string };
    if (!batchId || !date) { res.status(400).json({ error: "batchId and date required" }); return; }
    const day = new Date(date);
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);

    const batchStudents = await db
      .select({ id: students.id, rollNumber: students.rollNumber, userName: users.name })
      .from(students)
      .leftJoin(users, eq(students.userId, users.id))
      .where(and(eq(students.batchId, batchId), eq(students.isActive, true)))
      .orderBy(asc(students.rollNumber));

    const conditions = [
      sql`student_id IN (SELECT id FROM students WHERE batch_id = ${batchId})`,
      gte(attendance.date, day),
      sql`${attendance.date} < ${nextDay}`,
    ];
    if (subject) conditions.push(eq(attendance.subject, subject));

    const records = await db.select().from(attendance).where(and(...conditions));

    const recordMap = new Map(records.map(r => [r.studentId, r]));
    const data = batchStudents.map(s => ({
      ...s,
      attendance: recordMap.get(s.id) ?? null,
      status: recordMap.get(s.id)?.status ?? "present",
    }));
    res.json({ ok: true, data });
  } catch (e) { console.error(e); res.status(500).json({ error: "Failed to fetch attendance" }); }
});

router.post("/admin/attendance/bulk", async (req, res) => {
  try {
    const { records, subject, markedBy } = req.body as {
      records: { studentId: string; date: string; status: string }[];
      subject: string;
      markedBy?: string;
    };
    if (!records?.length || !subject) { res.status(400).json({ error: "records and subject required" }); return; }
    const values = records.map(r => ({
      studentId: r.studentId,
      date: new Date(r.date),
      subject,
      status: r.status as "present" | "absent" | "late",
      markedBy: markedBy ?? null,
    }));
    await db.insert(attendance).values(values)
      .onConflictDoUpdate({
        target: [attendance.studentId, attendance.date, attendance.subject],
        set: { status: sql`excluded.status`, markedBy: sql`excluded.marked_by` },
      });
    res.json({ ok: true, count: values.length });
  } catch (e) { console.error(e); res.status(500).json({ error: "Failed to save attendance" }); }
});

// ── Live Classes ──────────────────────────────────────────────────────────────

router.get("/admin/live-classes", async (req, res) => {
  try {
    const { batchId } = req.query as { batchId?: string };
    const rows = await db
      .select({
        id: liveClasses.id, topic: liveClasses.topic, subject: liveClasses.subject,
        scheduledAt: liveClasses.scheduledAt, status: liveClasses.status,
        durationMinutes: liveClasses.durationMinutes,
        zoomMeetingId: liveClasses.zoomMeetingId, zoomJoinUrl: liveClasses.zoomJoinUrl,
        zoomPasscode: liveClasses.zoomPasscode, recordingUrl: liveClasses.recordingUrl,
        batchId: liveClasses.batchId, batchName: batches.name,
        teacherId: liveClasses.teacherId, teacherName: users.name,
        createdAt: liveClasses.createdAt,
      })
      .from(liveClasses)
      .leftJoin(batches, eq(liveClasses.batchId, batches.id))
      .leftJoin(teachers, eq(liveClasses.teacherId, teachers.id))
      .leftJoin(users, eq(teachers.userId, users.id))
      .where(batchId ? eq(liveClasses.batchId, batchId) : undefined)
      .orderBy(desc(liveClasses.scheduledAt));
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ error: "Failed to fetch live classes" }); }
});

router.post("/admin/live-classes", async (req, res) => {
  const { batchId, teacherId, topic, subject, zoomMeetingId, zoomJoinUrl, zoomHostUrl, zoomPasscode, scheduledAt, durationMinutes } = req.body;
  if (!topic || !scheduledAt) { res.status(400).json({ error: "topic and scheduledAt required" }); return; }
  try {
    const [row] = await db.insert(liveClasses).values({ batchId, teacherId, topic, subject, zoomMeetingId, zoomJoinUrl, zoomHostUrl, zoomPasscode, scheduledAt: new Date(scheduledAt), durationMinutes }).returning();
    res.json({ ok: true, data: row });
  } catch (e) { res.status(500).json({ error: "Failed to create live class" }); }
});

router.patch("/admin/live-classes/:id", async (req, res) => {
  const { topic, subject, status, zoomJoinUrl, zoomPasscode, scheduledAt, durationMinutes, recordingUrl } = req.body;
  try {
    const [row] = await db.update(liveClasses).set({ topic, subject, status, zoomJoinUrl, zoomPasscode, scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined, durationMinutes, recordingUrl, updatedAt: new Date() }).where(eq(liveClasses.id, req.params.id)).returning();
    res.json({ ok: true, data: row });
  } catch (e) { res.status(500).json({ error: "Failed to update live class" }); }
});

router.delete("/admin/live-classes/:id", async (req, res) => {
  try {
    await db.delete(liveClasses).where(eq(liveClasses.id, req.params.id));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "Failed to delete live class" }); }
});

// ── Recordings ────────────────────────────────────────────────────────────────

router.get("/admin/recordings", async (req, res) => {
  try {
    const { batchId } = req.query as { batchId?: string };
    const rows = await db
      .select({
        id: classRecordings.id, title: classRecordings.title, subject: classRecordings.subject,
        teacherName: classRecordings.teacherName, recordingUrl: classRecordings.recordingUrl,
        sourceProvider: classRecordings.sourceProvider, classDate: classRecordings.classDate,
        durationMinutes: classRecordings.durationMinutes, isVisible: classRecordings.isVisible,
        viewCount: classRecordings.viewCount, batchId: classRecordings.batchId,
        batchIds: classRecordings.batchIds, archivedAt: classRecordings.archivedAt,
        batchName: batches.name, createdAt: classRecordings.createdAt,
      })
      .from(classRecordings)
      .leftJoin(batches, eq(classRecordings.batchId, batches.id))
      .where(and(
        isNull(classRecordings.archivedAt),
        batchId ? eq(classRecordings.batchId, batchId) : undefined,
      ))
      .orderBy(desc(classRecordings.classDate));
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ error: "Failed to fetch recordings" }); }
});

router.post("/admin/recordings", async (req, res) => {
  const { batchId, title, subject, teacherName, recordingUrl, sourceProvider, classDate, durationMinutes } = req.body;
  if (!title || !subject || !recordingUrl) { res.status(400).json({ error: "title, subject, recordingUrl required" }); return; }
  try {
    const [row] = await db.insert(classRecordings).values({
      batchId: batchId ?? null,
      batchIds: batchId ? [batchId] : [],
      title, subject, teacherName, recordingUrl,
      sourceProvider: sourceProvider ?? "zoom",
      classDate: classDate ? new Date(classDate) : null,
      durationMinutes,
    }).returning();
    res.json({ ok: true, data: row });
  } catch (e) { console.error(e); res.status(500).json({ error: "Failed to create recording" }); }
});

router.patch("/admin/recordings/:id", async (req, res) => {
  const { title, subject, teacherName, recordingUrl, isVisible, durationMinutes } = req.body;
  try {
    const [row] = await db.update(classRecordings).set({ title, subject, teacherName, recordingUrl, isVisible, durationMinutes, updatedAt: new Date() }).where(eq(classRecordings.id, req.params.id)).returning();
    res.json({ ok: true, data: row });
  } catch (e) { res.status(500).json({ error: "Failed to update recording" }); }
});

router.delete("/admin/recordings/:id", async (req, res) => {
  try {
    await db.update(classRecordings).set({ archivedAt: new Date() }).where(eq(classRecordings.id, req.params.id));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "Failed to archive recording" }); }
});

// ── Doubts ────────────────────────────────────────────────────────────────────

router.get("/admin/doubts", async (req, res) => {
  try {
    const { resolved } = req.query as { resolved?: string };
    const rows = await db
      .select({
        id: doubts.id, subject: doubts.subject, topic: doubts.topic,
        questionText: doubts.questionText, status: doubts.status,
        isResolved: doubts.isResolved, answerCount: doubts.answerCount,
        batchId: doubts.batchId, batchName: batches.name,
        studentId: doubts.studentId, studentName: users.name,
        createdAt: doubts.createdAt,
      })
      .from(doubts)
      .leftJoin(students, eq(doubts.studentId, students.id))
      .leftJoin(users, eq(students.userId, users.id))
      .leftJoin(batches, eq(doubts.batchId, batches.id))
      .where(resolved === "true" ? eq(doubts.isResolved, true) : eq(doubts.isResolved, false))
      .orderBy(desc(doubts.createdAt))
      .limit(200);
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ error: "Failed to fetch doubts" }); }
});

router.get("/admin/doubts/:id", async (req, res) => {
  try {
    const [doubt] = await db.select().from(doubts).where(eq(doubts.id, req.params.id));
    if (!doubt) { res.status(404).json({ error: "Not found" }); return; }
    const answers = await db.select().from(doubtAnswers).where(eq(doubtAnswers.doubtId, req.params.id)).orderBy(asc(doubtAnswers.createdAt));
    res.json({ ok: true, data: { ...doubt, answers } });
  } catch (e) { res.status(500).json({ error: "Failed to fetch doubt" }); }
});

router.patch("/admin/doubts/:id", async (req, res) => {
  try {
    const { isResolved, status } = req.body;
    const [row] = await db.update(doubts).set({ isResolved, status, updatedAt: new Date() }).where(eq(doubts.id, req.params.id)).returning();
    res.json({ ok: true, data: row });
  } catch (e) { res.status(500).json({ error: "Failed to update doubt" }); }
});

router.post("/admin/doubts/:id/answer", async (req, res) => {
  try {
    const { answerText } = req.body;
    if (!answerText?.trim()) { res.status(400).json({ error: "answerText required" }); return; }
    const { userId: clerkUserId } = getAuth(req);
    if (!clerkUserId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const [doubt] = await db.select({ id: doubts.id }).from(doubts).where(eq(doubts.id, req.params.id)).limit(1);
    if (!doubt) { res.status(404).json({ error: "Doubt not found" }); return; }
    const [adminUser] = await db.select({ id: users.id }).from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
    if (!adminUser) { res.status(500).json({ error: "Admin user record not found" }); return; }
    const answer = await db.transaction(async (tx) => {
      const [row] = await tx.insert(doubtAnswers).values({
        doubtId: req.params.id,
        authorId: adminUser.id,
        authorRole: "admin",
        answerText: answerText.trim(),
        isOfficial: true,
      }).returning();
      await tx.update(doubts)
        .set({ answerCount: sql`${doubts.answerCount} + 1`, updatedAt: new Date() })
        .where(eq(doubts.id, req.params.id));
      return row;
    });
    res.json({ ok: true, data: answer });
  } catch (e) { console.error(e); res.status(500).json({ error: "Failed to post answer" }); }
});

// ── Promotions ────────────────────────────────────────────────────────────────

router.get("/admin/promotions", async (_req, res) => {
  try {
    const rows = await db.select().from(promotions).orderBy(desc(promotions.createdAt)).limit(100);
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ error: "Failed to fetch promotions" }); }
});

router.post("/admin/promotions", async (req, res) => {
  const { title, body, displayType, audience, startsAt, endsAt, ctaLabel, ctaUrl, bgColour, ctaColour } = req.body;
  if (!title || !body || !startsAt || !endsAt) { res.status(400).json({ error: "title, body, startsAt, endsAt required" }); return; }
  try {
    const [row] = await db.insert(promotions).values({
      title, body,
      displayType: displayType ?? "banner",
      audience: audience ?? "public",
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      ctaLabel: ctaLabel ?? null,
      ctaUrl: ctaUrl ?? null,
      bgColour: bgColour ?? "#1a2e5a",
      ctaColour: ctaColour ?? "#2a9d8f",
    }).returning();
    res.json({ ok: true, data: row });
  } catch (e) { console.error(e); res.status(500).json({ error: "Failed to create promotion" }); }
});

router.patch("/admin/promotions/:id", async (req, res) => {
  const { title, body, displayType, audience, startsAt, endsAt, ctaLabel, ctaUrl, bgColour, ctaColour } = req.body;
  try {
    const [row] = await db.update(promotions).set({
      title, body, displayType, audience,
      startsAt: startsAt ? new Date(startsAt) : undefined,
      endsAt: endsAt ? new Date(endsAt) : undefined,
      ctaLabel, ctaUrl, bgColour, ctaColour,
      updatedAt: new Date(),
    }).where(eq(promotions.id, req.params.id)).returning();
    res.json({ ok: true, data: row });
  } catch (e) { res.status(500).json({ error: "Failed to update promotion" }); }
});

router.delete("/admin/promotions/:id", async (req, res) => {
  try {
    await db.update(promotions).set({ archivedAt: new Date() }).where(eq(promotions.id, req.params.id));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "Failed to archive promotion" }); }
});

// ── Question Bank ─────────────────────────────────────────────────────────────

router.get("/admin/question-bank", async (req, res) => {
  try {
    const { subject, difficulty, questionType, reviewStatus, source, search, page = "1", limit = "50" } = req.query as Record<string, string>;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [isNull(questionBank.deletedAt)];
    if (subject) conditions.push(eq(questionBank.subject, subject));
    if (difficulty) conditions.push(eq(questionBank.difficulty, difficulty as "easy" | "medium" | "hard"));
    if (questionType) conditions.push(eq(questionBank.questionType, questionType as "mcq" | "short" | "long" | "numerical"));
    if (reviewStatus) conditions.push(eq(questionBank.reviewStatus, reviewStatus));
    if (source) conditions.push(eq(questionBank.source, source));

    const rows = await db.select({
      id: questionBank.id, subject: questionBank.subject, topic: questionBank.topic,
      classGrade: questionBank.classGrade, difficulty: questionBank.difficulty,
      questionType: questionBank.questionType, questionText: questionBank.questionText,
      correctAnswer: questionBank.correctAnswer, marks: questionBank.marks,
      isPublished: questionBank.isPublished, examName: questionBank.examName,
      examTarget: questionBank.examTarget, source: questionBank.source,
      reviewStatus: questionBank.reviewStatus, year: questionBank.year,
      createdAt: questionBank.createdAt,
    }).from(questionBank)
      .where(and(...conditions))
      .orderBy(desc(questionBank.createdAt))
      .limit(parseInt(limit))
      .offset(offset);

    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(questionBank).where(and(...conditions));
    res.json({ ok: true, data: { rows, total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (e) { console.error(e); res.status(500).json({ error: "Failed to fetch question bank" }); }
});

router.get("/admin/question-bank/:id", async (req, res) => {
  try {
    const [row] = await db.select().from(questionBank).where(eq(questionBank.id, req.params.id));
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ok: true, data: row });
  } catch (e) { res.status(500).json({ error: "Failed to fetch question" }); }
});

/**
 * POST /admin/question-bank/import-ssc-paper — STUB endpoint for SSC PYQ ingestion.
 *
 * Accepts a paper metadata payload + an array of pre-extracted bilingual questions,
 * tags them with `source = SSC-<exam>-<year>-<tier>-<shift>`, and inserts them.
 *
 * NOTE: Real PDF vision-extraction is deferred until the user provides source PDFs.
 * For now, this just ingests already-structured rows so the admin pipeline exists.
 *
 * Body shape:
 *   {
 *     paper: { exam: "CGL"|"CHSL", year: 2024, tier: "TIER_1"|"TIER_2", shift?: "S1"|"S2"|"S3" },
 *     questions: [{ subject, topic?, difficulty, questionType, questionText, questionTextHi?,
 *                   options, optionsHi?, correctAnswer, solution?, solutionHi?, marks }, ...]
 *   }
 */
router.post("/admin/question-bank/import-ssc-paper", async (req, res) => {
  try {
    const { paper, questions } = req.body as {
      paper?: { exam?: string; year?: number; tier?: string; shift?: string };
      questions?: Array<Record<string, unknown>>;
    };
    if (!paper?.exam || !paper?.year || !paper?.tier) {
      res.status(400).json({ error: "paper.exam, paper.year, paper.tier are required" }); return;
    }
    if (!Array.isArray(questions) || questions.length === 0) {
      res.status(400).json({ error: "questions[] required (non-empty)" }); return;
    }
    const examFamily = `SSC_${paper.exam}`; // SSC_CGL or SSC_CHSL
    const tierTarget = paper.tier === "TIER_2" ? "SSC_TIER_2" : "SSC_TIER_1";
    const sourceTag = `SSC-${paper.exam}-${paper.year}-${paper.tier}${paper.shift ? `-${paper.shift}` : ""}`;
    const examName = `${examFamily} ${paper.year} ${paper.tier}${paper.shift ? ` ${paper.shift}` : ""}`;

    let inserted = 0;
    let duplicate = 0;
    let skipped = 0;
    for (const q of questions) {
      const qt = String(q.questionText ?? "").trim();
      const ca = String(q.correctAnswer ?? "").trim();
      const subj = String(q.subject ?? "").trim();
      if (!qt || !ca || !subj) { skipped++; continue; }
      try {
        // .returning() lets us tell apart real inserts from dedupe-skips.
        const inserted_rows = await db.insert(questionBank).values({
          subject: subj,
          topic: (q.topic as string | undefined)?.trim() || null,
          year: paper.year,
          difficulty: (q.difficulty as "easy" | "medium" | "hard" | undefined) ?? "medium",
          questionType: (q.questionType as "mcq" | "short" | "long" | "numerical" | undefined) ?? "mcq",
          questionText: qt,
          questionTextHi: (q.questionTextHi as string | undefined)?.trim() || null,
          options: (q.options as Record<string, string> | undefined) ?? null,
          optionsHi: (q.optionsHi as Record<string, string> | undefined) ?? null,
          correctAnswer: ca,
          solution: (q.solution as string | undefined)?.trim() || null,
          solutionHi: (q.solutionHi as string | undefined)?.trim() || null,
          examName,
          marks: typeof q.marks === "number" ? q.marks : 2,
          isPublished: true,
          examTarget: [examFamily, tierTarget],
          source: sourceTag,
          language: q.questionTextHi ? "bi" : "en",
          reviewStatus: "approved",
        }).onConflictDoNothing().returning({ id: questionBank.id });
        if (inserted_rows.length > 0) inserted++;
        else duplicate++;
      } catch (rowErr) {
        skipped++;
        console.warn("[import-ssc-paper] row skipped:", rowErr);
      }
    }
    res.json({ ok: true, inserted, duplicate, skipped, source: sourceTag });
  } catch (e) {
    console.error("POST /admin/question-bank/import-ssc-paper error:", e);
    res.status(500).json({ error: "Failed to import SSC paper" });
  }
});

router.post("/admin/question-bank", async (req, res) => {
  const { subject, topic, classGrade, year, difficulty, questionType, questionText, options, correctAnswer, solution, examName, marks, examTarget, source, language } = req.body;
  if (!subject || !questionText || !correctAnswer) { res.status(400).json({ error: "subject, questionText, correctAnswer required" }); return; }
  try {
    const [row] = await db.insert(questionBank).values({
      subject, topic: topic ?? null, classGrade: classGrade ?? null, year: year ?? null,
      difficulty: difficulty ?? "medium", questionType: questionType ?? "mcq",
      questionText, options: options ?? null, correctAnswer,
      solution: solution ?? null, examName: examName ?? null,
      marks: marks ?? 4, examTarget: examTarget ?? [],
      source: source ?? "MANUAL", language: language ?? "en",
      reviewStatus: "approved", isPublished: true,
    }).returning();
    res.json({ ok: true, data: row });
  } catch (e) { console.error(e); res.status(500).json({ error: "Failed to create question" }); }
});

router.patch("/admin/question-bank/:id", async (req, res) => {
  try {
    const [row] = await db.update(questionBank).set({ ...req.body, updatedAt: new Date() }).where(eq(questionBank.id, req.params.id)).returning();
    res.json({ ok: true, data: row });
  } catch (e) { res.status(500).json({ error: "Failed to update question" }); }
});

router.patch("/admin/question-bank/:id/review", async (req, res) => {
  const { reviewStatus } = req.body;
  if (!["approved", "rejected"].includes(reviewStatus)) { res.status(400).json({ error: "reviewStatus must be approved or rejected" }); return; }
  try {
    const [row] = await db.update(questionBank).set({ reviewStatus, isPublished: reviewStatus === "approved", updatedAt: new Date() }).where(eq(questionBank.id, req.params.id)).returning();
    res.json({ ok: true, data: row });
  } catch (e) { res.status(500).json({ error: "Failed to review question" }); }
});

router.delete("/admin/question-bank/:id", async (req, res) => {
  const { reason } = req.body;
  try {
    await db.update(questionBank).set({ deletedAt: new Date(), deletionReason: reason ?? null, updatedAt: new Date() }).where(eq(questionBank.id, req.params.id));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "Failed to delete question" }); }
});

// ── Practice Sets ─────────────────────────────────────────────────────────────

router.get("/admin/practice-sets", async (_req, res) => {
  try {
    const rows = await db
      .select({
        id: practiceSets.id, name: practiceSets.name, description: practiceSets.description,
        subject: practiceSets.subject, isActive: practiceSets.isActive, createdAt: practiceSets.createdAt,
        questionCount: sql<number>`(SELECT count(*)::int FROM practice_set_questions WHERE set_id = practice_sets.id)`,
      })
      .from(practiceSets)
      .orderBy(desc(practiceSets.createdAt));
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ error: "Failed to fetch practice sets" }); }
});

router.post("/admin/practice-sets", async (req, res) => {
  const { name, description, subject } = req.body;
  if (!name) { res.status(400).json({ error: "name required" }); return; }
  try {
    const [row] = await db.insert(practiceSets).values({ name, description, subject }).returning();
    res.json({ ok: true, data: row });
  } catch (e) { res.status(500).json({ error: "Failed to create practice set" }); }
});

router.patch("/admin/practice-sets/:id", async (req, res) => {
  const { name, description, subject, isActive } = req.body;
  try {
    const [row] = await db.update(practiceSets).set({ name, description, subject, isActive, updatedAt: new Date() }).where(eq(practiceSets.id, req.params.id)).returning();
    res.json({ ok: true, data: row });
  } catch (e) { res.status(500).json({ error: "Failed to update practice set" }); }
});

router.post("/admin/practice-sets/:id/questions", async (req, res) => {
  const { questionId, sortOrder } = req.body;
  if (!questionId) { res.status(400).json({ error: "questionId required" }); return; }
  try {
    const [row] = await db.insert(practiceSetQuestions).values({ setId: req.params.id, questionId, sortOrder: sortOrder ?? 0 }).onConflictDoNothing().returning();
    res.json({ ok: true, data: row });
  } catch (e) { res.status(500).json({ error: "Failed to add question to set" }); }
});

router.delete("/admin/practice-sets/:id/questions/:qid", async (req, res) => {
  try {
    await db.delete(practiceSetQuestions).where(and(eq(practiceSetQuestions.setId, req.params.id), eq(practiceSetQuestions.questionId, req.params.qid)));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "Failed to remove question from set" }); }
});

// ── Users Management ──────────────────────────────────────────────────────────

router.get("/admin/users", async (req, res) => {
  try {
    const { role, search, status, page = "1" } = req.query as { role?: string; search?: string; status?: string; page?: string };
    const offset = (parseInt(page) - 1) * 50;
    const conditions: ReturnType<typeof eq>[] = [];
    if (role) conditions.push(eq(users.role, role as "student" | "parent" | "teacher" | "admin"));
    if (status) conditions.push(eq(users.approvalStatus, status));
    if (search) conditions.push(or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`)) as ReturnType<typeof eq>);

    const rows = await db.select({
      id: users.id, name: users.name, email: users.email, phone: users.phone,
      role: users.role, clerkUserId: users.clerkUserId, approvalStatus: users.approvalStatus, createdAt: users.createdAt,
    }).from(users)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(users.createdAt))
      .limit(50).offset(offset);

    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(users).where(conditions.length ? and(...conditions) : undefined);
    res.json({ ok: true, data: { rows, total } });
  } catch (e) { res.status(500).json({ error: "Failed to fetch users" }); }
});

router.post("/admin/users", async (req, res) => {
  const { name, email, phone, role } = req.body;
  if (!name?.trim() || !email?.trim()) { res.status(400).json({ error: "name and email required" }); return; }
  if (!["student", "parent", "teacher", "admin"].includes(role ?? "student")) { res.status(400).json({ error: "Invalid role" }); return; }
  try {
    const existing = await db.select({ id: users.id }).from(users).where(ilike(users.email, email.trim())).limit(1);
    if (existing.length) { res.status(409).json({ error: "A user with this email already exists" }); return; }
    const [row] = await db.insert(users).values({
      name: name.trim(), email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      role: role ?? "student",
      approvalStatus: "approved",
      clerkUserId: `admin_created_${Date.now()}`,
    }).returning();
    res.json({ ok: true, data: row });
  } catch (e) { console.error(e); res.status(500).json({ error: "Failed to create user" }); }
});

router.patch("/admin/users/:id/approve", async (req, res) => {
  try {
    const [row] = await db.update(users).set({ approvalStatus: "approved", updatedAt: new Date() }).where(eq(users.id, req.params.id)).returning();
    if (!row) { res.status(404).json({ error: "User not found" }); return; }
    const emailConfigured = await emailAvailableAsync();
    let emailSent = false;
    if (emailConfigured && row.email) {
      try {
        const [setting] = await db.select({ value: siteSettings.value }).from(siteSettings).where(eq(siteSettings.key, "portal_url")).limit(1);
        const portalUrl = setting?.value || process.env.PORTAL_URL || `https://${process.env.REPLIT_DEV_DOMAIN ?? "paconline.in"}`;
        const { subject, html } = buildApprovalEmail(row.name ?? "Student", portalUrl);
        await sendEmail({ to: row.email, subject, html });
        emailSent = true;
      } catch (err) {
        console.error("[email] Failed to send approval email:", err);
      }
    }
    res.json({ ok: true, data: row, emailSent, emailConfigured, emailTo: row.email ?? null });
  } catch (e) { res.status(500).json({ error: "Failed to approve user" }); }
});

router.patch("/admin/users/:id/reject", async (req, res) => {
  try {
    const [row] = await db.update(users).set({ approvalStatus: "rejected", updatedAt: new Date() }).where(eq(users.id, req.params.id)).returning();
    if (!row) { res.status(404).json({ error: "User not found" }); return; }
    const emailConfigured = await emailAvailableAsync();
    let emailSent = false;
    if (emailConfigured && row.email) {
      try {
        const [setting] = await db.select({ value: siteSettings.value }).from(siteSettings).where(eq(siteSettings.key, "contact_phone")).limit(1);
        const contactNumber = setting?.value || process.env.CONTACT_PHONE || "+91-XXXXXXXXXX";
        const { subject, html } = buildRejectionEmail(row.name ?? "Applicant", contactNumber);
        await sendEmail({ to: row.email, subject, html });
        emailSent = true;
      } catch (err) {
        console.error("[email] Failed to send rejection email:", err);
      }
    }
    res.json({ ok: true, data: row, emailSent, emailConfigured, emailTo: row.email ?? null });
  } catch (e) { res.status(500).json({ error: "Failed to reject user" }); }
});

router.patch("/admin/users/:id/role", async (req, res) => {
  const { role } = req.body;
  if (!["student", "parent", "teacher", "admin"].includes(role)) { res.status(400).json({ error: "Invalid role" }); return; }
  try {
    const [row] = await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, req.params.id)).returning();
    res.json({ ok: true, data: row });
  } catch (e) { res.status(500).json({ error: "Failed to update user role" }); }
});

// ── Site Settings ─────────────────────────────────────────────────────────────

router.get("/admin/site-settings", async (_req, res) => {
  try {
    const rows = await db.select().from(siteSettings).orderBy(asc(siteSettings.key));
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ error: "Failed to fetch site settings" }); }
});

router.patch("/admin/site-settings/bulk", async (req, res) => {
  const { updates } = req.body as { updates: { key: string; value: string; label?: string }[] };
  if (!updates?.length) { res.status(400).json({ error: "updates array required" }); return; }
  try {
    await Promise.all(updates.map(u =>
      db.insert(siteSettings).values({ key: u.key, value: u.value, label: u.label })
        .onConflictDoUpdate({ target: siteSettings.key, set: { value: u.value, updatedAt: new Date() } })
    ));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "Failed to update site settings" }); }
});

// ── SEO Overrides ─────────────────────────────────────────────────────────────

router.get("/admin/seo", async (_req, res) => {
  try {
    const rows = await db.select().from(seoOverrides).orderBy(asc(seoOverrides.route));
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ error: "Failed to fetch SEO overrides" }); }
});

router.post("/admin/seo", async (req, res) => {
  const { route, title, description, focusKeyword, noIndex } = req.body;
  if (!route) { res.status(400).json({ error: "route required" }); return; }
  try {
    const [row] = await db.insert(seoOverrides).values({ route, title, description, focusKeyword, noIndex: noIndex ?? false })
      .onConflictDoUpdate({ target: seoOverrides.route, set: { title, description, focusKeyword, noIndex, updatedAt: new Date() } })
      .returning();
    res.json({ ok: true, data: row });
  } catch (e) { res.status(500).json({ error: "Failed to create SEO override" }); }
});

router.patch("/admin/seo/:id", async (req, res) => {
  const { title, description, focusKeyword, noIndex } = req.body;
  try {
    const [row] = await db.update(seoOverrides).set({ title, description, focusKeyword, noIndex, updatedAt: new Date() }).where(eq(seoOverrides.id, req.params.id)).returning();
    res.json({ ok: true, data: row });
  } catch (e) { res.status(500).json({ error: "Failed to update SEO override" }); }
});

router.delete("/admin/seo/:id", async (req, res) => {
  try {
    await db.delete(seoOverrides).where(eq(seoOverrides.id, req.params.id));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "Failed to delete SEO override" }); }
});

// ── Watermark Settings ────────────────────────────────────────────────────────

router.get("/admin/watermarks", async (_req, res) => {
  try {
    const rows = await db.select().from(watermarkSettings).orderBy(asc(watermarkSettings.docType));
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ error: "Failed to fetch watermark settings" }); }
});

router.patch("/admin/watermarks/:docType", async (req, res) => {
  const { enabled, textTemplate, position, opacity, rotation, fontSize, color, useGlobal } = req.body;
  try {
    const [row] = await db.insert(watermarkSettings).values({
      docType: req.params.docType, enabled: enabled ?? true,
      textTemplate: textTemplate ?? "{{centreName}} • {{userName}} • {{date}}",
      position: position ?? "tile", opacity: opacity ?? 12,
      rotation: rotation ?? 45, fontSize: fontSize ?? 36,
      color: color ?? "#888888", useGlobal: useGlobal ?? true,
    }).onConflictDoUpdate({
      target: watermarkSettings.docType,
      set: { enabled, textTemplate, position, opacity, rotation, fontSize, color, useGlobal, updatedAt: new Date() },
    }).returning();
    res.json({ ok: true, data: row });
  } catch (e) { res.status(500).json({ error: "Failed to update watermark settings" }); }
});

// ── Analytics ─────────────────────────────────────────────────────────────────

router.get("/admin/analytics/pageviews", async (req, res) => {
  try {
    const days = Math.min(90, Math.max(1, parseInt((req.query.days as string) ?? "30")));
    const creds = await getEffectiveCreds();
    if (creds) {
      try {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        const startDate = cutoff.toISOString().split("T")[0];
        const rows = await runReportWithCreds(
          creds,
          [{ name: "date" }],
          [{ name: "screenPageViews" }],
          [{ startDate, endDate: "today" }],
        );
        const data = rows.map(r => ({
          date: r.dimensionValues[0].value.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"),
          total: parseInt(r.metricValues[0].value ?? "0"),
        })).sort((a, b) => a.date.localeCompare(b.date));
        res.json({ ok: true, data, source: "ga4" });
        return;
      } catch (ga4Err) {
        console.warn("GA4 pageviews failed, falling back to internal:", ga4Err);
      }
    }
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    const rows = await db
      .select({ date: pageViews.date, total: sql<number>`sum(count)::int` })
      .from(pageViews)
      .where(gte(pageViews.date, cutoffStr))
      .groupBy(pageViews.date)
      .orderBy(asc(pageViews.date));
    res.json({ ok: true, data: rows, source: "internal" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Failed to fetch page views" }); }
});

router.get("/admin/analytics/top-pages", async (req, res) => {
  try {
    const days = Math.min(90, Math.max(1, parseInt((req.query.days as string) ?? "30")));
    const creds = await getEffectiveCreds();
    if (creds) {
      try {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        const startDate = cutoff.toISOString().split("T")[0];
        const rows = await runReportWithCreds(
          creds,
          [{ name: "pagePath" }],
          [{ name: "screenPageViews" }],
          [{ startDate, endDate: "today" }],
        );
        const data = rows
          .map(r => ({ path: r.dimensionValues[0].value, total: parseInt(r.metricValues[0].value ?? "0") }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 20);
        res.json({ ok: true, data, source: "ga4" });
        return;
      } catch (ga4Err) {
        console.warn("GA4 top-pages failed, falling back to internal:", ga4Err);
      }
    }
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    const rows = await db
      .select({ path: pageViews.path, total: sql<number>`sum(count)::int` })
      .from(pageViews)
      .where(gte(pageViews.date, cutoffStr))
      .groupBy(pageViews.path)
      .orderBy(desc(sql`sum(count)`))
      .limit(20);
    res.json({ ok: true, data: rows, source: "internal" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Failed to fetch top pages" }); }
});

router.get("/admin/analytics/ga4/summary", async (_req, res) => {
  const creds = await getEffectiveCreds();
  if (!creds) {
    res.json({ ok: true, data: { available: false, activeUsers7d: null, sessions30d: null, bounceRate30d: null, topSource: null } });
    return;
  }
  try {
    const [usersRows, sessionsRows, sourceRows] = await Promise.all([
      runReportWithCreds(creds, [], [{ name: "active7DayUsers" }], [{ startDate: "7daysAgo", endDate: "today" }]),
      runReportWithCreds(creds, [], [{ name: "sessions" }, { name: "bounceRate" }], [{ startDate: "30daysAgo", endDate: "today" }]),
      runReportWithCreds(creds, [{ name: "sessionDefaultChannelGroup" }], [{ name: "sessions" }], [{ startDate: "30daysAgo", endDate: "today" }]),
    ]);

    const activeUsers7d = parseInt(usersRows[0]?.metricValues[0]?.value ?? "0");
    const sessions30d = parseInt(sessionsRows[0]?.metricValues[0]?.value ?? "0");
    const bounceRateRaw = parseFloat(sessionsRows[0]?.metricValues[1]?.value ?? "0");
    const bounceRate30d = Math.round(bounceRateRaw * 100);

    const topSource = sourceRows
      .map(r => ({ source: r.dimensionValues[0].value, sessions: parseInt(r.metricValues[0].value ?? "0") }))
      .sort((a, b) => b.sessions - a.sessions)[0]?.source ?? null;

    res.json({ ok: true, data: { available: true, activeUsers7d, sessions30d, bounceRate30d, topSource } });
  } catch (e) { console.error(e); res.status(500).json({ error: "Failed to fetch GA4 summary" }); }
});

// ── Security Events ───────────────────────────────────────────────────────────

router.get("/admin/security/events", async (req, res) => {
  try {
    const rows = await db.select().from(securityEvents).orderBy(desc(securityEvents.createdAt)).limit(200);
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ error: "Failed to fetch security events" }); }
});

router.get("/admin/security/lockouts", async (_req, res) => {
  try {
    const rows = await db.select().from(ipLockouts).where(isNotNull(ipLockouts.lockedUntil)).orderBy(desc(ipLockouts.createdAt)).limit(100);
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ error: "Failed to fetch lockouts" }); }
});

router.patch("/admin/security/lockouts/:id/unlock", async (req, res) => {
  try {
    const [row] = await db.update(ipLockouts).set({ lockedUntil: null, unlockedAt: new Date(), updatedAt: new Date() }).where(eq(ipLockouts.id, req.params.id)).returning();
    res.json({ ok: true, data: row });
  } catch (e) { res.status(500).json({ error: "Failed to unlock IP" }); }
});

router.get("/admin/audit-log", async (req, res) => {
  try {
    const rows = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(200);
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ error: "Failed to fetch audit log" }); }
});

export default router;

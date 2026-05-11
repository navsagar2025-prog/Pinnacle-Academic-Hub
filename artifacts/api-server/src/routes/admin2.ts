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
import { desc, eq, sql, asc, isNull, isNotNull, and, gte, lte, ilike, or } from "drizzle-orm";

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
    const [adminUser] = clerkUserId
      ? await db.select({ id: users.id }).from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1)
      : [null];
    const [row] = await db.insert(assignments).values({
      batchId, title, subject, description, dueDate: new Date(dueDate), maxMarks, fileUrl,
      postedBy: adminUser?.id ?? null,
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
    const [adminUser] = clerkUserId
      ? await db.select({ id: users.id }).from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1)
      : [null];
    const [row] = await db.insert(studyMaterials).values({
      batchId, title, subject, type, fileUrl, fileSize,
      uploadedBy: adminUser?.id ?? null,
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
    const { batchId, date } = req.query as { batchId?: string; date?: string };
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

    const records = await db
      .select()
      .from(attendance)
      .where(and(
        sql`student_id IN (SELECT id FROM students WHERE batch_id = ${batchId})`,
        gte(attendance.date, day),
        lte(attendance.date, nextDay),
      ));

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
    await db.insert(attendance).values(values).onConflictDoNothing();
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
    const { role, search, page = "1" } = req.query as { role?: string; search?: string; page?: string };
    const offset = (parseInt(page) - 1) * 50;
    const conditions = [];
    if (role) conditions.push(eq(users.role, role as "student" | "parent" | "teacher" | "admin"));
    if (search) conditions.push(or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`)));

    const rows = await db.select({
      id: users.id, name: users.name, email: users.email, phone: users.phone,
      role: users.role, clerkUserId: users.clerkUserId, createdAt: users.createdAt,
    }).from(users)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(users.createdAt))
      .limit(50).offset(offset);

    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(users).where(conditions.length ? and(...conditions) : undefined);
    res.json({ ok: true, data: { rows, total } });
  } catch (e) { res.status(500).json({ error: "Failed to fetch users" }); }
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
    const days = parseInt((req.query.days as string) ?? "30");
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    const rows = await db
      .select({ date: pageViews.date, total: sql<number>`sum(count)::int` })
      .from(pageViews)
      .where(gte(pageViews.date, cutoffStr))
      .groupBy(pageViews.date)
      .orderBy(asc(pageViews.date));
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ error: "Failed to fetch page views" }); }
});

router.get("/admin/analytics/top-pages", async (req, res) => {
  try {
    const days = parseInt((req.query.days as string) ?? "30");
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
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ error: "Failed to fetch top pages" }); }
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

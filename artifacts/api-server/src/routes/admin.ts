import { Router, type Request, type Response, type NextFunction } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import {
  notices, enquiries, blogPosts, galleryItems,
  users, students, teachers, courses, batches, feeRecords, results,
  mockTests, doubts, siteSettings, seoOverrides, watermarkSettings,
  pageViews, securityEvents, ipLockouts, auditLogs, questionBank,
  practiceSets, practiceSetQuestions, practiceSetAssignments,
} from "@workspace/db/schema";
import { desc, eq, sql, asc, and, or, isNull, isNotNull, type SQL } from "drizzle-orm";
import { getEffectiveCreds, runReportWithCreds, runEventReport } from "../lib/ga4.js";

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

// ── Stats ──────────────────────────────────────────────────────────────────

router.get("/admin/stats", async (_req, res) => {
  try {
    const [
      [{ noticeCount }],
      [{ enquiryCount }],
      [{ blogCount }],
      [{ galleryCount }],
      [{ newEnquiryCount }],
      [{ studentCount }],
      [{ teacherCount }],
      [{ batchCount }],
      [{ openDoubtsCount }],
      [{ pendingApprovalCount }],
      [{ pendingQBReviewCount }],
    ] = await Promise.all([
      db.select({ noticeCount: sql<number>`count(*)::int` }).from(notices),
      db.select({ enquiryCount: sql<number>`count(*)::int` }).from(enquiries),
      db.select({ blogCount: sql<number>`count(*)::int` }).from(blogPosts),
      db.select({ galleryCount: sql<number>`count(*)::int` }).from(galleryItems),
      db.select({ newEnquiryCount: sql<number>`count(*)::int` }).from(enquiries).where(eq(enquiries.admissionStatus, "new")),
      db.select({ studentCount: sql<number>`count(*)::int` }).from(students),
      db.select({ teacherCount: sql<number>`count(*)::int` }).from(teachers),
      db.select({ batchCount: sql<number>`count(*)::int` }).from(batches),
      db.select({ openDoubtsCount: sql<number>`count(*)::int` }).from(doubts).where(eq(doubts.isResolved, false)),
      db.select({ pendingApprovalCount: sql<number>`count(*)::int` }).from(users).where(eq(users.approvalStatus, "pending")),
      db.select({ pendingQBReviewCount: sql<number>`count(*)::int` }).from(questionBank).where(and(eq(questionBank.reviewStatus, "pending"), isNull(questionBank.deletedAt))),
    ]);
    res.json({ ok: true, data: { noticeCount, enquiryCount, blogCount, galleryCount, newEnquiryCount, studentCount, teacherCount, batchCount, openDoubtsCount, pendingApprovalCount, pendingQBReviewCount } });
  } catch (e) {
    console.error("GET /admin/stats error:", e);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// ── Notices ────────────────────────────────────────────────────────────────

router.get("/admin/notices", async (_req, res) => {
  try {
    const rows = await db.select().from(notices).orderBy(desc(notices.createdAt)).limit(200);
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch notices" });
  }
});

router.post("/admin/notices", async (req, res) => {
  try {
    const { title, body, category, isPublic, expiresAt } = req.body;
    if (!title || !body) {
      res.status(400).json({ error: "title and body are required" });
      return;
    }
    const [row] = await db
      .insert(notices)
      .values({
        title,
        body,
        category: category ?? "General",
        isPublic: isPublic ?? true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        publishedAt: new Date(),
      })
      .returning();
    res.status(201).json({ ok: true, data: row });
  } catch (e) {
    console.error("POST /admin/notices error:", e);
    res.status(500).json({ error: "Failed to create notice" });
  }
});

router.patch("/admin/notices/:id", async (req, res) => {
  try {
    const { title, body, category, isPublic, expiresAt } = req.body;
    const [row] = await db
      .update(notices)
      .set({
        ...(title !== undefined && { title }),
        ...(body !== undefined && { body }),
        ...(category !== undefined && { category }),
        ...(isPublic !== undefined && { isPublic }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
        updatedAt: new Date(),
      })
      .where(eq(notices.id, req.params.id))
      .returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ok: true, data: row });
  } catch (e) {
    res.status(500).json({ error: "Failed to update notice" });
  }
});

router.delete("/admin/notices/:id", async (req, res) => {
  try {
    await db.delete(notices).where(eq(notices.id, req.params.id));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete notice" });
  }
});

// ── Enquiries ──────────────────────────────────────────────────────────────

router.get("/admin/enquiries", async (_req, res) => {
  try {
    const rows = await db.select().from(enquiries).orderBy(desc(enquiries.createdAt)).limit(500);
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch enquiries" });
  }
});

router.patch("/admin/enquiries/:id", async (req, res) => {
  try {
    const { admissionStatus, isFollowedUp, notes } = req.body;
    const [row] = await db
      .update(enquiries)
      .set({
        ...(admissionStatus !== undefined && { admissionStatus }),
        ...(isFollowedUp !== undefined && { isFollowedUp }),
        ...(notes !== undefined && { notes }),
        updatedAt: new Date(),
      })
      .where(eq(enquiries.id, req.params.id))
      .returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ok: true, data: row });
  } catch (e) {
    res.status(500).json({ error: "Failed to update enquiry" });
  }
});

// ── Blog ───────────────────────────────────────────────────────────────────

router.get("/admin/blog", async (_req, res) => {
  try {
    const rows = await db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt)).limit(200);
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch blog posts" });
  }
});

router.post("/admin/blog", async (req, res) => {
  try {
    const { slug, title, excerpt, content, category, authorName, status, readMinutes, tags } = req.body;
    if (!slug || !title || !authorName) {
      res.status(400).json({ error: "slug, title, and authorName are required" });
      return;
    }
    const [row] = await db
      .insert(blogPosts)
      .values({
        slug,
        title,
        excerpt: excerpt ?? null,
        content: content ?? null,
        category: category ?? "General",
        authorName,
        status: status ?? "draft",
        readMinutes: readMinutes ?? 5,
        tags: tags ?? [],
        publishedAt: status === "published" ? new Date() : null,
      })
      .returning();
    res.status(201).json({ ok: true, data: row });
  } catch (e) {
    console.error("POST /admin/blog error:", e);
    res.status(500).json({ error: "Failed to create blog post" });
  }
});

router.patch("/admin/blog/:id", async (req, res) => {
  try {
    const { title, excerpt, content, category, authorName, status, readMinutes, tags } = req.body;
    const existing = await db.select().from(blogPosts).where(eq(blogPosts.id, req.params.id)).limit(1);
    if (!existing[0]) { res.status(404).json({ error: "Not found" }); return; }

    const [row] = await db
      .update(blogPosts)
      .set({
        ...(title !== undefined && { title }),
        ...(excerpt !== undefined && { excerpt }),
        ...(content !== undefined && { content }),
        ...(category !== undefined && { category }),
        ...(authorName !== undefined && { authorName }),
        ...(readMinutes !== undefined && { readMinutes }),
        ...(tags !== undefined && { tags }),
        ...(status !== undefined && {
          status,
          publishedAt:
            status === "published" && !existing[0].publishedAt ? new Date() : existing[0].publishedAt,
        }),
        updatedAt: new Date(),
      })
      .where(eq(blogPosts.id, req.params.id))
      .returning();
    res.json({ ok: true, data: row });
  } catch (e) {
    res.status(500).json({ error: "Failed to update blog post" });
  }
});

router.delete("/admin/blog/:id", async (req, res) => {
  try {
    await db.delete(blogPosts).where(eq(blogPosts.id, req.params.id));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete blog post" });
  }
});

// ── Gallery ────────────────────────────────────────────────────────────────

router.get("/admin/gallery", async (_req, res) => {
  try {
    const rows = await db.select().from(galleryItems).orderBy(desc(galleryItems.createdAt)).limit(200);
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch gallery items" });
  }
});

router.post("/admin/gallery", async (req, res) => {
  try {
    const { title, imageUrl, caption, sortOrder, isVisible } = req.body;
    if (!title || !imageUrl) {
      res.status(400).json({ error: "title and imageUrl are required" });
      return;
    }
    const { category } = req.body;
    const [row] = await db
      .insert(galleryItems)
      .values({ title, imageUrl, caption: caption ?? null, category: category ?? "General", sortOrder: sortOrder ?? 0, isVisible: isVisible ?? true })
      .returning();
    res.status(201).json({ ok: true, data: row });
  } catch (e) {
    console.error("POST /admin/gallery error:", e);
    res.status(500).json({ error: "Failed to create gallery item" });
  }
});

router.patch("/admin/gallery/:id", async (req, res) => {
  try {
    const { title, imageUrl, caption, sortOrder, isVisible } = req.body;
    const [row] = await db
      .update(galleryItems)
      .set({
        ...(title !== undefined && { title }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(caption !== undefined && { caption }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isVisible !== undefined && { isVisible }),
        updatedAt: new Date(),
      })
      .where(eq(galleryItems.id, req.params.id))
      .returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ok: true, data: row });
  } catch (e) {
    res.status(500).json({ error: "Failed to update gallery item" });
  }
});

router.delete("/admin/gallery/:id", async (req, res) => {
  try {
    await db.delete(galleryItems).where(eq(galleryItems.id, req.params.id));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete gallery item" });
  }
});

// ── Students ─────────────────────────────────────────────────────────────────
router.get("/admin/students", async (_req, res) => {
  try {
    const rows = await db
      .select({
        id: students.id, rollNumber: students.rollNumber, feePlan: students.feePlan,
        isActive: students.isActive, enrolledAt: students.enrolledAt,
        guardianName: students.guardianName, guardianPhone: students.guardianPhone,
        batchId: students.batchId, batchName: batches.name,
        userName: users.name, userEmail: users.email, userPhone: users.phone,
        courseName: courses.title,
      })
      .from(students)
      .leftJoin(users, eq(students.userId, users.id))
      .leftJoin(batches, eq(students.batchId, batches.id))
      .leftJoin(courses, eq(batches.courseId, courses.id))
      .orderBy(asc(students.rollNumber));
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ error: "Failed to fetch students" }); }
});

router.post("/admin/students", async (req, res) => {
  const { rollNumber, feePlan, guardianName, guardianPhone, batchId, dateOfBirth, address, previousSchool } = req.body;
  if (!rollNumber) { res.status(400).json({ error: "rollNumber required" }); return; }
  try {
    const [row] = await db.insert(students).values({ rollNumber, feePlan, guardianName, guardianPhone, batchId, dateOfBirth, address, previousSchool }).returning();
    res.json({ ok: true, data: row });
  } catch (e) { res.status(500).json({ error: "Failed to create student" }); }
});

router.patch("/admin/students/:id", async (req, res) => {
  const { rollNumber, feePlan, guardianName, guardianPhone, batchId, isActive, address } = req.body;
  try {
    const [row] = await db.update(students).set({ rollNumber, feePlan, guardianName, guardianPhone, batchId, isActive, address, updatedAt: new Date() }).where(eq(students.id, req.params.id)).returning();
    res.json({ ok: true, data: row });
  } catch (e) { res.status(500).json({ error: "Failed to update student" }); }
});

// ── Teachers ──────────────────────────────────────────────────────────────────
router.get("/admin/teachers", async (_req, res) => {
  try {
    const rows = await db
      .select({
        id: teachers.id, designation: teachers.designation, qualification: teachers.qualification,
        subjects: teachers.subjects, experienceYears: teachers.experienceYears, isActive: teachers.isActive,
        isExaminer: teachers.isExaminer, photoUrl: teachers.photoUrl, joinedAt: teachers.joinedAt,
        userName: users.name, userEmail: users.email, userPhone: users.phone,
      })
      .from(teachers)
      .leftJoin(users, eq(teachers.userId, users.id))
      .orderBy(asc(users.name));
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ error: "Failed to fetch teachers" }); }
});

router.post("/admin/teachers", async (req, res) => {
  const { designation, qualification, subjects, experienceYears, bio, initials, isExaminer, photoUrl } = req.body;
  if (!designation) { res.status(400).json({ error: "designation required" }); return; }
  try {
    const [row] = await db.insert(teachers).values({ designation, qualification, subjects, experienceYears, bio, initials, isExaminer, photoUrl }).returning();
    res.json({ ok: true, data: row });
  } catch (e) { res.status(500).json({ error: "Failed to create teacher" }); }
});

router.patch("/admin/teachers/:id", async (req, res) => {
  const { designation, qualification, subjects, experienceYears, bio, isActive, isExaminer, photoUrl } = req.body;
  try {
    const [row] = await db.update(teachers).set({ designation, qualification, subjects, experienceYears, bio, isActive, isExaminer, photoUrl, updatedAt: new Date() }).where(eq(teachers.id, req.params.id)).returning();
    res.json({ ok: true, data: row });
  } catch (e) { res.status(500).json({ error: "Failed to update teacher" }); }
});

// ── Courses ───────────────────────────────────────────────────────────────────
router.get("/admin/courses", async (_req, res) => {
  try {
    const rows = await db.select().from(courses).orderBy(asc(courses.title));
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ error: "Failed to fetch courses" }); }
});

router.post("/admin/courses", async (req, res) => {
  const { slug, title, description, category, annualFee, admissionFee, maxBatchSize, eligibility, highlights, featuredImageUrl } = req.body;
  if (!slug || !title || annualFee == null) { res.status(400).json({ error: "slug, title, annualFee required" }); return; }
  try {
    const [row] = await db.insert(courses).values({ slug, title, description, category, annualFee, admissionFee, maxBatchSize, eligibility, highlights, featuredImageUrl }).returning();
    res.json({ ok: true, data: row });
  } catch (e) { res.status(500).json({ error: "Failed to create course" }); }
});

router.patch("/admin/courses/:id", async (req, res) => {
  const { title, description, category, annualFee, admissionFee, maxBatchSize, eligibility, isActive } = req.body;
  try {
    const [row] = await db.update(courses).set({ title, description, category, annualFee, admissionFee, maxBatchSize, eligibility, isActive, updatedAt: new Date() }).where(eq(courses.id, req.params.id)).returning();
    res.json({ ok: true, data: row });
  } catch (e) { res.status(500).json({ error: "Failed to update course" }); }
});

// ── Batches ───────────────────────────────────────────────────────────────────
router.get("/admin/batches", async (_req, res) => {
  try {
    const rows = await db
      .select({ id: batches.id, name: batches.name, timingLabel: batches.timingLabel, daysLabel: batches.daysLabel, status: batches.status, maxStudents: batches.maxStudents, room: batches.room, startDate: batches.startDate, endDate: batches.endDate, courseId: batches.courseId, courseName: courses.title })
      .from(batches).leftJoin(courses, eq(batches.courseId, courses.id))
      .orderBy(asc(batches.name));
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ error: "Failed to fetch batches" }); }
});

router.post("/admin/batches", async (req, res) => {
  const { courseId, name, timingLabel, daysLabel, maxStudents, room } = req.body;
  if (!name || !timingLabel || !daysLabel) { res.status(400).json({ error: "name, timingLabel, daysLabel required" }); return; }
  try {
    const [row] = await db.insert(batches).values({ courseId, name, timingLabel, daysLabel, maxStudents, room }).returning();
    res.json({ ok: true, data: row });
  } catch (e) { res.status(500).json({ error: "Failed to create batch" }); }
});

router.patch("/admin/batches/:id", async (req, res) => {
  const { name, timingLabel, daysLabel, maxStudents, status, room, courseId } = req.body;
  try {
    const [row] = await db.update(batches).set({ name, timingLabel, daysLabel, maxStudents, status, room, courseId, updatedAt: new Date() }).where(eq(batches.id, req.params.id)).returning();
    res.json({ ok: true, data: row });
  } catch (e) { res.status(500).json({ error: "Failed to update batch" }); }
});

// ── Fee Records ───────────────────────────────────────────────────────────────
router.get("/admin/fee-records", async (_req, res) => {
  try {
    const rows = await db
      .select({
        id: feeRecords.id, period: feeRecords.period, amount: feeRecords.amount,
        paidAmount: feeRecords.paidAmount, dueDate: feeRecords.dueDate, paidDate: feeRecords.paidDate,
        status: feeRecords.status, paymentMethod: feeRecords.paymentMethod,
        transactionRef: feeRecords.transactionRef, notes: feeRecords.notes,
        studentId: feeRecords.studentId, rollNumber: students.rollNumber,
        studentName: users.name,
      })
      .from(feeRecords)
      .leftJoin(students, eq(feeRecords.studentId, students.id))
      .leftJoin(users, eq(students.userId, users.id))
      .orderBy(desc(feeRecords.dueDate));
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ error: "Failed to fetch fee records" }); }
});

router.post("/admin/fee-records", async (req, res) => {
  const { studentId, period, amount, dueDate } = req.body;
  if (!studentId || !period || !amount || !dueDate) { res.status(400).json({ error: "studentId, period, amount, dueDate required" }); return; }
  try {
    const [row] = await db.insert(feeRecords).values({ studentId, period, amount, paidAmount: 0, dueDate: new Date(dueDate) }).returning();
    res.json({ ok: true, data: row });
  } catch (e) { res.status(500).json({ error: "Failed to create fee record" }); }
});

router.patch("/admin/fee-records/:id", async (req, res) => {
  const { status, paidAmount, paidDate, paymentMethod, transactionRef, notes } = req.body;
  try {
    const [row] = await db.update(feeRecords).set({ status, paidAmount, paidDate: paidDate ? new Date(paidDate) : undefined, paymentMethod, transactionRef, notes, updatedAt: new Date() }).where(eq(feeRecords.id, req.params.id)).returning();
    res.json({ ok: true, data: row });
  } catch (e) { res.status(500).json({ error: "Failed to update fee record" }); }
});

// ── Results (Toppers) ─────────────────────────────────────────────────────────
router.get("/admin/results", async (_req, res) => {
  try {
    const rows = await db.select().from(results).orderBy(desc(results.academicYear), asc(results.rank));
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ error: "Failed to fetch results" }); }
});

router.post("/admin/results", async (req, res) => {
  const { studentName, examName, subject, marks, rank, college, batch, academicYear, quote, initials, isTopper } = req.body;
  if (!studentName || !examName || !rank || !academicYear || !initials) { res.status(400).json({ error: "studentName, examName, rank, academicYear, initials required" }); return; }
  try {
    const [row] = await db.insert(results).values({ studentName, examName, subject, marks, rank, college, batch, academicYear, quote, initials, isTopper }).returning();
    res.json({ ok: true, data: row });
  } catch (e) { res.status(500).json({ error: "Failed to create result" }); }
});

router.patch("/admin/results/:id", async (req, res) => {
  try {
    const [row] = await db.update(results).set({ ...req.body, updatedAt: new Date() }).where(eq(results.id, req.params.id)).returning();
    res.json({ ok: true, data: row });
  } catch (e) { res.status(500).json({ error: "Failed to update result" }); }
});

router.delete("/admin/results/:id", async (req, res) => {
  try {
    await db.delete(results).where(eq(results.id, req.params.id));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "Failed to delete result" }); }
});

// ── Mock Tests (admin view) ───────────────────────────────────────────────────
router.get("/admin/mock-tests", async (_req, res) => {
  try {
    const rows = await db
      .select({ id: mockTests.id, title: mockTests.title, subject: mockTests.subject, examType: mockTests.examType, durationMinutes: mockTests.durationMinutes, isPublished: mockTests.isPublished, isPublic: mockTests.isPublic, scheduledStart: mockTests.scheduledStart, scheduledEnd: mockTests.scheduledEnd, createdAt: mockTests.createdAt, batchId: mockTests.batchId, batchName: batches.name })
      .from(mockTests).leftJoin(batches, eq(mockTests.batchId, batches.id))
      .orderBy(desc(mockTests.createdAt));
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ error: "Failed to fetch mock tests" }); }
});

router.patch("/admin/mock-tests/:id", async (req, res) => {
  const { isPublished, isPublic } = req.body;
  try {
    const [row] = await db.update(mockTests).set({ isPublished, isPublic, updatedAt: new Date() }).where(eq(mockTests.id, req.params.id)).returning();
    res.json({ ok: true, data: row });
  } catch (e) { res.status(500).json({ error: "Failed to update mock test" }); }
});

// ── Users ──────────────────────────────────────────────────────────────────

router.get("/admin/users", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? "1")));
    const limit = 50;
    const offset = (page - 1) * limit;
    const search = String(req.query.search ?? "").trim();
    const role = String(req.query.role ?? "").trim();
    const status = String(req.query.status ?? "").trim();
    const conds = [];
    if (search) conds.push(or(
      sql`${users.name} ilike ${"%" + search + "%"}`,
      sql`${users.email} ilike ${"%" + search + "%"}`,
    ));
    if (role) conds.push(eq(users.role, role as "student" | "parent" | "teacher" | "admin"));
    if (status) conds.push(eq(users.approvalStatus, status));
    const where = conds.length ? and(...conds) : undefined;
    const [rows, [{ total }]] = await Promise.all([
      db.select().from(users).where(where).orderBy(desc(users.createdAt)).limit(limit).offset(offset),
      db.select({ total: sql<number>`count(*)::int` }).from(users).where(where),
    ]);
    res.json({ ok: true, data: { rows, total } });
  } catch (e) {
    console.error("GET /admin/users error:", e);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.post("/admin/users", async (req, res) => {
  try {
    const { name, email, phone, role } = req.body;
    if (!name?.trim() || !email?.trim()) { res.status(400).json({ error: "name and email are required" }); return; }
    if (role && !["student", "parent", "teacher", "admin"].includes(role)) { res.status(400).json({ error: "Invalid role" }); return; }
    // Sentinel clerkUserId so unique constraint is satisfied. When the user signs in via Clerk
    // with this email, /portal/me will link the real clerkUserId and keep approvalStatus "approved".
    const sentinelClerkId = `admin_created_${crypto.randomUUID()}`;
    const [row] = await db.insert(users).values({
      clerkUserId: sentinelClerkId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      role: role ?? "student",
      approvalStatus: "approved",
    }).returning();
    res.status(201).json({ ok: true, data: row });
  } catch (e: unknown) {
    const code = (e as { code?: string }).code;
    if (code === "23505") { res.status(409).json({ error: "A user with this email already exists" }); return; }
    res.status(500).json({ error: "Failed to create user" });
  }
});

router.patch("/admin/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    if (!["student", "parent", "teacher", "admin"].includes(role)) {
      res.status(400).json({ error: "Invalid role" }); return;
    }
    const [row] = await db.update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, req.params.id))
      .returning();
    if (!row) { res.status(404).json({ error: "User not found" }); return; }
    res.json({ ok: true, data: row });
  } catch (e) {
    res.status(500).json({ error: "Failed to update role" });
  }
});

router.patch("/admin/users/:id/approve", async (req, res) => {
  try {
    const [row] = await db.update(users)
      .set({ approvalStatus: "approved", updatedAt: new Date() })
      .where(eq(users.id, req.params.id))
      .returning();
    if (!row) { res.status(404).json({ error: "User not found" }); return; }
    res.json({ ok: true, data: row });
  } catch (e) {
    res.status(500).json({ error: "Failed to approve user" });
  }
});

router.patch("/admin/users/:id/reject", async (req, res) => {
  try {
    const [row] = await db.update(users)
      .set({ approvalStatus: "rejected", updatedAt: new Date() })
      .where(eq(users.id, req.params.id))
      .returning();
    if (!row) { res.status(404).json({ error: "User not found" }); return; }
    res.json({ ok: true, data: row });
  } catch (e) {
    res.status(500).json({ error: "Failed to reject user" });
  }
});

// ── Site Settings ──────────────────────────────────────────────────────────

router.get("/admin/site-settings", async (_req, res) => {
  try {
    const rows = await db.select().from(siteSettings).orderBy(asc(siteSettings.key));
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch site settings" });
  }
});

router.patch("/admin/site-settings/bulk", async (req, res) => {
  try {
    const { updates } = req.body as { updates: { key: string; value: string; label?: string }[] };
    if (!Array.isArray(updates)) { res.status(400).json({ error: "updates must be an array" }); return; }
    await Promise.all(
      updates.map(u =>
        db.insert(siteSettings)
          .values({ key: u.key, value: u.value, label: u.label ?? null })
          .onConflictDoUpdate({ target: siteSettings.key, set: { value: u.value, updatedAt: new Date() } })
      )
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to save settings" });
  }
});

// ── SEO Overrides ──────────────────────────────────────────────────────────

router.get("/admin/seo", async (_req, res) => {
  try {
    const rows = await db.select().from(seoOverrides).orderBy(asc(seoOverrides.route));
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch SEO overrides" });
  }
});

router.post("/admin/seo", async (req, res) => {
  try {
    const { route, title, description, focusKeyword, noIndex } = req.body;
    if (!route) { res.status(400).json({ error: "route is required" }); return; }
    const [row] = await db.insert(seoOverrides)
      .values({ route, title: title ?? null, description: description ?? null, focusKeyword: focusKeyword ?? null, noIndex: noIndex ?? false })
      .returning();
    res.status(201).json({ ok: true, data: row });
  } catch (e) {
    res.status(500).json({ error: "Failed to create SEO override" });
  }
});

router.patch("/admin/seo/:id", async (req, res) => {
  try {
    const { title, description, focusKeyword, noIndex } = req.body;
    const [row] = await db.update(seoOverrides)
      .set({ title: title ?? null, description: description ?? null, focusKeyword: focusKeyword ?? null, noIndex: noIndex ?? false, updatedAt: new Date() })
      .where(eq(seoOverrides.id, req.params.id))
      .returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ok: true, data: row });
  } catch (e) {
    res.status(500).json({ error: "Failed to update SEO override" });
  }
});

router.delete("/admin/seo/:id", async (req, res) => {
  try {
    await db.delete(seoOverrides).where(eq(seoOverrides.id, req.params.id));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete SEO override" });
  }
});

// ── Watermark Settings ─────────────────────────────────────────────────────

router.get("/admin/watermarks", async (_req, res) => {
  try {
    const rows = await db.select().from(watermarkSettings).orderBy(asc(watermarkSettings.docType));
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch watermark settings" });
  }
});

router.patch("/admin/watermarks/:docType", async (req, res) => {
  try {
    const docType = req.params.docType;
    const { enabled, textTemplate, position, opacity, rotation, fontSize, color, useGlobal } = req.body;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setFields: Record<string, any> = { updatedAt: new Date() };
    if (enabled !== undefined) setFields.enabled = enabled;
    if (textTemplate !== undefined) setFields.textTemplate = textTemplate;
    if (position !== undefined) setFields.position = position;
    if (opacity !== undefined) setFields.opacity = Number(opacity);
    if (rotation !== undefined) setFields.rotation = Number(rotation);
    if (fontSize !== undefined) setFields.fontSize = Number(fontSize);
    if (color !== undefined) setFields.color = color;
    if (useGlobal !== undefined) setFields.useGlobal = useGlobal;
    const existing = await db.select({ id: watermarkSettings.id }).from(watermarkSettings).where(eq(watermarkSettings.docType, docType)).limit(1);
    let row;
    if (existing[0]) {
      [row] = await db.update(watermarkSettings).set(setFields).where(eq(watermarkSettings.docType, docType)).returning();
    } else {
      [row] = await db.insert(watermarkSettings).values({ docType, ...setFields }).returning();
    }
    res.json({ ok: true, data: row });
  } catch (e) {
    console.error("PATCH /admin/watermarks error:", e);
    res.status(500).json({ error: "Failed to update watermark settings" });
  }
});

// ── Analytics ─────────────────────────────────────────────────────────────

router.get("/admin/analytics/pageviews", async (req, res) => {
  try {
    const days = Math.min(90, Math.max(1, parseInt(String(req.query.days ?? "30"))));
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
    const rows = await db
      .select({ date: pageViews.date, total: sql<number>`sum(${pageViews.count})::int` })
      .from(pageViews)
      .where(sql`${pageViews.date} >= to_char(now() - interval '${sql.raw(String(days))} days', 'YYYY-MM-DD')`)
      .groupBy(pageViews.date)
      .orderBy(asc(pageViews.date));
    res.json({ ok: true, data: rows, source: "internal" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch pageviews" });
  }
});

router.get("/admin/analytics/top-pages", async (req, res) => {
  try {
    const days = Math.min(90, Math.max(1, parseInt(String(req.query.days ?? "30"))));
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
    const rows = await db
      .select({ path: pageViews.path, total: sql<number>`sum(${pageViews.count})::int` })
      .from(pageViews)
      .where(sql`${pageViews.date} >= to_char(now() - interval '${sql.raw(String(days))} days', 'YYYY-MM-DD')`)
      .groupBy(pageViews.path)
      .orderBy(sql`sum(${pageViews.count}) desc`)
      .limit(20);
    res.json({ ok: true, data: rows, source: "internal" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch top pages" });
  }
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
    const bounceRate30d = Math.round(parseFloat(sessionsRows[0]?.metricValues[1]?.value ?? "0") * 100);
    const topSource = sourceRows
      .map(r => ({ source: r.dimensionValues[0].value, sessions: parseInt(r.metricValues[0].value ?? "0") }))
      .sort((a, b) => b.sessions - a.sessions)[0]?.source ?? null;
    res.json({ ok: true, data: { available: true, activeUsers7d, sessions30d, bounceRate30d, topSource } });
  } catch (e) { console.error(e); res.status(500).json({ error: "Failed to fetch GA4 summary" }); }
});

router.get("/admin/analytics/feature-usage", async (req, res) => {
  const creds = await getEffectiveCreds();
  if (!creds) {
    res.json({ ok: true, data: [], available: false });
    return;
  }
  try {
    const days = Math.min(90, Math.max(1, parseInt(String(req.query.days ?? "30"))));
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const startDate = cutoff.toISOString().split("T")[0];
    const rows = await runEventReport(creds, [{ startDate, endDate: "today" }], "pinnacle_");
    res.json({ ok: true, data: rows, available: true });
  } catch (e) {
    console.error("GA4 feature-usage error:", e);
    res.status(500).json({ error: "Failed to fetch feature usage data" });
  }
});

// ── Security Events ────────────────────────────────────────────────────────

router.get("/admin/security/events", async (_req, res) => {
  try {
    const rows = await db.select().from(securityEvents).orderBy(desc(securityEvents.createdAt)).limit(200);
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch security events" });
  }
});

router.get("/admin/security/lockouts", async (_req, res) => {
  try {
    const rows = await db.select().from(ipLockouts).orderBy(desc(ipLockouts.createdAt)).limit(100);
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch IP lockouts" });
  }
});

router.patch("/admin/security/lockouts/:id/unlock", async (req, res) => {
  try {
    const [row] = await db.update(ipLockouts)
      .set({ unlockedAt: new Date(), lockedUntil: null, updatedAt: new Date() })
      .where(eq(ipLockouts.id, req.params.id))
      .returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ok: true, data: row });
  } catch (e) {
    res.status(500).json({ error: "Failed to unlock IP" });
  }
});

// ── Question Bank ──────────────────────────────────────────────────────────

// These literal sub-routes MUST come before any /:id routes to avoid mis-matching
router.get("/admin/question-bank/review-queue", async (_req, res) => {
  try {
    const rows = await db.select({
      id: questionBank.id, subject: questionBank.subject, topic: questionBank.topic,
      classGrade: questionBank.classGrade, year: questionBank.year,
      difficulty: questionBank.difficulty, questionType: questionBank.questionType,
      questionText: questionBank.questionText, options: questionBank.options,
      correctAnswer: questionBank.correctAnswer, solution: questionBank.solution,
      examName: questionBank.examName, marks: questionBank.marks,
      isPublished: questionBank.isPublished, examTarget: questionBank.examTarget,
      source: questionBank.source, reviewStatus: questionBank.reviewStatus,
      language: questionBank.language, createdAt: questionBank.createdAt,
    }).from(questionBank)
      .where(and(eq(questionBank.reviewStatus, "pending"), eq(questionBank.source, "AI"), isNull(questionBank.deletedAt)))
      .orderBy(asc(questionBank.createdAt));
    res.json({ ok: true, data: { rows, total: rows.length, page: 1, limit: rows.length } });
  } catch (e) {
    console.error("GET /admin/question-bank/review-queue error:", e);
    res.status(500).json({ error: "Failed to fetch review queue" });
  }
});

router.get("/admin/question-bank/deletion-requests", async (_req, res) => {
  try {
    const rows = await db.select({
      id: questionBank.id, subject: questionBank.subject, topic: questionBank.topic,
      questionText: questionBank.questionText, difficulty: questionBank.difficulty,
      questionType: questionBank.questionType, marks: questionBank.marks,
      deletionRequestedAt: questionBank.deletionRequestedAt, deletionReason: questionBank.deletionReason,
    }).from(questionBank)
      .where(and(isNotNull(questionBank.deletionRequestedAt), isNull(questionBank.deletedAt)))
      .orderBy(desc(questionBank.deletionRequestedAt));
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ error: "Failed to fetch deletion requests" }); }
});

router.get("/admin/question-bank/recycle-bin", async (_req, res) => {
  try {
    const rows = await db.select({
      id: questionBank.id, subject: questionBank.subject, topic: questionBank.topic,
      questionText: questionBank.questionText, difficulty: questionBank.difficulty,
      questionType: questionBank.questionType, marks: questionBank.marks,
      deletedAt: questionBank.deletedAt, deletionReason: questionBank.deletionReason,
    }).from(questionBank)
      .where(and(
        isNotNull(questionBank.deletedAt),
        sql`${questionBank.deletedAt} > now() - interval '7 days'`,
      ))
      .orderBy(desc(questionBank.deletedAt));
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ error: "Failed to fetch recycle bin" }); }
});

router.get("/admin/question-bank", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? "1")));
    const limit = Math.min(50, Math.max(10, parseInt(String(req.query.limit ?? "30"))));
    const offset = (page - 1) * limit;
    const subject = String(req.query.subject ?? "").trim();
    const topic = String(req.query.topic ?? "").trim();
    const difficulty = String(req.query.difficulty ?? "").trim();
    const questionType = String(req.query.questionType ?? "").trim();
    const source = String(req.query.source ?? "").trim();
    const reviewStatus = String(req.query.reviewStatus ?? "").trim();
    const examTarget = String(req.query.examTarget ?? "").trim();
    const search = String(req.query.search ?? "").trim();

    const conds: SQL<unknown>[] = [isNull(questionBank.deletedAt), isNull(questionBank.deletionRequestedAt)];
    if (subject) conds.push(eq(questionBank.subject, subject));
    if (topic) conds.push(sql`${questionBank.topic} ilike ${"%" + topic + "%"}`);
    if (difficulty) conds.push(eq(questionBank.difficulty, difficulty as "easy" | "medium" | "hard"));
    if (questionType) conds.push(eq(questionBank.questionType, questionType as "mcq" | "short" | "long" | "numerical"));
    if (source) conds.push(eq(questionBank.source, source));
    if (reviewStatus) conds.push(eq(questionBank.reviewStatus, reviewStatus));
    if (examTarget) conds.push(sql`${examTarget} = ANY(${questionBank.examTarget})`);
    if (search) conds.push(sql`${questionBank.searchVector} @@ plainto_tsquery('english', ${search})`);

    const where = and(...conds);
    const cols = {
      id: questionBank.id, subject: questionBank.subject, topic: questionBank.topic,
      classGrade: questionBank.classGrade, year: questionBank.year,
      difficulty: questionBank.difficulty, questionType: questionBank.questionType,
      questionText: questionBank.questionText, options: questionBank.options,
      correctAnswer: questionBank.correctAnswer, solution: questionBank.solution,
      examName: questionBank.examName, marks: questionBank.marks,
      isPublished: questionBank.isPublished, examTarget: questionBank.examTarget,
      source: questionBank.source, reviewStatus: questionBank.reviewStatus,
      language: questionBank.language, createdAt: questionBank.createdAt,
    };
    const [rows, [{ total }]] = await Promise.all([
      db.select(cols).from(questionBank).where(where).orderBy(desc(questionBank.createdAt)).limit(limit).offset(offset),
      db.select({ total: sql<number>`count(*)::int` }).from(questionBank).where(where),
    ]);
    res.json({ ok: true, data: { rows, total, page, limit } });
  } catch (e) {
    console.error("GET /admin/question-bank error:", e);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

router.post("/admin/question-bank", async (req, res) => {
  try {
    const { subject, topic, classGrade, year, difficulty, questionType, questionText, options,
      correctAnswer, solution, examName, marks, isPublished, examTarget, source, language } = req.body;
    if (!subject?.trim() || !questionText?.trim() || !correctAnswer?.trim()) {
      res.status(400).json({ error: "subject, questionText, correctAnswer are required" }); return;
    }
    const [row] = await db.insert(questionBank).values({
      subject: subject.trim(), topic: topic?.trim() || null, classGrade: classGrade?.trim() || null,
      year: year ? parseInt(year) : null, difficulty: difficulty ?? "medium",
      questionType: questionType ?? "mcq", questionText: questionText.trim(),
      options: options ?? null, correctAnswer: correctAnswer.trim(),
      solution: solution?.trim() || null, examName: examName?.trim() || null,
      marks: marks ? parseInt(marks) : 4, isPublished: isPublished ?? true,
      examTarget: examTarget ?? null, source: source ?? "MANUAL",
      language: language ?? "en", reviewStatus: "approved",
    }).returning({
      id: questionBank.id, subject: questionBank.subject, questionText: questionBank.questionText,
      createdAt: questionBank.createdAt,
    });
    res.status(201).json({ ok: true, data: row });
  } catch (e) {
    console.error("POST /admin/question-bank error:", e);
    res.status(500).json({ error: "Failed to create question" });
  }
});

router.patch("/admin/question-bank/:id/review", async (req, res) => {
  try {
    const { reviewStatus } = req.body;
    if (!["pending", "approved", "rejected"].includes(reviewStatus)) {
      res.status(400).json({ error: "reviewStatus must be pending|approved|rejected" }); return;
    }
    const [row] = await db.update(questionBank)
      .set({ reviewStatus, updatedAt: new Date() })
      .where(eq(questionBank.id, req.params.id))
      .returning({ id: questionBank.id, reviewStatus: questionBank.reviewStatus });
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ok: true, data: row });
  } catch (e) { res.status(500).json({ error: "Failed to update review status" }); }
});

router.post("/admin/question-bank/:id/confirm-delete", async (req, res) => {
  try {
    const [row] = await db.update(questionBank)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(questionBank.id, req.params.id), isNotNull(questionBank.deletionRequestedAt)))
      .returning({ id: questionBank.id });
    if (!row) { res.status(404).json({ error: "Not found or not flagged" }); return; }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "Failed to confirm deletion" }); }
});

router.post("/admin/question-bank/:id/restore", async (req, res) => {
  try {
    const [row] = await db.update(questionBank)
      .set({ deletionRequestedAt: null, deletionReason: null, deletedAt: null, updatedAt: new Date() })
      .where(eq(questionBank.id, req.params.id))
      .returning({ id: questionBank.id });
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "Failed to restore question" }); }
});

router.patch("/admin/question-bank/:id", async (req, res) => {
  try {
    const { subject, topic, classGrade, year, difficulty, questionType, questionText, options,
      correctAnswer, solution, examName, marks, isPublished, examTarget, source, language } = req.body;
    const [row] = await db.update(questionBank).set({
      ...(subject !== undefined ? { subject } : {}),
      ...(topic !== undefined ? { topic: topic || null } : {}),
      ...(classGrade !== undefined ? { classGrade: classGrade || null } : {}),
      ...(year !== undefined ? { year: year ? parseInt(year) : null } : {}),
      ...(difficulty !== undefined ? { difficulty } : {}),
      ...(questionType !== undefined ? { questionType } : {}),
      ...(questionText !== undefined ? { questionText } : {}),
      ...(options !== undefined ? { options } : {}),
      ...(correctAnswer !== undefined ? { correctAnswer } : {}),
      ...(solution !== undefined ? { solution: solution || null } : {}),
      ...(examName !== undefined ? { examName: examName || null } : {}),
      ...(marks !== undefined ? { marks: parseInt(marks) } : {}),
      ...(isPublished !== undefined ? { isPublished } : {}),
      ...(examTarget !== undefined ? { examTarget } : {}),
      ...(source !== undefined ? { source } : {}),
      ...(language !== undefined ? { language } : {}),
      updatedAt: new Date(),
    }).where(eq(questionBank.id, req.params.id))
      .returning({ id: questionBank.id, updatedAt: questionBank.updatedAt });
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ok: true, data: row });
  } catch (e) {
    console.error("PATCH /admin/question-bank/:id error:", e);
    res.status(500).json({ error: "Failed to update question" });
  }
});

// Stage 1: flag for deletion (stamps deletionRequestedAt + reason, NOT deletedAt)
router.delete("/admin/question-bank/:id", async (req, res) => {
  try {
    const { reason } = req.body;
    const [row] = await db.update(questionBank)
      .set({ deletionRequestedAt: new Date(), deletionReason: reason?.trim() || null, updatedAt: new Date() })
      .where(and(eq(questionBank.id, req.params.id), isNull(questionBank.deletedAt)))
      .returning({ id: questionBank.id });
    if (!row) { res.status(404).json({ error: "Not found or already deleted" }); return; }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "Failed to flag question for deletion" }); }
});

// ── Practice Sets ──────────────────────────────────────────────────────────

router.get("/admin/practice-sets", async (_req, res) => {
  try {
    const rows = await db.select({
      id: practiceSets.id, name: practiceSets.name, description: practiceSets.description,
      subject: practiceSets.subject, isActive: practiceSets.isActive,
      createdAt: practiceSets.createdAt, updatedAt: practiceSets.updatedAt,
      questionCount: sql<number>`(select count(*)::int from practice_set_questions psq where psq.set_id = ${practiceSets.id})`,
      assignmentCount: sql<number>`(select count(*)::int from practice_set_assignments psa where psa.set_id = ${practiceSets.id})`,
    }).from(practiceSets).orderBy(desc(practiceSets.createdAt));
    res.json({ ok: true, data: rows });
  } catch (e) {
    console.error("GET /admin/practice-sets error:", e);
    res.status(500).json({ error: "Failed to fetch practice sets" });
  }
});

router.post("/admin/practice-sets", async (req, res) => {
  try {
    const { name, description, subject } = req.body;
    if (!name?.trim()) { res.status(400).json({ error: "name is required" }); return; }
    const [row] = await db.insert(practiceSets)
      .values({ name: name.trim(), description: description?.trim() || null, subject: subject?.trim() || null })
      .returning();
    res.status(201).json({ ok: true, data: row });
  } catch (e) { res.status(500).json({ error: "Failed to create practice set" }); }
});

router.patch("/admin/practice-sets/:id", async (req, res) => {
  try {
    const { name, description, subject, isActive } = req.body;
    const [row] = await db.update(practiceSets).set({
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(description !== undefined ? { description: description || null } : {}),
      ...(subject !== undefined ? { subject: subject || null } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      updatedAt: new Date(),
    }).where(eq(practiceSets.id, req.params.id)).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ok: true, data: row });
  } catch (e) { res.status(500).json({ error: "Failed to update practice set" }); }
});

router.delete("/admin/practice-sets/:id", async (req, res) => {
  try {
    await db.delete(practiceSets).where(eq(practiceSets.id, req.params.id));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "Failed to delete practice set" }); }
});

router.get("/admin/practice-sets/:id/questions", async (req, res) => {
  try {
    const rows = await db.select({
      id: practiceSetQuestions.id,
      questionId: practiceSetQuestions.questionId,
      sortOrder: practiceSetQuestions.sortOrder,
      subject: questionBank.subject, topic: questionBank.topic,
      questionText: questionBank.questionText, difficulty: questionBank.difficulty,
      questionType: questionBank.questionType, marks: questionBank.marks,
    }).from(practiceSetQuestions)
      .leftJoin(questionBank, eq(practiceSetQuestions.questionId, questionBank.id))
      .where(eq(practiceSetQuestions.setId, req.params.id))
      .orderBy(asc(practiceSetQuestions.sortOrder));
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ error: "Failed to fetch practice set questions" }); }
});

router.post("/admin/practice-sets/:id/questions", async (req, res) => {
  try {
    const { questionIds } = req.body;
    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      res.status(400).json({ error: "questionIds must be a non-empty array" }); return;
    }
    const existing = await db.select({ questionId: practiceSetQuestions.questionId })
      .from(practiceSetQuestions).where(eq(practiceSetQuestions.setId, req.params.id));
    const existingIds = new Set(existing.map(e => e.questionId));
    const toInsert = (questionIds as string[]).filter(id => !existingIds.has(id));
    if (toInsert.length > 0) {
      const [{ maxOrder }] = await db.select({ maxOrder: sql<number>`coalesce(max(sort_order), 0)` })
        .from(practiceSetQuestions).where(eq(practiceSetQuestions.setId, req.params.id));
      let order = (maxOrder ?? 0) + 1;
      await db.insert(practiceSetQuestions).values(
        toInsert.map(qId => ({ setId: req.params.id, questionId: qId, sortOrder: order++ }))
      );
    }
    res.json({ ok: true, added: toInsert.length });
  } catch (e) {
    console.error("POST /admin/practice-sets/:id/questions error:", e);
    res.status(500).json({ error: "Failed to add questions to practice set" });
  }
});

router.delete("/admin/practice-sets/:setId/questions/:questionId", async (req, res) => {
  try {
    await db.delete(practiceSetQuestions).where(
      and(eq(practiceSetQuestions.setId, req.params.setId), eq(practiceSetQuestions.questionId, req.params.questionId))
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "Failed to remove question from set" }); }
});

// ── Practice Set Assignments ────────────────────────────────────────────────

router.get("/admin/practice-sets/:id/assignments", async (req, res) => {
  try {
    const rows = await db.select({
      id: practiceSetAssignments.id,
      setId: practiceSetAssignments.setId,
      batchId: practiceSetAssignments.batchId,
      studentId: practiceSetAssignments.studentId,
      assignedAt: practiceSetAssignments.createdAt,
      batchName: batches.name,
      studentName: users.name,
    }).from(practiceSetAssignments)
      .leftJoin(batches, eq(practiceSetAssignments.batchId, batches.id))
      .leftJoin(students, eq(practiceSetAssignments.studentId, students.id))
      .leftJoin(users, eq(students.userId, users.id))
      .where(eq(practiceSetAssignments.setId, req.params.id))
      .orderBy(desc(practiceSetAssignments.createdAt));
    res.json({ ok: true, data: rows });
  } catch (e) {
    console.error("GET /admin/practice-sets/:id/assignments error:", e);
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
});

router.post("/admin/practice-sets/:id/assignments", async (req, res) => {
  try {
    const { batchId, studentId } = req.body;
    if (!batchId && !studentId) {
      res.status(400).json({ error: "batchId or studentId is required" }); return;
    }
    if (batchId && studentId) {
      res.status(400).json({ error: "Provide exactly one of batchId or studentId" }); return;
    }
    const [row] = await db.insert(practiceSetAssignments)
      .values({ setId: req.params.id, batchId: batchId || null, studentId: studentId || null })
      .onConflictDoNothing()
      .returning();
    res.status(201).json({ ok: true, data: row ?? null });
  } catch (e) {
    console.error("POST /admin/practice-sets/:id/assignments error:", e);
    res.status(500).json({ error: "Failed to create assignment" });
  }
});

router.delete("/admin/practice-sets/:id/assignments/:assignmentId", async (req, res) => {
  try {
    await db.delete(practiceSetAssignments).where(
      and(eq(practiceSetAssignments.id, req.params.assignmentId), eq(practiceSetAssignments.setId, req.params.id))
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to remove assignment" });
  }
});

// ── Audit Log ──────────────────────────────────────────────────────────────

router.get("/admin/audit-log", async (_req, res) => {
  try {
    const rows = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(200);
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch audit log" });
  }
});

export default router;

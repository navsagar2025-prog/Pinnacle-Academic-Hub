import { Router } from "express";
import { requireAuth } from "@clerk/express";
import { db } from "@workspace/db";
import {
  notices, enquiries, blogPosts, galleryItems,
  users, students, teachers, courses, batches, feeRecords, results,
  mockTests,
} from "@workspace/db/schema";
import { desc, eq, sql, asc } from "drizzle-orm";

const router = Router();
router.use(requireAuth());

// ── Stats ──────────────────────────────────────────────────────────────────

router.get("/admin/stats", async (_req, res) => {
  try {
    const [
      [{ noticeCount }],
      [{ enquiryCount }],
      [{ blogCount }],
      [{ galleryCount }],
      [{ newEnquiryCount }],
    ] = await Promise.all([
      db.select({ noticeCount: sql<number>`count(*)::int` }).from(notices),
      db.select({ enquiryCount: sql<number>`count(*)::int` }).from(enquiries),
      db.select({ blogCount: sql<number>`count(*)::int` }).from(blogPosts),
      db.select({ galleryCount: sql<number>`count(*)::int` }).from(galleryItems),
      db
        .select({ newEnquiryCount: sql<number>`count(*)::int` })
        .from(enquiries)
        .where(eq(enquiries.admissionStatus, "new")),
    ]);
    res.json({ ok: true, data: { noticeCount, enquiryCount, blogCount, galleryCount, newEnquiryCount } });
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

export default router;

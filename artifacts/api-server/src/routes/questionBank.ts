import { Router } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import {
  questionBank, questionBookmarks, questionAttempts,
  students, users,
} from "@workspace/db/schema";
import { eq, and, isNull, desc, sql, arrayContains } from "drizzle-orm";

const router = Router();

// ── Helper: get student record (optional auth — mobile may send token) ─────────
async function tryGetStudentId(clerkUserId: string | null | undefined): Promise<string | null> {
  if (!clerkUserId) return null;
  try {
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
    if (!user) return null;
    const [student] = await db.select({ id: students.id }).from(students).where(eq(students.userId, user.id)).limit(1);
    return student?.id ?? null;
  } catch { return null; }
}

// ── GET /question-bank — public paginated list with filters ────────────────────
// Mobile app calls this. Auth is optional; if a Clerk session is present we
// return bookmarkedIds for the student so the UI can pre-tick bookmark icons.
router.get("/question-bank", async (req, res) => {
  try {
    const {
      subject, topic, difficulty, questionType, examTarget,
      search, classGrade, hasFigure,
      page = "1", pageSize = "50", limit,
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page ?? "1") || 1);
    const pageLimit = Math.min(200, parseInt(limit ?? pageSize ?? "50") || 50);
    const offset = (pageNum - 1) * pageLimit;

    const conditions = [
      isNull(questionBank.deletedAt),
      eq(questionBank.isPublished, true),
      eq(questionBank.reviewStatus, "approved"),
    ];

    if (subject && subject !== "All") conditions.push(eq(questionBank.subject, subject));
    if (topic) conditions.push(eq(questionBank.topic, topic));
    if (difficulty) conditions.push(eq(questionBank.difficulty, difficulty as "easy" | "medium" | "hard"));
    if (questionType) conditions.push(eq(questionBank.questionType, questionType as "mcq" | "short" | "long" | "numerical"));
    if (examTarget) conditions.push(arrayContains(questionBank.examTarget, [examTarget]));
    if (classGrade) conditions.push(eq(questionBank.classGrade, classGrade));
    if (hasFigure === "1") conditions.push(sql`${questionBank.imageUrl} IS NOT NULL`);

    let searchCondition = undefined;
    if (search?.trim()) {
      const tsq = search.trim().split(/\s+/).map(w => w + ":*").join(" & ");
      searchCondition = sql`${questionBank.searchVector} @@ to_tsquery('english', ${tsq})`;
    }

    const whereClause = searchCondition
      ? and(...conditions, searchCondition)
      : and(...conditions);

    const rows = await db.select({
      id: questionBank.id,
      subject: questionBank.subject,
      topic: questionBank.topic,
      year: questionBank.year,
      difficulty: questionBank.difficulty,
      questionType: questionBank.questionType,
      questionText: questionBank.questionText,
      options: questionBank.options,
      correctAnswer: questionBank.correctAnswer,
      solution: questionBank.solution,
      imageUrl: questionBank.imageUrl,
      solutionImageUrl: questionBank.solutionImageUrl,
      marks: questionBank.marks,
      examTarget: questionBank.examTarget,
    }).from(questionBank)
      .where(whereClause)
      .orderBy(desc(questionBank.createdAt))
      .limit(pageLimit)
      .offset(offset);

    // Optionally fetch bookmarks if user is authenticated
    const { userId: clerkUserId } = getAuth(req);
    let bookmarkedIds: string[] = [];
    if (clerkUserId) {
      const studentId = await tryGetStudentId(clerkUserId);
      if (studentId && rows.length > 0) {
        const questionIds = rows.map(r => r.id);
        const bmarks = await db.select({ questionId: questionBookmarks.questionId })
          .from(questionBookmarks)
          .where(and(
            eq(questionBookmarks.studentId, studentId),
            sql`${questionBookmarks.questionId} = ANY(ARRAY[${sql.join(questionIds.map(id => sql`${id}::uuid`), sql`, `)}])`,
          ));
        bookmarkedIds = bmarks.map(b => b.questionId);
      }
    }

    res.json({ ok: true, items: rows, bookmarkedIds, page: pageNum, pageSize: pageLimit });
  } catch (e) {
    console.error("GET /question-bank error:", e);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

// ── POST /question-bank/:id/bookmark ─────────────────────────────────────────
router.post("/question-bank/:id/bookmark", requireAuth(), async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);
  try {
    const studentId = await tryGetStudentId(clerkUserId);
    if (!studentId) { res.status(403).json({ error: "Student profile not found" }); return; }
    const questionId = req.params.id;
    const [qrow] = await db.select({ id: questionBank.id }).from(questionBank).where(eq(questionBank.id, questionId)).limit(1);
    if (!qrow) { res.status(404).json({ error: "Question not found" }); return; }
    await db.insert(questionBookmarks).values({ studentId, questionId }).onConflictDoNothing();
    res.json({ ok: true, success: true, bookmarked: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to bookmark" });
  }
});

// ── DELETE /question-bank/:id/bookmark ───────────────────────────────────────
router.delete("/question-bank/:id/bookmark", requireAuth(), async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);
  try {
    const studentId = await tryGetStudentId(clerkUserId);
    if (!studentId) { res.status(403).json({ error: "Student profile not found" }); return; }
    await db.delete(questionBookmarks).where(
      and(eq(questionBookmarks.studentId, studentId), eq(questionBookmarks.questionId, req.params.id))
    );
    res.json({ ok: true, success: true, bookmarked: false });
  } catch (e) {
    res.status(500).json({ error: "Failed to remove bookmark" });
  }
});

// ── POST /question-bank/:id/attempt — record a question attempt ───────────────
router.post("/question-bank/:id/attempt", requireAuth(), async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);
  const { submittedAnswer, isCorrect, timeSpentSeconds } = req.body;
  try {
    const studentId = await tryGetStudentId(clerkUserId);
    if (!studentId) { res.status(403).json({ error: "Student profile not found" }); return; }
    const [row] = await db.insert(questionAttempts).values({
      studentId,
      questionId: req.params.id,
      submittedAnswer: submittedAnswer ?? null,
      isCorrect: isCorrect ?? null,
      timeSpentSeconds: timeSpentSeconds ?? null,
    }).returning();
    res.json({ ok: true, data: row });
  } catch (e) {
    res.status(500).json({ error: "Failed to record attempt" });
  }
});

export default router;

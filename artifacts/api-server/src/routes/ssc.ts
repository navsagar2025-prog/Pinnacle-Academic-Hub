/**
 * ssc.ts — public (unauthenticated) SSC question-bank + exam-template endpoints.
 *
 * Powers the public /ssc page on the website and the public SSC tab on mobile.
 * Returns the same row shape as /portal/student/question-bank but without the
 * bookmark/attempt logic (those stay auth-only).
 *
 * Mounted under /api/v1/public/ssc/* in routes/index.ts BEFORE portalRouter so
 * we don't inherit requireAuth().
 */

import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  questionBank, examTemplates, examTemplateSections,
} from "@workspace/db/schema";
import { eq, and, isNull, desc, asc, sql, arrayOverlaps } from "drizzle-orm";

const router: IRouter = Router();

const TRACK_TARGETS: Record<string, string[]> = {
  SSC_CGL:  ["SSC_CGL", "SSC_TIER_1", "SSC_TIER_2"],
  SSC_CHSL: ["SSC_CHSL", "SSC_TIER_1"],
};

// GET /v1/public/ssc/question-bank — paginated bilingual SSC questions
router.get("/public/ssc/question-bank", async (req, res) => {
  try {
    const { subject, difficulty, search, track = "SSC_CGL", page = "1", pageSize = "20" } =
      req.query as Record<string, string>;

    const targets = TRACK_TARGETS[track] ?? TRACK_TARGETS.SSC_CGL;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limit = Math.min(50, parseInt(pageSize) || 20);
    const offset = (pageNum - 1) * limit;

    const conditions = [
      isNull(questionBank.deletedAt),
      eq(questionBank.isPublished, true),
      eq(questionBank.reviewStatus, "approved"),
      arrayOverlaps(questionBank.examTarget, targets),
    ];
    if (subject) conditions.push(eq(questionBank.subject, subject));
    if (difficulty) {
      conditions.push(eq(questionBank.difficulty, difficulty as "easy" | "medium" | "hard"));
    }
    if (search?.trim()) {
      const tsq = search.trim().split(/\s+/).filter(Boolean).map((w) => `${w}:*`).join(" & ");
      // OR over English + Hindi (search_vector includes both with simple+english dicts).
      conditions.push(sql`${questionBank.searchVector} @@ to_tsquery('simple', ${tsq})`);
    }

    const rows = await db.select({
      id: questionBank.id,
      subject: questionBank.subject,
      topic: questionBank.topic,
      difficulty: questionBank.difficulty,
      questionType: questionBank.questionType,
      questionText: questionBank.questionText,
      options: questionBank.options,
      correctAnswer: questionBank.correctAnswer,
      solution: questionBank.solution,
      marks: questionBank.marks,
      language: questionBank.language,
      questionTextHi: questionBank.questionTextHi,
      optionsHi: questionBank.optionsHi,
      solutionHi: questionBank.solutionHi,
      examTarget: questionBank.examTarget,
    })
      .from(questionBank)
      .where(and(...conditions))
      .orderBy(desc(questionBank.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` })
      .from(questionBank).where(and(...conditions));

    res.json({ ok: true, items: rows, total, page: pageNum, pageSize: limit, track });
  } catch (e) {
    console.error("GET /public/ssc/question-bank error:", e);
    res.status(500).json({ error: "Failed to fetch SSC question bank" });
  }
});

// GET /v1/public/ssc/exam-templates — list active SSC templates with sections
router.get("/public/ssc/exam-templates", async (req, res) => {
  try {
    const { family } = req.query as Record<string, string>;
    const conditions = [eq(examTemplates.isActive, true)];
    if (family) conditions.push(eq(examTemplates.examFamily, family));
    else conditions.push(sql`${examTemplates.examFamily} IN ('SSC_CGL','SSC_CHSL')`);

    const templates = await db.select().from(examTemplates)
      .where(and(...conditions))
      .orderBy(asc(examTemplates.examFamily), asc(examTemplates.tier), asc(examTemplates.name));

    if (templates.length === 0) {
      res.json({ ok: true, items: [] });
      return;
    }

    const ids = templates.map((t) => t.id);
    const sections = await db.select().from(examTemplateSections)
      .where(sql`${examTemplateSections.templateId} = ANY(ARRAY[${sql.join(ids.map((id) => sql`${id}::uuid`), sql`, `)}])`)
      .orderBy(asc(examTemplateSections.templateId), asc(examTemplateSections.sortOrder));

    const byTemplate = new Map<string, typeof sections>();
    for (const s of sections) {
      const list = byTemplate.get(s.templateId) ?? [];
      list.push(s);
      byTemplate.set(s.templateId, list);
    }

    const items = templates.map((t) => ({
      id: t.id,
      code: t.code,
      name: t.name,
      examFamily: t.examFamily,
      tier: t.tier,
      totalDurationMinutes: t.totalDurationMinutes,
      marksPerCorrect: t.marksPerCorrect,
      negativeMarks: t.negativeMarks,
      description: t.description,
      sections: (byTemplate.get(t.id) ?? []).map((s) => ({
        id: s.id, name: s.name, subject: s.subject,
        questionCount: s.questionCount, durationMinutes: s.durationMinutes,
      })),
      totalQuestions: (byTemplate.get(t.id) ?? []).reduce((a, s) => a + s.questionCount, 0),
    }));

    res.json({ ok: true, items });
  } catch (e) {
    console.error("GET /public/ssc/exam-templates error:", e);
    res.status(500).json({ error: "Failed to fetch SSC exam templates" });
  }
});

export default router;

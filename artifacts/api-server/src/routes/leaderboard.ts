import { Router } from "express";
import { db } from "@workspace/db";
import { mockTestAttempts, mockTests, students, users } from "@workspace/db/schema";
import { eq, and, gte, desc, sql } from "drizzle-orm";

const router = Router();

function maskName(name: string | null | undefined): string {
  if (!name) return "Anonymous";
  return name
    .split(/\s+/)
    .map((p, i) =>
      i === 0
        ? `${p[0]?.toUpperCase()}.`
        : `${p[0]?.toUpperCase() ?? ""}${".".repeat(Math.max(0, p.length - 1))}`
    )
    .join(" ")
    .trim() || "Anonymous";
}

router.get("/leaderboard", async (_req, res) => {
  try {
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const rows = await db
      .select({
        studentId: mockTestAttempts.studentId,
        score: mockTestAttempts.score,
        maxScore: mockTestAttempts.maxScore,
        testTitle: mockTests.title,
        submittedAt: mockTestAttempts.submittedAt,
        studentName: users.name,
      })
      .from(mockTestAttempts)
      .innerJoin(mockTests, eq(mockTestAttempts.testId, mockTests.id))
      .leftJoin(students, eq(mockTestAttempts.studentId, students.id))
      .leftJoin(users, eq(students.userId, users.id))
      .where(
        and(
          eq(mockTestAttempts.isCompleted, true),
          gte(mockTestAttempts.submittedAt, weekStart),
          sql`${mockTestAttempts.studentId} is not null`
        )
      )
      .orderBy(desc(mockTestAttempts.score));

    type LeaderRow = {
      studentId: string;
      maskedName: string;
      pct: number;
      score: number;
      maxScore: number;
      testTitle: string;
    };
    const bestByStudent = new Map<string, LeaderRow>();
    for (const r of rows) {
      if (!r.studentId || !r.maxScore) continue;
      const pct = ((r.score ?? 0) / r.maxScore) * 100;
      const prev = bestByStudent.get(r.studentId);
      if (!prev || pct > prev.pct) {
        bestByStudent.set(r.studentId, {
          studentId: r.studentId,
          maskedName: maskName(r.studentName),
          pct,
          score: r.score ?? 0,
          maxScore: r.maxScore,
          testTitle: r.testTitle,
        });
      }
    }

    const leaderboard = Array.from(bestByStudent.values())
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 20);

    res.json({ ok: true, data: leaderboard });
  } catch (e) {
    console.error("GET /leaderboard error:", e);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

export default router;

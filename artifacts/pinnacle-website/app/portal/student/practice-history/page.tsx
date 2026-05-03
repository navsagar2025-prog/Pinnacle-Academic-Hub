import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { mockTests, mockTestAttempts, students } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { Trophy, TrendingUp, Clock, ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Practice History — Student Portal" };

export default async function PracticeHistoryPage() {
  const user = await requirePortalRole("student");

  const [student] = await db.select({ id: students.id })
    .from(students).where(and(eq(students.userId, user.id), eq(students.isActive, true))).limit(1);

  const attempts = student ? await db
    .select({
      id: mockTestAttempts.id,
      testId: mockTestAttempts.testId,
      score: mockTestAttempts.score,
      maxScore: mockTestAttempts.maxScore,
      correctCount: mockTestAttempts.correctCount,
      wrongCount: mockTestAttempts.wrongCount,
      attemptedCount: mockTestAttempts.attemptedCount,
      totalQuestions: mockTestAttempts.totalQuestions,
      timeSpentSeconds: mockTestAttempts.timeSpentSeconds,
      submittedAt: mockTestAttempts.submittedAt,
      isCompleted: mockTestAttempts.isCompleted,
      testTitle: mockTests.title,
      testSubject: mockTests.subject,
      testExamType: mockTests.examType,
    })
    .from(mockTestAttempts)
    .leftJoin(mockTests, eq(mockTestAttempts.testId, mockTests.id))
    .where(and(eq(mockTestAttempts.studentId, student.id), eq(mockTestAttempts.isCompleted, true)))
    .orderBy(desc(mockTestAttempts.submittedAt)) : [];

  const totalAttempts = attempts.length;
  const avgPercentage = totalAttempts > 0
    ? Math.round(attempts.reduce((sum, a) => sum + (a.maxScore > 0 ? (a.score / a.maxScore) * 100 : 0), 0) / totalAttempts)
    : 0;
  const totalTimeMin = Math.round(attempts.reduce((sum, a) => sum + a.timeSpentSeconds, 0) / 60);
  const bestScore = attempts.reduce((best, a) => {
    const pct = a.maxScore > 0 ? (a.score / a.maxScore) * 100 : 0;
    return pct > best ? pct : best;
  }, 0);

  const trend = attempts.slice(0, 10).reverse();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Practice History</h1>
        <p className="text-slate-500 text-sm mt-1">All your past mock test attempts and progress over time</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card border-l-4 border-l-[var(--color-gold)]">
          <Trophy size={16} className="text-[var(--color-gold)] mb-1" />
          <div className="text-2xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">{totalAttempts}</div>
          <div className="text-xs text-slate-500">Tests Taken</div>
        </div>
        <div className="card border-l-4 border-l-[var(--color-teal)]">
          <TrendingUp size={16} className="text-[var(--color-teal)] mb-1" />
          <div className="text-2xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">{avgPercentage}%</div>
          <div className="text-xs text-slate-500">Avg Score</div>
        </div>
        <div className="card border-l-4 border-l-[var(--color-maroon)]">
          <Sparkles size={16} className="text-[var(--color-maroon)] mb-1" />
          <div className="text-2xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">{Math.round(bestScore)}%</div>
          <div className="text-xs text-slate-500">Best Score</div>
        </div>
        <div className="card border-l-4 border-l-blue-400">
          <Clock size={16} className="text-blue-500 mb-1" />
          <div className="text-2xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">{totalTimeMin}m</div>
          <div className="text-xs text-slate-500">Time Practiced</div>
        </div>
      </div>

      {trend.length >= 2 && (
        <div className="card">
          <h2 className="font-bold text-[var(--color-navy)] mb-4 font-[family-name:var(--font-playfair)]">Score Trend (last 10)</h2>
          <div className="flex items-end gap-1.5 h-32">
            {trend.map((a) => {
              const pct = a.maxScore > 0 ? (a.score / a.maxScore) * 100 : 0;
              return (
                <div key={a.id} className="flex-1 flex flex-col items-center gap-1 group" title={`${a.testTitle}: ${Math.round(pct)}%`}>
                  <div className="text-[9px] text-slate-400 font-bold">{Math.round(pct)}</div>
                  <div className={`w-full rounded-t transition-all ${
                    pct >= 75 ? "bg-[var(--color-teal)]" : pct >= 50 ? "bg-[var(--color-gold)]" : "bg-[var(--color-maroon)]"
                  } group-hover:opacity-80`} style={{ height: `${Math.max(pct, 3)}%` }} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h2 className="font-bold text-[var(--color-navy)] mb-3 font-[family-name:var(--font-playfair)] text-lg">All Attempts</h2>
        {attempts.length === 0 ? (
          <div className="card text-center py-10 text-slate-400">
            <Sparkles size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">You haven&apos;t completed any mock tests yet.</p>
            <Link href="/portal/student/mock-tests" className="inline-block mt-3 text-[var(--color-teal)] text-sm font-semibold hover:underline">
              Browse available tests →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {attempts.map((a) => {
              const pct = a.maxScore > 0 ? Math.round((a.score / a.maxScore) * 100) : 0;
              return (
                <Link key={a.id} href={`/portal/student/mock-tests/${a.testId}/result/${a.id}`}
                  className="card hover:shadow-elevated transition-all flex items-center justify-between gap-3 group">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-[var(--color-navy)] line-clamp-1">{a.testTitle ?? "Test"}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {a.testSubject} · {a.testExamType} · {a.submittedAt && new Date(a.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-[var(--color-navy)] text-sm">
                      {a.score}<span className="text-xs text-slate-400">/{a.maxScore}</span>
                    </div>
                    <div className={`text-xs font-semibold ${pct >= 75 ? "text-[var(--color-teal)]" : pct >= 50 ? "text-[var(--color-gold)]" : "text-[var(--color-maroon)]"}`}>
                      {pct}%
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-[var(--color-teal)] flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { mockTests, mockTestQuestions, mockTestAttempts, students } from "@workspace/db/schema";
import { eq, and, or, isNull, desc, sql } from "drizzle-orm";
import { Sparkles, Clock, FileQuestion, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Mock Tests — Student Portal" };

export default async function StudentMockTestsPage() {
  const dbUser = await requirePortalRole("student");

  const [enrollment] = await db
    .select({ studentId: students.id, batchId: students.batchId })
    .from(students)
    .where(and(eq(students.userId, dbUser.id), eq(students.isActive, true)))
    .limit(1);

  const audienceFilter = enrollment?.batchId
    ? or(eq(mockTests.batchId, enrollment.batchId), isNull(mockTests.batchId))
    : isNull(mockTests.batchId);

  const tests = await db
    .select({
      id: mockTests.id,
      title: mockTests.title,
      subject: mockTests.subject,
      examType: mockTests.examType,
      durationMinutes: mockTests.durationMinutes,
      marksPerQuestion: mockTests.marksPerQuestion,
      questionCount: sql<number>`(select count(*)::int from ${mockTestQuestions} where ${mockTestQuestions.testId} = ${mockTests.id})`,
    })
    .from(mockTests)
    .where(and(eq(mockTests.isPublished, true), audienceFilter))
    .orderBy(desc(mockTests.createdAt));

  const myAttempts = enrollment?.studentId
    ? await db
        .select({
          id: mockTestAttempts.id,
          testId: mockTestAttempts.testId,
          score: mockTestAttempts.score,
          maxScore: mockTestAttempts.maxScore,
          submittedAt: mockTestAttempts.submittedAt,
          isCompleted: mockTestAttempts.isCompleted,
        })
        .from(mockTestAttempts)
        .where(eq(mockTestAttempts.studentId, enrollment.studentId))
        .orderBy(desc(mockTestAttempts.startedAt))
    : [];

  const lastAttemptByTest = new Map<string, typeof myAttempts[number]>();
  for (const a of myAttempts) {
    if (!lastAttemptByTest.has(a.testId)) lastAttemptByTest.set(a.testId, a);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Mock Tests</h1>
        <p className="text-slate-500 text-sm mt-1">
          {tests.length} test{tests.length === 1 ? "" : "s"} available · Timed MCQs with auto-scoring
        </p>
      </div>

      {!enrollment && (
        <div className="card bg-amber-50 border border-amber-100 flex items-start gap-3">
          <AlertCircle size={17} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-amber-800 text-sm">Your enrollment is pending. Once enrolled, you&apos;ll see batch-specific tests here.</p>
        </div>
      )}

      {tests.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          <Sparkles size={32} className="mx-auto mb-3 opacity-30" />
          <p>No tests available yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tests.map((t) => {
            const last = lastAttemptByTest.get(t.id);
            const taken = last?.isCompleted;
            return (
              <div key={t.id} className="card hover:shadow-elevated transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)] line-clamp-2">{t.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{t.subject} · {t.examType}</p>
                  </div>
                  {taken && (
                    <span className="badge text-[10px] uppercase bg-[var(--color-teal)]/10 text-[var(--color-teal)]">
                      <CheckCircle2 size={10} className="inline mr-0.5" />Done
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-slate-100 text-xs mb-3">
                  <div className="text-center">
                    <div className="font-bold text-[var(--color-navy)] flex items-center justify-center gap-1">
                      <FileQuestion size={12} />{t.questionCount ?? 0}
                    </div>
                    <div className="text-slate-400 mt-0.5">Questions</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-[var(--color-navy)] flex items-center justify-center gap-1">
                      <Clock size={12} />{t.durationMinutes}m
                    </div>
                    <div className="text-slate-400 mt-0.5">Duration</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-[var(--color-navy)]">
                      {((t.questionCount ?? 0) * t.marksPerQuestion)}
                    </div>
                    <div className="text-slate-400 mt-0.5">Max Marks</div>
                  </div>
                </div>
                {taken ? (
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm">
                      <span className="text-slate-500">Last score: </span>
                      <span className="font-bold text-[var(--color-navy)]">{last.score}/{last.maxScore}</span>
                    </div>
                    <Link href={`/portal/student/mock-tests/${t.id}/result/${last.id}`}
                      className="text-xs text-[var(--color-teal)] font-semibold hover:underline">
                      View Report →
                    </Link>
                  </div>
                ) : (
                  <Link href={`/portal/student/mock-tests/${t.id}/take`}
                    className="block w-full text-center btn-gold py-2 text-sm">
                    Start Test
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

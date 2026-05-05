import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { mockTests, mockTestQuestions, mockTestAttempts, students } from "@workspace/db/schema";
import { eq, and, or, isNull, desc, sql } from "drizzle-orm";
import { Sparkles, AlertCircle } from "lucide-react";
import { StudentTestCard } from "./StudentTestCard";

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
      scheduledStart: mockTests.scheduledStart,
      scheduledEnd: mockTests.scheduledEnd,
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
            return (
              <StudentTestCard
                key={t.id}
                test={{
                  id: t.id,
                  title: t.title,
                  subject: t.subject,
                  examType: t.examType ?? "Mixed",
                  durationMinutes: t.durationMinutes,
                  marksPerQuestion: t.marksPerQuestion,
                  questionCount: t.questionCount ?? 0,
                  scheduledStart: t.scheduledStart ? t.scheduledStart.toISOString() : null,
                  scheduledEnd: t.scheduledEnd ? t.scheduledEnd.toISOString() : null,
                }}
                lastAttempt={last ? { id: last.id, score: last.score, maxScore: last.maxScore, isCompleted: last.isCompleted } : null}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

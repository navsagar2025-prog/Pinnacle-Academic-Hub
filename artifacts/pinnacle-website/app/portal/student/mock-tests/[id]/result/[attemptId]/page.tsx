import { db } from "@workspace/db";
import { mockTests, mockTestQuestions, mockTestAttempts, mockTestAnswers, students } from "@workspace/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Trophy, Target, Clock, CheckCircle2, ChevronLeft } from "lucide-react";
import { requirePortalRole } from "@/lib/server/portal-auth";
import { QuestionReview } from "./QuestionReview";

export const metadata = { title: "Test Result — Student Portal" };

export default async function ResultPage({ params }: { params: Promise<{ id: string; attemptId: string }> }) {
  const dbUser = await requirePortalRole("student");
  const { id, attemptId } = await params;

  // Resolve the current student's record so we can scope the attempt to them.
  const [enrollment] = await db
    .select({ studentId: students.id })
    .from(students)
    .where(and(eq(students.userId, dbUser.id), eq(students.isActive, true)))
    .limit(1);
  if (!enrollment) notFound();

  // Scope the attempt strictly to the current student + the URL test id.
  const [attempt] = await db
    .select()
    .from(mockTestAttempts)
    .where(and(
      eq(mockTestAttempts.id, attemptId),
      eq(mockTestAttempts.testId, id),
      eq(mockTestAttempts.studentId, enrollment.studentId),
    ))
    .limit(1);
  if (!attempt) notFound();

  // Solutions/answers are only revealed for completed (graded) attempts.
  // Send the student back to the take page if the attempt is still in progress.
  if (!attempt.isCompleted) {
    redirect(`/portal/student/mock-tests/${id}/take`);
  }

  const [test] = await db.select().from(mockTests).where(eq(mockTests.id, id)).limit(1);
  if (!test) notFound();

  const questions = await db.select().from(mockTestQuestions)
    .where(eq(mockTestQuestions.testId, id))
    .orderBy(asc(mockTestQuestions.questionNumber));

  const userAnswers = await db.select().from(mockTestAnswers).where(eq(mockTestAnswers.attemptId, attemptId));
  const answerByQ = new Map(userAnswers.map((a) => [a.questionId, a]));

  const accuracy = attempt.attemptedCount > 0 ? Math.round((attempt.correctCount / attempt.attemptedCount) * 100) : 0;
  const percentage = attempt.maxScore > 0 ? Math.round((attempt.score / attempt.maxScore) * 100) : 0;
  const timeMin = Math.floor(attempt.timeSpentSeconds / 60);
  const timeSec = attempt.timeSpentSeconds % 60;

  // Topic-wise analysis
  const topicMap = new Map<string, { total: number; correct: number; wrong: number; skipped: number }>();
  for (const q of questions) {
    const topic = q.topic ?? "General";
    if (!topicMap.has(topic)) topicMap.set(topic, { total: 0, correct: 0, wrong: 0, skipped: 0 });
    const s = topicMap.get(topic)!;
    s.total++;
    const ans = answerByQ.get(q.id);
    if (!ans?.selectedOption) s.skipped++;
    else if (ans.isCorrect) s.correct++;
    else s.wrong++;
  }
  const topicRows = Array.from(topicMap.entries()).map(([topic, s]) => ({
    topic, ...s, pct: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
  })).sort((a, b) => b.pct - a.pct);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/portal/student/mock-tests" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[var(--color-teal)] mb-2">
          <ChevronLeft size={14} /> All tests
        </Link>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Test Report</h1>
        <p className="text-slate-500 text-sm mt-1">{test.title}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card border-l-4 border-l-[var(--color-gold)]">
          <Trophy size={18} className="text-[var(--color-gold)] mb-1" />
          <div className="text-2xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">
            {attempt.score}<span className="text-sm text-slate-400">/{attempt.maxScore}</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Score · {percentage}%</div>
        </div>
        <div className="card border-l-4 border-l-[var(--color-teal)]">
          <Target size={18} className="text-[var(--color-teal)] mb-1" />
          <div className="text-2xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">{accuracy}%</div>
          <div className="text-xs text-slate-500 mt-1">Accuracy</div>
        </div>
        <div className="card border-l-4 border-l-blue-400">
          <CheckCircle2 size={18} className="text-blue-500 mb-1" />
          <div className="text-2xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">
            {attempt.correctCount}<span className="text-sm text-slate-400">/{attempt.totalQuestions}</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Correct · {attempt.wrongCount} wrong · {attempt.totalQuestions - attempt.attemptedCount} skipped</div>
        </div>
        <div className="card border-l-4 border-l-slate-400">
          <Clock size={18} className="text-slate-500 mb-1" />
          <div className="text-2xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">{timeMin}<span className="text-sm text-slate-400">m {timeSec}s</span></div>
          <div className="text-xs text-slate-500 mt-1">Time spent · of {test.durationMinutes}m</div>
        </div>
      </div>

      {/* Topic-wise analysis */}
      {topicRows.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-[var(--color-navy)] mb-4 font-[family-name:var(--font-playfair)]">Topic-wise Analysis</h2>
          <div className="space-y-3">
            {topicRows.map((row) => (
              <div key={row.topic}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-[var(--color-navy)]">{row.topic}</span>
                  <span className="text-xs text-slate-500">
                    {row.correct}/{row.total} correct · {row.pct}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full transition-all ${
                    row.pct >= 75 ? "bg-[var(--color-teal)]"
                    : row.pct >= 50 ? "bg-[var(--color-gold)]"
                    : "bg-[var(--color-maroon)]"
                  }`} style={{ width: `${row.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-question review with filters and solutions */}
      <QuestionReview
        questions={questions.map((q) => {
          const ans = answerByQ.get(q.id);
          return {
            id: q.id,
            questionNumber: q.questionNumber,
            topic: q.topic,
            questionText: q.questionText,
            imageUrl: q.imageUrl,
            optionA: q.optionA, optionB: q.optionB, optionC: q.optionC, optionD: q.optionD,
            optionAImageUrl: q.optionAImageUrl,
            optionBImageUrl: q.optionBImageUrl,
            optionCImageUrl: q.optionCImageUrl,
            optionDImageUrl: q.optionDImageUrl,
            correctOption: q.correctOption,
            explanation: q.explanation,
            explanationImageUrl: q.explanationImageUrl,
            selectedOption: ans?.selectedOption ?? null,
            isCorrect: ans?.isCorrect ?? null,
            marksAwarded: ans?.marksAwarded ?? null,
          };
        })}
      />
    </div>
  );
}

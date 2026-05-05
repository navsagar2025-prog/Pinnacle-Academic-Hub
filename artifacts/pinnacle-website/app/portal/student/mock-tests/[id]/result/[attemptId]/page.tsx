import { db } from "@workspace/db";
import { mockTests, mockTestQuestions, mockTestAttempts, mockTestAnswers } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Trophy, Target, Clock, CheckCircle2, XCircle, MinusCircle, ChevronLeft } from "lucide-react";
import { RichText } from "@/components/rich/RichText";

export const metadata = { title: "Test Result — Student Portal" };

export default async function ResultPage({ params }: { params: Promise<{ id: string; attemptId: string }> }) {
  const { id, attemptId } = await params;

  const [attempt] = await db.select().from(mockTestAttempts).where(eq(mockTestAttempts.id, attemptId)).limit(1);
  if (!attempt || attempt.testId !== id) notFound();

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

      {/* Per-question review */}
      <div className="card">
        <h2 className="font-bold text-[var(--color-navy)] mb-4 font-[family-name:var(--font-playfair)]">Question Review</h2>
        <ol className="space-y-4">
          {questions.map((q) => {
            const ans = answerByQ.get(q.id);
            const sel = ans?.selectedOption;
            const wasSkipped = !sel;
            const wasCorrect = ans?.isCorrect === true;
            return (
              <li key={q.id} className="border border-slate-100 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Q{q.questionNumber}{q.topic && ` · ${q.topic}`}</span>
                    {wasSkipped ? <span className="text-xs text-slate-400 inline-flex items-center gap-1"><MinusCircle size={12} />Skipped</span>
                     : wasCorrect ? <span className="text-xs text-[var(--color-teal)] inline-flex items-center gap-1"><CheckCircle2 size={12} />Correct (+{ans?.marksAwarded})</span>
                     : <span className="text-xs text-[var(--color-maroon)] inline-flex items-center gap-1"><XCircle size={12} />Wrong ({ans?.marksAwarded})</span>}
                  </div>
                </div>
                <div className="font-medium text-[var(--color-navy)] text-sm mb-2">
                  <RichText>{q.questionText}</RichText>
                </div>
                {q.imageUrl && (
                  <img src={q.imageUrl} alt="Question diagram"
                    className="max-h-56 rounded-lg border border-slate-100 mb-3 mx-auto block" />
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {(["A", "B", "C", "D"] as const).map((opt) => {
                    const text = { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD }[opt];
                    const optImg = { A: q.optionAImageUrl, B: q.optionBImageUrl, C: q.optionCImageUrl, D: q.optionDImageUrl }[opt];
                    const isCorrect = opt === q.correctOption;
                    const isSelected = sel === opt;
                    return (
                      <div key={opt} className={`text-xs p-2 rounded-lg ${
                        isCorrect ? "bg-[var(--color-teal)]/10 text-[var(--color-teal)] font-semibold"
                        : isSelected ? "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)] font-semibold"
                        : "text-slate-600"
                      }`}>
                        <span className="font-mono mr-1.5">{opt}.</span>
                        {text && <RichText>{text}</RichText>}
                        {optImg && <img src={optImg} alt={`Option ${opt}`} className="max-h-24 rounded border border-slate-100 mt-1" />}
                        {isCorrect && " ✓"}
                        {isSelected && !isCorrect && " ← your answer"}
                      </div>
                    );
                  })}
                </div>
                {(q.explanation || q.explanationImageUrl) && (
                  <div className="text-xs text-slate-600 mt-3 bg-blue-50 rounded-lg p-2">
                    <span className="font-semibold text-blue-800">Explanation: </span>
                    {q.explanation && <RichText>{q.explanation}</RichText>}
                    {q.explanationImageUrl && (
                      <img src={q.explanationImageUrl} alt="Explanation"
                        className="max-h-56 rounded border border-blue-100 mt-2 mx-auto block bg-white" />
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

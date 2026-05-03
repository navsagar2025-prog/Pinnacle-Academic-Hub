import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { mockTests, mockTestQuestions } from "@workspace/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { ArrowLeft, CheckCircle2, BookOpen } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata = { title: "Question Bank — Detail" };

export default async function QuestionBankDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePortalRole("student");
  const { id } = await params;

  const [test] = await db.select().from(mockTests)
    .where(and(eq(mockTests.id, id), eq(mockTests.isPublished, true))).limit(1);
  if (!test) notFound();

  const questions = await db.select().from(mockTestQuestions)
    .where(eq(mockTestQuestions.testId, id))
    .orderBy(asc(mockTestQuestions.questionNumber));

  return (
    <div className="space-y-4 max-w-4xl">
      <Link href="/portal/student/question-bank" className="text-xs text-[var(--color-teal)] font-semibold inline-flex items-center gap-1 hover:underline">
        <ArrowLeft size={12} /> Back to Question Bank
      </Link>
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">{test.title}</h1>
        <p className="text-slate-500 text-sm mt-1">{test.subject} · {test.examType} · {questions.length} questions · Browse mode (no scoring)</p>
      </div>

      <div className="space-y-3">
        {questions.map((q) => {
          const correctText = q.correctOption === "A" ? q.optionA : q.correctOption === "B" ? q.optionB : q.correctOption === "C" ? q.optionC : q.optionD;
          return (
            <div key={q.id} className="card">
              <div className="flex items-start gap-2 mb-3">
                <span className="text-xs font-bold text-white bg-[var(--color-navy)] rounded px-2 py-0.5 flex-shrink-0 mt-0.5">Q{q.questionNumber}</span>
                <p className="text-sm text-slate-800 flex-1">{q.questionText}</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-2 text-sm">
                {(["A", "B", "C", "D"] as const).map((opt) => {
                  const text = opt === "A" ? q.optionA : opt === "B" ? q.optionB : opt === "C" ? q.optionC : q.optionD;
                  const isCorrect = q.correctOption === opt;
                  return (
                    <div key={opt} className={`px-3 py-2 rounded-lg border text-xs flex items-start gap-2 ${
                      isCorrect ? "bg-[var(--color-teal)]/10 border-[var(--color-teal)] text-[var(--color-teal)] font-semibold" : "bg-slate-50 border-slate-200 text-slate-700"
                    }`}>
                      <span className="font-bold">{opt}.</span><span className="flex-1">{text}</span>
                      {isCorrect && <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" />}
                    </div>
                  );
                })}
              </div>
              {(q.topic || q.explanation) && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                  {q.topic && <div className="text-xs text-slate-500"><BookOpen size={11} className="inline mr-1" />Topic: <span className="font-semibold text-slate-700">{q.topic}</span></div>}
                  {q.explanation && <div className="text-xs text-slate-600 bg-slate-50 rounded p-2"><span className="font-semibold text-[var(--color-navy)]">Explanation:</span> {q.explanation}</div>}
                </div>
              )}
            </div>
          );
        })}
        {questions.length === 0 && <div className="card text-center text-slate-400 py-8 text-sm">No questions yet.</div>}
      </div>
    </div>
  );
}

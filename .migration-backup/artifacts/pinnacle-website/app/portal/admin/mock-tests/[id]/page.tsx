import { db } from "@workspace/db";
import { mockTests, mockTestQuestions, mockTestAttempts, mockTestSections } from "@workspace/db/schema";
import { eq, and, asc, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Trash2 } from "lucide-react";
import { ManageTestClient } from "./ManageTestClient";
import { QuestionAnalytics } from "@/components/portal/QuestionAnalytics";
import { getQuestionAnalytics } from "@/lib/server/question-analytics";

export const metadata = { title: "Manage Test — Admin Panel" };

export default async function AdminMockTestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [test] = await db.select().from(mockTests).where(eq(mockTests.id, id)).limit(1);
  if (!test) notFound();

  const questions = await db.select().from(mockTestQuestions)
    .where(eq(mockTestQuestions.testId, id))
    .orderBy(asc(mockTestQuestions.questionNumber));

  const sections = await db.select().from(mockTestSections)
    .where(eq(mockTestSections.testId, id))
    .orderBy(asc(mockTestSections.ordering), asc(mockTestSections.createdAt));

  const [{ attempts }] = await db.select({ attempts: sql<number>`count(*)::int` })
    .from(mockTestAttempts).where(eq(mockTestAttempts.testId, id));

  const [{ completedCount }] = await db.select({ completedCount: sql<number>`count(*)::int` })
    .from(mockTestAttempts)
    .where(and(eq(mockTestAttempts.testId, id), eq(mockTestAttempts.isCompleted, true)));

  const questionAnalytics = completedCount > 0 ? await getQuestionAnalytics(id) : [];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/portal/admin/mock-tests" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[var(--color-teal)] mb-2">
          <ChevronLeft size={14} /> All tests
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">{test.title}</h1>
            <p className="text-slate-500 text-sm mt-1">
              {test.subject} · {test.examType} · {test.durationMinutes} min · {test.marksPerQuestion} marks/q · −{test.negativeMarkingPercent}% negative · {attempts} attempt{attempts === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </div>

      <ManageTestClient
        test={{
          id: test.id,
          title: test.title,
          isPublished: test.isPublished,
          isPublic: test.isPublic,
        }}
        sections={sections.map((s) => ({ id: s.id, name: s.name, ordering: s.ordering, instructions: s.instructions }))}
      />

      {completedCount > 0 && questionAnalytics.length > 0 && (
        <QuestionAnalytics rows={questionAnalytics} testTitle={test.title} />
      )}

      <div className="card">
        <h2 className="font-bold text-[var(--color-navy)] mb-4 font-[family-name:var(--font-playfair)]">
          Questions ({questions.length})
        </h2>
        {questions.length === 0 ? (
          <p className="text-sm text-slate-400 py-3">No questions yet. Add your first question below.</p>
        ) : (
          (() => {
            const sectionMap = new Map(sections.map((s) => [s.id, s.name]));
            const groups: { name: string; items: typeof questions }[] = [];
            for (const s of sections) groups.push({ name: s.name, items: [] });
            const general: typeof questions = [];
            for (const q of questions) {
              if (q.sectionId && sectionMap.has(q.sectionId)) {
                groups.find((g) => g.name === sectionMap.get(q.sectionId!))!.items.push(q);
              } else general.push(q);
            }
            const finalGroups = sections.length > 0
              ? [...groups, ...(general.length > 0 ? [{ name: "General", items: general }] : [])]
              : [{ name: "", items: questions }];
            return (
        <div className="space-y-6">
          {finalGroups.map((g) => (
            <div key={g.name || "_all"}>
              {g.name && (
                <div className="text-xs uppercase tracking-wide text-[var(--color-teal)] font-bold mb-2">
                  {g.name} <span className="text-slate-400 font-normal normal-case">· {g.items.length} question{g.items.length === 1 ? "" : "s"}</span>
                </div>
              )}
              <ol className="space-y-4">
            {g.items.map((q) => (
              <li key={q.id} className="border border-slate-100 rounded-xl p-4 bg-[var(--color-slate-light)]/30">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="text-xs text-slate-400 mb-1">Q{q.questionNumber} {q.topic && `· ${q.topic}`}</div>
                    <p className="font-medium text-[var(--color-navy)] text-sm">{q.questionText}</p>
                  </div>
                  <DeleteQuestion testId={test.id} questionId={q.id} />
                </div>
                {q.questionType === "numerical" ? (
                  <div className="mt-2 text-xs bg-blue-50 border border-blue-100 rounded-lg p-2 inline-flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold text-[10px]">Numerical</span>
                    <span className="text-slate-600">Answer: <span className="font-mono font-semibold text-[var(--color-teal)]">{q.numericalAnswer ?? "—"}</span>{q.numericalTolerance ? <span className="text-slate-400"> ± {q.numericalTolerance}</span> : null}</span>
                  </div>
                ) : (
                  <>
                    {q.questionType === "multi" && (
                      <div className="mt-2 mb-1 text-[10px] inline-block px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-semibold">Multiple correct</div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
                      {(["A", "B", "C", "D"] as const).map((opt) => {
                        const text = { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD }[opt];
                        const correct = q.questionType === "multi"
                          ? (q.correctOptions ?? []).includes(opt)
                          : opt === q.correctOption;
                        return (
                          <div key={opt} className={`text-xs p-2 rounded-lg ${correct ? "bg-[var(--color-teal)]/10 text-[var(--color-teal)] font-semibold" : "text-slate-600"}`}>
                            <span className="font-mono mr-1.5">{opt}.</span>{text}{correct && " ✓"}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
                {q.explanation && <p className="text-xs text-slate-500 mt-2 italic">Explanation: {q.explanation}</p>}
              </li>
            ))}
              </ol>
            </div>
          ))}
        </div>
            );
          })()
        )}
      </div>
    </div>
  );
}

function DeleteQuestion({ testId, questionId }: { testId: string; questionId: string }) {
  return (
    <form action={async () => {
      "use server";
      const { db: dbInner } = await import("@workspace/db");
      const { mockTestQuestions: mq } = await import("@workspace/db/schema");
      const { eq: eqInner } = await import("drizzle-orm");
      const { revalidatePath } = await import("next/cache");
      await dbInner.delete(mq).where(eqInner(mq.id, questionId));
      revalidatePath(`/portal/admin/mock-tests/${testId}`);
    }}>
      <button type="submit" aria-label="Delete question" className="text-slate-400 hover:text-[var(--color-maroon)]">
        <Trash2 size={14} />
      </button>
    </form>
  );
}

import { db } from "@workspace/db";
import { mockTests, mockTestQuestions, mockTestAttempts } from "@workspace/db/schema";
import { eq, asc, sql } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Trash2 } from "lucide-react";
import { requirePortalRole } from "@/lib/server/portal-auth";
import { TeacherManageTestClient } from "./ManageTestClient";

export const metadata = { title: "Manage Test — Teacher Portal" };

export default async function TeacherMockTestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePortalRole("teacher");
  const { id } = await params;

  const [test] = await db.select().from(mockTests).where(eq(mockTests.id, id)).limit(1);
  if (!test) notFound();
  if (test.createdBy !== user.id) redirect("/portal/teacher/mock-tests");

  const questions = await db.select().from(mockTestQuestions)
    .where(eq(mockTestQuestions.testId, id))
    .orderBy(asc(mockTestQuestions.questionNumber));

  const [{ attempts }] = await db.select({ attempts: sql<number>`count(*)::int` })
    .from(mockTestAttempts).where(eq(mockTestAttempts.testId, id));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/portal/teacher/mock-tests" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[var(--color-teal)] mb-2">
          <ChevronLeft size={14} /> My tests
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

      <TeacherManageTestClient
        test={{
          id: test.id,
          title: test.title,
          isPublished: test.isPublished,
          isPublic: test.isPublic,
        }}
      />

      <div className="card">
        <h2 className="font-bold text-[var(--color-navy)] mb-4 font-[family-name:var(--font-playfair)]">
          Questions ({questions.length})
        </h2>
        {questions.length === 0 ? (
          <p className="text-sm text-slate-400 py-3">No questions yet. Add your first question below.</p>
        ) : (
          <ol className="space-y-4">
            {questions.map((q) => (
              <li key={q.id} className="border border-slate-100 rounded-xl p-4 bg-[var(--color-slate-light)]/30">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="text-xs text-slate-400 mb-1">Q{q.questionNumber} {q.topic && `· ${q.topic}`}</div>
                    <p className="font-medium text-[var(--color-navy)] text-sm">{q.questionText}</p>
                  </div>
                  <TeacherDeleteQuestion testId={test.id} questionId={q.id} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
                  {(["A", "B", "C", "D"] as const).map((opt) => {
                    const text = { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD }[opt];
                    const correct = opt === q.correctOption;
                    return (
                      <div key={opt} className={`text-xs p-2 rounded-lg ${correct ? "bg-[var(--color-teal)]/10 text-[var(--color-teal)] font-semibold" : "text-slate-600"}`}>
                        <span className="font-mono mr-1.5">{opt}.</span>{text}{correct && " ✓"}
                      </div>
                    );
                  })}
                </div>
                {q.explanation && <p className="text-xs text-slate-500 mt-2 italic">Explanation: {q.explanation}</p>}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function TeacherDeleteQuestion({ testId, questionId }: { testId: string; questionId: string }) {
  return (
    <form action={async () => {
      "use server";
      const { db: dbInner } = await import("@workspace/db");
      const { mockTests: mt, mockTestQuestions: mq } = await import("@workspace/db/schema");
      const { eq: eqInner, and: andInner } = await import("drizzle-orm");
      const { revalidatePath } = await import("next/cache");
      const { requirePortalRole: rpr } = await import("@/lib/server/portal-auth");
      const user = await rpr("teacher");
      const [test] = await dbInner.select({ createdBy: mt.createdBy }).from(mt).where(eqInner(mt.id, testId)).limit(1);
      if (!test || test.createdBy !== user.id) return;
      await dbInner.delete(mq).where(andInner(eqInner(mq.id, questionId), eqInner(mq.testId, testId)));
      revalidatePath(`/portal/teacher/mock-tests/${testId}`);
    }}>
      <button type="submit" aria-label="Delete question" className="text-slate-400 hover:text-[var(--color-maroon)]">
        <Trash2 size={14} />
      </button>
    </form>
  );
}

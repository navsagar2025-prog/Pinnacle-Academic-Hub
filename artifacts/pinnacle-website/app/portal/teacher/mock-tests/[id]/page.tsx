import { db } from "@workspace/db";
import { mockTests, mockTestQuestions, mockTestAttempts, mockTestAnswers, mockTestSections, students, users } from "@workspace/db/schema";
import { eq, asc, sql, and, desc } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Trash2 } from "lucide-react";
import { requirePortalRole } from "@/lib/server/portal-auth";
import { TeacherManageTestClient } from "./ManageTestClient";
import { TestAnalytics } from "./TestAnalytics";
import { QuestionAnalytics } from "@/components/portal/QuestionAnalytics";
import { getQuestionAnalytics } from "@/lib/server/question-analytics";
import { RichText } from "@/components/rich/RichText";

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

  const sections = await db.select().from(mockTestSections)
    .where(eq(mockTestSections.testId, id))
    .orderBy(asc(mockTestSections.ordering), asc(mockTestSections.createdAt));

  const allAttempts = await db.select({
    id: mockTestAttempts.id,
    studentId: mockTestAttempts.studentId,
    guestName: mockTestAttempts.guestName,
    score: mockTestAttempts.score,
    maxScore: mockTestAttempts.maxScore,
    correctCount: mockTestAttempts.correctCount,
    wrongCount: mockTestAttempts.wrongCount,
    attemptedCount: mockTestAttempts.attemptedCount,
    totalQuestions: mockTestAttempts.totalQuestions,
    timeSpentSeconds: mockTestAttempts.timeSpentSeconds,
    isCompleted: mockTestAttempts.isCompleted,
    submittedAt: mockTestAttempts.submittedAt,
    studentName: users.name,
  })
    .from(mockTestAttempts)
    .leftJoin(students, eq(mockTestAttempts.studentId, students.id))
    .leftJoin(users, eq(students.userId, users.id))
    .where(eq(mockTestAttempts.testId, id))
    .orderBy(desc(mockTestAttempts.submittedAt));

  const totalAttempts = allAttempts.length;
  const completedAttempts = allAttempts.filter((a) => a.isCompleted);
  const completedCount = completedAttempts.length;

  let averageScore = 0;
  let averagePercentage = 0;
  let highestScore = 0;
  let passRate = 0;
  let averageTimeMinutes = 0;

  const maxScore = test.marksPerQuestion * questions.length;

  if (completedCount > 0) {
    const totalScore = completedAttempts.reduce((s, a) => s + a.score, 0);
    averageScore = Math.round(totalScore / completedCount);
    highestScore = Math.max(...completedAttempts.map((a) => a.score));
    const percentages = completedAttempts.map((a) => {
      const attemptMax = a.maxScore > 0 ? a.maxScore : maxScore;
      return attemptMax > 0 ? (a.score / attemptMax) * 100 : 0;
    });
    averagePercentage = Math.round(percentages.reduce((s, p) => s + p, 0) / completedCount);
    const passThreshold = 0.4;
    const passing = completedAttempts.filter((a) => {
      const attemptMax = a.maxScore > 0 ? a.maxScore : maxScore;
      return attemptMax > 0 && a.score / attemptMax >= passThreshold;
    }).length;
    passRate = Math.round((passing / completedCount) * 100);
    const totalTime = completedAttempts.reduce((s, a) => s + a.timeSpentSeconds, 0);
    averageTimeMinutes = Math.round(totalTime / completedCount / 60);
  }

  let topicBreakdown: { topic: string; totalAnswered: number; correctCount: number; wrongCount: number; accuracy: number }[] = [];
  if (completedCount > 0) {
    const topicRows = await db.select({
      topic: mockTestQuestions.topic,
      totalAnswered: sql<number>`count(case when ${mockTestAnswers.selectedOption} is not null or ${mockTestAnswers.selectedOptions} is not null or ${mockTestAnswers.numericalResponse} is not null then 1 end)::int`,
      correctCount: sql<number>`count(case when ${mockTestAnswers.isCorrect} = true then 1 end)::int`,
      wrongCount: sql<number>`count(case when ${mockTestAnswers.isCorrect} = false then 1 end)::int`,
    })
      .from(mockTestAnswers)
      .innerJoin(mockTestQuestions, eq(mockTestAnswers.questionId, mockTestQuestions.id))
      .innerJoin(mockTestAttempts, eq(mockTestAnswers.attemptId, mockTestAttempts.id))
      .where(and(eq(mockTestAttempts.testId, id), eq(mockTestAttempts.isCompleted, true)))
      .groupBy(mockTestQuestions.topic)
      .orderBy(sql`count(case when ${mockTestAnswers.isCorrect} = true then 1 end)::float / nullif(count(case when ${mockTestAnswers.selectedOption} is not null or ${mockTestAnswers.selectedOptions} is not null or ${mockTestAnswers.numericalResponse} is not null then 1 end), 0) asc`);

    topicBreakdown = topicRows
      .filter((r) => r.topic && r.totalAnswered > 0)
      .map((r) => ({
        topic: r.topic!,
        totalAnswered: r.totalAnswered,
        correctCount: r.correctCount,
        wrongCount: r.wrongCount,
        accuracy: Math.round((r.correctCount / r.totalAnswered) * 100),
      }));
  }

  const questionAnalytics = completedCount > 0 ? await getQuestionAnalytics(id) : [];

  const studentAttempts = completedAttempts.map((a) => ({
    id: a.id,
    studentName: a.studentName || a.guestName || "Anonymous",
    score: a.score,
    maxScore: a.maxScore,
    correctCount: a.correctCount,
    wrongCount: a.wrongCount,
    attemptedCount: a.attemptedCount,
    totalQuestions: a.totalQuestions,
    timeSpentSeconds: a.timeSpentSeconds,
    submittedAt: a.submittedAt?.toISOString() ?? null,
  }));

  const attempts = totalAttempts;

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
            {test.scheduledStart && test.scheduledEnd && (
              <p className="text-xs text-[var(--color-teal)] mt-1 font-semibold">
                Scheduled: {new Date(test.scheduledStart).toLocaleString()} → {new Date(test.scheduledEnd).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>

      <TestAnalytics
        stats={{
          totalAttempts,
          completedAttempts: completedCount,
          averageScore,
          averagePercentage,
          maxScore,
          highestScore,
          passRate,
          averageTimeMinutes,
        }}
        topicBreakdown={topicBreakdown}
        studentAttempts={studentAttempts}
        testTitle={test.title}
      />

      {completedCount > 0 && questionAnalytics.length > 0 && (
        <QuestionAnalytics rows={questionAnalytics} testTitle={test.title} />
      )}

      <TeacherManageTestClient
        test={{
          id: test.id,
          title: test.title,
          isPublished: test.isPublished,
          isPublic: test.isPublic,
          scheduledStart: test.scheduledStart ? test.scheduledStart.toISOString() : null,
          scheduledEnd: test.scheduledEnd ? test.scheduledEnd.toISOString() : null,
          autoPublishAtStart: test.autoPublishAtStart,
        }}
        sections={sections.map((s) => ({ id: s.id, name: s.name, ordering: s.ordering, instructions: s.instructions }))}
      />

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
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-400 mb-1">Q{q.questionNumber} {q.topic && `· ${q.topic}`}</div>
                    <div className="font-medium text-[var(--color-navy)] text-sm">
                      <RichText>{q.questionText}</RichText>
                    </div>
                    {q.imageUrl && (
                      <img src={q.imageUrl} alt="" className="max-h-40 rounded border border-slate-200 mt-2" />
                    )}
                  </div>
                  <TeacherDeleteQuestion testId={test.id} questionId={q.id} />
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
                        const optImg = { A: q.optionAImageUrl, B: q.optionBImageUrl, C: q.optionCImageUrl, D: q.optionDImageUrl }[opt];
                        const correct = q.questionType === "multi"
                          ? (q.correctOptions ?? []).includes(opt)
                          : opt === q.correctOption;
                        return (
                          <div key={opt} className={`text-xs p-2 rounded-lg ${correct ? "bg-[var(--color-teal)]/10 text-[var(--color-teal)] font-semibold" : "text-slate-600"}`}>
                            <span className="font-mono mr-1.5">{opt}.</span>
                            {text && <RichText>{text}</RichText>}
                            {optImg && <img src={optImg} alt={`Option ${opt}`} className="max-h-20 rounded border border-slate-100 mt-1" />}
                            {correct && " ✓"}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
                {(q.explanation || q.explanationImageUrl) && (
                  <div className="text-xs text-slate-500 mt-2 italic">
                    Explanation: {q.explanation && <RichText>{q.explanation}</RichText>}
                    {q.explanationImageUrl && (
                      <img src={q.explanationImageUrl} alt="" className="max-h-32 rounded border border-slate-100 mt-1" />
                    )}
                  </div>
                )}
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

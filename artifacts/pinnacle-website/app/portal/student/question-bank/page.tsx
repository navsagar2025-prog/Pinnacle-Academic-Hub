import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { questionBank, questionBookmarks, questionAttempts, students } from "@workspace/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { Sparkles, Bookmark, CheckCircle2, Target, Clock, BarChart3 } from "lucide-react";
import Link from "next/link";
import { QuestionBankFilters } from "../../admin/question-bank/QuestionBankFilters";
import { WeakTopicsCard } from "@/components/portal/WeakTopicsCard";
import { getWeakTopics } from "@/lib/server/weak-topics";

export const metadata = { title: "Question Bank — Student Portal" };

const TYPE_LABEL: Record<string, string> = { mcq: "MCQ", short: "Short", long: "Long", numerical: "Numerical" };
const DIFF_COLOR: Record<string, string> = {
  easy: "bg-green-50 text-green-700",
  medium: "bg-amber-50 text-amber-700",
  hard: "bg-rose-50 text-rose-700",
};

export default async function StudentQuestionBankPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; difficulty?: string; type?: string; year?: string; examName?: string; pyq?: string; q?: string; bookmarked?: string; topic?: string }>;
}) {
  const user = await requirePortalRole("student");
  const sp = await searchParams;

  const [student] = await db.select({ id: students.id }).from(students)
    .where(and(eq(students.userId, user.id), eq(students.isActive, true))).limit(1);

  const all = await db.select().from(questionBank)
    .where(eq(questionBank.isPublished, true))
    .orderBy(desc(questionBank.createdAt))
    .limit(500);

  const myBookmarks = student
    ? await db.select({ id: questionBookmarks.questionId }).from(questionBookmarks).where(eq(questionBookmarks.studentId, student.id))
    : [];
  const bookmarkSet = new Set(myBookmarks.map((b) => b.id));

  type PerQ = { count: number; lastCorrect: boolean | null };
  const attemptByQ = new Map<string, PerQ>();
  let analytics: {
    overall: { total: number; correct: number; gradable: number; uniqueQuestions: number; totalSeconds: number };
    bySubject: Array<{ subject: string; total: number; correct: number; gradable: number }>;
    byDifficulty: Array<{ difficulty: string; total: number; correct: number; gradable: number }>;
  } | null = null;

  if (student) {
    const perQ = await db
      .select({
        questionId: questionAttempts.questionId,
        count: sql<number>`count(*)::int`,
        lastCorrect: sql<boolean | null>`(array_agg(${questionAttempts.isCorrect} order by ${questionAttempts.createdAt} desc))[1]`,
      })
      .from(questionAttempts)
      .where(eq(questionAttempts.studentId, student.id))
      .groupBy(questionAttempts.questionId);
    for (const r of perQ) attemptByQ.set(r.questionId, { count: r.count, lastCorrect: r.lastCorrect });

    const [overall] = await db
      .select({
        total: sql<number>`count(*)::int`,
        correct: sql<number>`count(*) filter (where ${questionAttempts.isCorrect} = true)::int`,
        gradable: sql<number>`count(*) filter (where ${questionAttempts.isCorrect} is not null)::int`,
        uniqueQuestions: sql<number>`count(distinct ${questionAttempts.questionId})::int`,
        totalSeconds: sql<number>`coalesce(sum(${questionAttempts.timeSpentSeconds}), 0)::int`,
      })
      .from(questionAttempts)
      .where(eq(questionAttempts.studentId, student.id));

    const bySubject = await db
      .select({
        subject: questionBank.subject,
        total: sql<number>`count(*)::int`,
        correct: sql<number>`count(*) filter (where ${questionAttempts.isCorrect} = true)::int`,
        gradable: sql<number>`count(*) filter (where ${questionAttempts.isCorrect} is not null)::int`,
      })
      .from(questionAttempts)
      .innerJoin(questionBank, eq(questionAttempts.questionId, questionBank.id))
      .where(eq(questionAttempts.studentId, student.id))
      .groupBy(questionBank.subject);

    const byDifficulty = await db
      .select({
        difficulty: questionBank.difficulty,
        total: sql<number>`count(*)::int`,
        correct: sql<number>`count(*) filter (where ${questionAttempts.isCorrect} = true)::int`,
        gradable: sql<number>`count(*) filter (where ${questionAttempts.isCorrect} is not null)::int`,
      })
      .from(questionAttempts)
      .innerJoin(questionBank, eq(questionAttempts.questionId, questionBank.id))
      .where(eq(questionAttempts.studentId, student.id))
      .groupBy(questionBank.difficulty);

    analytics = { overall, bySubject, byDifficulty };
  }

  let filtered = all.filter((q) => {
    if (sp.subject && sp.subject !== "All" && q.subject !== sp.subject) return false;
    if (sp.difficulty && q.difficulty !== sp.difficulty) return false;
    if (sp.type && q.questionType !== sp.type) return false;
    if (sp.year && q.year !== Number(sp.year)) return false;
    if (sp.examName && q.examName !== sp.examName) return false;
    if (sp.pyq === "1" && q.year == null) return false;
    if (sp.topic && (q.topic ?? "").toLowerCase() !== sp.topic.toLowerCase()) return false;
    if (sp.q) {
      const needle = sp.q.toLowerCase();
      if (!q.questionText.toLowerCase().includes(needle) && !(q.topic ?? "").toLowerCase().includes(needle)) return false;
    }
    return true;
  });
  if (sp.bookmarked === "1") filtered = filtered.filter((q) => bookmarkSet.has(q.id));

  const subjects = Array.from(new Set(all.map((q) => q.subject))).sort();
  const years = Array.from(new Set(all.map((q) => q.year).filter((y): y is number => !!y))).sort((a, b) => b - a);
  const examNames = Array.from(new Set(all.map((q) => q.examName).filter((n): n is string => !!n))).sort();

  const weakTopics = student ? await getWeakTopics(student.id) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Question Bank</h1>
          <p className="text-slate-500 text-sm mt-1">Practice from {all.length} curated questions, including previous-year papers.</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Link href="/portal/student/question-bank" className={`px-3 py-1.5 rounded-lg ${sp.bookmarked !== "1" ? "bg-[var(--color-navy)] text-white" : "bg-slate-100 text-slate-600"}`}>All</Link>
          <Link href="/portal/student/question-bank?bookmarked=1" className={`px-3 py-1.5 rounded-lg flex items-center gap-1 ${sp.bookmarked === "1" ? "bg-[var(--color-navy)] text-white" : "bg-slate-100 text-slate-600"}`}>
            <Bookmark size={13} />Bookmarks ({bookmarkSet.size})
          </Link>
        </div>
      </div>

      {analytics && analytics.overall.total > 0 && (
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-[var(--color-teal)]" />
            <h2 className="font-bold text-sm text-[var(--color-navy)]">My practice analytics</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-lg border border-slate-100 p-3">
              <Target size={14} className="text-[var(--color-teal)] mb-1" />
              <div className="text-xl font-bold text-[var(--color-navy)]">{analytics.overall.total}</div>
              <div className="text-xs text-slate-500">Total attempts</div>
            </div>
            <div className="rounded-lg border border-slate-100 p-3">
              <CheckCircle2 size={14} className="text-green-600 mb-1" />
              <div className="text-xl font-bold text-[var(--color-navy)]">
                {analytics.overall.gradable > 0 ? Math.round((analytics.overall.correct / analytics.overall.gradable) * 100) : 0}%
              </div>
              <div className="text-xs text-slate-500">Accuracy ({analytics.overall.correct}/{analytics.overall.gradable})</div>
            </div>
            <div className="rounded-lg border border-slate-100 p-3">
              <Sparkles size={14} className="text-[var(--color-gold)] mb-1" />
              <div className="text-xl font-bold text-[var(--color-navy)]">{analytics.overall.uniqueQuestions}</div>
              <div className="text-xs text-slate-500">Unique questions</div>
            </div>
            <div className="rounded-lg border border-slate-100 p-3">
              <Clock size={14} className="text-blue-500 mb-1" />
              <div className="text-xl font-bold text-[var(--color-navy)]">{Math.round(analytics.overall.totalSeconds / 60)}m</div>
              <div className="text-xs text-slate-500">Time practiced</div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-semibold text-slate-500 mb-2">By subject</div>
              <div className="space-y-1.5">
                {analytics.bySubject.map((row) => {
                  const acc = row.gradable > 0 ? Math.round((row.correct / row.gradable) * 100) : null;
                  return (
                    <div key={row.subject} className="flex items-center gap-2 text-xs">
                      <span className="w-24 truncate text-slate-600">{row.subject}</span>
                      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full ${acc !== null && acc >= 75 ? "bg-green-500" : acc !== null && acc >= 50 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${acc ?? 0}%` }} />
                      </div>
                      <span className="w-20 text-right text-slate-500">{row.total} att{acc !== null && <> · {acc}%</>}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 mb-2">By difficulty</div>
              <div className="space-y-1.5">
                {["easy", "medium", "hard"].map((d) => {
                  const row = analytics!.byDifficulty.find((r) => r.difficulty === d);
                  const total = row?.total ?? 0;
                  const acc = row && row.gradable > 0 ? Math.round((row.correct / row.gradable) * 100) : null;
                  return (
                    <div key={d} className="flex items-center gap-2 text-xs">
                      <span className={`w-24 capitalize badge ${DIFF_COLOR[d]}`}>{d}</span>
                      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full ${acc !== null && acc >= 75 ? "bg-green-500" : acc !== null && acc >= 50 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${acc ?? 0}%` }} />
                      </div>
                      <span className="w-20 text-right text-slate-500">{total} att{acc !== null && <> · {acc}%</>}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <WeakTopicsCard weakTopics={weakTopics} />

      <QuestionBankFilters subjects={subjects} years={years} examNames={examNames} showPyqShortcut />

      {filtered.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          <Sparkles size={32} className="mx-auto mb-3 opacity-30" />
          <p>{sp.bookmarked === "1" ? "You haven't bookmarked any questions yet." : "No questions match your filters."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => (
            <Link key={q.id} href={`/portal/student/question-bank/${q.id}`}
              className="card hover:shadow-elevated transition-all flex items-start gap-3 group">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5 text-xs">
                  <span className="badge bg-[var(--color-navy)]/10 text-[var(--color-navy)]">{q.subject}</span>
                  {q.topic && <span className="text-slate-500">· {q.topic}</span>}
                  {(q.year || q.examName) && (
                    <span className="badge bg-[var(--color-gold)]/15 text-[var(--color-navy)]">
                      PYQ{q.examName ? ` · ${q.examName}` : ""}{q.year ? ` · ${q.year}` : ""}
                    </span>
                  )}
                  <span className={`badge ${DIFF_COLOR[q.difficulty]}`}>{q.difficulty}</span>
                  <span className="badge bg-slate-100 text-slate-600">{TYPE_LABEL[q.questionType]}</span>
                  {bookmarkSet.has(q.id) && <Bookmark size={12} className="text-[var(--color-gold)] fill-[var(--color-gold)]" />}
                  {(() => {
                    const a = attemptByQ.get(q.id);
                    if (!a) return null;
                    return (
                      <span className="badge bg-slate-100 text-slate-600 flex items-center gap-1">
                        {a.lastCorrect === true && <CheckCircle2 size={10} className="text-green-600" />}
                        {a.lastCorrect === false && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                        {a.count}× attempted
                      </span>
                    );
                  })()}
                </div>
                <p className="text-sm text-[var(--color-navy)] line-clamp-2">{q.questionText}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

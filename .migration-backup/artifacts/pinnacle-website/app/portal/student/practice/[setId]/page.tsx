import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { students, questionAttempts } from "@workspace/db/schema";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import Link from "next/link";
import { ChevronLeft, CheckCircle2, Clock, Calendar, FolderOpen, ChevronRight } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { getSetDetail, studentCanAccessSet } from "@/lib/server/practice-sets";

export const metadata = { title: "Practice Set — Student Portal" };

const DIFF_COLOR: Record<string, string> = {
  easy: "bg-green-50 text-green-700",
  medium: "bg-amber-50 text-amber-700",
  hard: "bg-rose-50 text-rose-700",
};

export default async function StudentPracticeSetPage({ params }: { params: Promise<{ setId: string }> }) {
  const user = await requirePortalRole("student");
  const { setId } = await params;
  const [student] = await db.select({ id: students.id }).from(students)
    .where(and(eq(students.userId, user.id), eq(students.isActive, true))).limit(1);
  if (!student) redirect("/portal/student/practice");

  const allowed = await studentCanAccessSet(student.id, setId);
  if (!allowed) notFound();

  const detail = await getSetDetail(setId);
  if (!detail) notFound();

  const qids = detail.questions.map((r) => r.question.id);
  const lastByQ = new Map<string, { isCorrect: boolean | null; count: number }>();
  if (qids.length > 0) {
    const rows = await db
      .select({
        questionId: questionAttempts.questionId,
        count: sql<number>`count(*)::int`,
        lastCorrect: sql<boolean | null>`(array_agg(${questionAttempts.isCorrect} order by ${questionAttempts.createdAt} desc))[1]`,
      })
      .from(questionAttempts)
      .where(and(eq(questionAttempts.studentId, student.id), inArray(questionAttempts.questionId, qids)))
      .groupBy(questionAttempts.questionId);
    for (const r of rows) lastByQ.set(r.questionId, { isCorrect: r.lastCorrect, count: r.count });
  }

  const attempted = lastByQ.size;
  const correct = Array.from(lastByQ.values()).filter((v) => v.isCorrect === true).length;
  const pct = qids.length > 0 ? Math.round((attempted / qids.length) * 100) : 0;

  return (
    <div className="space-y-5 max-w-3xl">
      <Link href="/portal/student/practice" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[var(--color-teal)]">
        <ChevronLeft size={14} /> Back to practice sets
      </Link>

      <div className="card space-y-3">
        <div className="flex items-start gap-3">
          <FolderOpen size={20} className="text-[var(--color-teal)] mt-0.5" />
          <div className="flex-1 min-w-0">
            <h1 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[var(--color-navy)]">{detail.set.name}</h1>
            {detail.set.description && <p className="text-sm text-slate-500 mt-1">{detail.set.description}</p>}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="rounded-lg border border-slate-100 p-2.5">
            <div className="text-slate-400">Attempted</div>
            <div className="text-lg font-bold text-[var(--color-navy)]">{attempted}/{qids.length}</div>
          </div>
          <div className="rounded-lg border border-slate-100 p-2.5">
            <div className="text-slate-400">Correct</div>
            <div className="text-lg font-bold text-green-700">{correct}</div>
          </div>
          <div className="rounded-lg border border-slate-100 p-2.5">
            <div className="text-slate-400">Progress</div>
            <div className="text-lg font-bold text-[var(--color-teal)]">{pct}%</div>
          </div>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-[var(--color-teal)]" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <ol className="space-y-2">
        {detail.questions.map((row, i) => {
          const q = row.question;
          const a = lastByQ.get(q.id);
          return (
            <li key={q.id}>
              <Link href={`/portal/student/question-bank/${q.id}?set=${setId}`}
                className="card hover:shadow-elevated transition-all flex items-start gap-3 group">
                <span className="text-xs font-mono text-slate-400 mt-0.5 shrink-0 w-6 text-right">{i + 1}.</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap text-[11px] mb-1">
                    <span className="badge bg-[var(--color-navy)]/10 text-[var(--color-navy)]">{q.subject}</span>
                    {q.topic && <span className="text-slate-500">· {q.topic}</span>}
                    <span className={`badge ${DIFF_COLOR[q.difficulty]}`}>{q.difficulty}</span>
                    {(q.year || q.examName) && (
                      <span className="badge bg-[var(--color-gold)]/15 text-[var(--color-navy)]">
                        PYQ{q.examName ? ` · ${q.examName}` : ""}{q.year ? ` · ${q.year}` : ""}
                      </span>
                    )}
                    {a && (
                      a.isCorrect === true ? (
                        <span className="badge bg-green-50 text-green-700 flex items-center gap-1"><CheckCircle2 size={9} /> correct</span>
                      ) : a.isCorrect === false ? (
                        <span className="badge bg-rose-50 text-rose-700">try again</span>
                      ) : (
                        <span className="badge bg-slate-100 text-slate-600">submitted</span>
                      )
                    )}
                  </div>
                  <p className="text-sm text-[var(--color-navy)] line-clamp-2">{q.questionText}</p>
                </div>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-[var(--color-teal)] shrink-0 mt-1" />
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

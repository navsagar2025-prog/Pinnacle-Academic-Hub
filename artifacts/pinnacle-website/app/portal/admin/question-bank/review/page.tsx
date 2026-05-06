import { db } from "@workspace/db";
import { questionBank, users } from "@workspace/db/schema";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { getDbUser } from "@/lib/server/portal-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Sparkles, AlertCircle } from "lucide-react";
import { ReviewActions } from "./ReviewActions";
import { RichText } from "@/components/rich/RichText";

export const metadata = { title: "AI Review Queue — Admin Panel" };

const PAGE_SIZE = 25;

type SP = {
  subject?: string;
  difficulty?: string;
  page?: string;
};

export default async function AiReviewQueuePage({ searchParams }: { searchParams: Promise<SP> }) {
  // Match the API: admins AND teachers can review AI questions. The product
  // copy promises a "teacher review" flow; locking this to admin-only would
  // contradict that and bottleneck the queue at one role.
  const user = await getDbUser();
  if (!user) redirect("/portal/login");
  if (user.role !== "admin" && user.role !== "teacher") redirect("/portal");
  const sp = await searchParams;
  const requestedPage = Math.max(1, Number(sp.page ?? "1") || 1);

  const conds = [
    eq(questionBank.reviewStatus, "pending"),
    eq(questionBank.source, "AI"),
    isNull(questionBank.deletedAt),
  ];
  if (sp.subject && sp.subject !== "All") conds.push(eq(questionBank.subject, sp.subject));
  if (sp.difficulty) {
    conds.push(eq(questionBank.difficulty, sp.difficulty as "easy" | "medium" | "hard"));
  }
  const where = and(...conds);

  const [
    [{ total }],
    subjectsRows,
    rows,
  ] = await Promise.all([
    db.select({ total: sql<number>`count(*)::int` }).from(questionBank).where(where),
    db.selectDistinct({ subject: questionBank.subject })
      .from(questionBank)
      .where(and(eq(questionBank.reviewStatus, "pending"), eq(questionBank.source, "AI"), isNull(questionBank.deletedAt)))
      .orderBy(questionBank.subject),
    db.select({
      id: questionBank.id,
      subject: questionBank.subject,
      topic: questionBank.topic,
      classGrade: questionBank.classGrade,
      difficulty: questionBank.difficulty,
      questionType: questionBank.questionType,
      questionText: questionBank.questionText,
      options: questionBank.options,
      correctAnswer: questionBank.correctAnswer,
      solution: questionBank.solution,
      examTarget: questionBank.examTarget,
      createdAt: questionBank.createdAt,
      createdById: questionBank.createdBy,
      createdByName: users.name,
    })
      .from(questionBank)
      .leftJoin(users, eq(questionBank.createdBy, users.id))
      .where(where)
      .orderBy(desc(questionBank.createdAt))
      .limit(PAGE_SIZE)
      .offset((requestedPage - 1) * PAGE_SIZE),
  ]);

  const subjects = subjectsRows.map((r) => r.subject);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);

  return (
    <div className="space-y-5">
      <Link href="/portal/admin/question-bank" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[var(--color-teal)]">
        <ChevronLeft size={14} /> Back to Question Bank
      </Link>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)] flex items-center gap-2">
            <Sparkles size={22} className="text-[var(--color-gold)]" /> AI Review Queue
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {total === 0
              ? "No AI-generated questions waiting for review."
              : `${total.toLocaleString()} AI-generated question${total === 1 ? "" : "s"} pending review. Approved questions become visible to students; rejected ones are removed.`}
          </p>
        </div>
        {total > 0 && subjects.length > 0 && (
          <ReviewActions.BulkApproveBar subjects={subjects} currentSubject={sp.subject ?? "All"} />
        )}
      </div>

      {total > 0 && (
        <div className="card flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Subject</label>
            <ReviewActions.SubjectFilter subjects={subjects} value={sp.subject ?? "All"} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Difficulty</label>
            <ReviewActions.DifficultyFilter value={sp.difficulty ?? ""} />
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          <Sparkles size={32} className="mx-auto mb-3 opacity-30" />
          <p>{total === 0 ? "Nothing pending. Generate some questions from the Question Bank page." : "No questions match these filters."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const opts = (r.options ?? null) as Record<string, string> | null;
            return (
              <div key={r.id} className="card space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="badge bg-[var(--color-navy)]/10 text-[var(--color-navy)]">{r.subject}</span>
                    {r.topic && <span className="text-slate-500">{r.topic}</span>}
                    {r.classGrade && <span className="text-slate-400">· Class {r.classGrade}</span>}
                    <span className="text-slate-400">·</span>
                    <span className={`px-1.5 py-0.5 rounded ${r.difficulty === "easy" ? "bg-green-100 text-green-700" : r.difficulty === "hard" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>{r.difficulty}</span>
                    <span className="text-slate-400">· {r.questionType}</span>
                    {r.examTarget && r.examTarget.length > 0 && (
                      <span className="text-slate-500">· {r.examTarget.join(", ")}</span>
                    )}
                    <span className="text-slate-400 ml-2">queued by {r.createdByName ?? "unknown"} · {r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}</span>
                  </div>
                  <ReviewActions.RowActions id={r.id} />
                </div>
                <div className="text-sm text-[var(--color-navy)]">
                  <RichText>{r.questionText}</RichText>
                </div>
                {r.questionType === "mcq" && opts && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {(["A", "B", "C", "D"] as const).map((k) => (
                      <div key={k} className={`px-2 py-1 rounded ${r.correctAnswer === k ? "bg-green-100 text-green-800 font-semibold" : "bg-slate-50 text-slate-600"}`}>
                        <span className="font-bold mr-1">{k}.</span>
                        <RichText>{opts[k] ?? ""}</RichText>
                      </div>
                    ))}
                  </div>
                )}
                {r.questionType !== "mcq" && (
                  <div className="text-xs text-slate-600">
                    <span className="font-semibold">Answer:</span> <RichText>{r.correctAnswer}</RichText>
                  </div>
                )}
                {r.solution && (
                  <div className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded p-2">
                    <div className="font-semibold mb-1 flex items-center gap-1"><AlertCircle size={12} /> Solution</div>
                    <RichText>{r.solution}</RichText>
                  </div>
                )}
                <div className="text-[11px] text-slate-400 flex items-center gap-3">
                  <Link href={`/portal/admin/question-bank/${r.id}`} className="underline hover:text-[var(--color-teal)]">Open full editor</Link>
                </div>
              </div>
            );
          })}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2 text-xs">
              {page > 1 && <Link href={`?page=${page - 1}`} className="px-3 py-1.5 rounded border border-slate-200 hover:bg-slate-50">Previous</Link>}
              <span className="text-slate-500">Page {page} of {totalPages}</span>
              {page < totalPages && <Link href={`?page=${page + 1}`} className="px-3 py-1.5 rounded border border-slate-200 hover:bg-slate-50">Next</Link>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { questionBank, questionBookmarks, students } from "@workspace/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { Sparkles, Bookmark } from "lucide-react";
import Link from "next/link";
import { QuestionBankFilters } from "../../admin/question-bank/QuestionBankFilters";

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
  searchParams: Promise<{ subject?: string; difficulty?: string; type?: string; year?: string; q?: string; bookmarked?: string }>;
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

  let filtered = all.filter((q) => {
    if (sp.subject && sp.subject !== "All" && q.subject !== sp.subject) return false;
    if (sp.difficulty && q.difficulty !== sp.difficulty) return false;
    if (sp.type && q.questionType !== sp.type) return false;
    if (sp.year && q.year !== Number(sp.year)) return false;
    if (sp.q) {
      const needle = sp.q.toLowerCase();
      if (!q.questionText.toLowerCase().includes(needle) && !(q.topic ?? "").toLowerCase().includes(needle)) return false;
    }
    return true;
  });
  if (sp.bookmarked === "1") filtered = filtered.filter((q) => bookmarkSet.has(q.id));

  const subjects = Array.from(new Set(all.map((q) => q.subject))).sort();
  const years = Array.from(new Set(all.map((q) => q.year).filter((y): y is number => !!y))).sort((a, b) => b - a);

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

      <QuestionBankFilters subjects={subjects} years={years} />

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
                  {q.year && <span className="text-slate-400">· PYQ {q.year}</span>}
                  <span className={`badge ${DIFF_COLOR[q.difficulty]}`}>{q.difficulty}</span>
                  <span className="badge bg-slate-100 text-slate-600">{TYPE_LABEL[q.questionType]}</span>
                  {bookmarkSet.has(q.id) && <Bookmark size={12} className="text-[var(--color-gold)] fill-[var(--color-gold)]" />}
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

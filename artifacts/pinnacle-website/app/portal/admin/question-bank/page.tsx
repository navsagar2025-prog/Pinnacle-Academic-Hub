import { db } from "@workspace/db";
import { questionBank } from "@workspace/db/schema";
import { desc } from "drizzle-orm";
import { Sparkles, Plus, Filter } from "lucide-react";
import Link from "next/link";
import { QuestionBankFilters } from "./QuestionBankFilters";
import { QuestionImporter } from "./QuestionImporter";

export const metadata = { title: "Question Bank — Admin Panel" };

const TYPE_LABEL: Record<string, string> = { mcq: "MCQ", short: "Short", long: "Long", numerical: "Numerical" };
const DIFF_COLOR: Record<string, string> = {
  easy: "bg-green-50 text-green-700",
  medium: "bg-amber-50 text-amber-700",
  hard: "bg-rose-50 text-rose-700",
};

export default async function AdminQuestionBankPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; difficulty?: string; type?: string; year?: string; q?: string }>;
}) {
  const sp = await searchParams;

  const all = await db.select().from(questionBank).orderBy(desc(questionBank.createdAt)).limit(500);

  const filtered = all.filter((q) => {
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

  const subjects = Array.from(new Set(all.map((q) => q.subject))).sort();
  const years = Array.from(new Set(all.map((q) => q.year).filter((y): y is number => !!y))).sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Question Bank</h1>
          <p className="text-slate-500 text-sm mt-1">{all.length} questions · powers practice and auto-generated mock tests</p>
        </div>
        <div className="flex items-center gap-2">
          <QuestionImporter />
          <Link href="/portal/admin/question-bank/new" className="btn-gold text-sm px-4 py-2 flex items-center gap-1.5">
            <Plus size={16} /> Add Question
          </Link>
        </div>
      </div>

      <QuestionBankFilters subjects={subjects} years={years} />

      {filtered.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          <Sparkles size={32} className="mx-auto mb-3 opacity-30" />
          <p>No questions match. {all.length === 0 ? "Click \"Add Question\" to start the bank." : "Try a different filter."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => (
            <Link key={q.id} href={`/portal/admin/question-bank/${q.id}`}
              className="card hover:shadow-elevated transition-all flex items-start gap-4 group">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5 text-xs">
                  <span className="badge bg-[var(--color-navy)]/10 text-[var(--color-navy)]">{q.subject}</span>
                  {q.topic && <span className="text-slate-500">· {q.topic}</span>}
                  {q.classGrade && <span className="text-slate-400">· Cls {q.classGrade}</span>}
                  {q.year && <span className="text-slate-400">· {q.year}</span>}
                  <span className={`badge ${DIFF_COLOR[q.difficulty]}`}>{q.difficulty}</span>
                  <span className="badge bg-slate-100 text-slate-600">{TYPE_LABEL[q.questionType]}</span>
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

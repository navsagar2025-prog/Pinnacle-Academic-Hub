import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { mockTests, mockTestQuestions } from "@workspace/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { Library, BookOpen, ChevronRight } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Question Bank — Student Portal" };

type SP = { subject?: string; examType?: string; topic?: string };

export default async function QuestionBankPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requirePortalRole("student");
  const sp = await searchParams;
  const subjectFilter = sp.subject ?? "";
  const examTypeFilter = sp.examType ?? "";

  const conds = [eq(mockTests.isPublished, true)];
  if (subjectFilter) conds.push(eq(mockTests.subject, subjectFilter));
  if (examTypeFilter) conds.push(eq(mockTests.examType, examTypeFilter));

  const tests = await db.select({
    id: mockTests.id, title: mockTests.title, subject: mockTests.subject, examType: mockTests.examType,
    questionCount: sql<number>`(select count(*)::int from ${mockTestQuestions} where ${mockTestQuestions.testId} = ${mockTests.id})`,
  }).from(mockTests).where(and(...conds)).orderBy(desc(mockTests.createdAt));

  const subjects = Array.from(new Set(tests.map((t) => t.subject).filter((s): s is string => !!s))).sort();
  const examTypes = Array.from(new Set(tests.map((t) => t.examType).filter((e): e is string => !!e))).sort();

  const visibleTests = tests.filter((t) => t.questionCount > 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)] flex items-center gap-2">
          <Library size={22} className="text-[var(--color-teal)]" />Question Bank
        </h1>
        <p className="text-slate-500 text-sm mt-1">Browse questions from previous-year papers and mock tests for self-practice.</p>
      </div>

      <div className="card flex flex-wrap gap-2 items-center">
        <span className="text-xs text-slate-500 font-semibold mr-1">Subject:</span>
        <FilterChip href="/portal/student/question-bank" label="All" active={!subjectFilter} />
        {subjects.map((s) => (
          <FilterChip key={s} href={`/portal/student/question-bank?subject=${encodeURIComponent(s)}${examTypeFilter ? `&examType=${encodeURIComponent(examTypeFilter)}` : ""}`} label={s} active={subjectFilter === s} />
        ))}
        <span className="w-full" />
        <span className="text-xs text-slate-500 font-semibold mr-1">Exam:</span>
        <FilterChip href={subjectFilter ? `/portal/student/question-bank?subject=${encodeURIComponent(subjectFilter)}` : "/portal/student/question-bank"} label="All" active={!examTypeFilter} />
        {examTypes.map((e) => (
          <FilterChip key={e} href={`/portal/student/question-bank?examType=${encodeURIComponent(e)}${subjectFilter ? `&subject=${encodeURIComponent(subjectFilter)}` : ""}`} label={e} active={examTypeFilter === e} />
        ))}
      </div>

      {visibleTests.length === 0 ? (
        <div className="card text-center py-10 text-slate-400">
          <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No questions found for the selected filters.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {visibleTests.map((t) => (
            <Link key={t.id} href={`/portal/student/question-bank/${t.id}`}
              className="card hover:shadow-elevated transition-all flex items-center justify-between gap-3 group">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-[var(--color-navy)] line-clamp-1">{t.title}</div>
                <div className="text-xs text-slate-400 mt-0.5">{t.subject} · {t.examType} · {t.questionCount} questions</div>
              </div>
              <ChevronRight size={16} className="text-slate-300 group-hover:text-[var(--color-teal)] flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link href={href} className={`text-xs px-3 py-1 rounded-full font-semibold transition-colors ${
      active ? "bg-[var(--color-navy)] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
    }`}>{label}</Link>
  );
}

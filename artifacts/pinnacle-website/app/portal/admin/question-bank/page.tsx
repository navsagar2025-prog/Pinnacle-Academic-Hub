import { db } from "@workspace/db";
import { questionBank } from "@workspace/db/schema";
import { and, desc, eq, sql, type SQL } from "drizzle-orm";
import { Sparkles, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { QuestionBankFilters, TopicsSummary } from "./QuestionBankFilters";
import { QuestionImporter } from "./QuestionImporter";
import { QuestionPdfImporter } from "./QuestionPdfImporter";
import QuestionGenerator from "@/components/ai/QuestionGenerator";

export const metadata = { title: "Question Bank — Admin Panel" };

const TYPE_LABEL: Record<string, string> = { mcq: "MCQ", short: "Short", long: "Long", numerical: "Numerical" };
const DIFF_COLOR: Record<string, string> = {
  easy: "bg-green-50 text-green-700",
  medium: "bg-amber-50 text-amber-700",
  hard: "bg-rose-50 text-rose-700",
};
const PAGE_SIZE = 25;

type SP = {
  subject?: string;
  topic?: string;
  difficulty?: string;
  type?: string;
  year?: string;
  examName?: string;
  pyq?: string;
  q?: string;
  page?: string;
};

function parsePage(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

export default async function AdminQuestionBankPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const requestedPage = parsePage(sp.page);

  // Build the WHERE clause once and reuse it for the page slice + total count
  // + per-topic histogram. Keeps the three queries on identical filters.
  const conds: SQL[] = [];
  if (sp.subject && sp.subject !== "All") conds.push(eq(questionBank.subject, sp.subject));
  if (sp.topic) conds.push(eq(questionBank.topic, sp.topic));
  if (sp.difficulty) conds.push(eq(questionBank.difficulty, sp.difficulty as "easy" | "medium" | "hard"));
  if (sp.type) conds.push(eq(questionBank.questionType, sp.type as "mcq" | "short" | "long" | "numerical"));
  if (sp.year) conds.push(eq(questionBank.year, Number(sp.year)));
  if (sp.examName) conds.push(eq(questionBank.examName, sp.examName));
  if (sp.pyq === "1") conds.push(sql`${questionBank.year} is not null`);
  if (sp.q) conds.push(sql`search_vector @@ plainto_tsquery('english', ${sp.q})`);
  const where = conds.length === 0 ? undefined : conds.length === 1 ? conds[0] : and(...conds);

  // Topic histogram is scoped to the same filters EXCEPT the topic itself —
  // showing only "Quadratic Equations: 241" once you've picked Quadratic
  // Equations would defeat the point of the panel.
  const topicConds: SQL[] = [];
  if (sp.subject && sp.subject !== "All") topicConds.push(eq(questionBank.subject, sp.subject));
  if (sp.difficulty) topicConds.push(eq(questionBank.difficulty, sp.difficulty as "easy" | "medium" | "hard"));
  if (sp.type) topicConds.push(eq(questionBank.questionType, sp.type as "mcq" | "short" | "long" | "numerical"));
  if (sp.year) topicConds.push(eq(questionBank.year, Number(sp.year)));
  if (sp.examName) topicConds.push(eq(questionBank.examName, sp.examName));
  if (sp.pyq === "1") topicConds.push(sql`${questionBank.year} is not null`);
  topicConds.push(sql`${questionBank.topic} is not null`);
  const topicWhere = topicConds.length === 1 ? topicConds[0] : and(...topicConds);

  // Run the count + metadata first so we can clamp the page before fetching
  // the slice. Without this, ?page=999 on a 5-page result returns an empty
  // list even though matching rows exist.
  const [[{ total }], topicRows, distinctSubjects, distinctYears, distinctExams, [{ grandTotal }]] = await Promise.all([
    db.select({ total: sql<number>`count(*)::int` }).from(questionBank).where(where),
    // Topic histogram (only meaningful when a subject is picked)
    sp.subject && sp.subject !== "All"
      ? db.select({
          topic: sql<string>`${questionBank.topic}`.as("topic"),
          count: sql<number>`count(*)::int`.as("count"),
        }).from(questionBank).where(topicWhere).groupBy(questionBank.topic).orderBy(sql`count(*) desc`)
      : Promise.resolve([] as Array<{ topic: string; count: number }>),
    // Filter dropdown options — all distinct values across the whole bank, not
    // just the current page, so admins can always switch contexts.
    db.selectDistinct({ subject: questionBank.subject }).from(questionBank).orderBy(questionBank.subject),
    db.selectDistinct({ year: questionBank.year }).from(questionBank)
      .where(sql`${questionBank.year} is not null`).orderBy(desc(questionBank.year)),
    db.selectDistinct({ examName: questionBank.examName }).from(questionBank)
      .where(sql`${questionBank.examName} is not null`).orderBy(questionBank.examName),
    db.select({ grandTotal: sql<number>`count(*)::int` }).from(questionBank),
  ]);

  const subjects = distinctSubjects.map((r) => r.subject);
  const years = distinctYears.map((r) => r.year!).filter((y): y is number => !!y);
  const examNames = distinctExams.map((r) => r.examName!).filter((n): n is string => !!n);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(requestedPage, totalPages);
  const offset = (safePage - 1) * PAGE_SIZE;
  const startIdx = total === 0 ? 0 : offset + 1;
  const endIdx = Math.min(offset + PAGE_SIZE, total);

  const pageRows = total === 0 ? [] : await db.select().from(questionBank).where(where).orderBy(
    ...(sp.q
      ? [sql`ts_rank(search_vector, plainto_tsquery('english', ${sp.q})) DESC`, desc(questionBank.createdAt)]
      : [desc(questionBank.createdAt)]),
  ).limit(PAGE_SIZE).offset(offset);

  // Build href factory that preserves all current params except `page`.
  const baseParams = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (k === "page" || !v) continue;
    baseParams.set(k, String(v));
  }
  function pageHref(p: number) {
    const params = new URLSearchParams(baseParams.toString());
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Question Bank</h1>
          <p className="text-slate-500 text-sm mt-1">{grandTotal.toLocaleString()} questions in bank · powers practice and auto-generated mock tests</p>
        </div>
        <div className="flex items-center gap-2">
          <QuestionGenerator />
          <QuestionPdfImporter />
          <QuestionImporter />
          <Link href="/portal/admin/question-bank/new" className="btn-gold text-sm px-4 py-2 flex items-center gap-1.5">
            <Plus size={16} /> Add Question
          </Link>
        </div>
      </div>

      <QuestionBankFilters
        subjects={subjects}
        years={years}
        examNames={examNames}
        topicsForSubject={topicRows.map((r) => r.topic)}
        showPyqShortcut
      />

      {sp.subject && sp.subject !== "All" && topicRows.length > 0 && (
        <TopicsSummary subject={sp.subject} topics={topicRows} activeTopic={sp.topic ?? null} />
      )}

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          {total === 0
            ? "No questions match these filters."
            : <>Showing <strong className="text-[var(--color-navy)]">{startIdx.toLocaleString()}–{endIdx.toLocaleString()}</strong> of <strong className="text-[var(--color-navy)]">{total.toLocaleString()}</strong></>}
        </span>
        {totalPages > 1 && <span>Page {safePage} of {totalPages}</span>}
      </div>

      {pageRows.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          <Sparkles size={32} className="mx-auto mb-3 opacity-30" />
          <p>No questions match. {grandTotal === 0 ? "Click \"Add Question\" to start the bank." : "Try a different filter."}</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {pageRows.map((q) => (
              <Link key={q.id} href={`/portal/admin/question-bank/${q.id}`}
                className="card hover:shadow-elevated transition-all flex items-start gap-4 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5 text-xs">
                    <span className="badge bg-[var(--color-navy)]/10 text-[var(--color-navy)]">{q.subject}</span>
                    {q.topic && <span className="text-slate-500">· {q.topic}</span>}
                    {q.classGrade && <span className="text-slate-400">· Cls {q.classGrade}</span>}
                    <span className={`badge ${DIFF_COLOR[q.difficulty]}`}>{q.difficulty}</span>
                    <span className="badge bg-slate-100 text-slate-600">{TYPE_LABEL[q.questionType]}</span>
                  </div>
                  <p className="text-sm text-[var(--color-navy)] line-clamp-2">{q.questionText}</p>
                </div>
                {(q.year || q.examName) && (
                  <span className="badge bg-[var(--color-gold)]/15 text-[var(--color-navy)] shrink-0 self-start whitespace-nowrap">
                    PYQ{q.examName ? ` · ${q.examName}` : ""}{q.year ? ` · ${q.year}` : ""}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination page={safePage} totalPages={totalPages} hrefFor={pageHref} />
          )}
        </>
      )}
    </div>
  );
}

// Compact prev/next + windowed page links. Built as plain <Link>s so the page
// stays a server component and shareable URLs always reflect the visible page.
function Pagination({ page, totalPages, hrefFor }: { page: number; totalPages: number; hrefFor: (p: number) => string }) {
  // Show at most 7 numeric links: 1 … (page-2 … page+2) … last.
  const window: number[] = [];
  for (let p = Math.max(2, page - 2); p <= Math.min(totalPages - 1, page + 2); p++) window.push(p);

  return (
    <nav className="flex items-center justify-center gap-1.5 pt-2 flex-wrap" aria-label="Pagination">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs hover:bg-slate-50 flex items-center gap-1">
          <ChevronLeft size={12} /> Prev
        </Link>
      ) : (
        <span className="px-3 py-1.5 rounded-lg border border-slate-100 text-xs text-slate-300 flex items-center gap-1">
          <ChevronLeft size={12} /> Prev
        </span>
      )}

      <PageLink p={1} active={page === 1} hrefFor={hrefFor} />
      {window[0] > 2 && <span className="px-1 text-slate-400">…</span>}
      {window.map((p) => <PageLink key={p} p={p} active={page === p} hrefFor={hrefFor} />)}
      {window.length > 0 && window[window.length - 1] < totalPages - 1 && <span className="px-1 text-slate-400">…</span>}
      {totalPages > 1 && <PageLink p={totalPages} active={page === totalPages} hrefFor={hrefFor} />}

      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs hover:bg-slate-50 flex items-center gap-1">
          Next <ChevronRight size={12} />
        </Link>
      ) : (
        <span className="px-3 py-1.5 rounded-lg border border-slate-100 text-xs text-slate-300 flex items-center gap-1">
          Next <ChevronRight size={12} />
        </span>
      )}
    </nav>
  );
}

function PageLink({ p, active, hrefFor }: { p: number; active: boolean; hrefFor: (p: number) => string }) {
  if (active) {
    return <span className="px-3 py-1.5 rounded-lg bg-[var(--color-navy)] text-white text-xs font-semibold">{p}</span>;
  }
  return <Link href={hrefFor(p)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs hover:bg-slate-50">{p}</Link>;
}

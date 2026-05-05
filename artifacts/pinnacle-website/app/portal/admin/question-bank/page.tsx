import { db } from "@workspace/db";
import { questionBank, questionBankSavedViews } from "@workspace/db/schema";
import { and, asc, desc, eq, sql, type SQL } from "drizzle-orm";
import { Sparkles, Plus } from "lucide-react";
import Link from "next/link";
import { QuestionBankFilters } from "./QuestionBankFilters";
import { QuestionImporter } from "./QuestionImporter";
import { QuestionPdfImporter } from "./QuestionPdfImporter";
import QuestionGenerator from "@/components/ai/QuestionGenerator";
import { QuestionBankPagination } from "./QuestionBankPagination";
import { TopicDistribution } from "./TopicDistribution";
import { SavedViews } from "./SavedViews";
import { BulkQuestionList, type BulkItem } from "./BulkQuestionList";
import { requirePortalRole } from "@/lib/server/portal-auth";

export const metadata = { title: "Question Bank — Admin Panel" };

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

export default async function AdminQuestionBankPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const adminUser = await requirePortalRole("admin");
  const sp = await searchParams;
  const requestedPage = Math.max(1, Number(sp.page ?? "1") || 1);

  const conds: SQL[] = [sql`${questionBank.deletedAt} is null`];
  if (sp.subject && sp.subject !== "All") conds.push(eq(questionBank.subject, sp.subject));
  if (sp.topic) conds.push(eq(questionBank.topic, sp.topic));
  if (sp.difficulty) conds.push(eq(questionBank.difficulty, sp.difficulty as "easy" | "medium" | "hard"));
  if (sp.type) conds.push(eq(questionBank.questionType, sp.type as "mcq" | "short" | "long" | "numerical"));
  if (sp.year) conds.push(eq(questionBank.year, Number(sp.year)));
  if (sp.examName) conds.push(eq(questionBank.examName, sp.examName));
  if (sp.pyq === "1") conds.push(sql`${questionBank.year} is not null`);
  const search = (sp.q ?? "").trim();
  if (search) conds.push(sql`search_vector @@ plainto_tsquery('english', ${search})`);
  const where = conds.length === 0 ? undefined : conds.length === 1 ? conds[0] : and(...conds);

  // Topic-distribution / topic-dropdown queries are scoped to the same filters
  // EXCEPT the topic itself — the point of the side panel is to let users
  // switch between topics, so we need every topic's count for the subject.
  const topicConds: SQL[] = [sql`${questionBank.deletedAt} is null`];
  if (sp.subject && sp.subject !== "All") topicConds.push(eq(questionBank.subject, sp.subject));
  if (sp.difficulty) topicConds.push(eq(questionBank.difficulty, sp.difficulty as "easy" | "medium" | "hard"));
  if (sp.type) topicConds.push(eq(questionBank.questionType, sp.type as "mcq" | "short" | "long" | "numerical"));
  if (sp.year) topicConds.push(eq(questionBank.year, Number(sp.year)));
  if (sp.examName) topicConds.push(eq(questionBank.examName, sp.examName));
  if (sp.pyq === "1") topicConds.push(sql`${questionBank.year} is not null`);
  topicConds.push(sql`${questionBank.topic} is not null`);
  const topicWhere = topicConds.length === 1 ? topicConds[0] : and(...topicConds);

  // Fetch the count + metadata first so we can clamp the page before fetching
  // the slice. Without this, ?page=999 on a 5-page result returns an empty
  // list even though matching rows exist.
  const [
    subjectsRows,
    yearsRows,
    examNamesRows,
    [{ grandTotal }],
    [{ total }],
    topicsRows,
    topicCountsRows,
    savedViews,
  ] = await Promise.all([
    db.selectDistinct({ subject: questionBank.subject }).from(questionBank).where(sql`${questionBank.deletedAt} is null`).orderBy(questionBank.subject),
    db.selectDistinct({ year: questionBank.year }).from(questionBank).where(and(sql`${questionBank.year} is not null`, sql`${questionBank.deletedAt} is null`)).orderBy(desc(questionBank.year)),
    db.selectDistinct({ examName: questionBank.examName }).from(questionBank).where(and(sql`${questionBank.examName} is not null`, sql`${questionBank.deletedAt} is null`)).orderBy(questionBank.examName),
    db.select({ grandTotal: sql<number>`count(*)::int` }).from(questionBank).where(sql`${questionBank.deletedAt} is null`),
    db.select({ total: sql<number>`count(*)::int` }).from(questionBank).where(where),
    // Topic dropdown values: scoped to subject (+ other filters) but NOT the
    // current topic, so admins can always switch to another topic.
    sp.subject && sp.subject !== "All"
      ? db.selectDistinct({ topic: questionBank.topic })
          .from(questionBank)
          .where(topicWhere)
          .orderBy(questionBank.topic)
      : Promise.resolve([] as { topic: string | null }[]),
    // Per-topic counts for the side panel — only when a subject is selected,
    // again excluding the topic filter so the histogram shows all topics.
    sp.subject && sp.subject !== "All"
      ? db.select({
          topic: questionBank.topic,
          count: sql<number>`count(*)::int`,
        })
          .from(questionBank)
          .where(topicWhere)
          .groupBy(questionBank.topic)
          .orderBy(sql`count(*) desc`)
      : Promise.resolve([] as { topic: string | null; count: number }[]),
    // Per-admin saved filter combinations — small list, sorted by name for
    // predictable dropdown ordering.
    db.select({
      id: questionBankSavedViews.id,
      name: questionBankSavedViews.name,
      queryString: questionBankSavedViews.queryString,
    })
      .from(questionBankSavedViews)
      .where(eq(questionBankSavedViews.userId, adminUser.id))
      .orderBy(asc(questionBankSavedViews.name)),
  ]);

  const subjects = subjectsRows.map((r) => r.subject);
  const years = yearsRows.map((r) => r.year).filter((y): y is number => y != null);
  const examNames = examNamesRows.map((r) => r.examName).filter((n): n is string => !!n);
  const topics = topicsRows.map((r) => r.topic).filter((t): t is string => !!t);
  const topicCounts = topicCountsRows
    .filter((r): r is { topic: string; count: number } => !!r.topic)
    .map((r) => ({ topic: r.topic, count: r.count }));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const offset = (page - 1) * PAGE_SIZE;
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + PAGE_SIZE, total);

  const items = total === 0 ? [] : await db.select().from(questionBank).where(where).orderBy(
    ...(search
      ? [sql`ts_rank(search_vector, plainto_tsquery('english', ${search})) DESC`, desc(questionBank.createdAt)]
      : [desc(questionBank.createdAt)]),
  ).limit(PAGE_SIZE).offset(offset);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Question Bank</h1>
          <p className="text-slate-500 text-sm mt-1">{grandTotal.toLocaleString()} questions total · powers practice and auto-generated mock tests</p>
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

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <QuestionBankFilters
            subjects={subjects}
            topics={topics}
            years={years}
            examNames={examNames}
            showPyqShortcut
          />
        </div>
        <SavedViews initialViews={savedViews} />
      </div>

      <div className="grid lg:grid-cols-[1fr_260px] gap-5 items-start">
        <div className="space-y-3 min-w-0">
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-slate-500">
            <span>
              {total === 0 ? "No matching questions" : <>Showing <b className="text-[var(--color-navy)]">{from.toLocaleString()}–{to.toLocaleString()}</b> of <b className="text-[var(--color-navy)]">{total.toLocaleString()}</b> questions</>}
            </span>
            {totalPages > 1 && <span>Page {page} of {totalPages.toLocaleString()}</span>}
          </div>

          {items.length === 0 ? (
            <div className="card text-center py-12 text-slate-400">
              <Sparkles size={32} className="mx-auto mb-3 opacity-30" />
              <p>No questions match. {grandTotal === 0 ? "Click \"Add Question\" to start the bank." : "Try a different filter."}</p>
            </div>
          ) : (
            <>
              <BulkQuestionList
                items={items as BulkItem[]}
                total={total}
                filter={{
                  subject: sp.subject,
                  topic: sp.topic,
                  difficulty: sp.difficulty,
                  type: sp.type,
                  year: sp.year,
                  examName: sp.examName,
                  pyq: sp.pyq,
                  q: sp.q,
                }}
                topicOptions={topics}
              />
              <QuestionBankPagination page={page} totalPages={totalPages} />
            </>
          )}
        </div>

        {sp.subject && sp.subject !== "All" && topicCounts.length > 0 && (
          <TopicDistribution
            subject={sp.subject}
            topics={topicCounts}
            selectedTopic={sp.topic ?? null}
          />
        )}
      </div>
    </div>
  );
}

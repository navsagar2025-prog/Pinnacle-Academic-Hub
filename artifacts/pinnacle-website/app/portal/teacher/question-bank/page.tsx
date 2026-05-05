import { db } from "@workspace/db";
import { questionBank } from "@workspace/db/schema";
import { and, desc, eq, isNull, sql, type SQL } from "drizzle-orm";
import { requirePortalRole } from "@/lib/server/portal-auth";
import { TeacherQuestionList } from "./TeacherQuestionList";

export const metadata = { title: "Question Bank — Teacher Portal" };

const PAGE_SIZE = 25;
const SUBJECTS = ["All", "Physics", "Chemistry", "Mathematics", "Biology", "English", "Other"];

type SP = { subject?: string; q?: string; page?: string };

export default async function TeacherQuestionBankPage({
  searchParams,
}: { searchParams: Promise<SP> }) {
  await requirePortalRole("teacher");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);

  const conds: SQL[] = [isNull(questionBank.deletedAt)];
  if (sp.subject && sp.subject !== "All") conds.push(eq(questionBank.subject, sp.subject));
  const search = (sp.q ?? "").trim();
  if (search) conds.push(sql`search_vector @@ plainto_tsquery('english', ${search})`);
  const where = conds.length === 1 ? conds[0] : and(...conds);

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(questionBank)
    .where(where);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * PAGE_SIZE;

  const items = total === 0 ? [] : await db
    .select({
      id: questionBank.id,
      subject: questionBank.subject,
      topic: questionBank.topic,
      difficulty: questionBank.difficulty,
      questionType: questionBank.questionType,
      questionText: questionBank.questionText,
      year: questionBank.year,
      examName: questionBank.examName,
      deletionRequestedAt: questionBank.deletionRequestedAt,
      deletionReason: questionBank.deletionReason,
    })
    .from(questionBank)
    .where(where)
    .orderBy(desc(questionBank.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Question Bank</h1>
        <p className="text-slate-500 text-sm mt-1">
          Read-only view. Spotted a wrong, duplicate, or out-of-syllabus question? Flag it for the admin team to review and remove.
        </p>
      </div>
      <TeacherQuestionList
        items={items}
        total={total}
        page={safePage}
        totalPages={totalPages}
        subjects={SUBJECTS}
        currentSubject={sp.subject ?? "All"}
        currentSearch={search}
      />
    </div>
  );
}

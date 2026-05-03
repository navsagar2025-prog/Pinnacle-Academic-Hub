import { db } from "@workspace/db";
import { questionBank } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { QuestionEditor } from "../QuestionEditor";

export const metadata = { title: "Edit Question — Admin Panel" };

export default async function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [q] = await db.select().from(questionBank).where(eq(questionBank.id, id)).limit(1);
  if (!q) notFound();
  return (
    <div className="space-y-4 max-w-3xl">
      <Link href="/portal/admin/question-bank" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[var(--color-teal)]">
        <ChevronLeft size={14} /> Back to bank
      </Link>
      <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Edit Question</h1>
      <QuestionEditor initial={q} />
    </div>
  );
}

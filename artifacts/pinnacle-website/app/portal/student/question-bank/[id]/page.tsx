import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { questionBank, questionBookmarks, questionAttempts, students } from "@workspace/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PracticeView } from "./PracticeView";

export const metadata = { title: "Practice Question — Student Portal" };

export default async function StudentQuestionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePortalRole("student");
  const { id } = await params;
  const [q] = await db.select().from(questionBank).where(eq(questionBank.id, id)).limit(1);
  if (!q) notFound();

  const [student] = await db.select({ id: students.id }).from(students)
    .where(and(eq(students.userId, user.id), eq(students.isActive, true))).limit(1);

  let bookmarked = false;
  let priorAttempts: Array<{ id: string; submittedAnswer: string | null; isCorrect: boolean | null; timeSpentSeconds: number | null; createdAt: string }> = [];
  if (student) {
    const [bm] = await db.select({ id: questionBookmarks.id }).from(questionBookmarks)
      .where(and(eq(questionBookmarks.studentId, student.id), eq(questionBookmarks.questionId, id))).limit(1);
    bookmarked = !!bm;

    const rows = await db.select({
      id: questionAttempts.id,
      submittedAnswer: questionAttempts.submittedAnswer,
      isCorrect: questionAttempts.isCorrect,
      timeSpentSeconds: questionAttempts.timeSpentSeconds,
      createdAt: questionAttempts.createdAt,
    }).from(questionAttempts)
      .where(and(eq(questionAttempts.studentId, student.id), eq(questionAttempts.questionId, id)))
      .orderBy(desc(questionAttempts.createdAt))
      .limit(20);
    priorAttempts = rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
  }

  const opts = (q.options as Record<string, string> | null) ?? null;

  return (
    <div className="space-y-5 max-w-3xl">
      <Link href="/portal/student/question-bank" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[var(--color-teal)]">
        <ChevronLeft size={14} /> Back to bank
      </Link>

      <PracticeView
        question={{
          id: q.id,
          subject: q.subject,
          topic: q.topic,
          year: q.year,
          difficulty: q.difficulty,
          questionType: q.questionType,
          questionText: q.questionText,
          imageUrl: q.imageUrl,
          options: opts,
          correctAnswer: q.correctAnswer,
          solution: q.solution,
          solutionImageUrl: q.solutionImageUrl,
        }}
        initialBookmarked={bookmarked}
        initialAttempts={priorAttempts}
      />
    </div>
  );
}

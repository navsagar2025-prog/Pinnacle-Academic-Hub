import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { questionBank, questionBookmarks, questionAttempts, students } from "@workspace/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PracticeView } from "./PracticeView";
import { studentCanAccessQuestion } from "@/lib/server/practice-sets";

export const metadata = { title: "Practice Question — Student Portal" };

export default async function StudentQuestionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ set?: string }>;
}) {
  const user = await requirePortalRole("student");
  const { id } = await params;
  const sp = await searchParams;
  // Fetch the question regardless of soft-delete state. If it has been
  // removed, we still want students to land on a placeholder so their prior
  // attempts (and the contribution to their stats) remain reviewable — but
  // we suppress the body, options, correct answer and solution.
  const [q] = await db.select().from(questionBank)
    .where(eq(questionBank.id, id))
    .limit(1);
  if (!q) notFound();
  const isDeleted = q.deletedAt !== null;

  const [student] = await db.select({ id: students.id }).from(students)
    .where(and(eq(students.userId, user.id), eq(students.isActive, true))).limit(1);

  if (!student) redirect("/portal/student/practice");

  const [bm] = await db.select({ id: questionBookmarks.id }).from(questionBookmarks)
    .where(and(eq(questionBookmarks.studentId, student.id), eq(questionBookmarks.questionId, id))).limit(1);
  const bookmarked = !!bm;

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
  const priorAttempts = rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));

  // Gate access: students can open a question if (a) it appears in a practice
  // set they're currently assigned to, OR (b) they've previously attempted it
  // (review-only). Otherwise, bounce to the practice landing page so they don't
  // see the raw bank.
  if (priorAttempts.length === 0) {
    const canAccess = await studentCanAccessQuestion(student.id, id);
    if (!canAccess) redirect("/portal/student/practice");
  }

  const opts = (q.options as Record<string, string> | null) ?? null;

  return (
    <div className="space-y-5 max-w-3xl">
      <Link
        href={sp.set ? `/portal/student/practice/${sp.set}` : "/portal/student/practice"}
        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[var(--color-teal)]"
      >
        <ChevronLeft size={14} /> Back to {sp.set ? "this set" : "practice sets"}
      </Link>

      <PracticeView
        question={{
          id: q.id,
          subject: q.subject,
          topic: q.topic,
          year: q.year,
          difficulty: q.difficulty,
          questionType: q.questionType,
          questionText: isDeleted ? "" : q.questionText,
          imageUrl: isDeleted ? null : q.imageUrl,
          options: isDeleted ? null : opts,
          correctAnswer: isDeleted ? "" : q.correctAnswer,
          solution: isDeleted ? null : q.solution,
          solutionImageUrl: isDeleted ? null : q.solutionImageUrl,
        }}
        isDeleted={isDeleted}
        initialBookmarked={bookmarked}
        initialAttempts={priorAttempts}
      />
    </div>
  );
}

import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { doubts, doubtAnswers, students, users } from "@workspace/db/schema";
import { eq, asc, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, CheckCircle2, Clock } from "lucide-react";
import { AnswerForm, ResolveButton } from "./Interactions";

export const metadata = { title: "Doubt Discussion — Student Portal" };

export default async function StudentDoubtDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePortalRole("student");
  const { id } = await params;

  const [student] = await db.select({ id: students.id })
    .from(students).where(and(eq(students.userId, user.id), eq(students.isActive, true))).limit(1);

  const [doubt] = await db.select().from(doubts).where(eq(doubts.id, id)).limit(1);
  if (!doubt) notFound();
  if (student?.id !== doubt.studentId) notFound();

  const answers = await db.select({
    id: doubtAnswers.id,
    answerText: doubtAnswers.answerText,
    authorRole: doubtAnswers.authorRole,
    authorName: users.name,
    createdAt: doubtAnswers.createdAt,
  }).from(doubtAnswers)
    .leftJoin(users, eq(doubtAnswers.authorId, users.id))
    .where(eq(doubtAnswers.doubtId, id))
    .orderBy(asc(doubtAnswers.createdAt));

  return (
    <div className="space-y-5 max-w-3xl">
      <Link href="/portal/student/doubts" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[var(--color-teal)]">
        <ChevronLeft size={14} /> All doubts
      </Link>

      <div className="card">
        <div className="flex items-center gap-2 mb-2 text-xs">
          <span className="badge bg-[var(--color-navy)]/10 text-[var(--color-navy)]">{doubt.subject}</span>
          {doubt.topic && <span className="text-slate-400">· {doubt.topic}</span>}
          {doubt.isResolved ? (
            <span className="text-[var(--color-teal)] inline-flex items-center gap-1"><CheckCircle2 size={12} />Resolved</span>
          ) : (
            <span className="text-[var(--color-gold)] inline-flex items-center gap-1"><Clock size={12} />Open</span>
          )}
        </div>
        <p className="text-[var(--color-navy)] whitespace-pre-line">{doubt.questionText}</p>
        <p className="text-xs text-slate-400 mt-2">Posted {new Date(doubt.createdAt).toLocaleString("en-IN")}</p>
      </div>

      <div>
        <h2 className="font-bold text-[var(--color-navy)] mb-3 font-[family-name:var(--font-playfair)]">
          Replies ({answers.length})
        </h2>
        {answers.length === 0 ? (
          <p className="text-sm text-slate-400 px-1">No replies yet. Hang tight — our teachers usually respond within 24 hours.</p>
        ) : (
          <div className="space-y-3">
            {answers.map((a) => {
              const isStaff = a.authorRole === "teacher" || a.authorRole === "admin";
              return (
                <div key={a.id} className={`card ${isStaff ? "border-l-4 border-l-[var(--color-teal)] bg-[var(--color-teal)]/5" : ""}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`badge ${isStaff ? "bg-[var(--color-teal)]/15 text-[var(--color-teal)]" : "bg-slate-100 text-slate-600"}`}>
                        {isStaff ? "👨‍🏫 Teacher" : "Student"}
                      </span>
                      <span className="text-slate-500 font-medium">{a.authorName ?? "Anonymous"}</span>
                    </div>
                    <span className="text-xs text-slate-400">{new Date(a.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</span>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-line">{a.answerText}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AnswerForm doubtId={doubt.id} />

      {!doubt.isResolved && answers.length > 0 && (
        <ResolveButton doubtId={doubt.id} />
      )}
    </div>
  );
}

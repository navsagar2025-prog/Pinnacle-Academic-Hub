import { db } from "@workspace/db";
import { questionBank, users } from "@workspace/db/schema";
import { and, desc, eq, isNull, isNotNull } from "drizzle-orm";
import { requirePortalRole } from "@/lib/server/portal-auth";
import Link from "next/link";
import { ChevronLeft, AlertTriangle } from "lucide-react";
import { PendingActions } from "./PendingActions";

export const metadata = { title: "Pending Deletions — Admin Panel" };

export default async function PendingDeletionsPage() {
  await requirePortalRole("admin");

  const rows = await db
    .select({
      id: questionBank.id,
      subject: questionBank.subject,
      topic: questionBank.topic,
      questionText: questionBank.questionText,
      difficulty: questionBank.difficulty,
      questionType: questionBank.questionType,
      requestedAt: questionBank.deletionRequestedAt,
      reason: questionBank.deletionReason,
      requesterId: questionBank.deletionRequestedBy,
      requesterName: users.name,
      requesterEmail: users.email,
      requesterRole: users.role,
    })
    .from(questionBank)
    .leftJoin(users, eq(questionBank.deletionRequestedBy, users.id))
    .where(and(isNotNull(questionBank.deletionRequestedAt), isNull(questionBank.deletedAt)))
    .orderBy(desc(questionBank.deletionRequestedAt));

  return (
    <div className="space-y-5">
      <Link href="/portal/admin/question-bank" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[var(--color-teal)]">
        <ChevronLeft size={14} /> Back to Question Bank
      </Link>
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)] flex items-center gap-2">
          <AlertTriangle size={22} className="text-[var(--color-gold)]" /> Pending Deletion Requests
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {rows.length === 0
            ? "Nothing waiting — teachers haven't flagged any questions for removal."
            : `${rows.length} question${rows.length === 1 ? "" : "s"} flagged by teachers, awaiting your decision.`}
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          <p>You're all caught up.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="card flex items-start gap-4">
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="badge bg-[var(--color-navy)]/10 text-[var(--color-navy)]">{r.subject}</span>
                  {r.topic && <span className="text-slate-500">· {r.topic}</span>}
                  <span className="text-slate-400">· {r.difficulty} · {r.questionType}</span>
                </div>
                <Link href={`/portal/admin/question-bank/${r.id}`} className="block text-sm text-[var(--color-navy)] line-clamp-2 hover:underline">
                  {r.questionText}
                </Link>
                <div className="text-xs bg-amber-50 border border-amber-100 rounded-lg p-3 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-amber-900">
                      {r.requesterName ?? "Unknown"} ({r.requesterRole ?? "teacher"})
                    </span>
                    <span className="text-amber-700">
                      {r.requestedAt ? new Date(r.requestedAt).toLocaleString() : ""}
                    </span>
                  </div>
                  <div className="text-amber-900 whitespace-pre-wrap">{r.reason ?? <em className="text-amber-700">no reason given</em>}</div>
                </div>
              </div>
              <PendingActions id={r.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

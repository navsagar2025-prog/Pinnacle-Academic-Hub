import { db } from "@workspace/db";
import { questionBank, users } from "@workspace/db/schema";
import { desc, eq, isNotNull } from "drizzle-orm";
import { requirePortalRole } from "@/lib/server/portal-auth";
import Link from "next/link";
import { ChevronLeft, Trash2 } from "lucide-react";
import { RestoreButton } from "./RestoreButton";
import { PURGE_AFTER_DAYS } from "@/lib/server/question-bank-deletion";

export const metadata = { title: "Recycle Bin — Admin Panel" };

export default async function BinPage() {
  await requirePortalRole("admin");

  const rows = await db
    .select({
      id: questionBank.id,
      subject: questionBank.subject,
      topic: questionBank.topic,
      questionText: questionBank.questionText,
      difficulty: questionBank.difficulty,
      questionType: questionBank.questionType,
      deletedAt: questionBank.deletedAt,
      reason: questionBank.deletionReason,
      requesterName: users.name,
    })
    .from(questionBank)
    .leftJoin(users, eq(questionBank.deletionRequestedBy, users.id))
    .where(isNotNull(questionBank.deletedAt))
    .orderBy(desc(questionBank.deletedAt));

  return (
    <div className="space-y-5">
      <Link href="/portal/admin/question-bank" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[var(--color-teal)]">
        <ChevronLeft size={14} /> Back to Question Bank
      </Link>
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)] flex items-center gap-2">
          <Trash2 size={22} className="text-[var(--color-maroon)]" /> Recycle Bin
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Soft-deleted questions stay here for {PURGE_AFTER_DAYS} days, then auto-purge. Restore anytime to bring them back to the bank.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          <p>The bin is empty.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const purgeAt = r.deletedAt
              ? new Date(r.deletedAt.getTime() + PURGE_AFTER_DAYS * 24 * 60 * 60 * 1000)
              : null;
            const daysLeft = purgeAt ? Math.max(0, Math.ceil((purgeAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000))) : 0;
            return (
              <div key={r.id} className="card flex items-start gap-4 opacity-90">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="badge bg-[var(--color-navy)]/10 text-[var(--color-navy)]">{r.subject}</span>
                    {r.topic && <span className="text-slate-500">· {r.topic}</span>}
                    <span className="text-slate-400">· {r.difficulty} · {r.questionType}</span>
                    <span className="badge bg-rose-50 text-rose-700">
                      Auto-purges in {daysLeft} day{daysLeft === 1 ? "" : "s"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">{r.questionText}</p>
                  <div className="text-[11px] text-slate-500">
                    Deleted {r.deletedAt ? new Date(r.deletedAt).toLocaleString() : "?"}
                    {r.requesterName ? <> · requested by <b>{r.requesterName}</b></> : null}
                    {r.reason ? <> · reason: <em>{r.reason}</em></> : null}
                  </div>
                </div>
                <RestoreButton id={r.id} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

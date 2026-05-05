import { db } from "@workspace/db";
import { questionBank, users, auditLogs } from "@workspace/db/schema";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { requirePortalRole } from "@/lib/server/portal-auth";
import Link from "next/link";
import { ChevronLeft, Clock, Trash2 } from "lucide-react";
import { RestoreButton } from "./RestoreButton";
import {
  PURGE_AFTER_DAYS,
  PURGE_CRON_AUDIT_ENTITY_ID,
} from "@/lib/server/question-bank-deletion";

export const metadata = { title: "Recycle Bin — Admin Panel" };

export default async function BinPage() {
  await requirePortalRole("admin");

  const [lastCronRun] = await db
    .select({
      createdAt: auditLogs.createdAt,
      details: auditLogs.details,
    })
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.action, "qb.delete.cron_run"),
        eq(auditLogs.entityType, "cron"),
        eq(auditLogs.entityId, PURGE_CRON_AUDIT_ENTITY_ID),
      ),
    )
    .orderBy(desc(auditLogs.createdAt))
    .limit(1);

  const lastPurgedCount =
    lastCronRun?.details && typeof (lastCronRun.details as { purged?: unknown }).purged === "number"
      ? ((lastCronRun.details as { purged: number }).purged)
      : null;
  const hoursSinceRun = lastCronRun
    ? (Date.now() - new Date(lastCronRun.createdAt).getTime()) / (60 * 60 * 1000)
    : null;
  const cronStale = hoursSinceRun === null || hoursSinceRun > 36;

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

      <div
        className={`card flex items-start gap-3 text-xs ${
          cronStale
            ? "border-amber-300 bg-amber-50 text-amber-900"
            : "border-emerald-200 bg-emerald-50 text-emerald-900"
        }`}
      >
        <Clock size={16} className="mt-0.5 shrink-0" />
        <div className="space-y-0.5">
          <div className="font-semibold">
            Daily auto-purge job:{" "}
            {lastCronRun ? (cronStale ? "stale — last run was over 36h ago" : "healthy") : "has never run yet"}
          </div>
          <div>
            {lastCronRun ? (
              <>
                Last run <b>{new Date(lastCronRun.createdAt).toLocaleString()}</b>
                {lastPurgedCount !== null ? (
                  <> · purged <b>{lastPurgedCount}</b> question{lastPurgedCount === 1 ? "" : "s"}</>
                ) : null}
              </>
            ) : (
              <>
                Schedule a daily POST to <code className="bg-white/60 px-1 py-0.5 rounded">/api/v1/cron/purge-deleted-questions</code> with{" "}
                <code className="bg-white/60 px-1 py-0.5 rounded">Authorization: Bearer $CRON_SECRET</code>.
              </>
            )}
          </div>
        </div>
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

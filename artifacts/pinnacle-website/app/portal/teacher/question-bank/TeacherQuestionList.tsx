"use client";
import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Flag, Loader2, Search, AlertTriangle } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

type Item = {
  id: string;
  subject: string;
  topic: string | null;
  difficulty: "easy" | "medium" | "hard";
  questionType: "mcq" | "short" | "long" | "numerical";
  questionText: string;
  year: number | null;
  examName: string | null;
  deletionRequestedAt: Date | null;
  deletionReason: string | null;
};

const DIFF_COLOR: Record<string, string> = {
  easy: "bg-green-50 text-green-700",
  medium: "bg-amber-50 text-amber-700",
  hard: "bg-rose-50 text-rose-700",
};

export function TeacherQuestionList({
  items, total, page, totalPages, subjects, currentSubject, currentSearch,
}: {
  items: Item[];
  total: number;
  page: number;
  totalPages: number;
  subjects: string[];
  currentSubject: string;
  currentSearch: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();
  const [flagFor, setFlagFor] = useState<Item | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(currentSearch);

  function go(params: Record<string, string | undefined>) {
    const next = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(params)) {
      if (v == null || v === "" || v === "All") next.delete(k);
      else next.set(k, v);
    }
    if (!("page" in params)) next.delete("page");
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  }

  async function submitFlag() {
    if (!flagFor) return;
    if (!reason.trim()) { setError("A reason is required."); return; }
    setBusy(true); setError(null);
    try {
      const res = await fetch(`${BASE}/api/v1/question-bank/${flagFor.id}/deletion-request`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data?.error ?? "Flag failed");
      setFlagFor(null);
      setReason("");
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={currentSubject}
          onChange={(e) => go({ subject: e.target.value })}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
        >
          {subjects.map((s) => <option key={s}>{s}</option>)}
        </select>
        <form
          onSubmit={(e) => { e.preventDefault(); go({ q: search }); }}
          className="flex-1 min-w-[200px] flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3"
        >
          <Search size={14} className="text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions…"
            className="flex-1 py-2 text-sm outline-none bg-transparent"
          />
        </form>
        <span className="text-xs text-slate-500">{total.toLocaleString()} matching</span>
      </div>

      {items.length === 0 ? (
        <div className="card text-center py-12 text-slate-400"><p>No matching questions.</p></div>
      ) : (
        <div className="space-y-3">
          {items.map((q) => (
            <div key={q.id} className="card flex items-start gap-3">
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="badge bg-[var(--color-navy)]/10 text-[var(--color-navy)]">{q.subject}</span>
                  {q.topic && <span className="text-slate-500">· {q.topic}</span>}
                  <span className={`badge ${DIFF_COLOR[q.difficulty]}`}>{q.difficulty}</span>
                  <span className="badge bg-slate-100 text-slate-600">{q.questionType.toUpperCase()}</span>
                  {(q.year || q.examName) && (
                    <span className="badge bg-[var(--color-gold)]/15 text-[var(--color-navy)]">
                      PYQ{q.examName ? ` · ${q.examName}` : ""}{q.year ? ` · ${q.year}` : ""}
                    </span>
                  )}
                  {q.deletionRequestedAt && (
                    <span className="badge bg-amber-50 text-amber-800 inline-flex items-center gap-1">
                      <AlertTriangle size={10} /> Flagged
                    </span>
                  )}
                </div>
                <p className="text-sm text-[var(--color-navy)] line-clamp-3">{q.questionText}</p>
                {q.deletionRequestedAt && q.deletionReason && (
                  <div className="text-[11px] text-amber-800 bg-amber-50 rounded px-2 py-1">
                    Pending: {q.deletionReason}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => { setFlagFor(q); setReason(q.deletionReason ?? ""); setError(null); }}
                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-100 text-amber-900 hover:bg-amber-200 inline-flex items-center gap-1.5"
              >
                <Flag size={12} /> {q.deletionRequestedAt ? "Update flag" : "Request deletion"}
              </button>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2 text-sm">
          <button disabled={page <= 1} onClick={() => go({ page: String(page - 1) })}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40">Prev</button>
          <span className="text-slate-500">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => go({ page: String(page + 1) })}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40">Next</button>
        </div>
      )}

      {flagFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setFlagFor(null)}>
          <div className="bg-white rounded-xl shadow-elevated max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold text-lg text-[var(--color-navy)]">Flag question for deletion</h2>
            <p className="text-xs text-slate-500 mt-1 line-clamp-3">{flagFor.questionText}</p>
            <label className="block mt-3 text-xs font-semibold text-slate-600">Reason (required)</label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              autoFocus
              maxLength={1000}
              placeholder="e.g. Out of NEET 2026 syllabus, or option C is also correct."
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-y"
            />
            {error && <p className="text-xs text-rose-600 mt-2">{error}</p>}
            <div className="mt-4 flex items-center justify-end gap-2">
              <button onClick={() => setFlagFor(null)} disabled={busy}
                className="px-3 py-1.5 rounded-lg text-sm bg-slate-100 hover:bg-slate-200 disabled:opacity-50">Cancel</button>
              <button onClick={submitFlag} disabled={busy}
                className="px-3 py-1.5 rounded-lg text-sm bg-amber-500 text-white hover:bg-amber-600 inline-flex items-center gap-1.5 disabled:opacity-50">
                {busy && <Loader2 size={14} className="animate-spin" />}
                <Flag size={14} /> Submit flag
              </button>
            </div>
            <p className="mt-3 text-[11px] text-slate-400">
              An admin reviews every flag. Approved deletions go to the recycle bin for 7 days before permanent removal.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

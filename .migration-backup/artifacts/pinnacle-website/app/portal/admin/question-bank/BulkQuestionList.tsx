"use client";
import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckSquare, Square, Trash2, Tag, Sliders, Eye, EyeOff, X, Loader2 } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

const TYPE_LABEL: Record<string, string> = { mcq: "MCQ", short: "Short", long: "Long", numerical: "Numerical" };
const DIFF_COLOR: Record<string, string> = {
  easy: "bg-green-50 text-green-700",
  medium: "bg-amber-50 text-amber-700",
  hard: "bg-rose-50 text-rose-700",
};

export type BulkItem = {
  id: string;
  subject: string;
  topic: string | null;
  classGrade: string | null;
  difficulty: "easy" | "medium" | "hard";
  questionType: "mcq" | "short" | "long" | "numerical";
  questionText: string;
  year: number | null;
  examName: string | null;
  isPublished: boolean;
  deletionRequestedAt: Date | string | null;
  deletionReason: string | null;
};

type Filter = Record<string, string | undefined>;

export function BulkQuestionList({
  items,
  total,
  filter,
  topicOptions,
}: {
  items: BulkItem[];
  total: number;
  filter: Filter;
  topicOptions: string[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // When the admin clicks "Select all matching filter", we keep the explicit
  // id list around — the toolbar then targets every matching row, not just
  // the page. `null` means selection is page-scoped.
  const [matchingIds, setMatchingIds] = useState<string[] | null>(null);
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [unflaggedWarning, setUnflaggedWarning] = useState<{ unflagged: number; total: number } | null>(null);
  const [topicPrompt, setTopicPrompt] = useState(false);
  const [topicValue, setTopicValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const visibleIds = useMemo(() => items.map((i) => i.id), [items]);
  const allOnPageChecked = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const effectiveCount = matchingIds ? matchingIds.length : selected.size;
  const hasSelection = effectiveCount > 0;

  function toggle(id: string) {
    setMatchingIds(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function togglePage() {
    setMatchingIds(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageChecked) {
        for (const id of visibleIds) next.delete(id);
      } else {
        for (const id of visibleIds) next.add(id);
      }
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
    setMatchingIds(null);
  }

  async function selectAllMatching() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/api/v1/question-bank/bulk`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "list-ids", filter }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error ?? "Failed to load matching ids");
      setMatchingIds(data.ids);
      setSelected(new Set(data.ids));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to select all");
    } finally {
      setBusy(false);
    }
  }

  // Build the body for PATCH/DELETE. We prefer to send the filter (small
  // payload, server re-evaluates) when the admin used "select all matching"
  // AND the filter actually narrows the bank — otherwise the server refuses
  // to act, by design, so we fall back to sending the explicit id list.
  const filterHasConstraints = useMemo(
    () => Object.values(filter).some((v) => v != null && String(v).trim() !== "" && v !== "All"),
    [filter],
  );

  function targetBody(): Record<string, unknown> {
    if (matchingIds && matchingIds.length === selected.size && filterHasConstraints) {
      return { filter };
    }
    return { ids: Array.from(selected) };
  }

  async function applyPatch(set: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/api/v1/question-bank/bulk`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...targetBody(), set }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error ?? "Bulk update failed");
      clearSelection();
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bulk update failed");
    } finally {
      setBusy(false);
    }
  }

  async function applyDelete(ackNoTeacherRequest = false) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/api/v1/question-bank/bulk`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...targetBody(), ackNoTeacherRequest }),
      });
      const data = await res.json();
      if (res.status === 409 && data?.error === "no_teacher_request") {
        setUnflaggedWarning({ unflagged: data.unflaggedCount, total: data.totalCount });
        return;
      }
      if (!res.ok || !data.success) throw new Error(data.error ?? "Bulk delete failed");
      setConfirmDelete(false);
      setUnflaggedWarning(null);
      clearSelection();
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bulk delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Header row: select-all-on-page checkbox + matching-filter affordance */}
      <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePage}
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-[var(--color-navy)] font-medium"
          >
            {allOnPageChecked ? <CheckSquare size={16} /> : <Square size={16} />}
            Select page ({visibleIds.length})
          </button>
          {total > visibleIds.length && (
            matchingIds ? (
              <span className="text-[var(--color-navy)] font-semibold">
                All {matchingIds.length.toLocaleString()} matching selected ·
                <button type="button" onClick={clearSelection} className="ml-1 underline hover:text-[var(--color-maroon)]">
                  clear
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={selectAllMatching}
                disabled={busy}
                className="text-[var(--color-teal)] hover:underline font-medium disabled:opacity-50"
              >
                Select all {total.toLocaleString()} matching this filter
              </button>
            )
          )}
        </div>
        {hasSelection && (
          <button
            type="button"
            onClick={clearSelection}
            className="text-slate-500 hover:text-[var(--color-maroon)] inline-flex items-center gap-1"
          >
            <X size={12} /> Clear selection
          </button>
        )}
      </div>

      {/* Sticky toolbar — shown only when something is selected */}
      {hasSelection && (
        <div className="sticky top-2 z-10 card flex items-center justify-between gap-3 flex-wrap bg-white shadow-elevated border border-[var(--color-gold)]/40">
          <div className="text-sm font-semibold text-[var(--color-navy)]">
            {effectiveCount.toLocaleString()} selected
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <DifficultyMenu disabled={busy} onPick={(d) => applyPatch({ difficulty: d })} />
            <button
              type="button"
              disabled={busy}
              onClick={() => { setTopicValue(""); setTopicPrompt(true); }}
              className="px-3 py-1.5 rounded-lg text-sm bg-slate-100 hover:bg-slate-200 inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <Tag size={14} /> Set topic
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => applyPatch({ isPublished: true })}
              className="px-3 py-1.5 rounded-lg text-sm bg-slate-100 hover:bg-slate-200 inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <Eye size={14} /> Publish
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => applyPatch({ isPublished: false })}
              className="px-3 py-1.5 rounded-lg text-sm bg-slate-100 hover:bg-slate-200 inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <EyeOff size={14} /> Unpublish
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirmDelete(true)}
              className="px-3 py-1.5 rounded-lg text-sm bg-[var(--color-maroon)] text-white hover:opacity-90 inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <Trash2 size={14} /> Delete
            </button>
            {(busy || pending) && <Loader2 size={16} className="animate-spin text-slate-400" />}
          </div>
        </div>
      )}

      {error && (
        <div className="card bg-rose-50 border border-rose-200 text-sm text-rose-800 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-800"><X size={14} /></button>
        </div>
      )}

      <div className="space-y-3">
        {items.map((q) => {
          const checked = selected.has(q.id);
          return (
            <div
              key={q.id}
              className={`card flex items-start gap-3 group transition-all ${checked ? "ring-2 ring-[var(--color-gold)] shadow-elevated" : "hover:shadow-elevated"}`}
            >
              <label className="pt-0.5 cursor-pointer select-none" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[var(--color-navy)] cursor-pointer"
                  checked={checked}
                  onChange={() => toggle(q.id)}
                />
              </label>
              <Link href={`/portal/admin/question-bank/${q.id}`} className="flex-1 min-w-0 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5 text-xs">
                    <span className="badge bg-[var(--color-navy)]/10 text-[var(--color-navy)]">{q.subject}</span>
                    {q.topic && <span className="text-slate-500">· {q.topic}</span>}
                    {q.classGrade && <span className="text-slate-400">· Cls {q.classGrade}</span>}
                    <span className={`badge ${DIFF_COLOR[q.difficulty]}`}>{q.difficulty}</span>
                    <span className="badge bg-slate-100 text-slate-600">{TYPE_LABEL[q.questionType]}</span>
                    {!q.isPublished && <span className="badge bg-slate-200 text-slate-700">Unpublished</span>}
                  </div>
                  <p className="text-sm text-[var(--color-navy)] line-clamp-2">{q.questionText}</p>
                </div>
                {(q.year || q.examName) && (
                  <span className="badge bg-[var(--color-gold)]/15 text-[var(--color-navy)] shrink-0 self-start whitespace-nowrap">
                    PYQ{q.examName ? ` · ${q.examName}` : ""}{q.year ? ` · ${q.year}` : ""}
                  </span>
                )}
              </Link>
            </div>
          );
        })}
      </div>

      {confirmDelete && !unflaggedWarning && (() => {
        // Show how many of the visible-page selected rows are already flagged
        // by a teacher. We can only inspect rows on the current page; for
        // "select all matching" the warning modal still surfaces the true
        // unflagged count from the server.
        const selectedItems = items.filter((i) => selected.has(i.id));
        const flagged = selectedItems.filter((i) => i.deletionRequestedAt);
        const sampleReason = flagged.find((i) => i.deletionReason)?.deletionReason ?? null;
        return (
        <Modal onClose={() => setConfirmDelete(false)}>
          <h2 className="font-bold text-lg text-[var(--color-navy)]">Approve and move {effectiveCount.toLocaleString()} to the bin?</h2>
          <p className="text-sm text-slate-600 mt-2">
            Students lose access immediately. Items stay recoverable for 7 days from the Recycle Bin, then auto-purge.
          </p>
          {flagged.length > 0 && (
            <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900">
              <div className="font-semibold">
                {flagged.length} of {selectedItems.length} on this page were flagged by a teacher.
              </div>
              {sampleReason && (
                <div className="mt-1 text-amber-800 line-clamp-2">
                  Sample reason: &ldquo;{sampleReason}&rdquo;
                </div>
              )}
            </div>
          )}
          <div className="mt-4 flex items-center justify-end gap-2">
            <button onClick={() => setConfirmDelete(false)} disabled={busy} className="px-3 py-1.5 rounded-lg text-sm bg-slate-100 hover:bg-slate-200 disabled:opacity-50">
              Cancel
            </button>
            <button onClick={() => applyDelete(false)} disabled={busy} className="px-3 py-1.5 rounded-lg text-sm bg-[var(--color-maroon)] text-white hover:opacity-90 inline-flex items-center gap-1.5 disabled:opacity-50">
              {busy && <Loader2 size={14} className="animate-spin" />}
              <Trash2 size={14} /> Approve · move {effectiveCount.toLocaleString()} to bin
            </button>
          </div>
        </Modal>
        );
      })()}

      {unflaggedWarning && (
        <Modal onClose={() => { setUnflaggedWarning(null); setConfirmDelete(false); }}>
          <h2 className="font-bold text-lg text-[var(--color-maroon)]">No teacher request on {unflaggedWarning.unflagged} of {unflaggedWarning.total}</h2>
          <p className="text-sm text-slate-600 mt-2">
            Pinnacle policy is to delete only after a teacher or examiner flags a question with a reason.
            Continue anyway? This will be recorded in the audit log.
          </p>
          <div className="mt-4 flex items-center justify-end gap-2">
            <button onClick={() => { setUnflaggedWarning(null); setConfirmDelete(false); }} disabled={busy} className="px-3 py-1.5 rounded-lg text-sm bg-slate-100 hover:bg-slate-200 disabled:opacity-50">
              Cancel
            </button>
            <button onClick={() => applyDelete(true)} disabled={busy} className="px-3 py-1.5 rounded-lg text-sm bg-[var(--color-maroon)] text-white hover:opacity-90 inline-flex items-center gap-1.5 disabled:opacity-50">
              {busy && <Loader2 size={14} className="animate-spin" />}
              <Trash2 size={14} /> Delete anyway
            </button>
          </div>
        </Modal>
      )}

      {topicPrompt && (
        <Modal onClose={() => setTopicPrompt(false)}>
          <h2 className="font-bold text-lg text-[var(--color-navy)]">Set topic for {effectiveCount.toLocaleString()} questions</h2>
          <p className="text-sm text-slate-600 mt-2">Pick an existing topic or type a new one. Leave blank to clear.</p>
          <input
            list="bulk-topic-options"
            value={topicValue}
            onChange={(e) => setTopicValue(e.target.value)}
            autoFocus
            placeholder="Topic name…"
            className="mt-3 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
          />
          <datalist id="bulk-topic-options">
            {topicOptions.map((t) => <option key={t} value={t} />)}
          </datalist>
          <div className="mt-4 flex items-center justify-end gap-2">
            <button onClick={() => setTopicPrompt(false)} disabled={busy} className="px-3 py-1.5 rounded-lg text-sm bg-slate-100 hover:bg-slate-200 disabled:opacity-50">
              Cancel
            </button>
            <button
              onClick={async () => { setTopicPrompt(false); await applyPatch({ topic: topicValue.trim() }); }}
              disabled={busy}
              className="px-3 py-1.5 rounded-lg text-sm bg-[var(--color-navy)] text-white hover:opacity-90 inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              {busy && <Loader2 size={14} className="animate-spin" />}
              Apply
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function DifficultyMenu({ disabled, onPick }: { disabled: boolean; onPick: (d: "easy" | "medium" | "hard") => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="px-3 py-1.5 rounded-lg text-sm bg-slate-100 hover:bg-slate-200 inline-flex items-center gap-1.5 disabled:opacity-50"
      >
        <Sliders size={14} /> Set difficulty
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 z-20 bg-white border border-slate-200 rounded-lg shadow-elevated overflow-hidden text-sm min-w-[140px]">
            {(["easy", "medium", "hard"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => { setOpen(false); onPick(d); }}
                className="block w-full text-left px-3 py-1.5 hover:bg-slate-50 capitalize"
              >
                {d}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-elevated max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

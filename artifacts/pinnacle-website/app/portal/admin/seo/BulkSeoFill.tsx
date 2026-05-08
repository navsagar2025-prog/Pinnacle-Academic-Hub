"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, CheckCircle, Loader2, AlertCircle, ChevronRight } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

export interface BulkSeoRow {
  route: string;
  label: string;
  defaultTitle: string;
  defaultDescription: string;
  dbTitle: string | null;
  dbDescription: string | null;
  dbFocusKeyword: string | null;
}

type FillStatus = "idle" | "filling" | "done" | "error";

interface RowState {
  status: FillStatus;
  error?: string;
  result?: { title: string; description: string; focusKeyword: string };
}

async function fillOne(row: BulkSeoRow): Promise<{ title: string; description: string; focusKeyword: string }> {
  const fillRes = await fetch(`${BASE}/api/v1/seo/ai-fill`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      route: row.route,
      label: row.label,
      existingTitle: row.dbTitle ?? row.defaultTitle,
      existingDescription: row.dbDescription ?? row.defaultDescription,
    }),
  });
  if (!fillRes.ok) {
    const j = await fillRes.json().catch(() => ({}));
    throw new Error(j.error ?? "AI fill failed");
  }
  const { data } = await fillRes.json();
  return data as { title: string; description: string; focusKeyword: string };
}

async function saveOne(route: string, title: string, description: string, focusKeyword: string) {
  const res = await fetch(`${BASE}/api/v1/seo`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ route, title, description, focusKeyword }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error ?? "Save failed");
  }
}

export function BulkSeoFill({ rows }: { rows: BulkSeoRow[] }) {
  const router = useRouter();
  const [states, setStates] = useState<Record<string, RowState>>({});
  const [bulkFilling, setBulkFilling] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);

  const setRowState = useCallback((route: string, state: RowState) => {
    setStates((prev) => ({ ...prev, [route]: state }));
  }, []);

  async function handleFillOne(row: BulkSeoRow) {
    setRowState(row.route, { status: "filling" });
    try {
      const result = await fillOne(row);
      await saveOne(row.route, result.title, result.description, result.focusKeyword);
      setRowState(row.route, { status: "done", result });
      router.refresh();
    } catch (e) {
      setRowState(row.route, { status: "error", error: e instanceof Error ? e.message : "Failed" });
    }
  }

  async function handleFillAll(onlyMissing: boolean) {
    const targets = onlyMissing
      ? rows.filter((r) => !r.dbTitle || !r.dbDescription)
      : rows;

    setBulkFilling(true);
    setBulkProgress({ done: 0, total: targets.length });

    for (let i = 0; i < targets.length; i++) {
      const row = targets[i];
      setRowState(row.route, { status: "filling" });
      try {
        const result = await fillOne(row);
        await saveOne(row.route, result.title, result.description, result.focusKeyword);
        setRowState(row.route, { status: "done", result });
      } catch (e) {
        setRowState(row.route, {
          status: "error",
          error: e instanceof Error ? e.message : "Failed",
        });
      }
      setBulkProgress({ done: i + 1, total: targets.length });
    }

    setBulkFilling(false);
    setBulkProgress(null);
    router.refresh();
  }

  const missingCount = rows.filter((r) => !r.dbTitle || !r.dbDescription).length;
  const doneCount = Object.values(states).filter((s) => s.status === "done").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-playfair)] font-semibold text-[var(--color-navy)]">
            Bulk AI SEO Fill
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Auto-generate optimised title, description &amp; focus keyword for every public page.{" "}
            {missingCount > 0 && (
              <span className="text-amber-600 font-medium">{missingCount} pages have no override yet.</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {missingCount > 0 && (
            <button
              onClick={() => handleFillAll(true)}
              disabled={bulkFilling}
              className="inline-flex items-center gap-1.5 text-xs btn-secondary py-2 px-3 disabled:opacity-50"
            >
              {bulkFilling ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Sparkles size={12} />
              )}
              Fill {missingCount} Missing
            </button>
          )}
          <button
            onClick={() => handleFillAll(false)}
            disabled={bulkFilling}
            className="inline-flex items-center gap-1.5 text-xs btn-primary py-2 px-3 disabled:opacity-50"
          >
            {bulkFilling ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Sparkles size={12} />
            )}
            Re-fill All {rows.length} Pages
          </button>
        </div>
      </div>

      {bulkProgress && (
        <div className="bg-[var(--color-navy)]/5 border border-[var(--color-navy)]/10 rounded-xl px-4 py-3">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-medium text-[var(--color-navy)]">Bulk filling in progress…</span>
            <span className="text-slate-500">{bulkProgress.done} / {bulkProgress.total}</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-teal)] rounded-full transition-all duration-300"
              style={{ width: `${(bulkProgress.done / bulkProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {doneCount > 0 && !bulkFilling && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-xs text-emerald-700 font-medium flex items-center gap-2">
          <CheckCircle size={13} />
          {doneCount} page{doneCount > 1 ? "s" : ""} updated in this session.
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Page</th>
              <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">DB Title</th>
              <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">DB Description</th>
              <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Focus Keyword</th>
              <th className="text-center py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((row) => {
              const st = states[row.route];
              const isFilling = st?.status === "filling";
              const isDone = st?.status === "done";
              const isError = st?.status === "error";
              const effectiveTitle = st?.result?.title ?? row.dbTitle;
              const effectiveDesc = st?.result?.description ?? row.dbDescription;
              const effectiveKw = st?.result?.focusKeyword ?? row.dbFocusKeyword;
              const isMissing = !effectiveTitle || !effectiveDesc;

              return (
                <tr
                  key={row.route}
                  className={`transition-colors ${
                    isDone
                      ? "bg-emerald-50/40"
                      : isMissing
                      ? "bg-amber-50/30"
                      : "hover:bg-slate-50/60"
                  }`}
                >
                  <td className="py-2.5 px-3">
                    <div className="font-medium text-[var(--color-navy)] text-xs">{row.label}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{row.route}</div>
                  </td>
                  <td className="py-2.5 px-3 max-w-[180px]">
                    {effectiveTitle ? (
                      <div className="text-xs text-slate-700 line-clamp-2">
                        {effectiveTitle}
                        <span className={`ml-1 text-[10px] ${effectiveTitle.length >= 50 && effectiveTitle.length <= 60 ? "text-emerald-600" : "text-amber-500"}`}>
                          ({effectiveTitle.length})
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-300 italic">No override</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 max-w-[220px]">
                    {effectiveDesc ? (
                      <div className="text-xs text-slate-500 line-clamp-2">
                        {effectiveDesc}
                        <span className={`ml-1 text-[10px] ${effectiveDesc.length >= 140 && effectiveDesc.length <= 165 ? "text-emerald-600" : "text-amber-500"}`}>
                          ({effectiveDesc.length})
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-300 italic">No override</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    {effectiveKw ? (
                      <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        {effectiveKw}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-300 italic">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {isError ? (
                      <button
                        onClick={() => handleFillOne(row)}
                        className="inline-flex items-center gap-1 text-[10px] text-[var(--color-maroon)] border border-[var(--color-maroon)]/30 rounded-lg px-2.5 py-1 hover:bg-[var(--color-maroon)]/5"
                        title={st?.error}
                      >
                        <AlertCircle size={10} /> Retry
                      </button>
                    ) : isFilling ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-[var(--color-teal)]">
                        <Loader2 size={10} className="animate-spin" /> Filling…
                      </span>
                    ) : isDone ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600">
                        <CheckCircle size={10} /> Done
                        <button
                          onClick={() => handleFillOne(row)}
                          className="ml-1 text-slate-400 hover:text-[var(--color-teal)]"
                          title="Redo"
                        >
                          <ChevronRight size={10} />
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleFillOne(row)}
                        disabled={bulkFilling}
                        className="inline-flex items-center gap-1 text-[10px] text-[var(--color-teal)] border border-[var(--color-teal)]/30 rounded-lg px-2.5 py-1 hover:bg-[var(--color-teal)]/5 disabled:opacity-40"
                      >
                        <Sparkles size={10} /> AI Fill
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

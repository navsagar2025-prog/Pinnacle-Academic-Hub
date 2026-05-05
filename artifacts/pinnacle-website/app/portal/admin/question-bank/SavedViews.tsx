"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Bookmark, ChevronDown, Pencil, Trash2, Plus } from "lucide-react";

type SavedView = {
  id: string;
  name: string;
  queryString: string;
};

// Keys we consider "filter state" — anything else (notably `page`) is stripped
// before saving so a saved view always lands on page 1 of its filter set.
const FILTER_KEYS = ["subject", "topic", "difficulty", "type", "year", "examName", "pyq", "q"];

function buildFilterQuery(sp: URLSearchParams): string {
  const out = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const v = sp.get(key);
    if (v) out.set(key, v);
  }
  return out.toString();
}

export function SavedViews({ initialViews }: { initialViews: SavedView[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [views, setViews] = useState<SavedView[]>(initialViews);
  const [open, setOpen] = useState(false);
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const currentQuery = buildFilterQuery(new URLSearchParams(sp.toString()));

  async function refreshViews() {
    const r = await fetch("/api/v1/question-bank/saved-views", { cache: "no-store" });
    if (r.ok) {
      const data = await r.json();
      setViews(data.views ?? []);
    }
  }

  function applyView(v: SavedView) {
    setOpen(false);
    // Preserve no other params — saved views fully replace the filter state.
    router.push(`?${v.queryString}`);
  }

  async function saveCurrent() {
    setError(null);
    const name = window.prompt("Name this view (e.g. \"Maths · Matrices · PYQ\")")?.trim();
    if (!name) return;
    const r = await fetch("/api/v1/question-bank/saved-views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, queryString: currentQuery }),
    });
    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      setError(data?.error ?? "Failed to save view");
      return;
    }
    await refreshViews();
    setOpen(true);
  }

  async function renameView(v: SavedView) {
    setError(null);
    const name = window.prompt("Rename view", v.name)?.trim();
    if (!name || name === v.name) return;
    const r = await fetch(`/api/v1/question-bank/saved-views/${v.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      setError(data?.error ?? "Failed to rename");
      return;
    }
    await refreshViews();
  }

  async function deleteView(v: SavedView) {
    if (!window.confirm(`Delete saved view "${v.name}"?`)) return;
    setError(null);
    const r = await fetch(`/api/v1/question-bank/saved-views/${v.id}`, { method: "DELETE" });
    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      setError(data?.error ?? "Failed to delete");
      return;
    }
    await refreshViews();
  }

  return (
    <div ref={wrapRef} className="flex items-center gap-2 relative">
      <button
        type="button"
        onClick={() => startTransition(saveCurrent)}
        disabled={busy}
        className="px-3 py-2 rounded-lg text-sm font-semibold bg-[var(--color-navy)] text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
        title={currentQuery ? "Save current filter combination" : "Save the unfiltered (all-questions) view"}
      >
        <Plus size={14} /> Save current view
      </button>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="px-3 py-2 rounded-lg text-sm font-semibold bg-white border border-slate-200 text-[var(--color-navy)] hover:bg-slate-50 flex items-center gap-1.5"
      >
        <Bookmark size={14} />
        Saved views
        {views.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-600">{views.length}</span>
        )}
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-72 max-h-80 overflow-auto rounded-xl border border-slate-200 bg-white shadow-elevated z-20">
          {views.length === 0 ? (
            <div className="p-4 text-sm text-slate-400 text-center">
              No saved views yet. Apply filters and click <b>Save current view</b>.
            </div>
          ) : (
            <ul className="py-1">
              {views.map((v) => (
                <li key={v.id} className="group flex items-center gap-1 px-2 py-1 hover:bg-slate-50">
                  <button
                    type="button"
                    onClick={() => applyView(v)}
                    className="flex-1 min-w-0 text-left px-2 py-1.5 text-sm text-[var(--color-navy)] truncate"
                    title={v.queryString ? `?${v.queryString}` : "No filters"}
                  >
                    {v.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => renameView(v)}
                    className="p-1.5 rounded text-slate-400 hover:text-[var(--color-navy)] hover:bg-slate-100"
                    title="Rename"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteView(v)}
                    className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && (
        <div className="absolute right-0 top-full mt-1 w-72 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3 py-2 z-30">
          {error}
        </div>
      )}
    </div>
  );
}

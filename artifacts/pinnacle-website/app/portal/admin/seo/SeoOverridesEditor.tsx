"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X, Check, Trash2, Plus } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

type SeoRow = {
  id: string;
  route: string;
  title: string | null;
  description: string | null;
  focusKeyword: string | null;
  noIndex: boolean | null;
  updatedAt: Date | string;
};

function EditModal({ row, onClose }: { row: Partial<SeoRow> & { route: string }; onClose: () => void }) {
  const router = useRouter();
  const [route, setRoute] = useState(row.route);
  const [title, setTitle] = useState(row.title ?? "");
  const [description, setDescription] = useState(row.description ?? "");
  const [focusKeyword, setFocusKeyword] = useState(row.focusKeyword ?? "");
  const [noIndex, setNoIndex] = useState(row.noIndex ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!route.trim()) return setError("Route is required");
    setSaving(true);
    setError("");
    const res = await fetch(`${BASE}/api/v1/seo`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ route, title, description, focusKeyword, noIndex }),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Save failed");
      return;
    }
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-[family-name:var(--font-playfair)] text-lg font-bold text-[var(--color-navy)]">Edit SEO Override</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 rounded-lg p-1"><X size={18} /></button>
        </div>
        <form onSubmit={save} className="p-5 space-y-4">
          {error && <p className="text-sm text-[var(--color-maroon)] bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Route *</label>
            <input value={route} onChange={(e) => setRoute(e.target.value)} className="input-field font-mono text-sm" placeholder="/courses" required />
            <p className="text-xs text-slate-400 mt-1">The URL path, e.g. <code>/courses</code> or <code>/blog</code></p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Title Override</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="Overrides the &lt;title&gt; tag (leave blank to use default)" />
            {title && <p className={`text-xs mt-1 ${title.length >= 50 && title.length <= 60 ? "text-emerald-600" : "text-amber-600"}`}>{title.length} chars (ideal: 50–60)</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Meta Description Override</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-field resize-none" rows={3} placeholder="Overrides the meta description (leave blank to use default)" />
            {description && <p className={`text-xs mt-1 ${description.length >= 140 && description.length <= 165 ? "text-emerald-600" : "text-amber-600"}`}>{description.length} chars (ideal: 140–165)</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Focus Keyword</label>
            <input value={focusKeyword} onChange={(e) => setFocusKeyword(e.target.value)} className="input-field" placeholder="e.g. JEE coaching Greater Noida" />
          </div>
          <div className="flex items-center gap-2">
            <input id="noIndex" type="checkbox" checked={noIndex} onChange={(e) => setNoIndex(e.target.checked)} className="w-4 h-4 accent-[var(--color-maroon)]" />
            <label htmlFor="noIndex" className="text-sm text-slate-600">
              Add <code>noindex</code> (hide from search engines)
            </label>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5 text-sm disabled:opacity-50">
              {saving ? "Saving…" : "Save Override"}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5 text-sm">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function SeoOverridesTable({ rows }: { rows: SeoRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<(Partial<SeoRow> & { route: string }) | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(route: string) {
    setDeleting(route);
    await fetch(`${BASE}/api/v1/seo?route=${encodeURIComponent(route)}`, { method: "DELETE" });
    setDeleting(null);
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">SEO Overrides</h2>
        <button
          onClick={() => setEditing({ route: "" })}
          className="inline-flex items-center gap-1.5 text-xs btn-secondary py-1.5 px-3"
        >
          <Plus size={13} /> Add Override
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">No SEO overrides configured. Add overrides to customise titles and descriptions for specific pages.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {["Route", "Title Override", "Description Override", "Focus Keyword", "NoIndex", "Actions"].map((h) => (
                  <th key={h} className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-[var(--color-slate-light)]/50 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-xs text-[var(--color-navy)]">{r.route}</td>
                  <td className="py-2.5 px-3 text-xs text-slate-600 max-w-[200px]">
                    {r.title ? (
                      <span className="line-clamp-2">{r.title}</span>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="py-2.5 px-3 text-xs text-slate-500 max-w-[220px]">
                    {r.description ? (
                      <span className="line-clamp-2">{r.description}</span>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="py-2.5 px-3 text-xs text-slate-500">
                    {r.focusKeyword ?? <span className="text-slate-300">—</span>}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {r.noIndex ? (
                      <span className="badge text-xs bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]">noindex</span>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditing(r)}
                        className="text-xs text-[var(--color-teal)] hover:underline flex items-center gap-1"
                      >
                        <Pencil size={11} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(r.route)}
                        disabled={deleting === r.route}
                        className="text-xs text-[var(--color-maroon)] hover:underline flex items-center gap-1 disabled:opacity-50"
                      >
                        <Trash2 size={11} /> {deleting === r.route ? "…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing !== null && (
        <EditModal row={editing} onClose={() => setEditing(null)} />
      )}
    </>
  );
}

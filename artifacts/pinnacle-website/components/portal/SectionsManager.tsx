"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, Plus, Trash2, Pencil, Check, X } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

export type SectionRow = { id: string; name: string; ordering: number; instructions: string | null };

export function SectionsManager({ testId, initialSections }: { testId: string; initialSections: SectionRow[] }) {
  const router = useRouter();
  const [sections, setSections] = useState(initialSections);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  async function add() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCreating(true); setError("");
    try {
      const res = await fetch(`${BASE}/api/v1/mock-tests/${testId}/sections`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed"); return; }
      setSections([...sections, data.section]);
      setName("");
      router.refresh();
    } finally { setCreating(false); }
  }

  async function rename(id: string) {
    const trimmed = editName.trim();
    if (!trimmed) { setEditing(null); return; }
    const res = await fetch(`${BASE}/api/v1/mock-tests/${testId}/sections/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    if (res.ok) {
      setSections(sections.map((s) => s.id === id ? { ...s, name: trimmed } : s));
      router.refresh();
    }
    setEditing(null);
  }

  async function remove(id: string) {
    if (!confirm("Delete this section? Questions in it will move to General.")) return;
    const res = await fetch(`${BASE}/api/v1/mock-tests/${testId}/sections/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSections(sections.filter((s) => s.id !== id));
      router.refresh();
    }
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <Layers size={16} className="text-[var(--color-teal)]" />
        <h2 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">Sections</h2>
        <span className="text-xs text-slate-400 ml-1">Optional — group questions (e.g. Physics / Chemistry / Maths)</span>
      </div>
      {sections.length === 0 ? (
        <p className="text-xs text-slate-400 mb-3">No sections yet. Without sections all questions appear in a single &ldquo;General&rdquo; group.</p>
      ) : (
        <ul className="space-y-1.5 mb-3">
          {sections.map((s, i) => (
            <li key={s.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50">
              <span className="text-xs text-slate-400 font-mono w-5">{i + 1}.</span>
              {editing === s.id ? (
                <>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus
                    onKeyDown={(e) => { if (e.key === "Enter") rename(s.id); if (e.key === "Escape") setEditing(null); }}
                    className="flex-1 px-2 py-1 rounded border border-slate-200 text-sm" />
                  <button onClick={() => rename(s.id)} className="text-[var(--color-teal)] hover:text-[var(--color-teal-light)]"><Check size={14} /></button>
                  <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium text-[var(--color-navy)]">{s.name}</span>
                  <button onClick={() => { setEditing(s.id); setEditName(s.name); }} className="text-slate-400 hover:text-[var(--color-teal)]" aria-label="Rename"><Pencil size={12} /></button>
                  <button onClick={() => remove(s.id)} className="text-slate-400 hover:text-[var(--color-maroon)]" aria-label="Delete"><Trash2 size={12} /></button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") add(); }}
          placeholder="New section name (e.g. Physics)"
          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" />
        <button onClick={add} disabled={creating || !name.trim()}
          className="btn-gold text-sm px-3 py-2 flex items-center gap-1.5 disabled:opacity-50">
          <Plus size={14} />Add
        </button>
      </div>
      {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2 mt-2">{error}</p>}
    </div>
  );
}

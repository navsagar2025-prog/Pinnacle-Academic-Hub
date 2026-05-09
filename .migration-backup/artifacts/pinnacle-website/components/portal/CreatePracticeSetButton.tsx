"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

export function CreatePracticeSetButton({ basePath }: { basePath: "admin" | "teacher" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!name.trim()) { setErr("Name is required"); return; }
    setBusy(true);
    try {
      const res = await fetch(`${BASE}/api/v1/practice-sets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          subject: subject.trim() || null,
          description: description.trim() || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to create set");
      }
      const { set } = (await res.json()) as { set: { id: string } };
      router.push(`/portal/${basePath}/practice-sets/${set.id}`);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Unexpected error");
      setBusy(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-gold text-sm px-4 py-2 flex items-center gap-1.5">
        <Plus size={16} /> New Practice Set
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !busy && setOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[var(--color-navy)]">New Practice Set</h2>
              <button onClick={() => !busy && setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Set name</label>
                <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. JEE Main 2024 — Mechanics PYQs" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Subject (optional)</label>
                <input className="input-field" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Physics / Chemistry / …" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Description (optional)</label>
                <textarea className="input-field resize-y" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this set is for…" />
              </div>
              {err && <p className="text-xs text-[var(--color-maroon)]">{err}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => !busy && setOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">Cancel</button>
                <button type="submit" disabled={busy} className="btn-gold text-sm px-4 py-2 disabled:opacity-60">
                  {busy ? "Creating…" : "Create & add questions"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

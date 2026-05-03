"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Plus } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

type Batch = { id: string; name: string; courseTitle: string | null };

export function CreateTestButton({ batches }: { batches: Batch[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-gold text-sm px-4 py-2 flex items-center gap-1.5">
        <Plus size={16} /> Create Test
      </button>
      {open && <CreateTestModal batches={batches} onClose={() => setOpen(false)} />}
    </>
  );
}

function CreateTestModal({ batches, onClose }: { batches: Batch[]; onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    subject: "Physics",
    examType: "JEE Main",
    batchId: "",
    durationMinutes: 60,
    marksPerQuestion: 4,
    negativeMarkingPercent: 25,
    instructions: "",
    isPublic: false,
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch(`${BASE}/api/v1/mock-tests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, batchId: form.batchId || null }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Failed"); return; }
    router.push(`/portal/admin/mock-tests/${data.test.id}`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-[family-name:var(--font-playfair)] font-bold text-[var(--color-navy)] text-lg">Create Mock Test</h2>
          <button onClick={onClose} aria-label="Close"><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Title</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="JEE Main Mock Test 1 · Mechanics" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Subject</label>
              <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white">
                {["Physics", "Chemistry", "Mathematics", "Biology", "Mixed"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Exam Type</label>
              <select value={form.examType} onChange={(e) => setForm({ ...form, examType: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white">
                {["JEE Main", "JEE Advanced", "NEET", "CBSE", "Foundation", "Mixed"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Audience</label>
            <select value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white">
              <option value="">All students</option>
              {batches.map((b) => <option key={b.id} value={b.id}>{b.name} {b.courseTitle ? `· ${b.courseTitle}` : ""}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Duration (min)</label>
              <input type="number" min={5} value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Marks/Q</label>
              <input type="number" min={1} value={form.marksPerQuestion}
                onChange={(e) => setForm({ ...form, marksPerQuestion: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Neg %</label>
              <input type="number" min={0} max={100} value={form.negativeMarkingPercent}
                onChange={(e) => setForm({ ...form, negativeMarkingPercent: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Instructions (optional)</label>
            <textarea rows={3} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              placeholder="Read each question carefully. No calculator allowed."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none" />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isPublic} onChange={(e) => setForm({ ...form, isPublic: e.target.checked })} className="rounded" />
            <span className="text-sm text-slate-600">Public scholarship/entrance test (no login required)</span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-[var(--color-teal)] text-white text-sm font-semibold hover:bg-[var(--color-teal-light)] disabled:opacity-50">
              {loading ? "Creating…" : "Create & Add Questions"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

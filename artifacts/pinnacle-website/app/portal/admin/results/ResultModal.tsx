"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Pencil, Trash2 } from "lucide-react";
import type { Result } from "@workspace/db/schema";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

export function AddResultButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn-primary py-2.5 px-5 text-sm" onClick={() => setOpen(true)}>
        <Plus size={15} /> Add Result
      </button>
      {open && <ResultModal onClose={() => setOpen(false)} />}
    </>
  );
}

export function EditResultButton({ result }: { result: Result }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="text-xs font-semibold text-[var(--color-teal)] hover:underline" onClick={() => setOpen(true)}>
        <Pencil size={12} className="inline mr-1" />Edit
      </button>
      {open && <ResultModal result={result} onClose={() => setOpen(false)} />}
    </>
  );
}

export function DeleteResultButton({ resultId }: { resultId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this result entry?")) return;
    setLoading(true);
    await fetch(`${BASE}/api/v1/results/${resultId}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button disabled={loading} onClick={handleDelete} className="text-xs font-semibold text-[var(--color-maroon)] hover:underline">
      <Trash2 size={12} className="inline mr-1" />{loading ? "…" : "Delete"}
    </button>
  );
}

function ResultModal({ result, onClose }: { result?: Result; onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    studentName: result?.studentName ?? "",
    examName: result?.examName ?? "",
    rank: result?.rank ?? "",
    college: result?.college ?? "",
    batch: result?.batch ?? "",
    academicYear: result?.academicYear ?? new Date().getFullYear().toString(),
    quote: result?.quote ?? "",
    initials: result?.initials ?? "",
    isTopper: result?.isTopper ?? false,
  });

  const set = (k: string, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const url = result ? `${BASE}/api/v1/results/${result.id}` : `${BASE}/api/v1/results`;
    const method = result ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Failed"); return; }
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-[family-name:var(--font-playfair)] font-bold text-[var(--color-navy)] text-lg">{result ? "Edit Result" : "Add Result"}</h2>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          {[
            { label: "Student Name *", key: "studentName", placeholder: "Aditya Sharma" },
            { label: "Exam Name *", key: "examName", placeholder: "JEE Advanced 2025" },
            { label: "Rank *", key: "rank", placeholder: "AIR 342 / 99.4 Percentile" },
            { label: "College / Institution", key: "college", placeholder: "IIT Bombay — Computer Science" },
            { label: "Batch", key: "batch", placeholder: "JEE 2025 — Evening" },
            { label: "Academic Year *", key: "academicYear", placeholder: "2025" },
            { label: "Initials *", key: "initials", placeholder: "AS", maxLength: 2 },
            { label: "Student Quote", key: "quote", placeholder: "Pinnacle's guidance transformed my preparation." },
          ].map(({ label, key, placeholder, maxLength }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
              <input
                type="text"
                value={form[key as keyof typeof form] as string}
                onChange={(e) => set(key, e.target.value)}
                placeholder={placeholder}
                maxLength={maxLength}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]"
              />
            </div>
          ))}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isTopper} onChange={(e) => set("isTopper", e.target.checked)} className="rounded" />
            <span className="text-sm text-slate-600">Feature as Topper on public results page</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-outline py-2.5 text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary py-2.5 text-sm">{loading ? "Saving…" : "Save Result"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Sparkles } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

type Batch = { id: string; name: string; courseTitle: string | null };

export function TeacherCreateTestButton({ batches, allowedSubjects }: { batches: Batch[]; allowedSubjects: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-gold text-sm px-4 py-2 flex items-center gap-1.5">
        <Plus size={16} /> Create Test
      </button>
      {open && <TeacherCreateTestModal batches={batches} allowedSubjects={allowedSubjects} onClose={() => setOpen(false)} />}
    </>
  );
}

function TeacherCreateTestModal({ batches, allowedSubjects, onClose }: { batches: Batch[]; allowedSubjects: string[]; onClose: () => void }) {
  const router = useRouter();
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const subjects = allowedSubjects.length > 0 ? allowedSubjects : ["Physics"];
  const [form, setForm] = useState({
    title: "",
    subject: subjects[0],
    examType: "JEE Main",
    batchId: "",
    durationMinutes: 60,
    marksPerQuestion: 4,
    negativeMarkingPercent: 25,
    instructions: "",
    isPublic: false,
    classGrade: "",
    difficulty: "mixed",
    fromYear: "",
    toYear: "",
    count: 20,
    isPublished: false,
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    if (mode === "manual") {
      const res = await fetch(`${BASE}/api/v1/mock-tests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, batchId: form.batchId || null }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) { setError(data.error ?? "Failed"); return; }
      router.push(`/portal/teacher/mock-tests/${data.test.id}`);
    } else {
      const res = await fetch(`${BASE}/api/v1/mock-tests/auto-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          subject: form.subject,
          examType: form.examType,
          batchId: form.batchId || null,
          durationMinutes: form.durationMinutes,
          marksPerQuestion: form.marksPerQuestion,
          negativeMarkingPercent: form.negativeMarkingPercent,
          instructions: form.instructions,
          isPublic: form.isPublic,
          classGrade: form.classGrade || null,
          difficulty: form.difficulty,
          fromYear: form.fromYear ? Number(form.fromYear) : null,
          toYear: form.toYear ? Number(form.toYear) : null,
          count: form.count,
          isPublished: form.isPublished,
        }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) { setError(data.error ?? "Failed"); return; }
      router.push(`/portal/teacher/mock-tests/${data.test.id}`);
    }
  }

  const input = "w-full px-3 py-2 rounded-lg border border-slate-200 text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-[family-name:var(--font-playfair)] font-bold text-[var(--color-navy)] text-lg">Create Mock Test</h2>
          <button onClick={onClose} aria-label="Close"><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
        </div>

        <div className="px-5 pt-4">
          <div className="grid grid-cols-2 gap-2 bg-slate-100 rounded-lg p-1">
            <button type="button" onClick={() => setMode("manual")}
              className={`text-sm font-semibold py-1.5 rounded-md ${mode === "manual" ? "bg-white shadow text-[var(--color-navy)]" : "text-slate-500"}`}>
              Manual (add Qs later)
            </button>
            <button type="button" onClick={() => setMode("auto")}
              className={`text-sm font-semibold py-1.5 rounded-md flex items-center justify-center gap-1 ${mode === "auto" ? "bg-white shadow text-[var(--color-gold)]" : "text-slate-500"}`}>
              <Sparkles size={13} /> Auto from Bank
            </button>
          </div>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Title</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="JEE Main Mock Test 1 · Mechanics" className={input} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Subject</label>
              <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={input + " bg-white"}>
                {subjects.map((s) => <option key={s}>{s}</option>)}
              </select>
              {subjects.length === 1 && (
                <p className="text-[10px] text-slate-400 mt-0.5">Restricted to your subject</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Exam Type</label>
              <select value={form.examType} onChange={(e) => setForm({ ...form, examType: e.target.value })} className={input + " bg-white"}>
                {["JEE Main", "JEE Advanced", "NEET", "CBSE", "Foundation", "Mixed"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Audience</label>
            <select value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })} className={input + " bg-white"}>
              <option value="">All students</option>
              {batches.map((b) => <option key={b.id} value={b.id}>{b.name} {b.courseTitle ? `· ${b.courseTitle}` : ""}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Duration (min)</label>
              <input type="number" min={5} value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })} className={input} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Marks/Q</label>
              <input type="number" min={1} value={form.marksPerQuestion}
                onChange={(e) => setForm({ ...form, marksPerQuestion: Number(e.target.value) })} className={input} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Neg %</label>
              <input type="number" min={0} max={100} value={form.negativeMarkingPercent}
                onChange={(e) => setForm({ ...form, negativeMarkingPercent: Number(e.target.value) })} className={input} />
            </div>
          </div>

          {mode === "auto" && (
            <div className="rounded-lg border border-[var(--color-gold)]/30 bg-[var(--color-gold)]/5 p-3 space-y-3">
              <p className="text-xs text-slate-600">Pulls published MCQs from the Question Bank that match these filters.</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Class</label>
                  <input className={input} value={form.classGrade} onChange={(e) => setForm({ ...form, classGrade: e.target.value })} placeholder="Any" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Difficulty</label>
                  <select className={input + " bg-white"} value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                    <option value="mixed">Mixed</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">From Year</label>
                  <input type="number" className={input} value={form.fromYear} onChange={(e) => setForm({ ...form, fromYear: e.target.value })} placeholder="2018" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">To Year</label>
                  <input type="number" className={input} value={form.toYear} onChange={(e) => setForm({ ...form, toYear: e.target.value })} placeholder="2024" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1"># of Questions (max 100)</label>
                <input type="number" min={1} max={100} className={input} value={form.count}
                  onChange={(e) => setForm({ ...form, count: Number(e.target.value) })} />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
                Publish immediately to students
              </label>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Instructions (optional)</label>
            <textarea rows={2} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              placeholder="Read each question carefully. No calculator allowed." className={input + " resize-none"} />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isPublic} onChange={(e) => setForm({ ...form, isPublic: e.target.checked })} className="rounded" />
            <span className="text-sm text-slate-600">Public scholarship/entrance test (no login required)</span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-[var(--color-teal)] text-white text-sm font-semibold hover:bg-[var(--color-teal-light)] disabled:opacity-50 flex items-center gap-1.5">
              {mode === "auto" && <Sparkles size={14} />}
              {loading ? "Working…" : mode === "auto" ? "Generate Test" : "Create & Add Questions"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

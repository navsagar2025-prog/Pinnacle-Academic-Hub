"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Eye, EyeOff, Upload, Trash2, CalendarClock, Save } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

type Test = {
  id: string;
  title: string;
  isPublished: boolean;
  isPublic: boolean;
  scheduledStart: string | null;
  scheduledEnd: string | null;
};

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TeacherManageTestClient({ test }: { test: Test }) {
  const router = useRouter();
  const [published, setPublished] = useState(test.isPublished);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    questionText: "", optionA: "", optionB: "", optionC: "", optionD: "",
    correctOption: "A", topic: "", explanation: "",
  });

  async function togglePublished() {
    const next = !published;
    setPublished(next);
    await fetch(`${BASE}/api/v1/mock-tests/${test.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: next }),
    });
    router.refresh();
  }

  async function deleteTest() {
    if (!confirm("Delete this test? This cannot be undone.")) return;
    setDeleting(true);
    await fetch(`${BASE}/api/v1/mock-tests/${test.id}`, { method: "DELETE" });
    router.push("/portal/teacher/mock-tests");
  }

  async function addQuestion(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.questionText || !form.optionA || !form.optionB || !form.optionC || !form.optionD) {
      setError("Please fill in question text and all four options.");
      return;
    }
    const res = await fetch(`${BASE}/api/v1/mock-tests/${test.id}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed"); return; }
    setForm({ questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "A", topic: form.topic, explanation: "" });
    setAdding(true);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <ScheduleEditor testId={test.id} initialStart={test.scheduledStart} initialEnd={test.scheduledEnd} />
      <BulkImportCard testId={test.id} onImported={() => router.refresh()} />
      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-semibold text-sm text-[var(--color-navy)]">Visibility</div>
          <div className="text-xs text-slate-500">
            {published ? "Live — students can take this test" : "Draft — hidden from students"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={togglePublished}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors ${
              published
                ? "bg-[var(--color-teal)] text-white hover:bg-[var(--color-teal-light)]"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {published ? <Eye size={14} /> : <EyeOff size={14} />}
            {published ? "Published" : "Publish"}
          </button>
          <button
            onClick={deleteTest}
            disabled={deleting}
            className="px-3 py-2 rounded-lg text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Trash2 size={14} />
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">Add Question</h2>
          <button onClick={() => setAdding((a) => !a)} className="text-xs text-[var(--color-teal)] font-semibold hover:underline">
            {adding ? "Hide" : "Show form"}
          </button>
        </div>
        {adding && (
          <form onSubmit={addQuestion} className="space-y-3">
            {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <textarea required rows={2} placeholder="Question text" value={form.questionText}
              onChange={(e) => setForm({ ...form, questionText: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(["A", "B", "C", "D"] as const).map((opt) => (
                <input key={opt} required placeholder={`Option ${opt}`}
                  value={form[`option${opt}` as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [`option${opt}`]: e.target.value } as typeof form)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select value={form.correctOption} onChange={(e) => setForm({ ...form, correctOption: e.target.value })}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white">
                {(["A", "B", "C", "D"] as const).map((o) => <option key={o} value={o}>Correct: {o}</option>)}
              </select>
              <input placeholder="Topic (e.g. Kinematics)" value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
            </div>
            <textarea rows={2} placeholder="Explanation (shown after submission, optional)" value={form.explanation}
              onChange={(e) => setForm({ ...form, explanation: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none" />
            <button type="submit" className="btn-gold text-sm px-4 py-2 flex items-center gap-1.5">
              <Plus size={14} /> Add Question
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function ScheduleEditor({ testId, initialStart, initialEnd }: { testId: string; initialStart: string | null; initialEnd: string | null }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(Boolean(initialStart || initialEnd));
  const [start, setStart] = useState(toLocalInput(initialStart));
  const [end, setEnd] = useState(toLocalInput(initialEnd));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  async function save() {
    setError(""); setMsg("");
    const payload = enabled
      ? { scheduledStart: start ? new Date(start).toISOString() : null, scheduledEnd: end ? new Date(end).toISOString() : null }
      : { scheduledStart: null, scheduledEnd: null };
    if (enabled) {
      if (!start || !end) { setError("Pick both an opens-at and closes-at time."); return; }
      if (new Date(end).getTime() <= new Date(start).getTime()) { setError("Schedule end must be after start."); return; }
    }
    setSaving(true);
    const res = await fetch(`${BASE}/api/v1/mock-tests/${testId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save schedule");
      return;
    }
    setMsg(enabled ? "Schedule saved." : "Schedule cleared.");
    router.refresh();
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)] flex items-center gap-2">
            <CalendarClock size={16} className="text-[var(--color-teal)]" />Schedule
          </h2>
          <p className="text-xs text-slate-500 mt-1">Limit when students can start this test. Leave off for an always-open test.</p>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold text-[var(--color-navy)] cursor-pointer">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="rounded" />
          Schedule a window
        </label>
      </div>
      {enabled && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Opens at</label>
            <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Closes at</label>
            <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
          </div>
        </div>
      )}
      {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2 mt-3">{error}</p>}
      {msg && <p className="text-[var(--color-teal)] text-sm bg-[var(--color-teal)]/10 rounded-lg px-3 py-2 mt-3">{msg}</p>}
      <div className="flex justify-end mt-3">
        <button onClick={save} disabled={saving}
          className="px-4 py-2 rounded-lg bg-[var(--color-teal)] text-white text-sm font-semibold hover:bg-[var(--color-teal-light)] disabled:opacity-50 flex items-center gap-1.5">
          <Save size={14} />{saving ? "Saving…" : "Save schedule"}
        </button>
      </div>
    </div>
  );
}

function BulkImportCard({ testId, onImported }: { testId: string; onImported: () => void }) {
  const [open, setOpen] = useState(false);
  const [csv, setCsv] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsv(await file.text());
  }

  async function submit() {
    setLoading(true); setError(""); setResult(null);
    const res = await fetch(`${BASE}/api/v1/mock-tests/${testId}/questions/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Import failed"); return; }
    setResult({ imported: data.imported, skipped: data.skipped, errors: data.errors ?? [] });
    setCsv("");
    onImported();
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)] flex items-center gap-2">
            <Upload size={16} className="text-[var(--color-teal)]" />Bulk Import Questions
          </h2>
          <p className="text-xs text-slate-500 mt-1">Paste CSV or upload a .csv file with columns: questionText, optionA, optionB, optionC, optionD, correctOption (and optionally topic, explanation)</p>
        </div>
        <button onClick={() => setOpen((o) => !o)} className="text-xs text-[var(--color-teal)] font-semibold hover:underline">
          {open ? "Hide" : "Open importer"}
        </button>
      </div>
      {open && (
        <div className="mt-4 space-y-3">
          <input type="file" accept=".csv,text/csv" onChange={handleFile}
            className="block text-xs text-slate-600 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border file:border-slate-200 file:bg-white file:text-xs file:font-semibold file:text-[var(--color-navy)] hover:file:bg-slate-50" />
          <textarea rows={6} value={csv} onChange={(e) => setCsv(e.target.value)}
            placeholder={`questionText,optionA,optionB,optionC,optionD,correctOption,topic,explanation\n"What is 2+2?","3","4","5","6","B","Math",`}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono resize-none" />
          {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          {result && (
            <div className="bg-[var(--color-teal)]/10 text-[var(--color-teal)] rounded-lg px-3 py-2 text-sm">
              Imported {result.imported} questions{result.skipped > 0 && `, skipped ${result.skipped}`}.
              {result.errors.length > 0 && (
                <ul className="mt-2 text-xs text-slate-600 list-disc list-inside">
                  {result.errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              )}
            </div>
          )}
          <button onClick={submit} disabled={loading || !csv.trim()}
            className="btn-gold px-4 py-2 text-sm flex items-center gap-1.5 disabled:opacity-50">
            <Upload size={14} />{loading ? "Importing…" : "Import"}
          </button>
        </div>
      )}
    </div>
  );
}

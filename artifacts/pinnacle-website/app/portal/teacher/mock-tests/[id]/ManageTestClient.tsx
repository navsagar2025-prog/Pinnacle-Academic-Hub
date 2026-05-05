"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Eye, EyeOff, Upload, Trash2, CalendarClock, Save, Image as ImageIcon, X } from "lucide-react";
import FileUpload from "@/components/upload/FileUpload";
import { SectionsManager, type SectionRow } from "@/components/portal/SectionsManager";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

type Test = {
  id: string;
  title: string;
  isPublished: boolean;
  isPublic: boolean;
  scheduledStart: string | null;
  scheduledEnd: string | null;
};

type ImageState = {
  imageUrl: string;
  optionAImageUrl: string;
  optionBImageUrl: string;
  optionCImageUrl: string;
  optionDImageUrl: string;
  explanationImageUrl: string;
};
const EMPTY_IMAGES: ImageState = {
  imageUrl: "", optionAImageUrl: "", optionBImageUrl: "",
  optionCImageUrl: "", optionDImageUrl: "", explanationImageUrl: "",
};

function ImageField({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  if (value) {
    return (
      <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-2 py-1.5 text-xs">
        <ImageIcon size={12} className="text-[var(--color-teal)]" />
        <img src={value} alt="" className="h-8 w-8 rounded object-cover border border-slate-200" />
        <span className="flex-1 text-slate-600 truncate">{label}: image attached</span>
        <button type="button" onClick={() => onChange("")} className="text-slate-400 hover:text-[var(--color-maroon)]">
          <X size={12} />
        </button>
      </div>
    );
  }
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        className="text-[11px] text-slate-400 hover:text-[var(--color-teal)] inline-flex items-center gap-1">
        <ImageIcon size={11} />Add image to {label}
      </button>
    );
  }
  return (
    <div className="space-y-1">
      <FileUpload
        category="mock_test_image"
        accept="image"
        label={`Upload ${label} image`}
        hint="JPG, PNG or WebP, max 5 MB"
        onUploaded={(_path, servingUrl) => { onChange(servingUrl); setOpen(false); }}
      />
      <button type="button" onClick={() => setOpen(false)} className="text-[11px] text-slate-400 hover:text-slate-600">Cancel</button>
    </div>
  );
}

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TeacherManageTestClient({ test, sections }: { test: Test; sections: SectionRow[] }) {
  const router = useRouter();
  const [published, setPublished] = useState(test.isPublished);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    questionText: "", optionA: "", optionB: "", optionC: "", optionD: "",
    correctOption: "A", topic: "", explanation: "",
    numericalAnswer: "", numericalTolerance: "0",
  });
  const [questionType, setQuestionType] = useState<"mcq" | "multi" | "numerical">("mcq");
  const [correctOptions, setCorrectOptions] = useState<Set<"A" | "B" | "C" | "D">>(new Set());
  const [sectionId, setSectionId] = useState<string>("");
  const [images, setImages] = useState<ImageState>(EMPTY_IMAGES);

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
    const hasQuestion = form.questionText.trim() || images.imageUrl;
    if (!hasQuestion) { setError("Question text or image is required."); return; }
    if (questionType === "mcq" || questionType === "multi") {
      const optHas = (txt: string, img: string) => Boolean(txt.trim() || img);
      if (!optHas(form.optionA, images.optionAImageUrl) || !optHas(form.optionB, images.optionBImageUrl) ||
          !optHas(form.optionC, images.optionCImageUrl) || !optHas(form.optionD, images.optionDImageUrl)) {
        setError("Each of the four options must have either text or an image."); return;
      }
      if (questionType === "multi" && correctOptions.size === 0) {
        setError("Pick at least one correct option for a multi-correct question."); return;
      }
    } else {
      const n = Number(form.numericalAnswer);
      if (form.numericalAnswer.trim() === "" || !Number.isFinite(n)) {
        setError("Numerical answer must be a number."); return;
      }
      const tol = Number(form.numericalTolerance);
      if (!Number.isFinite(tol) || tol < 0) {
        setError("Tolerance must be a non-negative number."); return;
      }
    }
    const payload: Record<string, unknown> = {
      questionType,
      sectionId: sectionId || null,
      questionText: form.questionText,
      topic: form.topic,
      explanation: form.explanation,
      ...images,
    };
    if (questionType === "mcq") {
      Object.assign(payload, {
        optionA: form.optionA, optionB: form.optionB, optionC: form.optionC, optionD: form.optionD,
        correctOption: form.correctOption,
      });
    } else if (questionType === "multi") {
      Object.assign(payload, {
        optionA: form.optionA, optionB: form.optionB, optionC: form.optionC, optionD: form.optionD,
        correctOptions: Array.from(correctOptions).sort(),
      });
    } else {
      Object.assign(payload, {
        numericalAnswer: Number(form.numericalAnswer),
        numericalTolerance: Number(form.numericalTolerance),
      });
    }
    const res = await fetch(`${BASE}/api/v1/mock-tests/${test.id}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed"); return; }
    setForm({ questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "A", topic: form.topic, explanation: "", numericalAnswer: "", numericalTolerance: "0" });
    setCorrectOptions(new Set());
    setImages(EMPTY_IMAGES);
    setAdding(true);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <ScheduleEditor testId={test.id} initialStart={test.scheduledStart} initialEnd={test.scheduledEnd} />
      <SectionsManager testId={test.id} initialSections={sections} />
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
            <p className="text-[11px] text-slate-400">
              Tip: wrap math in <code>$…$</code> for inline (e.g. <code>$x^2 + 1$</code>) or <code>$$…$$</code> for block. You can attach a diagram to the question and to each option.
            </p>
            <textarea rows={2} placeholder="Question text (supports $LaTeX$)" value={form.questionText}
              onChange={(e) => setForm({ ...form, questionText: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none" />
            <ImageField label="Question" value={images.imageUrl}
              onChange={(v) => setImages({ ...images, imageUrl: v })} />
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-500 mr-1">Type:</span>
              {(["mcq", "multi", "numerical"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setQuestionType(t)}
                  className={`px-2 py-1 rounded-md font-semibold transition-colors ${
                    questionType === t ? "bg-[var(--color-navy)] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}>
                  {t === "mcq" ? "Single correct" : t === "multi" ? "Multiple correct" : "Numerical"}
                </button>
              ))}
            </div>
            {(questionType === "mcq" || questionType === "multi") && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(["A", "B", "C", "D"] as const).map((opt) => {
                    const imgKey = `option${opt}ImageUrl` as keyof ImageState;
                    const isCorrect = questionType === "multi"
                      ? correctOptions.has(opt)
                      : form.correctOption === opt;
                    return (
                      <div key={opt} className={`space-y-1 p-2 rounded-lg border ${isCorrect ? "border-[var(--color-teal)] bg-[var(--color-teal)]/5" : "border-transparent"}`}>
                        <div className="flex items-center gap-2">
                          {questionType === "multi" ? (
                            <input type="checkbox" checked={correctOptions.has(opt)}
                              onChange={(e) => {
                                const next = new Set(correctOptions);
                                if (e.target.checked) next.add(opt); else next.delete(opt);
                                setCorrectOptions(next);
                              }}
                              className="accent-[var(--color-teal)]" title="Mark as correct" />
                          ) : (
                            <input type="radio" name="correctOption" checked={form.correctOption === opt}
                              onChange={() => setForm({ ...form, correctOption: opt })}
                              className="accent-[var(--color-teal)]" title="Mark as correct" />
                          )}
                          <input placeholder={`Option ${opt} (text or image)`}
                            value={form[`option${opt}` as "optionA" | "optionB" | "optionC" | "optionD"]}
                            onChange={(e) => setForm({ ...form, [`option${opt}`]: e.target.value } as typeof form)}
                            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" />
                        </div>
                        <ImageField label={opt} value={images[imgKey]}
                          onChange={(v) => setImages({ ...images, [imgKey]: v })} />
                      </div>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-400">
                  {questionType === "multi"
                    ? "Tick every option that is correct. Students get full marks only when their selection matches exactly."
                    : "Pick the single correct option using the radio button."}
                </p>
              </>
            )}
            {questionType === "numerical" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-blue-50/50 border border-blue-100 rounded-lg p-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Correct numerical answer</label>
                  <input type="text" inputMode="decimal" placeholder="e.g. 3.14"
                    value={form.numericalAnswer}
                    onChange={(e) => setForm({ ...form, numericalAnswer: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tolerance (± value)</label>
                  <input type="text" inputMode="decimal" placeholder="0"
                    value={form.numericalTolerance}
                    onChange={(e) => setForm({ ...form, numericalTolerance: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono" />
                </div>
                <p className="text-[11px] text-slate-500 sm:col-span-2">Student's response is correct if it falls within ± tolerance of the answer.</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input placeholder="Topic (e.g. Kinematics)" value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
              {sections.length > 0 && (
                <select value={sectionId} onChange={(e) => setSectionId(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white">
                  <option value="">No section (General)</option>
                  {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              )}
            </div>
            <textarea rows={2} placeholder="Explanation (shown after submission, supports $LaTeX$)" value={form.explanation}
              onChange={(e) => setForm({ ...form, explanation: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none" />
            <ImageField label="Explanation" value={images.explanationImageUrl}
              onChange={(v) => setImages({ ...images, explanationImageUrl: v })} />
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
          <p className="text-xs text-slate-500 mt-1">Paste CSV or upload a .csv file. Required: <code>questionText</code>. For MCQ also <code>optionA-D + correctOption (A|B|C|D)</code>. For multi-correct set <code>questionType=multi</code> and <code>correctOptions=A|C</code>. For numerical set <code>questionType=numerical</code> and <code>numericalAnswer</code> (optional <code>numericalTolerance</code>). Other optional: topic, explanation, imageUrl, optionAImageUrl…optionDImageUrl, explanationImageUrl. Wrap math with <code>$…$</code>.</p>
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

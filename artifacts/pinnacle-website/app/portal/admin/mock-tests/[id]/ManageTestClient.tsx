"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Eye, EyeOff, Upload, Image as ImageIcon, X } from "lucide-react";
import FileUpload from "@/components/upload/FileUpload";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

type Test = { id: string; title: string; isPublished: boolean; isPublic: boolean };

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

export function ManageTestClient({ test }: { test: Test }) {
  const router = useRouter();
  const [published, setPublished] = useState(test.isPublished);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    questionText: "", optionA: "", optionB: "", optionC: "", optionD: "",
    correctOption: "A", topic: "", explanation: "",
  });
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

  async function addQuestion(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const optHas = (txt: string, img: string) => Boolean(txt.trim() || img);
    const hasQuestion = form.questionText.trim() || images.imageUrl;
    if (!hasQuestion ||
        !optHas(form.optionA, images.optionAImageUrl) || !optHas(form.optionB, images.optionBImageUrl) ||
        !optHas(form.optionC, images.optionCImageUrl) || !optHas(form.optionD, images.optionDImageUrl)) {
      setError("Question and each option must have either text or an image.");
      return;
    }
    const res = await fetch(`${BASE}/api/v1/mock-tests/${test.id}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, ...images }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed"); return; }
    setForm({ questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "A", topic: form.topic, explanation: "" });
    setImages(EMPTY_IMAGES);
    setAdding(true);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <BulkImportCard testId={test.id} onImported={() => router.refresh()} />
      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-semibold text-sm text-[var(--color-navy)]">Visibility</div>
          <div className="text-xs text-slate-500">
            {published ? "Live — students can take this test" : "Draft — hidden from students"}
          </div>
        </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(["A", "B", "C", "D"] as const).map((opt) => {
                const imgKey = `option${opt}ImageUrl` as keyof ImageState;
                return (
                  <div key={opt} className="space-y-1">
                    <input placeholder={`Option ${opt} (text or image)`}
                      value={form[`option${opt}` as const]}
                      onChange={(e) => setForm({ ...form, [`option${opt}`]: e.target.value } as typeof form)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
                    <ImageField label={opt} value={images[imgKey]}
                      onChange={(v) => setImages({ ...images, [imgKey]: v })} />
                  </div>
                );
              })}
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
          <p className="text-xs text-slate-500 mt-1">Paste CSV or upload a .csv file. Required columns: questionText, optionA, optionB, optionC, optionD, correctOption. Optional: topic, explanation, imageUrl, optionAImageUrl, optionBImageUrl, optionCImageUrl, optionDImageUrl, explanationImageUrl. Wrap math with <code>$…$</code>.</p>
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
              ✓ Imported {result.imported} questions{result.skipped > 0 && `, skipped ${result.skipped}`}.
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

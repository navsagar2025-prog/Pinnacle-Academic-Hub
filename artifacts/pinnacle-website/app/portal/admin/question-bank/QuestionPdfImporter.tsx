"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, X, CheckCircle2, AlertCircle, Sparkles, Trash2, ImagePlus } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

type Draft = {
  draftId: string;
  subject: string;
  topic: string;
  classGrade: string;
  year: number | null;
  examName: string;
  questionType: "mcq" | "short" | "long" | "numerical";
  difficulty: "easy" | "medium" | "hard";
  questionText: string;
  options: Record<string, string> | null;
  correctAnswer: string;
  solution: string;
  imageUrl: string;
  solutionImageUrl: string;
  marks: number;
  hasFigure: boolean;
  figureDescription: string;
  figurePage: number | null;
};

const SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Biology", "English", "General Knowledge"];
const QTYPES: Draft["questionType"][] = ["mcq", "short", "long", "numerical"];
const DIFFS: Draft["difficulty"][] = ["easy", "medium", "hard"];

async function uploadPdfToObjectStorage(file: File): Promise<string> {
  const presign = await fetch(`${BASE}/api/v1/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: file.name,
      size: file.size,
      contentType: file.type || "application/pdf",
      category: "pyq_pdf",
    }),
  });
  const presignJson = await presign.json();
  if (!presign.ok) throw new Error(presignJson.error ?? "Could not request upload URL");

  const put = await fetch(presignJson.uploadURL, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/pdf" },
    body: file,
  });
  if (!put.ok) throw new Error(`Upload failed: ${put.status}`);
  return presignJson.objectPath as string;
}

async function uploadFigureImage(file: File): Promise<string> {
  const presign = await fetch(`${BASE}/api/v1/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: file.name,
      size: file.size,
      contentType: file.type,
      category: "question_figure",
    }),
  });
  const presignJson = await presign.json();
  if (!presign.ok) throw new Error(presignJson.error ?? "Could not request upload URL");

  const put = await fetch(presignJson.uploadURL, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!put.ok) throw new Error(`Upload failed: ${put.status}`);
  return `${BASE}/api/v1/storage${presignJson.objectPath}`;
}

export function QuestionPdfImporter() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<"pick" | "extracting" | "review" | "saving" | "done">("pick");
  const [file, setFile] = useState<File | null>(null);
  const [examName, setExamName] = useState("");
  const [year, setYear] = useState<string>(String(new Date().getFullYear() - 1));
  const [defaultSubject, setDefaultSubject] = useState("");
  const [defaultClassGrade, setDefaultClassGrade] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ inserted: number; errorCount: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setStage("pick"); setFile(null); setDrafts([]); setError(""); setDone(null);
    if (fileRef.current) fileRef.current.value = "";
  }
  function close() { setOpen(false); reset(); }

  async function startExtract() {
    if (!file) { setError("Please choose a PDF first."); return; }
    setError(""); setStage("extracting");
    try {
      const objectPath = await uploadPdfToObjectStorage(file);
      const res = await fetch(`${BASE}/api/v1/question-bank/pdf-extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objectPath,
          examName: examName.trim() || null,
          year: year ? Number(year) : null,
          defaultSubject: defaultSubject || null,
          defaultClassGrade: defaultClassGrade || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Extraction failed"); setStage("pick"); return; }
      const list: Draft[] = (json.drafts ?? []).map((d: Draft) => ({
        ...d,
        // Make sure mcq always has option scaffolding for editing
        options: d.questionType === "mcq" ? (d.options ?? { A: "", B: "", C: "", D: "" }) : null,
      }));
      if (list.length === 0) { setError("AI did not detect any questions in this PDF. Try a clearer scan."); setStage("pick"); return; }
      setDrafts(list);
      setStage("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload or extraction failed");
      setStage("pick");
    }
  }

  function updateDraft(idx: number, patch: Partial<Draft>) {
    setDrafts((prev) => prev.map((d, i) => i === idx ? { ...d, ...patch } : d));
  }
  function updateOption(idx: number, key: "A" | "B" | "C" | "D", value: string) {
    setDrafts((prev) => prev.map((d, i) => i === idx
      ? { ...d, options: { ...(d.options ?? { A: "", B: "", C: "", D: "" }), [key]: value } }
      : d));
  }
  function removeDraft(idx: number) {
    setDrafts((prev) => prev.filter((_, i) => i !== idx));
  }
  async function attachFigure(idx: number, file: File) {
    try {
      const url = await uploadFigureImage(file);
      updateDraft(idx, { imageUrl: url });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Figure upload failed");
    }
  }

  function missingFieldsFor(d: Draft): string[] {
    const issues: string[] = [];
    if (!d.subject.trim()) issues.push("subject");
    if (!d.questionText.trim()) issues.push("question text");
    if (!d.correctAnswer.trim()) issues.push("answer");
    if (d.questionType === "mcq") {
      for (const k of ["A", "B", "C", "D"] as const) {
        if (!(d.options?.[k] ?? "").trim()) issues.push(`option ${k}`);
      }
    }
    return issues;
  }

  async function commit() {
    const incomplete = drafts.filter((d) => missingFieldsFor(d).length > 0);
    if (incomplete.length > 0) {
      const ok = window.confirm(
        `${incomplete.length} draft${incomplete.length === 1 ? "" : "s"} ${incomplete.length === 1 ? "is" : "are"} missing required fields (e.g. answer or MCQ options) and will be skipped during save. Continue anyway?`,
      );
      if (!ok) return;
    }
    setError(""); setStage("saving");
    const rows = drafts.map((d) => ({
      subject: d.subject,
      topic: d.topic,
      classGrade: d.classGrade,
      year: d.year ?? "",
      examName: d.examName,
      difficulty: d.difficulty,
      type: d.questionType,
      question: d.questionText,
      A: d.options?.A ?? "",
      B: d.options?.B ?? "",
      C: d.options?.C ?? "",
      D: d.options?.D ?? "",
      correct: d.correctAnswer,
      solution: d.solution,
      imageUrl: d.imageUrl,
      solutionImageUrl: d.solutionImageUrl,
      marks: d.marks,
    }));
    try {
      const res = await fetch(`${BASE}/api/v1/question-bank/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, commit: true }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Save failed"); setStage("review"); return; }
      setDone({ inserted: json.inserted ?? 0, errorCount: json.errorCount ?? 0 });
      setStage("done");
      router.refresh();
    } catch {
      setError("Network error during save");
      setStage("review");
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-sm px-4 py-2 rounded-lg border border-slate-300 text-[var(--color-navy)] hover:bg-slate-50 flex items-center gap-1.5 font-semibold">
        <FileUp size={16} /> Import PDF
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={close}>
          <div className="bg-white rounded-xl shadow-elevated max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-[var(--color-teal)]" />
                <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[var(--color-navy)]">Import PYQ from scanned PDF</h2>
              </div>
              <button onClick={close} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
            </div>

            <div className="p-5 space-y-4">
              {error && (
                <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
                </div>
              )}

              {stage === "pick" && (
                <>
                  <div className="bg-slate-50 rounded-lg px-4 py-3 text-sm text-slate-600">
                    <p>Upload a previous-year question paper (PDF, up to 25 MB). Our AI will detect each question, its options, the answer and any inline figures, then show a draft list you can review before publishing.</p>
                    <p className="mt-2 text-xs text-slate-500">Tip: clearer scans (300 DPI+) extract more reliably.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-xs font-semibold text-slate-600">Exam name</span>
                      <input value={examName} onChange={(e) => setExamName(e.target.value)} placeholder="e.g. JEE Main 2024 Shift 1" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold text-slate-600">Year</span>
                      <input value={year} onChange={(e) => setYear(e.target.value.replace(/[^0-9]/g, ""))} maxLength={4} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold text-slate-600">Default subject (optional)</span>
                      <select value={defaultSubject} onChange={(e) => setDefaultSubject(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                        <option value="">— Auto-detect —</option>
                        {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold text-slate-600">Default class (optional)</span>
                      <input value={defaultClassGrade} onChange={(e) => setDefaultClassGrade(e.target.value)} placeholder="e.g. 12" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                    </label>
                  </div>

                  <label className="block border-2 border-dashed border-slate-200 rounded-lg p-6 text-center cursor-pointer hover:border-[var(--color-teal)] hover:bg-slate-50 transition-colors">
                    <FileUp size={28} className="mx-auto text-slate-400 mb-2" />
                    <p className="text-sm font-semibold text-[var(--color-navy)]">{file?.name || "Choose PDF file"}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Click to browse · max 25 MB</p>
                    <input ref={fileRef} type="file" accept="application/pdf,.pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="hidden" />
                  </label>
                </>
              )}

              {stage === "extracting" && (
                <div className="text-center py-10">
                  <Sparkles size={36} className="mx-auto text-[var(--color-teal)] animate-pulse mb-3" />
                  <p className="font-semibold text-[var(--color-navy)]">Reading the PDF and drafting questions…</p>
                  <p className="text-xs text-slate-500 mt-1">This can take up to a minute for long papers.</p>
                </div>
              )}

              {stage === "review" && (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-600">
                      <span className="font-semibold text-[var(--color-navy)]">{drafts.length}</span> draft question{drafts.length === 1 ? "" : "s"}.
                      Edit anything you need, remove unwanted rows, then save.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {drafts.map((d, idx) => {
                      const missing = missingFieldsFor(d);
                      return (
                      <div key={d.draftId} className={`border rounded-lg p-4 space-y-3 ${missing.length > 0 ? "border-amber-300 bg-amber-50/30" : "border-slate-200"}`}>
                        {missing.length > 0 && (
                          <div className="text-xs text-amber-800 bg-amber-100 rounded px-2 py-1 inline-flex items-center gap-1">
                            <AlertCircle size={12} /> Missing: {missing.join(", ")}. Will be skipped at save unless filled in.
                          </div>
                        )}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            <select value={d.subject} onChange={(e) => updateDraft(idx, { subject: e.target.value })} className="rounded border border-slate-300 px-2 py-1">
                              {[d.subject, ...SUBJECTS.filter((s) => s !== d.subject)].map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <input value={d.topic} onChange={(e) => updateDraft(idx, { topic: e.target.value })} placeholder="topic" className="rounded border border-slate-300 px-2 py-1" />
                            <input value={d.classGrade} onChange={(e) => updateDraft(idx, { classGrade: e.target.value })} placeholder="class" className="rounded border border-slate-300 px-2 py-1" />
                            <input value={d.examName} onChange={(e) => updateDraft(idx, { examName: e.target.value })} placeholder="exam" className="rounded border border-slate-300 px-2 py-1" />
                            <select value={d.questionType} onChange={(e) => updateDraft(idx, { questionType: e.target.value as Draft["questionType"], options: e.target.value === "mcq" ? (d.options ?? { A: "", B: "", C: "", D: "" }) : null })} className="rounded border border-slate-300 px-2 py-1">
                              {QTYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <select value={d.difficulty} onChange={(e) => updateDraft(idx, { difficulty: e.target.value as Draft["difficulty"] })} className="rounded border border-slate-300 px-2 py-1">
                              {DIFFS.map((dd) => <option key={dd} value={dd}>{dd}</option>)}
                            </select>
                            <input type="number" value={d.year ?? ""} onChange={(e) => updateDraft(idx, { year: e.target.value ? Number(e.target.value) : null })} placeholder="year" className="rounded border border-slate-300 px-2 py-1" />
                            <input type="number" value={d.marks} onChange={(e) => updateDraft(idx, { marks: Number(e.target.value) || 0 })} placeholder="marks" className="rounded border border-slate-300 px-2 py-1" />
                          </div>
                          <button onClick={() => removeDraft(idx)} title="Discard this question" className="text-rose-500 hover:bg-rose-50 rounded p-1.5 shrink-0">
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-600">Question</label>
                          <textarea value={d.questionText} onChange={(e) => updateDraft(idx, { questionText: e.target.value })} rows={3} className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
                        </div>

                        {d.questionType === "mcq" && d.options && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {(["A", "B", "C", "D"] as const).map((k) => (
                              <div key={k} className="flex items-center gap-2">
                                <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${d.correctAnswer === k ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>{k}</span>
                                <input value={d.options?.[k] ?? ""} onChange={(e) => updateOption(idx, k, e.target.value)} className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm" />
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-slate-600">Correct answer</label>
                            {d.questionType === "mcq" ? (
                              <select value={d.correctAnswer} onChange={(e) => updateDraft(idx, { correctAnswer: e.target.value })} className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm">
                                <option value="">—</option>
                                {["A", "B", "C", "D"].map((k) => <option key={k} value={k}>{k}</option>)}
                              </select>
                            ) : (
                              <input value={d.correctAnswer} onChange={(e) => updateDraft(idx, { correctAnswer: e.target.value })} className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm" />
                            )}
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-600">Solution (optional)</label>
                            <input value={d.solution} onChange={(e) => updateDraft(idx, { solution: e.target.value })} className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm" />
                          </div>
                        </div>

                        <div className={`rounded px-3 py-2 text-xs space-y-2 ${d.hasFigure || d.imageUrl ? "bg-amber-50 border border-amber-100 text-amber-800" : "bg-slate-50 border border-slate-100 text-slate-600"}`}>
                          {(d.hasFigure || d.imageUrl) ? (
                            <p>
                              <strong>Figure detected{d.figurePage ? ` on page ${d.figurePage}` : ""}.</strong>
                              {d.figureDescription ? ` ${d.figureDescription}` : ""}
                            </p>
                          ) : (
                            <p>No figure detected. Attach one manually if the AI missed it.</p>
                          )}
                          <div className="flex items-center gap-2">
                            {d.imageUrl ? (
                              <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={d.imageUrl} alt="figure" className="h-12 w-12 object-cover rounded border border-amber-200" />
                                <button onClick={() => updateDraft(idx, { imageUrl: "" })} className="text-xs underline">Remove</button>
                              </>
                            ) : (
                              <label className="inline-flex items-center gap-1 text-[var(--color-teal)] font-semibold cursor-pointer">
                                <ImagePlus size={14} /> Attach figure image
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) attachFigure(idx, f); }} />
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </>
              )}

              {stage === "saving" && (
                <div className="text-center py-10">
                  <Sparkles size={36} className="mx-auto text-[var(--color-teal)] animate-pulse mb-3" />
                  <p className="font-semibold text-[var(--color-navy)]">Saving questions to the bank…</p>
                </div>
              )}

              {stage === "done" && done && (
                <div className="text-center py-6">
                  <CheckCircle2 size={40} className="mx-auto text-green-600 mb-2" />
                  <p className="font-semibold text-[var(--color-navy)] text-lg">Imported {done.inserted} question{done.inserted === 1 ? "" : "s"}</p>
                  {done.errorCount > 0 && (
                    <p className="text-xs text-slate-500 mt-1">{done.errorCount} draft{done.errorCount === 1 ? "" : "s"} skipped due to validation issues.</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-100 sticky bottom-0 bg-white">
              {stage === "pick" && (
                <>
                  <button onClick={close} className="text-sm px-4 py-2 text-slate-600 font-semibold">Cancel</button>
                  <button onClick={startExtract} disabled={!file} className="btn-gold text-sm px-4 py-2 disabled:opacity-50">Extract questions</button>
                </>
              )}
              {stage === "review" && (
                <>
                  <button onClick={reset} className="text-sm px-4 py-2 text-slate-600 font-semibold">Discard & start over</button>
                  <button onClick={commit} disabled={drafts.length === 0} className="btn-gold text-sm px-4 py-2 disabled:opacity-50">
                    Save {drafts.length} question{drafts.length === 1 ? "" : "s"}
                  </button>
                </>
              )}
              {stage === "done" && (
                <button onClick={close} className="btn-gold text-sm px-4 py-2">Done</button>
              )}
              {(stage === "extracting" || stage === "saving") && (
                <button disabled className="text-sm px-4 py-2 text-slate-400 font-semibold">Working…</button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

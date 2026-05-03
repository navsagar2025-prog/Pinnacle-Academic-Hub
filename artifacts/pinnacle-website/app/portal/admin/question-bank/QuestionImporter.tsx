"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileSpreadsheet, X, CheckCircle2, AlertCircle, Download } from "lucide-react";
import * as XLSX from "xlsx";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

const COLUMNS = [
  "subject", "topic", "classGrade", "year", "difficulty", "type",
  "question", "A", "B", "C", "D", "correct", "solution", "imageUrl", "marks",
];

type RowError = { line: number; message: string };
type Preview = { validCount: number; errorCount: number; errors: RowError[] };

export function QuestionImporter() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<Record<string, unknown>[] | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ inserted: number; errorCount: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setFileName(""); setRows(null); setPreview(null); setError(""); setDone(null);
    if (fileRef.current) fileRef.current.value = "";
  }
  function close() { setOpen(false); reset(); }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(""); setPreview(null); setDone(null); setFileName(file.name);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      if (!sheet) throw new Error("Spreadsheet has no sheets");
      const parsed = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: false });
      if (parsed.length === 0) throw new Error("No data rows found");
      setRows(parsed);
      await validate(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file");
      setRows(null);
    }
  }

  async function validate(data: Record<string, unknown>[]) {
    setBusy(true);
    try {
      const res = await fetch(`${BASE}/api/v1/question-bank/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: data, commit: false }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Validation failed"); return; }
      setPreview({ validCount: json.validCount, errorCount: json.errorCount, errors: json.errors ?? [] });
    } catch {
      setError("Network error during validation");
    } finally {
      setBusy(false);
    }
  }

  async function commit() {
    if (!rows) return;
    setBusy(true); setError("");
    try {
      const res = await fetch(`${BASE}/api/v1/question-bank/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, commit: true }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Import failed"); return; }
      setDone({ inserted: json.inserted, errorCount: json.errorCount });
      router.refresh();
    } catch {
      setError("Network error during import");
    } finally {
      setBusy(false);
    }
  }

  function downloadTemplate() {
    const example = [{
      subject: "Physics", topic: "Kinematics", classGrade: "12", year: "2024",
      difficulty: "medium", type: "mcq",
      question: "A ball is dropped from 20 m. What is its speed on impact? (g = 10 m/s²)",
      A: "10 m/s", B: "20 m/s", C: "14.1 m/s", D: "30 m/s", correct: "B",
      solution: "v = √(2gh) = √(2·10·20) = 20 m/s", imageUrl: "", marks: "4",
    }];
    const ws = XLSX.utils.json_to_sheet(example, { header: COLUMNS });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Questions");
    XLSX.writeFile(wb, "question-bank-template.xlsx");
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-sm px-4 py-2 rounded-lg border border-slate-300 text-[var(--color-navy)] hover:bg-slate-50 flex items-center gap-1.5 font-semibold">
        <Upload size={16} /> Import
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={close}>
          <div className="bg-white rounded-xl shadow-elevated max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white">
              <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[var(--color-navy)]">Bulk Import Questions</h2>
              <button onClick={close} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
            </div>

            <div className="p-5 space-y-4">
              {!done && (
                <div className="bg-slate-50 rounded-lg px-4 py-3 text-sm text-slate-600">
                  <p className="mb-2">Upload a CSV or XLSX file with these columns (header row required):</p>
                  <p className="font-mono text-xs text-slate-700 break-all">{COLUMNS.join(", ")}</p>
                  <ul className="mt-2 text-xs space-y-0.5 list-disc list-inside text-slate-500">
                    <li><strong>Required:</strong> subject, question, correct (A/B/C/D for MCQ)</li>
                    <li><strong>type:</strong> mcq, short, long, numerical (default mcq)</li>
                    <li><strong>difficulty:</strong> easy, medium, hard (default medium)</li>
                    <li>For non-MCQ questions, A–D may be blank and 'correct' is the expected answer text</li>
                  </ul>
                  <button onClick={downloadTemplate} className="mt-2 text-xs text-[var(--color-teal)] hover:underline inline-flex items-center gap-1 font-semibold">
                    <Download size={12} /> Download template (.xlsx)
                  </button>
                </div>
              )}

              {!done && (
                <label className="block border-2 border-dashed border-slate-200 rounded-lg p-6 text-center cursor-pointer hover:border-[var(--color-teal)] hover:bg-slate-50 transition-colors">
                  <FileSpreadsheet size={28} className="mx-auto text-slate-400 mb-2" />
                  <p className="text-sm font-semibold text-[var(--color-navy)]">{fileName || "Choose CSV or XLSX file"}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Click to browse</p>
                  <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={onPick} className="hidden" />
                </label>
              )}

              {error && (
                <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
                </div>
              )}

              {busy && <p className="text-sm text-slate-500 text-center py-2">Working…</p>}

              {preview && !done && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3">
                      <p className="text-xs font-semibold text-green-700">Ready to import</p>
                      <p className="text-2xl font-bold text-green-800">{preview.validCount}</p>
                    </div>
                    <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3">
                      <p className="text-xs font-semibold text-rose-700">Failed validation</p>
                      <p className="text-2xl font-bold text-rose-800">{preview.errorCount}</p>
                    </div>
                  </div>
                  {preview.errors.length > 0 && (
                    <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 sticky top-0">
                          <tr>
                            <th className="text-left px-3 py-2 font-semibold text-slate-600 w-16">Row</th>
                            <th className="text-left px-3 py-2 font-semibold text-slate-600">Issue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {preview.errors.map((er, i) => (
                            <tr key={i} className="border-t border-slate-100">
                              <td className="px-3 py-1.5 font-mono text-slate-500">{er.line}</td>
                              <td className="px-3 py-1.5 text-slate-700">{er.message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <p className="text-xs text-slate-500">
                    {preview.errorCount > 0
                      ? "Failed rows will be skipped. Only valid rows will be imported."
                      : "All rows passed validation."}
                  </p>
                </div>
              )}

              {done && (
                <div className="text-center py-4">
                  <CheckCircle2 size={40} className="mx-auto text-green-600 mb-2" />
                  <p className="font-semibold text-[var(--color-navy)] text-lg">Imported {done.inserted} questions</p>
                  {done.errorCount > 0 && (
                    <p className="text-xs text-slate-500 mt-1">{done.errorCount} row{done.errorCount === 1 ? "" : "s"} skipped due to validation errors.</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-100 sticky bottom-0 bg-white">
              {done ? (
                <button onClick={close} className="btn-gold text-sm px-4 py-2">Done</button>
              ) : (
                <>
                  <button onClick={close} className="text-sm px-4 py-2 text-slate-600 font-semibold">Cancel</button>
                  {preview && preview.validCount > 0 && (
                    <button onClick={commit} disabled={busy} className="btn-gold text-sm px-4 py-2 disabled:opacity-50">
                      {busy ? "Importing…" : `Import ${preview.validCount} question${preview.validCount === 1 ? "" : "s"}`}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Pencil, Trash2, Users, User, Loader2, AlertCircle, CheckCircle } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

interface Batch {
  id: string;
  name: string;
  courseTitle?: string | null;
}

interface Student {
  id: string;
  name: string | null;
  rollNumber: string;
}

interface TestResult {
  id: string;
  studentId: string;
  studentName: string | null;
  rollNumber: string;
  batchId: string | null;
  batchName: string | null;
  examName: string;
  subject: string;
  totalMarks: number;
  marksObtained: number;
  rank: string | null;
  examDate: string;
}

export function AddTestScoreButton({ batches }: { batches: Batch[] }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"single" | "bulk">("single");
  return (
    <>
      <div className="flex gap-2">
        <button
          className="btn-primary py-2.5 px-5 text-sm"
          onClick={() => { setMode("single"); setOpen(true); }}
        >
          <Plus size={15} /> Add Result
        </button>
        <button
          className="btn-outline py-2.5 px-5 text-sm"
          onClick={() => { setMode("bulk"); setOpen(true); }}
        >
          <Users size={15} /> Bulk Entry
        </button>
      </div>
      {open && <TestScoreModal batches={batches} mode={mode} onClose={() => setOpen(false)} />}
    </>
  );
}

export function EditTestScoreButton({ result }: { result: TestResult }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="text-xs font-semibold text-[var(--color-teal)] hover:underline" onClick={() => setOpen(true)}>
        <Pencil size={12} className="inline mr-1" />Edit
      </button>
      {open && <EditModal result={result} onClose={() => setOpen(false)} />}
    </>
  );
}

export function DeleteTestScoreButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this test result?")) return;
    setLoading(true);
    await fetch(`${BASE}/api/v1/test-results/${id}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button disabled={loading} onClick={handleDelete} className="text-xs font-semibold text-[var(--color-maroon)] hover:underline">
      <Trash2 size={12} className="inline mr-1" />{loading ? "…" : "Delete"}
    </button>
  );
}

function EditModal({ result, onClose }: { result: TestResult; onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    examName: result.examName,
    subject: result.subject,
    totalMarks: String(result.totalMarks),
    marksObtained: String(result.marksObtained),
    rank: result.rank ?? "",
    examDate: result.examDate ? new Date(result.examDate).toISOString().split("T")[0] : "",
  });

  const pct =
    Number(form.totalMarks) > 0
      ? ((Number(form.marksObtained) / Number(form.totalMarks)) * 100).toFixed(1)
      : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch(`${BASE}/api/v1/test-results/${result.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        examName: form.examName,
        subject: form.subject,
        totalMarks: Number(form.totalMarks),
        marksObtained: Number(form.marksObtained),
        rank: form.rank || undefined,
        examDate: form.examDate,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { setError((data as { error?: string }).error ?? "Failed"); return; }
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="font-[family-name:var(--font-playfair)] font-bold text-[var(--color-navy)]">Edit Test Result</h2>
            <p className="text-xs text-slate-500 mt-0.5">{result.studentName ?? result.rollNumber}</p>
          </div>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Exam Name *</label>
              <input required value={form.examName} onChange={(e) => setForm((p) => ({ ...p, examName: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Subject *</label>
              <input required value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Exam Date *</label>
              <input required type="date" value={form.examDate} onChange={(e) => setForm((p) => ({ ...p, examDate: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Total Marks *</label>
              <input required type="number" min={1} value={form.totalMarks} onChange={(e) => setForm((p) => ({ ...p, totalMarks: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Marks Obtained *</label>
              <input required type="number" min={0} max={Number(form.totalMarks)} value={form.marksObtained} onChange={(e) => setForm((p) => ({ ...p, marksObtained: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Rank (optional)</label>
              <input value={form.rank} onChange={(e) => setForm((p) => ({ ...p, rank: e.target.value }))} placeholder="e.g. 3rd"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]" />
            </div>
            {pct !== null && (
              <div className="col-span-2 text-xs text-slate-500">
                Score: <span className={`font-bold ${Number(pct) >= 75 ? "text-green-600" : Number(pct) >= 50 ? "text-amber-600" : "text-[var(--color-maroon)]"}`}>{pct}%</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-outline py-2.5 text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary py-2.5 text-sm">{loading ? "Saving…" : "Save"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TestScoreModal({
  batches,
  mode: initialMode,
  onClose,
}: {
  batches: Batch[];
  mode: "single" | "bulk";
  onClose: () => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"single" | "bulk">(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Shared exam details
  const [examName, setExamName] = useState("");
  const [subject, setSubject] = useState("");
  const [totalMarks, setTotalMarks] = useState("100");
  const [examDate, setExamDate] = useState(new Date().toISOString().split("T")[0]);
  const [batchId, setBatchId] = useState(batches[0]?.id ?? "");

  // Single mode extras
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [marksObtained, setMarksObtained] = useState("");
  const [rank, setRank] = useState("");

  // Bulk mode: per-student marks map
  const [bulkMarks, setBulkMarks] = useState<Record<string, { marks: string; rank: string }>>({});

  // Fetch students whenever batchId changes
  useEffect(() => {
    if (!batchId) return;
    setStudentsLoading(true);
    fetch(`${BASE}/api/v1/students?batchId=${batchId}&limit=200`)
      .then((r) => r.json())
      .then((d: { data?: Student[] }) => {
        const list = d.data ?? [];
        setStudents(list);
        setStudentId(list[0]?.id ?? "");
        // Reset bulk marks
        const init: Record<string, { marks: string; rank: string }> = {};
        for (const s of list) init[s.id] = { marks: "", rank: "" };
        setBulkMarks(init);
      })
      .catch(console.error)
      .finally(() => setStudentsLoading(false));
  }, [batchId]);

  async function handleSingleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentId) { setError("Please select a student"); return; }
    const mObtained = Number(marksObtained);
    const mTotal = Number(totalMarks);
    if (isNaN(mObtained) || mObtained < 0 || mObtained > mTotal) {
      setError("Marks obtained must be between 0 and total marks");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch(`${BASE}/api/v1/test-results`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entries: [{
          studentId,
          batchId: batchId || undefined,
          examName,
          subject,
          totalMarks: mTotal,
          marksObtained: mObtained,
          rank: rank || undefined,
          examDate,
        }],
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { setError((data as { error?: string }).error ?? "Failed"); return; }
    router.refresh();
    onClose();
  }

  async function handleBulkSubmit(e: React.FormEvent) {
    e.preventDefault();
    const mTotal = Number(totalMarks);
    const entries = students
      .filter((s) => bulkMarks[s.id]?.marks !== "")
      .map((s) => ({
        studentId: s.id,
        batchId: batchId || undefined,
        examName,
        subject,
        totalMarks: mTotal,
        marksObtained: Number(bulkMarks[s.id]?.marks ?? 0),
        rank: bulkMarks[s.id]?.rank || undefined,
        examDate,
      }));

    if (entries.length === 0) { setError("Enter marks for at least one student"); return; }

    const invalid = entries.filter((e) => e.marksObtained < 0 || e.marksObtained > mTotal);
    if (invalid.length > 0) {
      setError(`Marks must be between 0 and ${mTotal} for all students`);
      return;
    }

    setLoading(true);
    setError("");
    const res = await fetch(`${BASE}/api/v1/test-results`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { setError((data as { error?: string }).error ?? "Failed"); return; }
    setSuccess(`${(data as { inserted?: number }).inserted ?? entries.length} results saved successfully.`);
    setTimeout(() => { router.refresh(); onClose(); }, 1500);
  }

  const sharedFields = (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2">
        <label className="block text-xs font-semibold text-slate-600 mb-1">Batch *</label>
        <select value={batchId} onChange={(e) => setBatchId(e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]">
          {batches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}{b.courseTitle ? ` — ${b.courseTitle}` : ""}</option>
          ))}
        </select>
      </div>
      <div className="col-span-2">
        <label className="block text-xs font-semibold text-slate-600 mb-1">Exam Name *</label>
        <input required value={examName} onChange={(e) => setExamName(e.target.value)} placeholder="e.g. Unit Test 3 — December"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Subject *</label>
        <input required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Physics"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Total Marks *</label>
        <input required type="number" min={1} value={totalMarks} onChange={(e) => setTotalMarks(e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]" />
      </div>
      <div className="col-span-2">
        <label className="block text-xs font-semibold text-slate-600 mb-1">Exam Date *</label>
        <input required type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]" />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b flex-shrink-0">
          <h2 className="font-[family-name:var(--font-playfair)] font-bold text-[var(--color-navy)] text-lg">Enter Test Results</h2>
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setMode("single")}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors ${mode === "single" ? "bg-white shadow text-[var(--color-navy)] font-semibold" : "text-slate-500"}`}
              >
                <User size={12} /> Single
              </button>
              <button
                type="button"
                onClick={() => setMode("bulk")}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors ${mode === "bulk" ? "bg-white shadow text-[var(--color-navy)] font-semibold" : "text-slate-500"}`}
              >
                <Users size={12} /> Bulk
              </button>
            </div>
            <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5 mb-4">
              <AlertCircle size={14} className="text-[var(--color-maroon)] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[var(--color-maroon)]">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg px-3 py-2.5 mb-4">
              <CheckCircle size={14} className="text-green-600" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {mode === "single" && (
            <form id="single-form" onSubmit={handleSingleSubmit} className="space-y-4">
              {sharedFields}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Student *</label>
                  {studentsLoading ? (
                    <div className="flex items-center gap-2 text-slate-400 text-sm py-2"><Loader2 size={14} className="animate-spin" />Loading students…</div>
                  ) : (
                    <select required value={studentId} onChange={(e) => setStudentId(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]">
                      <option value="">— Select student —</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>{s.name ?? s.rollNumber} ({s.rollNumber})</option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Marks Obtained *</label>
                    <input required type="number" min={0} max={Number(totalMarks)} value={marksObtained}
                      onChange={(e) => setMarksObtained(e.target.value)} placeholder={`0–${totalMarks}`}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Rank (optional)</label>
                    <input value={rank} onChange={(e) => setRank(e.target.value)} placeholder="e.g. 1st"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]" />
                  </div>
                </div>
                {marksObtained !== "" && Number(totalMarks) > 0 && (
                  <p className="text-xs text-slate-500">
                    Score: <span className={`font-bold ${(Number(marksObtained) / Number(totalMarks)) * 100 >= 75 ? "text-green-600" : (Number(marksObtained) / Number(totalMarks)) * 100 >= 50 ? "text-amber-600" : "text-[var(--color-maroon)]"}`}>
                      {((Number(marksObtained) / Number(totalMarks)) * 100).toFixed(1)}%
                    </span>
                  </p>
                )}
              </div>
            </form>
          )}

          {mode === "bulk" && (
            <form id="bulk-form" onSubmit={handleBulkSubmit} className="space-y-4">
              {sharedFields}
              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-xs font-semibold text-slate-600 mb-3">
                  Student Marks
                  {!studentsLoading && students.length > 0 && (
                    <span className="ml-2 font-normal text-slate-400">({students.length} students — leave blank to skip)</span>
                  )}
                </h3>

                {studentsLoading ? (
                  <div className="flex items-center gap-2 text-slate-400 text-sm py-4"><Loader2 size={14} className="animate-spin" />Loading students…</div>
                ) : students.length === 0 ? (
                  <p className="text-slate-400 text-sm py-4">No students found in this batch.</p>
                ) : (
                  <div className="space-y-2">
                    {students.map((s) => {
                      const m = bulkMarks[s.id]?.marks ?? "";
                      const pct = m !== "" && Number(totalMarks) > 0 ? (Number(m) / Number(totalMarks)) * 100 : null;
                      return (
                        <div key={s.id} className="flex items-center gap-3 py-1.5 border-b border-slate-50 last:border-0">
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-[var(--color-navy)] truncate block">{s.name ?? s.rollNumber}</span>
                            <span className="text-[11px] text-slate-400">{s.rollNumber}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              max={Number(totalMarks)}
                              value={m}
                              onChange={(e) => setBulkMarks((prev) => ({ ...prev, [s.id]: { ...prev[s.id], marks: e.target.value } }))}
                              placeholder={`/ ${totalMarks}`}
                              className="w-20 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]"
                            />
                            <input
                              type="text"
                              value={bulkMarks[s.id]?.rank ?? ""}
                              onChange={(e) => setBulkMarks((prev) => ({ ...prev, [s.id]: { ...prev[s.id], rank: e.target.value } }))}
                              placeholder="Rank"
                              className="w-16 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]"
                            />
                            {pct !== null && (
                              <span className={`text-xs font-semibold w-11 text-right ${pct >= 75 ? "text-green-600" : pct >= 50 ? "text-amber-600" : "text-[var(--color-maroon)]"}`}>
                                {pct.toFixed(0)}%
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </form>
          )}
        </div>

        <div className="p-5 border-t flex-shrink-0 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 btn-outline py-2.5 text-sm">Cancel</button>
          <button
            type="submit"
            form={mode === "single" ? "single-form" : "bulk-form"}
            disabled={loading || !!success}
            className="flex-1 btn-primary py-2.5 text-sm"
          >
            {loading ? <><Loader2 size={14} className="animate-spin inline mr-1" />Saving…</> : mode === "bulk" ? "Save All Results" : "Save Result"}
          </button>
        </div>
      </div>
    </div>
  );
}

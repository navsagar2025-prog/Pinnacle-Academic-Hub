"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus, X, Search, Calendar, Users, User as UserIcon, ChevronDown } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

export type EditorQuestion = {
  id: string;
  subject: string;
  topic: string | null;
  difficulty: string;
  questionType: string;
  questionText: string;
  year: number | null;
  examName: string | null;
};

export type EditorAssignment = {
  id: string;
  batchId: string | null;
  batchName: string | null;
  studentId: string | null;
  studentName: string | null;
  studentRoll: string | null;
  dueAt: string | null;
};

export type EditorBatch = { id: string; name: string };
export type EditorStudent = { id: string; name: string; rollNumber: string; batchName: string | null };

export function PracticeSetEditor({
  setId,
  initialName,
  initialSubject,
  initialDescription,
  initialActive,
  questions,
  assignments,
  candidateQuestions,
  batches,
  students,
}: {
  setId: string;
  initialName: string;
  initialSubject: string | null;
  initialDescription: string | null;
  initialActive: boolean;
  questions: EditorQuestion[];
  assignments: EditorAssignment[];
  candidateQuestions: EditorQuestion[];
  batches: EditorBatch[];
  students: EditorStudent[];
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [subject, setSubject] = useState(initialSubject ?? "");
  const [description, setDescription] = useState(initialDescription ?? "");
  const [active, setActive] = useState(initialActive);
  const [savingMeta, setSavingMeta] = useState(false);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerSubject, setPickerSubject] = useState("All");
  const [pickerSelected, setPickerSelected] = useState<Set<string>>(new Set());
  const [pickerBusy, setPickerBusy] = useState(false);

  const [assignTab, setAssignTab] = useState<"batch" | "student">("batch");
  const [assignBatch, setAssignBatch] = useState("");
  const [assignStudent, setAssignStudent] = useState("");
  const [assignDue, setAssignDue] = useState("");
  const [assignBusy, setAssignBusy] = useState(false);
  const [assignErr, setAssignErr] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  const inSet = useMemo(() => new Set(questions.map((q) => q.id)), [questions]);
  const subjects = useMemo(
    () => Array.from(new Set(candidateQuestions.map((q) => q.subject))).sort(),
    [candidateQuestions],
  );

  const pickerFiltered = useMemo(() => {
    const needle = pickerSearch.trim().toLowerCase();
    return candidateQuestions.filter((q) => {
      if (inSet.has(q.id)) return false;
      if (pickerSubject !== "All" && q.subject !== pickerSubject) return false;
      if (needle) {
        if (
          !q.questionText.toLowerCase().includes(needle) &&
          !(q.topic ?? "").toLowerCase().includes(needle) &&
          !(q.examName ?? "").toLowerCase().includes(needle)
        ) return false;
      }
      return true;
    }).slice(0, 200);
  }, [candidateQuestions, inSet, pickerSearch, pickerSubject]);

  const studentsFiltered = useMemo(() => {
    const needle = studentSearch.trim().toLowerCase();
    if (!needle) return students.slice(0, 50);
    return students
      .filter((s) =>
        s.name?.toLowerCase().includes(needle) ||
        s.rollNumber.toLowerCase().includes(needle) ||
        (s.batchName ?? "").toLowerCase().includes(needle),
      )
      .slice(0, 50);
  }, [students, studentSearch]);

  async function saveMeta() {
    setSavingMeta(true);
    try {
      const res = await fetch(`${BASE}/api/v1/practice-sets/${setId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          subject: subject.trim() || null,
          description: description.trim() || null,
          isActive: active,
        }),
      });
      if (res.ok) router.refresh();
    } finally {
      setSavingMeta(false);
    }
  }

  async function addQuestions() {
    if (pickerSelected.size === 0) { setPickerOpen(false); return; }
    setPickerBusy(true);
    try {
      await fetch(`${BASE}/api/v1/practice-sets/${setId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionIds: Array.from(pickerSelected) }),
      });
      setPickerSelected(new Set());
      setPickerOpen(false);
      router.refresh();
    } finally {
      setPickerBusy(false);
    }
  }

  async function removeQuestion(qid: string) {
    if (!confirm("Remove this question from the set?")) return;
    await fetch(`${BASE}/api/v1/practice-sets/${setId}/questions?questionId=${qid}`, { method: "DELETE" });
    router.refresh();
  }

  async function addAssignment() {
    setAssignErr("");
    const body: Record<string, unknown> = {};
    if (assignTab === "batch") {
      if (!assignBatch) { setAssignErr("Pick a batch"); return; }
      body.batchId = assignBatch;
    } else {
      if (!assignStudent) { setAssignErr("Pick a student"); return; }
      body.studentId = assignStudent;
    }
    if (assignDue) body.dueAt = new Date(assignDue).toISOString();
    setAssignBusy(true);
    try {
      const res = await fetch(`${BASE}/api/v1/practice-sets/${setId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed");
      }
      setAssignBatch(""); setAssignStudent(""); setAssignDue(""); setStudentSearch("");
      router.refresh();
    } catch (e) {
      setAssignErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setAssignBusy(false);
    }
  }

  async function removeAssignment(aid: string) {
    if (!confirm("Remove this assignment?")) return;
    await fetch(`${BASE}/api/v1/practice-sets/${setId}/assignments?assignmentId=${aid}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Metadata card */}
      <div className="card space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Set name</label>
            <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Subject</label>
            <input className="input-field" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Optional" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
          <textarea className="input-field resize-y" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Shown to students on the set card" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Active (visible to students)
          </label>
          <button onClick={saveMeta} disabled={savingMeta} className="btn-gold text-xs px-3 py-1.5 disabled:opacity-60">
            {savingMeta ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      {/* Questions card */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-bold text-sm text-[var(--color-navy)]">Questions ({questions.length})</h2>
          <button onClick={() => setPickerOpen(true)} className="text-xs text-[var(--color-teal)] font-semibold flex items-center gap-1 hover:underline">
            <Plus size={14} /> Add from question bank
          </button>
        </div>
        {questions.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4 text-center">No questions yet — add some from the bank.</p>
        ) : (
          <ol className="space-y-2">
            {questions.map((q, i) => (
              <li key={q.id} className="flex items-start gap-3 rounded-lg border border-slate-100 p-3">
                <span className="text-xs font-mono text-slate-400 mt-0.5 shrink-0 w-6 text-right">{i + 1}.</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap text-[11px] mb-1">
                    <span className="badge bg-[var(--color-navy)]/10 text-[var(--color-navy)]">{q.subject}</span>
                    {q.topic && <span className="text-slate-500">· {q.topic}</span>}
                    <span className="badge bg-slate-100 text-slate-600">{q.difficulty}</span>
                    {(q.year || q.examName) && (
                      <span className="badge bg-[var(--color-gold)]/15 text-[var(--color-navy)]">
                        PYQ{q.examName ? ` · ${q.examName}` : ""}{q.year ? ` · ${q.year}` : ""}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--color-navy)] line-clamp-2">{q.questionText}</p>
                </div>
                <button onClick={() => removeQuestion(q.id)} className="text-slate-300 hover:text-[var(--color-maroon)] shrink-0" aria-label="Remove question">
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Assignments card */}
      <div className="card space-y-3">
        <h2 className="font-bold text-sm text-[var(--color-navy)]">Assigned to ({assignments.length})</h2>

        <div className="rounded-lg border border-slate-100 p-3 space-y-2 bg-slate-50/50">
          <div className="flex gap-1 text-xs">
            <button onClick={() => setAssignTab("batch")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1 ${assignTab === "batch" ? "bg-[var(--color-navy)] text-white" : "bg-white text-slate-600 border border-slate-200"}`}>
              <Users size={12} /> Whole batch
            </button>
            <button onClick={() => setAssignTab("student")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1 ${assignTab === "student" ? "bg-[var(--color-navy)] text-white" : "bg-white text-slate-600 border border-slate-200"}`}>
              <UserIcon size={12} /> Single student
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-2">
            {assignTab === "batch" ? (
              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Batch</label>
                <div className="relative">
                  <select className="input-field appearance-none pr-8" value={assignBatch} onChange={(e) => setAssignBatch(e.target.value)}>
                    <option value="">Select batch…</option>
                    {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            ) : (
              <div className="md:col-span-2 space-y-1">
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Student</label>
                <input className="input-field text-xs" placeholder="Search by name, roll, or batch…" value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} />
                <div className="max-h-40 overflow-auto border border-slate-200 rounded-lg bg-white text-xs">
                  {studentsFiltered.length === 0 ? (
                    <p className="text-slate-400 p-2 italic">No matching students.</p>
                  ) : studentsFiltered.map((s) => (
                    <button key={s.id} onClick={() => setAssignStudent(s.id)} type="button"
                      className={`block w-full text-left px-2 py-1.5 hover:bg-slate-50 ${assignStudent === s.id ? "bg-[var(--color-teal)]/10" : ""}`}>
                      <span className="font-semibold">{s.name}</span>
                      <span className="text-slate-400"> · {s.rollNumber}{s.batchName ? ` · ${s.batchName}` : ""}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
                <Calendar size={10} /> Due (optional)
              </label>
              <input type="date" className="input-field" value={assignDue} onChange={(e) => setAssignDue(e.target.value)} />
            </div>
          </div>

          {assignErr && <p className="text-xs text-[var(--color-maroon)]">{assignErr}</p>}
          <div className="flex justify-end">
            <button onClick={addAssignment} disabled={assignBusy} className="btn-gold text-xs px-3 py-1.5 disabled:opacity-60">
              {assignBusy ? "Assigning…" : "Assign"}
            </button>
          </div>
        </div>

        {assignments.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-3 text-center">No assignments yet — pick a batch or student above.</p>
        ) : (
          <ul className="space-y-1.5">
            {assignments.map((a) => (
              <li key={a.id} className="flex items-center gap-2 text-xs rounded-lg border border-slate-100 px-3 py-2">
                {a.batchId ? (
                  <><Users size={12} className="text-[var(--color-teal)]" /><span className="font-semibold">{a.batchName ?? "Batch"}</span><span className="text-slate-400">· whole batch</span></>
                ) : (
                  <><UserIcon size={12} className="text-[var(--color-teal)]" /><span className="font-semibold">{a.studentName ?? "Student"}</span><span className="text-slate-400">· {a.studentRoll}</span></>
                )}
                {a.dueAt && (
                  <span className="ml-auto text-slate-500 flex items-center gap-1">
                    <Calendar size={10} /> due {new Date(a.dueAt).toLocaleDateString()}
                  </span>
                )}
                <button onClick={() => removeAssignment(a.id)} className="text-slate-300 hover:text-[var(--color-maroon)] ml-2" aria-label="Remove assignment">
                  <X size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Question picker modal */}
      {pickerOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !pickerBusy && setPickerOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-[family-name:var(--font-playfair)] text-lg font-bold text-[var(--color-navy)]">Add questions from the bank</h3>
              <button onClick={() => !pickerBusy && setPickerOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="p-4 border-b border-slate-100 flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[180px]">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="input-field pl-8 text-xs" placeholder="Search question text, topic, exam…" value={pickerSearch} onChange={(e) => setPickerSearch(e.target.value)} />
              </div>
              <select className="input-field text-xs max-w-[140px]" value={pickerSubject} onChange={(e) => setPickerSubject(e.target.value)}>
                <option value="All">All subjects</option>
                {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex-1 overflow-auto p-3 space-y-1.5">
              {pickerFiltered.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8 italic">No questions match — try clearing filters.</p>
              ) : pickerFiltered.map((q) => {
                const checked = pickerSelected.has(q.id);
                return (
                  <label key={q.id} className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${checked ? "border-[var(--color-teal)] bg-[var(--color-teal)]/5" : "border-slate-100 hover:bg-slate-50"}`}>
                    <input type="checkbox" className="mt-1 shrink-0" checked={checked}
                      onChange={(e) => {
                        const next = new Set(pickerSelected);
                        if (e.target.checked) next.add(q.id); else next.delete(q.id);
                        setPickerSelected(next);
                      }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap text-[11px] mb-1">
                        <span className="badge bg-[var(--color-navy)]/10 text-[var(--color-navy)]">{q.subject}</span>
                        {q.topic && <span className="text-slate-500">· {q.topic}</span>}
                        <span className="badge bg-slate-100 text-slate-600">{q.difficulty}</span>
                        {(q.year || q.examName) && (
                          <span className="badge bg-[var(--color-gold)]/15 text-[var(--color-navy)]">
                            PYQ{q.examName ? ` · ${q.examName}` : ""}{q.year ? ` · ${q.year}` : ""}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--color-navy)] line-clamp-2">{q.questionText}</p>
                    </div>
                  </label>
                );
              })}
            </div>
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-500">{pickerSelected.size} selected</p>
              <div className="flex gap-2">
                <button onClick={() => !pickerBusy && setPickerOpen(false)} className="text-xs text-slate-600 px-3 py-1.5 hover:text-slate-900">Cancel</button>
                <button onClick={addQuestions} disabled={pickerBusy || pickerSelected.size === 0} className="btn-gold text-xs px-3 py-1.5 disabled:opacity-60">
                  {pickerBusy ? "Adding…" : `Add ${pickerSelected.size}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

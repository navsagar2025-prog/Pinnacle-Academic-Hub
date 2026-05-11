import { useState } from "react";
import { Plus, X, Search, Check, Trash2, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast, SkeletonList, useModalEscape } from "./portalUtils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function api(method: string, path: string, body: object | null, getToken: () => Promise<string | null>) {
  const token = await getToken();
  const res = await fetch(`${BASE}/api/v1${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return res.json();
}

type Question = {
  id: string; subject: string; topic: string | null; difficulty: string;
  questionType: string; questionText: string; correctAnswer: string;
  marks: number; isPublished: boolean; examName: string | null;
  examTarget: string[] | null; source: string; reviewStatus: string;
  year: number | null; classGrade: string | null; createdAt: string;
};

type QBData = { rows: Question[]; total: number; page: number; limit: number };

function useFetch<T>(path: string, getToken: () => Promise<string | null>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (qPath: string = path) => {
    setLoading(true); setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${BASE}/api/v1${qPath}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setData(json.data);
    } catch (e) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setLoading(false); }
  };

  return { data, loading, error, load };
}

const SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Biology", "English", "General"];
const DIFFICULTIES = ["easy", "medium", "hard"];
const TYPES = ["mcq", "numerical", "short", "long"];
const SOURCES = ["MANUAL", "PYQ", "NCERT_EXEMPLAR", "AI", "THIRD_PARTY_FREE"];
const EXAM_TARGETS = ["JEE_MAIN", "JEE_ADVANCED", "NEET", "CBSE_BOARDS", "FOUNDATION"];

const EMPTY_FORM = {
  subject: "", topic: "", classGrade: "", year: "", difficulty: "medium", questionType: "mcq",
  questionText: "", correctAnswer: "", solution: "", examName: "", marks: 4,
  examTarget: [] as string[], source: "MANUAL",
  optionA: "", optionB: "", optionC: "", optionD: "",
};

export function AdminQuestionBank({ getToken }: { getToken: () => Promise<string | null> }) {
  const { toast } = useToast();
  const { data, loading, error, load } = useFetch<QBData>("/admin/question-bank", getToken);
  const [tab, setTab] = useState<"all" | "pending">("all");
  const [filters, setFilters] = useState({ subject: "", difficulty: "", questionType: "", source: "", search: "" });
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<{ mode: "create" | "edit"; item?: Question } | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ id: string; reason: string } | null>(null);
  useModalEscape(() => setModal(null), !!modal);
  useModalEscape(() => setDeleteModal(null), !!deleteModal);

  const buildPath = (p = page) => {
    const params = new URLSearchParams({ page: String(p), limit: "30" });
    if (filters.subject) params.set("subject", filters.subject);
    if (filters.difficulty) params.set("difficulty", filters.difficulty);
    if (filters.questionType) params.set("questionType", filters.questionType);
    if (filters.source) params.set("source", filters.source);
    if (tab === "pending") params.set("reviewStatus", "pending");
    return `/admin/question-bank?${params}`;
  };

  const fetch_ = (p = page) => load(buildPath(p));

  const openCreate = () => { setForm({ ...EMPTY_FORM }); setModal({ mode: "create" }); };
  const openEdit = (q: Question) => {
    const opts = (q as unknown as Record<string, string | null>);
    setForm({
      subject: q.subject, topic: q.topic ?? "", classGrade: q.classGrade ?? "",
      year: q.year ? String(q.year) : "", difficulty: q.difficulty, questionType: q.questionType,
      questionText: q.questionText, correctAnswer: q.correctAnswer, solution: "",
      examName: q.examName ?? "", marks: q.marks, examTarget: q.examTarget ?? [],
      source: q.source,
      optionA: String(opts["optionA"] ?? ""), optionB: String(opts["optionB"] ?? ""),
      optionC: String(opts["optionC"] ?? ""), optionD: String(opts["optionD"] ?? ""),
    });
    setModal({ mode: "edit", item: q });
  };

  const save = async () => {
    setSaving(true);
    const options = form.questionType === "mcq"
      ? { A: form.optionA, B: form.optionB, C: form.optionC, D: form.optionD }
      : null;
    const payload = {
      subject: form.subject, topic: form.topic || null, classGrade: form.classGrade || null,
      year: form.year ? parseInt(form.year) : null, difficulty: form.difficulty,
      questionType: form.questionType, questionText: form.questionText,
      options, correctAnswer: form.correctAnswer, solution: form.solution || null,
      examName: form.examName || null, marks: Number(form.marks),
      examTarget: form.examTarget, source: form.source,
    };
    try {
      if (modal?.mode === "create") await api("POST", "/admin/question-bank", payload, getToken);
      else await api("PATCH", `/admin/question-bank/${modal?.item?.id}`, payload, getToken);
      toast(modal?.mode === "create" ? "Question created" : "Question updated", "success");
      setModal(null); fetch_();
    } catch { toast("Failed to save question", "error"); }
    setSaving(false);
  };

  const review = async (id: string, status: "approved" | "rejected") => {
    try {
      await api("PATCH", `/admin/question-bank/${id}/review`, { reviewStatus: status }, getToken);
      toast(status === "approved" ? "Question approved" : "Question rejected", status === "approved" ? "success" : "info");
      fetch_();
    } catch { toast("Failed to update review", "error"); }
  };

  const softDelete = async () => {
    if (!deleteModal) return;
    try {
      await api("DELETE", `/admin/question-bank/${deleteModal.id}`, { reason: deleteModal.reason }, getToken);
      toast("Question deleted", "success");
      setDeleteModal(null); fetch_();
    } catch { toast("Failed to delete question", "error"); }
  };

  const goPage = (p: number) => { setPage(p); fetch_(p); };
  const applyFilters = () => { setPage(1); fetch_(1); };

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 30);

  const diffColor: Record<string, string> = { easy: "bg-green-100 text-green-700", medium: "bg-yellow-100 text-yellow-700", hard: "bg-red-100 text-red-700" };
  const reviewColor: Record<string, string> = { approved: "bg-green-100 text-green-700", pending: "bg-orange-100 text-orange-700", rejected: "bg-red-100 text-red-700" };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-navy)]">Question Bank</h2>
          <p className="text-sm text-slate-500 mt-0.5">{total} questions</p>
        </div>
        <button onClick={openCreate} className="btn-primary px-4 py-2 flex items-center gap-2 text-sm"><Plus size={14} /> New Question</button>
      </div>

      <div className="flex gap-2 mb-4">
        {(["all", "pending"] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setPage(1); setTimeout(() => fetch_(1), 0); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${tab === t ? "bg-[var(--color-navy)] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            {t === "all" ? "All Questions" : "Pending Review"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm" value={filters.subject} onChange={e => setFilters(f => ({ ...f, subject: e.target.value }))}>
          <option value="">All Subjects</option>
          {SUBJECTS.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm" value={filters.difficulty} onChange={e => setFilters(f => ({ ...f, difficulty: e.target.value }))}>
          <option value="">All Difficulties</option>
          {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
        </select>
        <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm" value={filters.questionType} onChange={e => setFilters(f => ({ ...f, questionType: e.target.value }))}>
          <option value="">All Types</option>
          {TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <button onClick={applyFilters} className="bg-[var(--color-teal)] text-white rounded-lg px-3 py-2 text-sm flex items-center gap-1.5 justify-center">
          <Search size={14} /> Search
        </button>
      </div>

      {loading && <SkeletonList rows={5} />}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {!loading && (
        <div className="space-y-2">
          {rows.map(q => (
            <div key={q.id} className="card border border-slate-200 p-4">
              <div className="flex gap-3 items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{q.subject}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${diffColor[q.difficulty] ?? ""}`}>{q.difficulty}</span>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{q.questionType}</span>
                    {q.reviewStatus !== "approved" && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${reviewColor[q.reviewStatus] ?? ""}`}>{q.reviewStatus}</span>
                    )}
                    {q.source !== "MANUAL" && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{q.source}</span>}
                  </div>
                  <p className="text-sm text-slate-800 line-clamp-2">{q.questionText}</p>
                  <p className="text-xs text-slate-400 mt-1">{q.topic && `${q.topic} · `}{q.marks} marks{q.year && ` · ${q.year}`}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {q.reviewStatus === "pending" && (
                    <>
                      <button onClick={() => review(q.id, "approved")} title="Approve" className="p-1.5 text-green-500 hover:bg-green-50 rounded transition-colors"><Check size={14} /></button>
                      <button onClick={() => review(q.id, "rejected")} title="Reject" className="p-1.5 text-red-400 hover:bg-red-50 rounded transition-colors"><X size={14} /></button>
                    </>
                  )}
                  <button onClick={() => openEdit(q)} className="p-1.5 text-slate-400 hover:text-[var(--color-navy)] transition-colors"><Pencil size={14} /></button>
                  <button onClick={() => setDeleteModal({ id: q.id, reason: "" })} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
          {rows.length === 0 && <p className="text-slate-400 text-sm text-center py-8">No questions found.</p>}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => goPage(page - 1)} disabled={page === 1} className="p-1.5 rounded text-slate-500 hover:text-slate-900 disabled:opacity-30"><ChevronLeft size={16} /></button>
          <span className="text-sm text-slate-600">{page} / {totalPages}</span>
          <button onClick={() => goPage(page + 1)} disabled={page === totalPages} className="p-1.5 rounded text-slate-500 hover:text-slate-900 disabled:opacity-30"><ChevronRight size={16} /></button>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white">
              <h3 className="font-bold text-[var(--color-navy)]">{modal.mode === "create" ? "New Question" : "Edit Question"}</h3>
              <button onClick={() => setModal(null)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Subject *</label>
                  <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}>
                    <option value="">Select…</option>
                    {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Topic</label>
                  <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Type *</label>
                  <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.questionType} onChange={e => setForm(f => ({ ...f, questionType: e.target.value }))}>
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Difficulty *</label>
                  <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}>
                    {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Marks</label>
                  <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.marks} onChange={e => setForm(f => ({ ...f, marks: parseInt(e.target.value) || 4 }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Year (PYQ)</label>
                  <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.year} placeholder="e.g. 2023" onChange={e => setForm(f => ({ ...f, year: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Exam Name</label>
                  <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.examName} placeholder="JEE Main 2023" onChange={e => setForm(f => ({ ...f, examName: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Source</label>
                  <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
                    {SOURCES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Question Text *</label>
                <textarea rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none" value={form.questionText} onChange={e => setForm(f => ({ ...f, questionText: e.target.value }))} />
              </div>

              {form.questionType === "mcq" && (
                <div className="grid grid-cols-2 gap-3">
                  {(["A", "B", "C", "D"] as const).map(opt => (
                    <div key={opt}>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Option {opt}</label>
                      <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form[`option${opt}` as keyof typeof form] as string} onChange={e => setForm(f => ({ ...f, [`option${opt}`]: e.target.value }))} />
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Correct Answer *</label>
                {form.questionType === "mcq" ? (
                  <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.correctAnswer} onChange={e => setForm(f => ({ ...f, correctAnswer: e.target.value }))}>
                    <option value="">Select…</option>
                    {["A", "B", "C", "D"].map(o => <option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.correctAnswer} onChange={e => setForm(f => ({ ...f, correctAnswer: e.target.value }))} />
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Solution / Explanation</label>
                <textarea rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none" value={form.solution} onChange={e => setForm(f => ({ ...f, solution: e.target.value }))} />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Exam Targets</label>
                <div className="flex flex-wrap gap-2">
                  {EXAM_TARGETS.map(t => (
                    <label key={t} className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input type="checkbox" checked={form.examTarget.includes(t)} onChange={e => setForm(f => ({ ...f, examTarget: e.target.checked ? [...f.examTarget, t] : f.examTarget.filter(x => x !== t) }))} />
                      {t.replace(/_/g, " ")}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-5 pb-5">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
              <button onClick={save} disabled={saving || !form.subject || !form.questionText || !form.correctAnswer} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-[var(--color-navy)] mb-3">Delete Question</h3>
            <p className="text-sm text-slate-600 mb-3">This question will be soft-deleted and moved to the recycle bin. Provide a reason:</p>
            <textarea rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none mb-4" placeholder="Reason for deletion…" value={deleteModal.reason} onChange={e => setDeleteModal(d => d ? { ...d, reason: e.target.value } : null)} />
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteModal(null)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
              <button onClick={softDelete} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type PracticeSet = { id: string; name: string; description: string | null; subject: string | null; isActive: boolean; questionCount: number; createdAt: string };

export function AdminPracticeSets({ getToken }: { getToken: () => Promise<string | null> }) {
  const { toast } = useToast();
  const { data: sets, loading, load } = useFetch<PracticeSet[]>("/admin/practice-sets", getToken);
  const [modal, setModal] = useState<{ mode: "create" | "edit"; item?: PracticeSet } | null>(null);
  const [form, setForm] = useState({ name: "", description: "", subject: "" });
  const [saving, setSaving] = useState(false);
  useModalEscape(() => setModal(null), !!modal);

  const openCreate = () => { setForm({ name: "", description: "", subject: "" }); setModal({ mode: "create" }); };
  const openEdit = (s: PracticeSet) => { setForm({ name: s.name, description: s.description ?? "", subject: s.subject ?? "" }); setModal({ mode: "edit", item: s }); };

  const save = async () => {
    setSaving(true);
    try {
      if (modal?.mode === "create") await api("POST", "/admin/practice-sets", form, getToken);
      else await api("PATCH", `/admin/practice-sets/${modal?.item?.id}`, form, getToken);
      toast(modal?.mode === "create" ? "Practice set created" : "Practice set updated", "success");
      setModal(null); load();
    } catch { toast("Failed to save practice set", "error"); }
    setSaving(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[var(--color-navy)]">Practice Sets</h2>
        <button onClick={openCreate} className="btn-primary px-4 py-2 flex items-center gap-2 text-sm"><Plus size={14} /> New Set</button>
      </div>
      {loading && <SkeletonList rows={3} />}
      <div className="space-y-3">
        {(sets ?? []).map(s => (
          <div key={s.id} className="card border border-slate-200 flex gap-3 items-center">
            <div className="flex-1">
              <p className="font-semibold text-sm text-[var(--color-navy)]">{s.name}</p>
              <p className="text-xs text-slate-500">{s.subject && `${s.subject} · `}{s.questionCount} questions{s.description && ` · ${s.description}`}</p>
            </div>
            <div className="flex gap-2 items-center shrink-0">
              {!s.isActive && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Inactive</span>}
              <button onClick={() => openEdit(s)} className="p-1.5 text-slate-400 hover:text-[var(--color-navy)]"><Pencil size={14} /></button>
            </div>
          </div>
        ))}
        {(sets ?? []).length === 0 && !loading && <p className="text-slate-400 text-sm">No practice sets yet.</p>}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[var(--color-navy)]">{modal.mode === "create" ? "New Practice Set" : "Edit Practice Set"}</h3>
              <button onClick={() => setModal(null)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
                <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Subject</label>
                <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}>
                  <option value="">All subjects</option>
                  {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                <textarea rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
              <button onClick={save} disabled={saving || !form.name} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

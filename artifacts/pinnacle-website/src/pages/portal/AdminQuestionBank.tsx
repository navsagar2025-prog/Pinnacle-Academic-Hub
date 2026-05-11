import { useState, useCallback } from "react";
import {
  Plus, X, Search, Check, Trash2, Pencil, ChevronLeft, ChevronRight,
  RotateCcw, AlertTriangle, Recycle, BookMarked, MinusCircle, Eye, EyeOff, Users,
} from "lucide-react";
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

async function fetchApi<T>(path: string, getToken: () => Promise<string | null>): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BASE}/api/v1${path}`, { headers: { Authorization: `Bearer ${token}` } });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed");
  return json.data as T;
}

type Question = {
  id: string; subject: string; topic: string | null; difficulty: string;
  questionType: string; questionText: string; correctAnswer: string; options: Record<string, string> | null;
  solution: string | null; marks: number; isPublished: boolean; examName: string | null;
  examTarget: string[] | null; source: string; reviewStatus: string;
  year: number | null; classGrade: string | null; language: string; createdAt: string;
};

type QBData = { rows: Question[]; total: number; page: number; limit: number };

type DeletionRequest = {
  id: string; subject: string; topic: string | null; questionText: string;
  difficulty: string; questionType: string; marks: number;
  deletionRequestedAt: string; deletionReason: string | null;
};

type RecycleBinItem = {
  id: string; subject: string; topic: string | null; questionText: string;
  difficulty: string; questionType: string; marks: number;
  deletedAt: string; deletionReason: string | null;
};

const SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Biology", "English", "General"];
const DIFFICULTIES = ["easy", "medium", "hard"];
const TYPES = ["mcq", "numerical", "short", "long"];
const SOURCES = ["MANUAL", "PYQ", "NCERT_EXEMPLAR", "AI", "THIRD_PARTY_FREE"];
const EXAM_TARGETS = ["JEE_MAIN", "JEE_ADVANCED", "NEET", "CBSE_BOARDS", "FOUNDATION"];

const LANGUAGES = [{ value: "en", label: "English" }, { value: "hi", label: "Hindi" }, { value: "bi", label: "Bilingual" }];
const CLASS_GRADES = ["8", "9", "10", "11", "12", "Dropper"];

const EMPTY_FORM = {
  subject: "", topic: "", classGrade: "", year: "", difficulty: "medium", questionType: "mcq",
  questionText: "", correctAnswer: "", solution: "", examName: "", marks: 4,
  examTarget: [] as string[], source: "MANUAL", language: "en",
  optionA: "", optionB: "", optionC: "", optionD: "",
};

const diffColor: Record<string, string> = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  hard: "bg-red-100 text-red-700",
};
const reviewColor: Record<string, string> = {
  approved: "bg-green-100 text-green-700",
  pending: "bg-orange-100 text-orange-700",
  rejected: "bg-red-100 text-red-700",
};

type QBTab = "all" | "pending" | "deletion-requests" | "recycle-bin";

export function AdminQuestionBank({ getToken }: { getToken: () => Promise<string | null> }) {
  const { toast } = useToast();
  const [tab, setTab] = useState<QBTab>("all");
  const [filters, setFilters] = useState({ subject: "", difficulty: "", questionType: "", source: "", topic: "", examTarget: "", reviewStatus: "" });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<QBData | null>(null);
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>([]);
  const [recycleBin, setRecycleBin] = useState<RecycleBinItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{ mode: "create" | "edit"; item?: Question } | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ id: string; reason: string } | null>(null);
  useModalEscape(() => setModal(null), !!modal);
  useModalEscape(() => setDeleteModal(null), !!deleteModal);

  const buildPath = useCallback((p = page) => {
    const params = new URLSearchParams({ page: String(p), limit: "30" });
    if (filters.subject) params.set("subject", filters.subject);
    if (filters.difficulty) params.set("difficulty", filters.difficulty);
    if (filters.questionType) params.set("questionType", filters.questionType);
    if (filters.source) params.set("source", filters.source);
    if (search.trim()) params.set("search", search.trim());
    if (tab === "pending") params.set("reviewStatus", "pending");
    return `/admin/question-bank?${params}`;
  }, [page, filters, search, tab]);

  const load = useCallback(async (p = page, activeTab = tab) => {
    setLoading(true);
    try {
      if (activeTab === "deletion-requests") {
        const rows = await fetchApi<DeletionRequest[]>("/admin/question-bank/deletion-requests", getToken);
        setDeletionRequests(rows);
      } else if (activeTab === "recycle-bin") {
        const rows = await fetchApi<RecycleBinItem[]>("/admin/question-bank/recycle-bin", getToken);
        setRecycleBin(rows);
      } else {
        const params = new URLSearchParams({ page: String(p), limit: "30" });
        if (filters.subject) params.set("subject", filters.subject);
        if (filters.topic) params.set("topic", filters.topic);
        if (filters.difficulty) params.set("difficulty", filters.difficulty);
        if (filters.questionType) params.set("questionType", filters.questionType);
        if (filters.source) params.set("source", filters.source);
        if (filters.examTarget) params.set("examTarget", filters.examTarget);
        if (search.trim()) params.set("search", search.trim());
        if (activeTab === "pending") {
          params.set("reviewStatus", "pending");
        } else if (filters.reviewStatus) {
          params.set("reviewStatus", filters.reviewStatus);
        }
        const d = await fetchApi<QBData>(`/admin/question-bank?${params}`, getToken);
        setData(d);
      }
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [page, filters, search, tab, getToken, toast]);

  // Initial load
  const [initialized, setInitialized] = useState(false);
  if (!initialized) { setInitialized(true); load(1, "all"); }

  const switchTab = (t: QBTab) => { setTab(t); setPage(1); load(1, t); };
  const applyFilters = () => { setPage(1); load(1, tab); };
  const goPage = (p: number) => { setPage(p); load(p, tab); };

  const openCreate = () => { setForm({ ...EMPTY_FORM }); setModal({ mode: "create" }); };
  const openEdit = (q: Question) => {
    const opts = q.options ?? {} as Record<string, string>;
    setForm({
      subject: q.subject, topic: q.topic ?? "", classGrade: q.classGrade ?? "",
      year: q.year ? String(q.year) : "", difficulty: q.difficulty, questionType: q.questionType,
      questionText: q.questionText, correctAnswer: q.correctAnswer, solution: q.solution ?? "",
      examName: q.examName ?? "", marks: q.marks, examTarget: q.examTarget ?? [],
      source: q.source, language: q.language ?? "en",
      optionA: opts["A"] ?? "", optionB: opts["B"] ?? "",
      optionC: opts["C"] ?? "", optionD: opts["D"] ?? "",
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
      examTarget: form.examTarget, source: form.source, language: form.language,
    };
    try {
      if (modal?.mode === "create") {
        await api("POST", "/admin/question-bank", payload, getToken);
        toast("success", "Question created");
      } else {
        await api("PATCH", `/admin/question-bank/${modal?.item?.id}`, payload, getToken);
        toast("success", "Question updated");
      }
      setModal(null);
      load(page, tab);
    } catch { toast("error", "Failed to save question"); }
    setSaving(false);
  };

  const review = async (id: string, status: "approved" | "rejected") => {
    try {
      await api("PATCH", `/admin/question-bank/${id}/review`, { reviewStatus: status }, getToken);
      toast(status === "approved" ? "success" : "info", status === "approved" ? "Approved" : "Rejected");
      load(page, tab);
    } catch { toast("error", "Failed to update review"); }
  };

  const flagForDeletion = async () => {
    if (!deleteModal) return;
    try {
      await api("DELETE", `/admin/question-bank/${deleteModal.id}`, { reason: deleteModal.reason }, getToken);
      toast("info", "Question flagged for deletion — confirm in Deletion Requests tab");
      setDeleteModal(null);
      load(page, tab);
    } catch { toast("error", "Failed to flag question"); }
  };

  const confirmDelete = async (id: string) => {
    if (!confirm("Permanently soft-delete this question? It will go to the Recycle Bin for 7 days.")) return;
    try {
      await api("POST", `/admin/question-bank/${id}/confirm-delete`, {}, getToken);
      toast("success", "Moved to Recycle Bin");
      load(1, tab);
    } catch { toast("error", "Failed to confirm deletion"); }
  };

  const restore = async (id: string) => {
    try {
      await api("POST", `/admin/question-bank/${id}/restore`, {}, getToken);
      toast("success", "Question restored");
      load(1, tab);
    } catch { toast("error", "Failed to restore"); }
  };

  const togglePublish = async (id: string, current: boolean) => {
    try {
      await api("PATCH", `/admin/question-bank/${id}`, { isPublished: !current }, getToken);
      load(page, tab);
    } catch { toast("error", "Failed to toggle publish state"); }
  };

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 30);

  const TABS: { key: QBTab; label: string }[] = [
    { key: "all", label: "All Questions" },
    { key: "pending", label: "Pending Review" },
    { key: "deletion-requests", label: "Deletion Requests" },
    { key: "recycle-bin", label: "Recycle Bin" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-navy)]">Question Bank</h2>
          {tab === "all" && <p className="text-sm text-slate-500 mt-0.5">{total} questions</p>}
        </div>
        <button onClick={openCreate} className="btn-primary px-4 py-2 flex items-center gap-2 text-sm">
          <Plus size={14} /> New Question
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => switchTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? "bg-[var(--color-navy)] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            {t.key === "deletion-requests" && <AlertTriangle size={12} className="inline mr-1" />}
            {t.key === "recycle-bin" && <Recycle size={12} className="inline mr-1" />}
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters (only for all/pending tabs) */}
      {(tab === "all" || tab === "pending") && (
        <div className="space-y-2 mb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
            <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm" value={filters.source} onChange={e => setFilters(f => ({ ...f, source: e.target.value }))}>
              <option value="">All Sources</option>
              {SOURCES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <input placeholder="Filter by topic…" className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={filters.topic} onChange={e => setFilters(f => ({ ...f, topic: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && applyFilters()} />
            <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm" value={filters.examTarget} onChange={e => setFilters(f => ({ ...f, examTarget: e.target.value }))}>
              <option value="">All Exam Targets</option>
              {EXAM_TARGETS.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
            </select>
            {tab === "all" && (
              <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm" value={filters.reviewStatus} onChange={e => setFilters(f => ({ ...f, reviewStatus: e.target.value }))}>
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            )}
            <div className={`relative ${tab === "pending" ? "md:col-span-2" : ""}`}>
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input placeholder="Full-text search…" className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm"
                value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && applyFilters()} />
            </div>
            <button onClick={applyFilters} className="bg-[var(--color-teal)] text-white rounded-lg px-3 py-2 text-sm font-medium">
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {loading && <SkeletonList rows={5} />}

      {/* All / Pending Review */}
      {!loading && (tab === "all" || tab === "pending") && (
        <>
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
                      {q.source !== "MANUAL" && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{q.source}</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-800 line-clamp-2">{q.questionText}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {q.topic && `${q.topic} · `}{q.marks} marks{q.year && ` · ${q.year}`}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {q.reviewStatus === "pending" && (
                      <>
                        <button onClick={() => review(q.id, "approved")} title="Approve"
                          className="p-1.5 text-green-500 hover:bg-green-50 rounded"><Check size={14} /></button>
                        <button onClick={() => review(q.id, "rejected")} title="Reject"
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded"><X size={14} /></button>
                      </>
                    )}
                    <button onClick={() => togglePublish(q.id, q.isPublished)} title={q.isPublished ? "Published — click to unpublish" : "Draft — click to publish"}
                      className={`p-1.5 rounded transition-colors ${q.isPublished ? "text-green-500 hover:text-slate-400" : "text-slate-300 hover:text-green-500"}`}>
                      {q.isPublished ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button onClick={() => openEdit(q)} className="p-1.5 text-slate-400 hover:text-[var(--color-navy)]"><Pencil size={14} /></button>
                    <button onClick={() => setDeleteModal({ id: q.id, reason: "" })} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
            {rows.length === 0 && <p className="text-slate-400 text-sm text-center py-8">No questions found.</p>}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button onClick={() => goPage(page - 1)} disabled={page === 1}
                className="p-1.5 rounded text-slate-500 hover:text-slate-900 disabled:opacity-30"><ChevronLeft size={16} /></button>
              <span className="text-sm text-slate-600">{page} / {totalPages}</span>
              <button onClick={() => goPage(page + 1)} disabled={page === totalPages}
                className="p-1.5 rounded text-slate-500 hover:text-slate-900 disabled:opacity-30"><ChevronRight size={16} /></button>
            </div>
          )}
        </>
      )}

      {/* Deletion Requests */}
      {!loading && tab === "deletion-requests" && (
        <div className="space-y-2">
          {deletionRequests.length === 0 && <p className="text-slate-400 text-sm text-center py-8">No pending deletion requests.</p>}
          {deletionRequests.map(q => (
            <div key={q.id} className="card border border-orange-200 bg-orange-50 p-4">
              <div className="flex gap-3 items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{q.subject}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${diffColor[q.difficulty] ?? ""}`}>{q.difficulty}</span>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{q.questionType}</span>
                  </div>
                  <p className="text-sm text-slate-800 line-clamp-2">{q.questionText}</p>
                  {q.deletionReason && (
                    <p className="text-xs text-orange-700 mt-1">Reason: {q.deletionReason}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    Flagged {new Date(q.deletionRequestedAt).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => restore(q.id)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-green-300 text-green-700 hover:bg-green-50">
                    <RotateCcw size={12} /> Restore
                  </button>
                  <button onClick={() => confirmDelete(q.id)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700">
                    <Trash2 size={12} /> Confirm Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recycle Bin */}
      {!loading && tab === "recycle-bin" && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 mb-3">Questions deleted within the last 7 days. After 7 days they are permanently purged.</p>
          {recycleBin.length === 0 && <p className="text-slate-400 text-sm text-center py-8">Recycle bin is empty.</p>}
          {recycleBin.map(q => (
            <div key={q.id} className="card border border-red-200 bg-red-50 p-4">
              <div className="flex gap-3 items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{q.subject}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${diffColor[q.difficulty] ?? ""}`}>{q.difficulty}</span>
                  </div>
                  <p className="text-sm text-slate-800 line-clamp-2">{q.questionText}</p>
                  {q.deletionReason && <p className="text-xs text-red-700 mt-1">Reason: {q.deletionReason}</p>}
                  <p className="text-xs text-slate-400 mt-1">Deleted {new Date(q.deletedAt).toLocaleString("en-IN")}</p>
                </div>
                <button onClick={() => restore(q.id)}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-green-300 text-green-700 hover:bg-green-50 shrink-0">
                  <RotateCcw size={12} /> Restore
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h3 className="font-bold text-[var(--color-navy)]">
                {modal.mode === "create" ? "New Question" : "Edit Question"}
              </h3>
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
                  <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.questionType} onChange={e => setForm(f => ({ ...f, questionType: e.target.value, correctAnswer: "" }))}>
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
                  <input type="number" placeholder="e.g. 2023" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Class / Grade</label>
                  <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.classGrade} onChange={e => setForm(f => ({ ...f, classGrade: e.target.value }))}>
                    <option value="">—</option>
                    {CLASS_GRADES.map(g => <option key={g} value={g}>Class {g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Language</label>
                  <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))}>
                    {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Exam Name</label>
                  <input placeholder="JEE Main 2023" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.examName} onChange={e => setForm(f => ({ ...f, examName: e.target.value }))} />
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
                    <option value="">Select correct option…</option>
                    {["A", "B", "C", "D"].map(o => <option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <input placeholder={form.questionType === "numerical" ? "e.g. 42.5" : "Model answer…"} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.correctAnswer} onChange={e => setForm(f => ({ ...f, correctAnswer: e.target.value }))} />
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
                      <input type="checkbox" checked={form.examTarget.includes(t)}
                        onChange={e => setForm(f => ({ ...f, examTarget: e.target.checked ? [...f.examTarget, t] : f.examTarget.filter(x => x !== t) }))} />
                      {t.replace(/_/g, " ")}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-5 pb-5 sticky bottom-0 bg-white border-t border-slate-100 pt-3">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
              <button onClick={save} disabled={saving || !form.subject || !form.questionText || !form.correctAnswer} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">
                {saving ? "Saving…" : "Save Question"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete (Flag) Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-[var(--color-navy)] mb-1">Flag for Deletion</h3>
            <p className="text-sm text-slate-600 mb-3">
              This question will be moved to Deletion Requests. An admin must confirm before it's soft-deleted.
            </p>
            <textarea rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none mb-4"
              placeholder="Reason for deletion (optional)…"
              value={deleteModal.reason}
              onChange={e => setDeleteModal(d => d ? { ...d, reason: e.target.value } : null)} />
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteModal(null)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
              <button onClick={flagForDeletion} className="px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                Flag for Deletion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Practice Sets ────────────────────────────────────────────────────────────

type PracticeSet = {
  id: string; name: string; description: string | null; subject: string | null;
  isActive: boolean; questionCount: number; assignmentCount: number; createdAt: string;
};

type Assignment = {
  id: string; setId: string; batchId: string | null; studentId: string | null;
  assignedAt: string; batchName: string | null; studentName: string | null;
};

type BatchOption = { id: string; name: string };
type StudentOption = { id: string; userName: string | null; rollNumber: string | null; batchName: string | null };

function AssignmentModal({
  practiceSet, getToken, onClose,
}: { practiceSet: PracticeSet; getToken: () => Promise<string | null>; onClose: () => void }) {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [allStudents, setAllStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"batch" | "student">("batch");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [asgns, batchList, studentList] = await Promise.all([
        fetchApi<Assignment[]>(`/admin/practice-sets/${practiceSet.id}/assignments`, getToken),
        fetchApi<BatchOption[]>("/admin/batches", getToken),
        fetchApi<StudentOption[]>("/admin/students", getToken),
      ]);
      setAssignments(asgns);
      setBatches(batchList);
      setAllStudents(studentList);
    } catch { toast("error", "Failed to load assignments"); }
    finally { setLoading(false); }
  }, [practiceSet.id, getToken, toast]);

  const [initialized, setInitialized] = useState(false);
  if (!initialized) { setInitialized(true); load(); }

  const filteredStudents = studentSearch.trim().length > 0
    ? allStudents.filter(s =>
        (s.userName ?? "").toLowerCase().includes(studentSearch.toLowerCase()) ||
        (s.rollNumber ?? "").toLowerCase().includes(studentSearch.toLowerCase())
      ).slice(0, 8)
    : [];

  const assignToBatch = async () => {
    if (!selectedBatchId) return;
    setSaving(true);
    try {
      await api("POST", `/admin/practice-sets/${practiceSet.id}/assignments`, { batchId: selectedBatchId }, getToken);
      toast("success", "Assigned to batch");
      setSelectedBatchId("");
      load();
    } catch { toast("error", "Failed to assign"); }
    finally { setSaving(false); }
  };

  const assignToStudent = async () => {
    if (!selectedStudent) return;
    setSaving(true);
    try {
      await api("POST", `/admin/practice-sets/${practiceSet.id}/assignments`, { studentId: selectedStudent.id }, getToken);
      toast("success", `Assigned to ${selectedStudent.userName ?? selectedStudent.rollNumber}`);
      setSelectedStudent(null);
      setStudentSearch("");
      load();
    } catch { toast("error", "Failed to assign"); }
    finally { setSaving(false); }
  };

  const remove = async (assignmentId: string) => {
    try {
      await api("DELETE", `/admin/practice-sets/${practiceSet.id}/assignments/${assignmentId}`, null, getToken);
      toast("success", "Assignment removed");
      load();
    } catch { toast("error", "Failed to remove"); }
  };

  useModalEscape(onClose, true);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="font-bold text-[var(--color-navy)]">Assign: {practiceSet.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Assign this set to a batch or individual student</p>
          </div>
          <button onClick={onClose}><X size={18} className="text-slate-400" /></button>
        </div>

        <div className="p-5 space-y-4 flex-1 overflow-y-auto">
          {/* Assign form */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <div className="flex gap-2">
              <button onClick={() => setMode("batch")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${mode === "batch" ? "bg-[var(--color-navy)] text-white" : "bg-white border border-slate-200 text-slate-600"}`}>
                Assign to Batch
              </button>
              <button onClick={() => setMode("student")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${mode === "student" ? "bg-[var(--color-navy)] text-white" : "bg-white border border-slate-200 text-slate-600"}`}>
                Assign to Student
              </button>
            </div>
            {mode === "batch" ? (
              <div className="flex gap-2">
                <select className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={selectedBatchId} onChange={e => setSelectedBatchId(e.target.value)}>
                  <option value="">Select batch…</option>
                  {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <button onClick={assignToBatch} disabled={!selectedBatchId || saving}
                  className="bg-[var(--color-teal)] text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50">
                  {saving ? "…" : "Assign"}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedStudent ? (
                  <div className="flex items-center gap-2 border border-teal-200 bg-teal-50 rounded-lg px-3 py-2">
                    <span className="text-sm text-teal-800 flex-1">{selectedStudent.userName} {selectedStudent.rollNumber && `(${selectedStudent.rollNumber})`}</span>
                    <button onClick={() => { setSelectedStudent(null); setStudentSearch(""); }} className="text-teal-400 hover:text-teal-700"><X size={14} /></button>
                    <button onClick={assignToStudent} disabled={saving}
                      className="bg-[var(--color-teal)] text-white rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50">
                      {saving ? "…" : "Assign"}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm"
                        placeholder="Search student by name or roll…"
                        value={studentSearch}
                        onChange={e => setStudentSearch(e.target.value)}
                      />
                    </div>
                    {filteredStudents.length > 0 && (
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        {filteredStudents.map(s => (
                          <button key={s.id} onClick={() => { setSelectedStudent(s); setStudentSearch(""); }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0 flex justify-between">
                            <span>{s.userName ?? "—"}</span>
                            <span className="text-slate-400 text-xs">{s.rollNumber}{s.batchName && ` · ${s.batchName}`}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {studentSearch.trim().length > 0 && filteredStudents.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-2">No students match.</p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Current assignments */}
          <div>
            <p className="text-sm font-semibold text-[var(--color-navy)] mb-2">
              Current Assignments ({assignments.length})
            </p>
            {loading && <SkeletonList rows={2} />}
            {!loading && assignments.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">No assignments yet.</p>
            )}
            <div className="space-y-2">
              {assignments.map(a => (
                <div key={a.id} className="flex items-center justify-between border border-slate-200 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {a.batchId ? `Batch: ${a.batchName ?? a.batchId}` : `Student: ${a.studentName ?? a.studentId}`}
                    </p>
                    <p className="text-xs text-slate-400">{new Date(a.assignedAt).toLocaleDateString("en-IN")}</p>
                  </div>
                  <button onClick={() => remove(a.id)} className="text-slate-300 hover:text-red-500 p-1 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 pb-4 shrink-0">
          <button onClick={onClose} className="w-full py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

type SetQuestion = {
  id: string; questionId: string; sortOrder: number;
  subject: string | null; topic: string | null; questionText: string | null;
  difficulty: string | null; questionType: string | null; marks: number | null;
};

type BankQuestion = {
  id: string; subject: string; topic: string | null; questionText: string;
  difficulty: string; questionType: string; marks: number;
};

function QuestionPickerModal({
  setId, setName, getToken, onClose,
}: { setId: string; setName: string; getToken: () => Promise<string | null>; onClose: () => void }) {
  const { toast } = useToast();
  const [setQuestions, setSetQuestions] = useState<SetQuestion[]>([]);
  const [bankResults, setBankResults] = useState<BankQuestion[]>([]);
  const [loadingSet, setLoadingSet] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchSubject, setSearchSubject] = useState("");
  const [searchText, setSearchText] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);

  const loadSetQuestions = useCallback(async () => {
    setLoadingSet(true);
    try {
      const rows = await fetchApi<SetQuestion[]>(`/admin/practice-sets/${setId}/questions`, getToken);
      setSetQuestions(rows);
    } catch { toast("error", "Failed to load set questions"); }
    finally { setLoadingSet(false); }
  }, [setId, getToken, toast]);

  const [loaded, setLoaded] = useState(false);
  if (!loaded) { setLoaded(true); loadSetQuestions(); }

  const searchBank = async () => {
    setSearching(true);
    try {
      const params = new URLSearchParams({ limit: "20", page: "1" });
      if (searchSubject) params.set("subject", searchSubject);
      if (searchText.trim()) params.set("search", searchText.trim());
      const d = await fetchApi<{ rows: BankQuestion[] }>(`/admin/question-bank?${params}`, getToken);
      setBankResults(d.rows);
    } catch { toast("error", "Failed to search bank"); }
    finally { setSearching(false); }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const addSelected = async () => {
    if (selected.size === 0) return;
    setAdding(true);
    try {
      await api("POST", `/admin/practice-sets/${setId}/questions`, { questionIds: [...selected] }, getToken);
      toast("success", `Added ${selected.size} question(s)`);
      setSelected(new Set());
      loadSetQuestions();
    } catch { toast("error", "Failed to add questions"); }
    finally { setAdding(false); }
  };

  const removeQuestion = async (questionId: string) => {
    try {
      await api("DELETE", `/admin/practice-sets/${setId}/questions/${questionId}`, null, getToken);
      toast("success", "Removed from set");
      loadSetQuestions();
    } catch { toast("error", "Failed to remove"); }
  };

  useModalEscape(onClose, true);

  const inSetIds = new Set(setQuestions.map(q => q.questionId));

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="font-bold text-[var(--color-navy)]">{setName}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Manage questions in this practice set</p>
          </div>
          <button onClick={onClose}><X size={18} className="text-slate-400" /></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Questions in set */}
          <div className="w-2/5 border-r border-slate-100 flex flex-col">
            <div className="px-4 py-3 border-b border-slate-100 shrink-0">
              <p className="text-sm font-semibold text-[var(--color-navy)]">
                In this set ({setQuestions.length})
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {loadingSet && <SkeletonList rows={3} />}
              {!loadingSet && setQuestions.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6">No questions yet. Search and add from the bank →</p>
              )}
              {setQuestions.map(q => (
                <div key={q.id} className="border border-slate-200 rounded-lg p-2.5 bg-slate-50">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex gap-1 mb-1 flex-wrap">
                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{q.subject}</span>
                        {q.difficulty && <span className={`text-xs px-1.5 py-0.5 rounded ${diffColor[q.difficulty] ?? ""}`}>{q.difficulty}</span>}
                      </div>
                      <p className="text-xs text-slate-700 line-clamp-2">{q.questionText}</p>
                    </div>
                    <button onClick={() => removeQuestion(q.questionId)}
                      className="p-1 text-slate-300 hover:text-red-500 shrink-0 transition-colors" title="Remove from set">
                      <MinusCircle size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Bank search */}
          <div className="flex-1 flex flex-col">
            <div className="px-4 py-3 border-b border-slate-100 shrink-0">
              <p className="text-sm font-semibold text-[var(--color-navy)] mb-2">Search Question Bank</p>
              <div className="flex gap-2">
                <select className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs" value={searchSubject} onChange={e => setSearchSubject(e.target.value)}>
                  <option value="">All Subjects</option>
                  {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
                <input placeholder="Search text…" className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
                  value={searchText} onChange={e => setSearchText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && searchBank()} />
                <button onClick={searchBank} className="bg-[var(--color-teal)] text-white rounded-lg px-3 py-1.5 text-xs font-medium">
                  {searching ? "…" : "Search"}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {bankResults.length === 0 && !searching && (
                <p className="text-xs text-slate-400 text-center py-6">Search the bank above to find questions to add.</p>
              )}
              {bankResults.map(q => {
                const alreadyIn = inSetIds.has(q.id);
                const isSelected = selected.has(q.id);
                return (
                  <div key={q.id}
                    onClick={() => !alreadyIn && toggleSelect(q.id)}
                    className={`border rounded-lg p-2.5 cursor-pointer transition-colors ${alreadyIn ? "border-green-200 bg-green-50 cursor-default opacity-60" : isSelected ? "border-[var(--color-teal)] bg-teal-50" : "border-slate-200 hover:border-slate-300"}`}>
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex gap-1 mb-1 flex-wrap">
                          <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{q.subject}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${diffColor[q.difficulty] ?? ""}`}>{q.difficulty}</span>
                          <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{q.questionType}</span>
                        </div>
                        <p className="text-xs text-slate-700 line-clamp-2">{q.questionText}</p>
                      </div>
                      {alreadyIn ? (
                        <Check size={14} className="text-green-500 shrink-0 mt-1" />
                      ) : (
                        <div className={`w-4 h-4 rounded border shrink-0 mt-1 flex items-center justify-center ${isSelected ? "bg-[var(--color-teal)] border-[var(--color-teal)]" : "border-slate-300"}`}>
                          {isSelected && <Check size={10} className="text-white" />}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {selected.size > 0 && (
              <div className="px-4 py-3 border-t border-slate-100 shrink-0 flex items-center justify-between bg-teal-50">
                <p className="text-sm text-teal-700">{selected.size} question(s) selected</p>
                <button onClick={addSelected} disabled={adding}
                  className="btn-primary px-4 py-1.5 text-sm disabled:opacity-50">
                  {adding ? "Adding…" : `Add ${selected.size} to Set`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminPracticeSets({ getToken }: { getToken: () => Promise<string | null> }) {
  const { toast } = useToast();
  const [sets, setSets] = useState<PracticeSet[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{ mode: "create" | "edit"; item?: PracticeSet } | null>(null);
  const [pickerSet, setPickerSet] = useState<PracticeSet | null>(null);
  const [assignSet, setAssignSet] = useState<PracticeSet | null>(null);
  const [form, setForm] = useState({ name: "", description: "", subject: "" });
  const [saving, setSaving] = useState(false);
  useModalEscape(() => setModal(null), !!modal);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchApi<PracticeSet[]>("/admin/practice-sets", getToken);
      setSets(rows);
    } catch { toast("error", "Failed to load practice sets"); }
    finally { setLoading(false); }
  }, [getToken, toast]);

  const [initialized, setInitialized] = useState(false);
  if (!initialized) { setInitialized(true); load(); }

  const openCreate = () => { setForm({ name: "", description: "", subject: "" }); setModal({ mode: "create" }); };
  const openEdit = (s: PracticeSet) => {
    setForm({ name: s.name, description: s.description ?? "", subject: s.subject ?? "" });
    setModal({ mode: "edit", item: s });
  };

  const save = async () => {
    setSaving(true);
    try {
      if (modal?.mode === "create") {
        await api("POST", "/admin/practice-sets", form, getToken);
        toast("success", "Practice set created");
      } else {
        await api("PATCH", `/admin/practice-sets/${modal?.item?.id}`, form, getToken);
        toast("success", "Practice set updated");
      }
      setModal(null);
      load();
    } catch { toast("error", "Failed to save practice set"); }
    setSaving(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[var(--color-navy)]">Practice Sets</h2>
        <button onClick={openCreate} className="btn-primary px-4 py-2 flex items-center gap-2 text-sm">
          <Plus size={14} /> New Set
        </button>
      </div>

      {loading && <SkeletonList rows={3} />}

      <div className="space-y-3">
        {sets.map(s => (
          <div key={s.id} className="card border border-slate-200 flex gap-3 items-center">
            <div className="flex-1">
              <p className="font-semibold text-sm text-[var(--color-navy)]">{s.name}</p>
              <p className="text-xs text-slate-500">
                {s.subject && `${s.subject} · `}
                {s.questionCount} question{s.questionCount !== 1 ? "s" : ""}
                {" · "}
                <span className={s.assignmentCount > 0 ? "text-teal-600 font-medium" : "text-slate-400"}>
                  {s.assignmentCount} assigned
                </span>
                {s.description && ` · ${s.description}`}
              </p>
            </div>
            <div className="flex gap-2 items-center shrink-0">
              {!s.isActive && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Inactive</span>}
              <button onClick={() => setAssignSet(s)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-orange-300 text-orange-700 hover:bg-orange-50 transition-colors">
                <Users size={12} /> Assign
              </button>
              <button onClick={() => setPickerSet(s)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[var(--color-teal)] text-[var(--color-teal)] hover:bg-teal-50 transition-colors">
                <BookMarked size={12} /> Questions
              </button>
              <button onClick={() => openEdit(s)} className="p-1.5 text-slate-400 hover:text-[var(--color-navy)]">
                <Pencil size={14} />
              </button>
            </div>
          </div>
        ))}
        {sets.length === 0 && !loading && (
          <p className="text-slate-400 text-sm text-center py-8">No practice sets yet. Create one to get started.</p>
        )}
      </div>

      {/* Create / Edit modal */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[var(--color-navy)]">
                {modal.mode === "create" ? "New Practice Set" : "Edit Practice Set"}
              </h3>
              <button onClick={() => setModal(null)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
                <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Subject</label>
                <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}>
                  <option value="">All subjects</option>
                  {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                <textarea rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none"
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
              <button onClick={save} disabled={saving || !form.name}
                className="btn-primary px-4 py-2 text-sm disabled:opacity-50">
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question picker modal */}
      {pickerSet && (
        <QuestionPickerModal
          setId={pickerSet.id}
          setName={pickerSet.name}
          getToken={getToken}
          onClose={() => { setPickerSet(null); load(); }}
        />
      )}

      {/* Assignment modal */}
      {assignSet && (
        <AssignmentModal
          practiceSet={assignSet}
          getToken={getToken}
          onClose={() => { setAssignSet(null); load(); }}
        />
      )}
    </div>
  );
}

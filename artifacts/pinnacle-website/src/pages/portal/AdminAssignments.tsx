import { useState, useEffect, useCallback } from "react";
import { Plus, X, Pencil, Trash2, RefreshCw, AlertCircle } from "lucide-react";
import { useToast, SkeletonList, useModalEscape, apiMutation } from "./portalUtils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function useFetch<T>(path: string, getToken: () => Promise<string | null>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async (p = path) => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${BASE}/api/v1${p}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json(); setData(json.data);
    } finally { setLoading(false); }
  }, [path]);
  useEffect(() => { load(); }, [load]);
  return { data, loading, reload: load };
}

type Assignment = { id: string; title: string; subject: string; description: string | null; dueDate: string; maxMarks: number | null; isVisible: boolean; fileUrl: string | null; batchId: string | null; batchName: string | null; createdAt: string };
type Batch = { id: string; name: string };

const SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Biology", "English", "General"];
const EMPTY = { batchId: "", title: "", subject: "", description: "", dueDate: "", maxMarks: "", fileUrl: "" };

export function AdminAssignments({ getToken }: { getToken: () => Promise<string | null> }) {
  const { toast } = useToast();
  const { data: batches } = useFetch<Batch[]>("/admin/batches", getToken);
  const [filterBatch, setFilterBatch] = useState("");
  const [assignments, setAssignments] = useState<Assignment[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ mode: "create" | "edit"; item?: Assignment } | null>(null);
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  useModalEscape(() => setModal(null), !!modal);

  const load = useCallback(async (batch = filterBatch) => {
    setLoading(true);
    try {
      const token = await getToken();
      const path = batch ? `/admin/assignments?batchId=${batch}` : "/admin/assignments";
      const res = await fetch(`${BASE}/api/v1${path}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json(); setAssignments(json.data);
    } finally { setLoading(false); }
  }, [filterBatch, getToken]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm({ ...EMPTY }); setModal({ mode: "create" }); };
  const openEdit = (a: Assignment) => {
    setForm({ batchId: a.batchId ?? "", title: a.title, subject: a.subject, description: a.description ?? "", dueDate: a.dueDate.split("T")[0], maxMarks: String(a.maxMarks ?? ""), fileUrl: a.fileUrl ?? "" });
    setModal({ mode: "edit", item: a });
  };

  const save = async () => {
    setSaving(true);
    const p = { ...form, batchId: form.batchId || null, description: form.description || null, maxMarks: form.maxMarks ? parseInt(form.maxMarks) : null, fileUrl: form.fileUrl || null };
    try {
      const res = modal?.mode === "create"
        ? await apiMutation("POST", "/admin/assignments", p, getToken)
        : await apiMutation("PATCH", `/admin/assignments/${modal?.item?.id}`, p, getToken);
      if (res.ok) { toast("success", modal?.mode === "create" ? "Assignment created" : "Assignment updated"); setModal(null); load(); }
      else toast("error", (res as { error?: string }).error ?? "Save failed");
    } catch { toast("error", "Network error"); }
    finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this assignment?")) return;
    const res = await apiMutation("DELETE", `/admin/assignments/${id}`, null, getToken);
    if (res.ok) { toast("success", "Assignment deleted"); load(); }
    else toast("error", "Delete failed");
  };

  const isOverdue = (d: string) => new Date(d) < new Date();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[var(--color-navy)]">Assignments</h2>
        <div className="flex gap-2">
          <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm" value={filterBatch} onChange={e => { setFilterBatch(e.target.value); load(e.target.value); }}>
            <option value="">All Batches</option>
            {(batches ?? []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <button onClick={() => load()} className="p-2 text-slate-400 hover:text-slate-700"><RefreshCw size={15} /></button>
          <button onClick={openCreate} className="btn-primary px-4 py-2 flex items-center gap-2 text-sm"><Plus size={14} /> New Assignment</button>
        </div>
      </div>

      {loading && <SkeletonList rows={4} />}
      <div className="space-y-3">
        {(assignments ?? []).map(a => (
          <div key={a.id} className="card border border-slate-200 flex gap-3 items-start">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-1.5 mb-1">
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{a.subject}</span>
                {a.batchName && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{a.batchName}</span>}
                {isOverdue(a.dueDate) && <span className="flex items-center gap-0.5 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full"><AlertCircle size={10} /> Overdue</span>}
                {!a.isVisible && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">Hidden</span>}
              </div>
              <p className="font-semibold text-sm text-[var(--color-navy)]">{a.title}</p>
              {a.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{a.description}</p>}
              <p className="text-xs text-slate-400 mt-1">Due: {new Date(a.dueDate).toLocaleDateString("en-IN")}{a.maxMarks && ` · ${a.maxMarks} marks`}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => openEdit(a)} className="p-1.5 text-slate-400 hover:text-[var(--color-navy)]"><Pencil size={14} /></button>
              <button onClick={() => del(a.id)} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {(assignments ?? []).length === 0 && !loading && <p className="text-slate-400 text-sm">No assignments yet.</p>}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-bold text-[var(--color-navy)]">{modal.mode === "create" ? "New Assignment" : "Edit Assignment"}</h3>
              <button onClick={() => setModal(null)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Title *</label>
                <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Subject *</label>
                  <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}>
                    <option value="">Select…</option>
                    {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Batch</label>
                  <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.batchId} onChange={e => setForm(f => ({ ...f, batchId: e.target.value }))}>
                    <option value="">All Batches</option>
                    {(batches ?? []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Due Date *</label>
                  <input type="date" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Max Marks</label>
                  <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.maxMarks} onChange={e => setForm(f => ({ ...f, maxMarks: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                <textarea rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">File URL</label>
                <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="https://…" value={form.fileUrl} onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-5 pb-5">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
              <button onClick={save} disabled={saving || !form.title || !form.subject || !form.dueDate} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

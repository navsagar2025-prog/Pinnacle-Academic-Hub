import { useState, useEffect, useCallback } from "react";
import { Plus, X, Pencil, Trash2, Eye, EyeOff, RefreshCw } from "lucide-react";
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

type Material = { id: string; title: string; subject: string; type: string; fileUrl: string | null; fileSize: string | null; downloadCount: number; isVisible: boolean; batchId: string | null; batchName: string | null; createdAt: string };
type Batch = { id: string; name: string };

const SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Biology", "English", "General"];
const TYPES = ["notes", "formula", "exercise", "summary", "paper"];
const EMPTY = { batchId: "", title: "", subject: "", type: "notes", fileUrl: "", fileSize: "" };

const TYPE_COLORS: Record<string, string> = {
  notes: "bg-blue-100 text-blue-700", formula: "bg-purple-100 text-purple-700",
  exercise: "bg-orange-100 text-orange-700", summary: "bg-teal-100 text-teal-700",
  paper: "bg-red-100 text-red-700",
};

export function AdminStudyMaterials({ getToken }: { getToken: () => Promise<string | null> }) {
  const { toast } = useToast();
  const { data: batches } = useFetch<Batch[]>("/admin/batches", getToken);
  const [filterBatch, setFilterBatch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [materials, setMaterials] = useState<Material[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ mode: "create" | "edit"; item?: Material } | null>(null);
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  useModalEscape(() => setModal(null), !!modal);

  const loadMaterials = useCallback(async (batch = filterBatch) => {
    setLoading(true);
    try {
      const token = await getToken();
      const path = batch ? `/admin/study-materials?batchId=${batch}` : "/admin/study-materials";
      const res = await fetch(`${BASE}/api/v1${path}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json(); setMaterials(json.data);
    } finally { setLoading(false); }
  }, [filterBatch, getToken]);

  useEffect(() => { loadMaterials(); }, [loadMaterials]);

  const openCreate = () => { setForm({ ...EMPTY }); setModal({ mode: "create" }); };
  const openEdit = (m: Material) => {
    setForm({ batchId: m.batchId ?? "", title: m.title, subject: m.subject, type: m.type, fileUrl: m.fileUrl ?? "", fileSize: m.fileSize ?? "" });
    setModal({ mode: "edit", item: m });
  };

  const save = async () => {
    setSaving(true);
    const p = { ...form, batchId: form.batchId || null, fileUrl: form.fileUrl || null, fileSize: form.fileSize || null };
    try {
      const res = modal?.mode === "create"
        ? await apiMutation("POST", "/admin/study-materials", p, getToken)
        : await apiMutation("PATCH", `/admin/study-materials/${modal?.item?.id}`, p, getToken);
      if (res.ok) { toast("success", modal?.mode === "create" ? "Material added" : "Material updated"); setModal(null); loadMaterials(); }
      else toast("error", (res as { error?: string }).error ?? "Save failed");
    } catch { toast("error", "Network error"); }
    finally { setSaving(false); }
  };

  const toggleVis = async (m: Material) => {
    const res = await apiMutation("PATCH", `/admin/study-materials/${m.id}`, { isVisible: !m.isVisible }, getToken);
    if (res.ok) { toast("success", m.isVisible ? "Hidden" : "Visible"); loadMaterials(); }
    else toast("error", "Update failed");
  };

  const del = async (id: string) => {
    if (!confirm("Delete this material?")) return;
    const res = await apiMutation("DELETE", `/admin/study-materials/${id}`, null, getToken);
    if (res.ok) { toast("success", "Material deleted"); loadMaterials(); }
    else toast("error", "Delete failed");
  };

  const visible = (materials ?? []).filter(m => !filterType || m.type === filterType);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[var(--color-navy)]">Study Materials</h2>
        <div className="flex gap-2 flex-wrap justify-end">
          <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm" value={filterBatch} onChange={e => { setFilterBatch(e.target.value); loadMaterials(e.target.value); }}>
            <option value="">All Batches</option>
            {(batches ?? []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <button onClick={() => loadMaterials()} className="p-2 text-slate-400 hover:text-slate-700"><RefreshCw size={15} /></button>
          <button onClick={openCreate} className="btn-primary px-4 py-2 flex items-center gap-2 text-sm"><Plus size={14} /> Add Material</button>
        </div>
      </div>

      {loading && <SkeletonList rows={5} />}
      <div className="space-y-2">
        {visible.map(m => (
          <div key={m.id} className={`card border flex gap-3 items-center ${m.isVisible ? "border-slate-200" : "border-slate-100 opacity-60"}`}>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-1.5 mb-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[m.type] ?? "bg-slate-100 text-slate-600"}`}>{m.type}</span>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{m.subject}</span>
                {m.batchName && <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">{m.batchName}</span>}
              </div>
              <p className="font-semibold text-sm text-[var(--color-navy)]">{m.title}</p>
              <p className="text-xs text-slate-400 mt-0.5">{m.downloadCount} downloads{m.fileSize && ` · ${m.fileSize}`}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              {m.fileUrl && <a href={m.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 text-teal-500 hover:text-teal-700 text-xs">View</a>}
              <button onClick={() => toggleVis(m)} className="p-1.5 text-slate-400 hover:text-slate-700">{m.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}</button>
              <button onClick={() => openEdit(m)} className="p-1.5 text-slate-400 hover:text-[var(--color-navy)]"><Pencil size={14} /></button>
              <button onClick={() => del(m.id)} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {visible.length === 0 && !loading && <p className="text-slate-400 text-sm">No materials found.</p>}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-bold text-[var(--color-navy)]">{modal.mode === "create" ? "Add Material" : "Edit Material"}</h3>
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
                  <label className="block text-xs font-medium text-slate-600 mb-1">Type *</label>
                  <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {TYPES.map(t => <option key={t}>{t}</option>)}
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
                  <label className="block text-xs font-medium text-slate-600 mb-1">File Size</label>
                  <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="e.g. 2.4 MB" value={form.fileSize} onChange={e => setForm(f => ({ ...f, fileSize: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">File URL</label>
                <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="https://drive.google.com/…" value={form.fileUrl} onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-5 pb-5">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
              <button onClick={save} disabled={saving || !form.title || !form.subject || !form.type} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

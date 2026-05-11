import { useState, useEffect, useCallback } from "react";
import { Plus, X, Pencil, Eye, EyeOff, Archive } from "lucide-react";
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

type Recording = {
  id: string; title: string; subject: string; teacherName: string | null;
  recordingUrl: string; sourceProvider: string; classDate: string | null;
  durationMinutes: number | null; isVisible: boolean; viewCount: number;
  batchId: string | null; batchName: string | null; createdAt: string;
};
type Batch = { id: string; name: string };

const SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Biology", "English", "General"];
const EMPTY = { batchId: "", title: "", subject: "", teacherName: "", recordingUrl: "", sourceProvider: "zoom", classDate: "", durationMinutes: 60 };
const SOURCE_COLORS: Record<string, string> = { zoom: "bg-blue-100 text-blue-700", youtube: "bg-red-100 text-red-700", google_meet: "bg-green-100 text-green-700" };

export function AdminRecordingsSection({ getToken }: { getToken: () => Promise<string | null> }) {
  const { toast } = useToast();
  const { data: batches } = useFetch<Batch[]>("/admin/batches", getToken);
  const [filterBatch, setFilterBatch] = useState("");
  const [recordings, setRecordings] = useState<Recording[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ mode: "create" | "edit"; item?: Recording } | null>(null);
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  useModalEscape(() => setModal(null), !!modal);

  const load = useCallback(async (batch = filterBatch) => {
    setLoading(true);
    try {
      const token = await getToken();
      const path = batch ? `/admin/recordings?batchId=${batch}` : "/admin/recordings";
      const res = await fetch(`${BASE}/api/v1${path}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json(); setRecordings(json.data);
    } finally { setLoading(false); }
  }, [filterBatch, getToken]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm({ ...EMPTY }); setModal({ mode: "create" }); };
  const openEdit = (r: Recording) => {
    setForm({ batchId: r.batchId ?? "", title: r.title, subject: r.subject, teacherName: r.teacherName ?? "", recordingUrl: r.recordingUrl, sourceProvider: r.sourceProvider, classDate: r.classDate ? r.classDate.split("T")[0] : "", durationMinutes: r.durationMinutes ?? 60 });
    setModal({ mode: "edit", item: r });
  };

  const save = async () => {
    setSaving(true);
    const p = { ...form, batchId: form.batchId || null, teacherName: form.teacherName || null, classDate: form.classDate || null };
    try {
      const res = modal?.mode === "create"
        ? await apiMutation("POST", "/admin/recordings", p, getToken)
        : await apiMutation("PATCH", `/admin/recordings/${modal?.item?.id}`, p, getToken);
      if (res.ok) { toast("success", modal?.mode === "create" ? "Recording added" : "Recording updated"); setModal(null); load(); }
      else toast("error", (res as { error?: string }).error ?? "Save failed");
    } catch { toast("error", "Network error"); }
    finally { setSaving(false); }
  };

  const toggleVis = async (r: Recording) => {
    const res = await apiMutation("PATCH", `/admin/recordings/${r.id}`, { isVisible: !r.isVisible }, getToken);
    if (res.ok) { toast("success", r.isVisible ? "Hidden" : "Now visible"); load(); }
    else toast("error", "Update failed");
  };

  const archive = async (id: string) => {
    if (!confirm("Archive this recording?")) return;
    const res = await apiMutation("DELETE", `/admin/recordings/${id}`, null, getToken);
    if (res.ok) { toast("success", "Recording archived"); load(); }
    else toast("error", "Archive failed");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[var(--color-navy)]">Class Recordings</h2>
        <div className="flex gap-2">
          <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm" value={filterBatch} onChange={e => { setFilterBatch(e.target.value); load(e.target.value); }}>
            <option value="">All Batches</option>
            {(batches ?? []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <button onClick={openCreate} className="btn-primary px-4 py-2 flex items-center gap-2 text-sm"><Plus size={14} /> Add Recording</button>
        </div>
      </div>

      {loading && <SkeletonList rows={4} />}
      <div className="space-y-2">
        {(recordings ?? []).map(r => (
          <div key={r.id} className={`card border flex gap-3 items-center ${r.isVisible ? "border-slate-200" : "border-slate-100 opacity-60"}`}>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-1.5 mb-1">
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{r.subject}</span>
                {r.batchName && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{r.batchName}</span>}
                <span className={`text-xs px-2 py-0.5 rounded-full ${SOURCE_COLORS[r.sourceProvider] ?? "bg-slate-100 text-slate-600"}`}>{r.sourceProvider}</span>
              </div>
              <p className="font-semibold text-sm text-[var(--color-navy)]">{r.title}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {r.teacherName && `${r.teacherName} · `}
                {r.classDate && `${new Date(r.classDate).toLocaleDateString("en-IN")} · `}
                {r.durationMinutes && `${r.durationMinutes}min · `}
                {r.viewCount} views
              </p>
            </div>
            <div className="flex gap-1 shrink-0 items-center">
              <a href={r.recordingUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--color-teal)] hover:underline px-2 py-1">Watch</a>
              <button onClick={() => toggleVis(r)} className="p-1.5 text-slate-400 hover:text-slate-700">{r.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}</button>
              <button onClick={() => openEdit(r)} className="p-1.5 text-slate-400 hover:text-[var(--color-navy)]"><Pencil size={14} /></button>
              <button onClick={() => archive(r.id)} className="p-1.5 text-slate-400 hover:text-orange-500"><Archive size={14} /></button>
            </div>
          </div>
        ))}
        {(recordings ?? []).length === 0 && !loading && <p className="text-slate-400 text-sm">No recordings yet.</p>}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-bold text-[var(--color-navy)]">{modal.mode === "create" ? "Add Recording" : "Edit Recording"}</h3>
              <button onClick={() => setModal(null)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Title *</label>
                <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Recording URL *</label>
                <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="https://zoom.us/rec/… or youtube.com/watch?v=…" value={form.recordingUrl} onChange={e => setForm(f => ({ ...f, recordingUrl: e.target.value }))} />
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
                  <label className="block text-xs font-medium text-slate-600 mb-1">Source</label>
                  <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.sourceProvider} onChange={e => setForm(f => ({ ...f, sourceProvider: e.target.value }))}>
                    <option value="zoom">Zoom</option>
                    <option value="youtube">YouTube</option>
                    <option value="google_meet">Google Meet</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Batch</label>
                  <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.batchId} onChange={e => setForm(f => ({ ...f, batchId: e.target.value }))}>
                    <option value="">None</option>
                    {(batches ?? []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Teacher Name</label>
                  <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.teacherName} onChange={e => setForm(f => ({ ...f, teacherName: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Class Date</label>
                  <input type="date" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.classDate} onChange={e => setForm(f => ({ ...f, classDate: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Duration (min)</label>
                  <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.durationMinutes} onChange={e => setForm(f => ({ ...f, durationMinutes: parseInt(e.target.value) || 60 }))} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-5 pb-5">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
              <button onClick={save} disabled={saving || !form.title || !form.subject || !form.recordingUrl} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

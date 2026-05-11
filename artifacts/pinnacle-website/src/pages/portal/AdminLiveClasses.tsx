import { useState, useEffect, useCallback } from "react";
import { Plus, X, Pencil, Trash2, Video } from "lucide-react";
import { useToast, SkeletonList, useModalEscape, apiMutation } from "./portalUtils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function useFetch<T>(path: string, getToken: () => Promise<string | null>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${BASE}/api/v1${path}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json(); setData(json.data);
    } finally { setLoading(false); }
  }, [path]);
  useEffect(() => { load(); }, [load]);
  return { data, loading, reload: load };
}

type LiveClass = { id: string; topic: string; subject: string | null; scheduledAt: string; status: string; durationMinutes: number | null; zoomMeetingId: string | null; zoomJoinUrl: string | null; zoomPasscode: string | null; recordingUrl: string | null; batchId: string | null; batchName: string | null; teacherId: string | null; teacherName: string | null };
type Batch = { id: string; name: string };
type Teacher = { id: string; userName: string | null };

const STATUSES = ["scheduled", "live", "completed", "cancelled"];
const STATUS_COLORS: Record<string, string> = { scheduled: "bg-blue-100 text-blue-700", live: "bg-green-100 text-green-700", completed: "bg-slate-100 text-slate-600", cancelled: "bg-red-100 text-red-600" };
const EMPTY = { batchId: "", teacherId: "", topic: "", subject: "", zoomMeetingId: "", zoomJoinUrl: "", zoomPasscode: "", scheduledAt: "", durationMinutes: 60 };

export function AdminLiveClasses({ getToken }: { getToken: () => Promise<string | null> }) {
  const { toast } = useToast();
  const { data: classes, loading, reload } = useFetch<LiveClass[]>("/admin/live-classes", getToken);
  const { data: batches } = useFetch<Batch[]>("/admin/batches", getToken);
  const { data: teachers } = useFetch<Teacher[]>("/admin/teachers", getToken);
  const [modal, setModal] = useState<{ mode: "create" | "edit"; item?: LiveClass } | null>(null);
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  useModalEscape(() => setModal(null), !!modal);

  const openCreate = () => { setForm({ ...EMPTY }); setModal({ mode: "create" }); };
  const openEdit = (c: LiveClass) => {
    setForm({ batchId: c.batchId ?? "", teacherId: c.teacherId ?? "", topic: c.topic, subject: c.subject ?? "", zoomMeetingId: c.zoomMeetingId ?? "", zoomJoinUrl: c.zoomJoinUrl ?? "", zoomPasscode: c.zoomPasscode ?? "", scheduledAt: c.scheduledAt.slice(0, 16), durationMinutes: c.durationMinutes ?? 60 });
    setModal({ mode: "edit", item: c });
  };

  const save = async () => {
    setSaving(true);
    const p = { ...form, batchId: form.batchId || null, teacherId: form.teacherId || null, subject: form.subject || null, zoomMeetingId: form.zoomMeetingId || null, zoomJoinUrl: form.zoomJoinUrl || null, zoomPasscode: form.zoomPasscode || null };
    try {
      const res = modal?.mode === "create"
        ? await apiMutation("POST", "/admin/live-classes", p, getToken)
        : await apiMutation("PATCH", `/admin/live-classes/${modal?.item?.id}`, p, getToken);
      if (res.ok) { toast("success", modal?.mode === "create" ? "Class scheduled" : "Class updated"); setModal(null); reload(); }
      else toast("error", (res as { error?: string }).error ?? "Save failed");
    } catch { toast("error", "Network error"); }
    finally { setSaving(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    const res = await apiMutation("PATCH", `/admin/live-classes/${id}`, { status }, getToken);
    if (res.ok) { toast("success", `Status → ${status}`); reload(); }
    else toast("error", "Update failed");
  };

  const del = async (id: string) => {
    if (!confirm("Delete this class?")) return;
    const res = await apiMutation("DELETE", `/admin/live-classes/${id}`, null, getToken);
    if (res.ok) { toast("success", "Class deleted"); reload(); }
    else toast("error", "Delete failed");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[var(--color-navy)]">Live Classes</h2>
        <button onClick={openCreate} className="btn-primary px-4 py-2 flex items-center gap-2 text-sm"><Plus size={14} /> Schedule Class</button>
      </div>

      {loading && <SkeletonList rows={4} />}
      <div className="space-y-3">
        {(classes ?? []).map(c => (
          <div key={c.id} className="card border border-slate-200">
            <div className="flex gap-3 items-start">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-navy)]/10 flex items-center justify-center shrink-0">
                <Video size={18} className="text-[var(--color-navy)]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-1.5 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[c.status] ?? ""}`}>{c.status}</span>
                  {c.batchName && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{c.batchName}</span>}
                  {c.subject && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{c.subject}</span>}
                </div>
                <p className="font-semibold text-sm text-[var(--color-navy)]">{c.topic}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {new Date(c.scheduledAt).toLocaleString("en-IN")}
                  {c.durationMinutes && ` · ${c.durationMinutes}min`}
                  {c.teacherName && ` · ${c.teacherName}`}
                </p>
                {c.zoomJoinUrl && (
                  <a href={c.zoomJoinUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--color-teal)] hover:underline mt-1 inline-block">Join Link</a>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                {c.status === "scheduled" && (
                  <button onClick={() => updateStatus(c.id, "live")} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200">Go Live</button>
                )}
                {c.status === "live" && (
                  <button onClick={() => updateStatus(c.id, "completed")} className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded-lg">End</button>
                )}
                <button onClick={() => openEdit(c)} className="p-1.5 text-slate-400 hover:text-[var(--color-navy)]"><Pencil size={14} /></button>
                <button onClick={() => del(c.id)} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
        {(classes ?? []).length === 0 && !loading && <p className="text-slate-400 text-sm">No live classes scheduled.</p>}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-bold text-[var(--color-navy)]">{modal.mode === "create" ? "Schedule Live Class" : "Edit Live Class"}</h3>
              <button onClick={() => setModal(null)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Topic *</label>
                <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Subject</label>
                  <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Duration (min)</label>
                  <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.durationMinutes} onChange={e => setForm(f => ({ ...f, durationMinutes: parseInt(e.target.value) || 60 }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Batch</label>
                  <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.batchId} onChange={e => setForm(f => ({ ...f, batchId: e.target.value }))}>
                    <option value="">None</option>
                    {(batches ?? []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Teacher</label>
                  <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.teacherId} onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))}>
                    <option value="">None</option>
                    {(teachers ?? []).map(t => <option key={t.id} value={t.id}>{t.userName ?? t.id}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Scheduled At *</label>
                <input type="datetime-local" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Zoom Join URL</label>
                <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="https://zoom.us/j/…" value={form.zoomJoinUrl} onChange={e => setForm(f => ({ ...f, zoomJoinUrl: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Meeting ID</label>
                  <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.zoomMeetingId} onChange={e => setForm(f => ({ ...f, zoomMeetingId: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Passcode</label>
                  <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.zoomPasscode} onChange={e => setForm(f => ({ ...f, zoomPasscode: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-5 pb-5">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
              <button onClick={save} disabled={saving || !form.topic || !form.scheduledAt} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

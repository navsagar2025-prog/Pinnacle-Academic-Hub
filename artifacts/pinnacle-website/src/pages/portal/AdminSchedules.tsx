import { useState, useEffect, useCallback } from "react";
import { Plus, X, Pencil, Trash2, RefreshCw } from "lucide-react";
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

type Schedule = {
  id: string; subject: string; topic: string | null; dayOfWeek: number;
  startTime: string; endTime: string; room: string | null; isRecurring: boolean;
  batchId: string | null; batchName: string | null; teacherId: string | null; teacherName: string | null;
};
type Batch = { id: string; name: string };
type Teacher = { id: string; userName: string | null };

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Biology", "English", "General"];
const EMPTY = { batchId: "", teacherId: "", subject: "", topic: "", dayOfWeek: 1, startTime: "09:00", endTime: "10:00", room: "", isRecurring: true };

export function AdminSchedules({ getToken }: { getToken: () => Promise<string | null> }) {
  const { toast } = useToast();
  const { data: schedules, loading, reload } = useFetch<Schedule[]>("/admin/schedules", getToken);
  const { data: batches } = useFetch<Batch[]>("/admin/batches", getToken);
  const { data: teachers } = useFetch<Teacher[]>("/admin/teachers", getToken);
  const [modal, setModal] = useState<{ mode: "create" | "edit"; item?: Schedule } | null>(null);
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  useModalEscape(() => setModal(null), !!modal);

  const openCreate = () => { setForm({ ...EMPTY }); setModal({ mode: "create" }); };
  const openEdit = (s: Schedule) => {
    setForm({ batchId: s.batchId ?? "", teacherId: s.teacherId ?? "", subject: s.subject, topic: s.topic ?? "", dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime, room: s.room ?? "", isRecurring: s.isRecurring });
    setModal({ mode: "edit", item: s });
  };

  const save = async () => {
    setSaving(true);
    const p = { ...form, batchId: form.batchId || null, teacherId: form.teacherId || null, topic: form.topic || null, room: form.room || null };
    try {
      const res = modal?.mode === "create"
        ? await apiMutation("POST", "/admin/schedules", p, getToken)
        : await apiMutation("PATCH", `/admin/schedules/${modal?.item?.id}`, p, getToken);
      if (res.ok) { toast("success", modal?.mode === "create" ? "Slot added" : "Slot updated"); setModal(null); reload(); }
      else toast("error", (res as { error?: string }).error ?? "Save failed");
    } catch { toast("error", "Network error"); }
    finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this slot?")) return;
    const res = await apiMutation("DELETE", `/admin/schedules/${id}`, null, getToken);
    if (res.ok) { toast("success", "Slot deleted"); reload(); }
    else toast("error", "Delete failed");
  };

  const grouped = DAYS.map((day, i) => ({
    day, slots: (schedules ?? []).filter(s => s.dayOfWeek === i),
  })).filter(g => g.slots.length > 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[var(--color-navy)]">Class Timetable</h2>
        <div className="flex gap-2">
          <button onClick={reload} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[var(--color-navy)]"><RefreshCw size={14} /></button>
          <button onClick={openCreate} className="btn-primary px-4 py-2 flex items-center gap-2 text-sm"><Plus size={14} /> Add Slot</button>
        </div>
      </div>

      {loading && <SkeletonList rows={5} />}
      {grouped.length === 0 && !loading && <p className="text-slate-400 text-sm">No schedule slots yet. Add one to build the timetable.</p>}

      <div className="space-y-4">
        {grouped.map(({ day, slots }) => (
          <div key={day}>
            <h3 className="text-sm font-semibold text-[var(--color-navy)] mb-2">{day}</h3>
            <div className="space-y-2">
              {slots.map(s => (
                <div key={s.id} className="card border border-slate-200 flex gap-3 items-center">
                  <div className="w-24 shrink-0 text-center">
                    <p className="text-sm font-mono font-medium text-[var(--color-teal)]">{s.startTime}</p>
                    <p className="text-xs text-slate-400">{s.endTime}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[var(--color-navy)]">{s.subject}{s.topic && ` — ${s.topic}`}</p>
                    <p className="text-xs text-slate-500">
                      {s.batchName && `${s.batchName} · `}
                      {s.teacherName && `${s.teacherName} · `}
                      {s.room && `Room ${s.room}`}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(s)} className="p-1.5 text-slate-400 hover:text-[var(--color-navy)]"><Pencil size={14} /></button>
                    <button onClick={() => del(s.id)} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-bold text-[var(--color-navy)]">{modal.mode === "create" ? "Add Slot" : "Edit Slot"}</h3>
              <button onClick={() => setModal(null)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="p-5 space-y-3">
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
                  <label className="block text-xs font-medium text-slate-600 mb-1">Day *</label>
                  <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.dayOfWeek} onChange={e => setForm(f => ({ ...f, dayOfWeek: parseInt(e.target.value) }))}>
                    {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Room</label>
                  <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Start *</label>
                  <input type="time" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">End *</label>
                  <input type="time" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
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
            </div>
            <div className="flex justify-end gap-3 px-5 pb-5">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
              <button onClick={save} disabled={saving || !form.subject} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

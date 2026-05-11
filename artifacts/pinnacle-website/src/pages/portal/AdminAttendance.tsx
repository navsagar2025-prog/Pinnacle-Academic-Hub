import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Save, AlertTriangle } from "lucide-react";
import { useToast } from "./portalUtils";

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

type Batch = { id: string; name: string };
type AttendanceRow = { id: string; rollNumber: string; userName: string | null; status: string; attendance: unknown };
type LowAlert = {
  id: string; notifiedPct: number; notifiedAt: string; hasRecovered: boolean;
  studentId: string | null; rollNumber: string | null; batchId: string | null;
  batchName: string | null; studentName: string | null;
};

const STATUSES = ["present", "absent", "late"] as const;
const STATUS_COLORS = { present: "bg-green-100 text-green-700", absent: "bg-red-100 text-red-700", late: "bg-yellow-100 text-yellow-700" };

export function AdminAttendance({ getToken }: { getToken: () => Promise<string | null> }) {
  const { toast } = useToast();
  const { data: batches } = useFetch<Batch[]>("/admin/batches", getToken);
  const { data: lowAlerts, reload: reloadAlerts } = useFetch<LowAlert[]>("/admin/attendance/low-alerts", getToken);
  const [batchId, setBatchId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [subject, setSubject] = useState("");
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadAttendance = async () => {
    if (!batchId || !date) return;
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${BASE}/api/v1/admin/attendance?batchId=${batchId}&date=${date}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      const data: AttendanceRow[] = json.data ?? [];
      setRows(data);
      const initial: Record<string, string> = {};
      data.forEach(r => { initial[r.id] = r.status; });
      setStatuses(initial);
    } catch { toast("error", "Failed to load attendance"); }
    finally { setLoading(false); }
  };

  const saveAttendance = async () => {
    if (!subject) { toast("error", "Enter a subject before saving"); return; }
    setSaving(true);
    try {
      const token = await getToken();
      const records = rows.map(r => ({ studentId: r.id, date, status: statuses[r.id] ?? "present" }));
      const res = await fetch(`${BASE}/api/v1/admin/attendance/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ records, subject }),
      });
      if (res.ok) { toast("success", "Attendance saved"); reloadAlerts(); }
      else toast("error", "Save failed");
    } catch { toast("error", "Network error"); }
    finally { setSaving(false); }
  };

  const presentCount = Object.values(statuses).filter(s => s === "present").length;
  const absentCount = Object.values(statuses).filter(s => s === "absent").length;
  const lateCount = Object.values(statuses).filter(s => s === "late").length;
  const total = rows.length;
  const attendancePct = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  const activeAlerts = (lowAlerts ?? []).filter(a => !a.hasRecovered);

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-navy)] mb-4">Attendance</h2>

      {activeAlerts.length > 0 && (
        <div className="mb-6 card border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-red-600 shrink-0" />
            <h3 className="text-sm font-semibold text-red-700">Low Attendance Alerts ({activeAlerts.length} student{activeAlerts.length !== 1 ? "s" : ""})</h3>
          </div>
          <div className="space-y-2">
            {activeAlerts.map(a => (
              <div key={a.id} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-red-100">
                <span className="text-xs font-mono text-slate-500 w-12 shrink-0">{a.rollNumber ?? "—"}</span>
                <span className="text-sm font-medium text-[var(--color-navy)] flex-1">{a.studentName ?? "Unknown"}</span>
                {a.batchName && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{a.batchName}</span>}
                <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">{a.notifiedPct}% attendance</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card border border-slate-200 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Batch *</label>
            <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={batchId} onChange={e => setBatchId(e.target.value)}>
              <option value="">Select…</option>
              {(batches ?? []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Date *</label>
            <input type="date" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Subject *</label>
            <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Physics, Chemistry…" value={subject} onChange={e => setSubject(e.target.value)} />
          </div>
          <div className="flex items-end">
            <button onClick={loadAttendance} disabled={!batchId || !date || loading} className="w-full flex items-center justify-center gap-2 bg-[var(--color-navy)] text-white rounded-lg px-3 py-2 text-sm disabled:opacity-50">
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Load
            </button>
          </div>
        </div>
      </div>

      {rows.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-3 flex-wrap">
              <span className="text-sm text-green-600 font-medium">{presentCount} Present</span>
              <span className="text-sm text-red-500 font-medium">{absentCount} Absent</span>
              {lateCount > 0 && <span className="text-sm text-yellow-600 font-medium">{lateCount} Late</span>}
              <span className="text-sm text-slate-500">{attendancePct}% attendance rate</span>
            </div>
            <button onClick={saveAttendance} disabled={saving} className="btn-primary px-4 py-2 flex items-center gap-2 text-sm disabled:opacity-50">
              <Save size={14} /> {saving ? "Saving…" : "Save Attendance"}
            </button>
          </div>

          {absentCount > total * 0.25 && (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 text-sm text-orange-700">
              <AlertTriangle size={16} /> More than 25% of students are absent in this session
            </div>
          )}

          <div className="space-y-2">
            {rows.map(r => (
              <div key={r.id} className="card border border-slate-200 flex items-center gap-4">
                <div className="w-14 text-center">
                  <p className="text-xs font-mono font-bold text-slate-500">{r.rollNumber}</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--color-navy)]">{r.userName ?? "—"}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {STATUSES.map(s => (
                    <button key={s} onClick={() => setStatuses(prev => ({ ...prev, [r.id]: s }))}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${statuses[r.id] === s ? STATUS_COLORS[s] + " border-transparent" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-600">
            Session summary: <strong>{presentCount}</strong> present · <strong>{absentCount}</strong> absent · <strong>{lateCount}</strong> late
            {total > 0 && <> · <strong>{attendancePct}%</strong> attendance</>}
          </div>
        </>
      )}

      {rows.length === 0 && !loading && batchId && (
        <p className="text-slate-400 text-sm text-center py-8">No students found for this batch, or click Load to fetch the attendance grid.</p>
      )}
      {!batchId && (
        <p className="text-slate-400 text-sm text-center py-8">Select a batch and date to mark attendance.</p>
      )}
    </div>
  );
}

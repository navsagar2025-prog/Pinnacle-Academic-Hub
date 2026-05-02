"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle, XCircle, AlertCircle, Save, Users, Clock,
  History, ChevronDown, ChevronUp, Filter, Loader2, Pencil, X, BarChart2,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

interface Batch {
  id: string;
  name: string;
  timingLabel: string | null;
  courseTitle: string | null;
  subjects: string[];
}

interface Student {
  id: string;
  name: string;
  rollNumber: string;
}

interface Props {
  batches: Batch[];
  studentsByBatch: Record<string, Student[]>;
}

type AttendanceStatus = "present" | "absent" | "late";

interface SessionRecord {
  studentId: string;
  studentName: string;
  rollNumber: string;
  status: string;
  isActive: boolean;
}

interface Session {
  date: string;
  subject: string;
  batchId: string;
  batchName: string;
  records: SessionRecord[];
}

type Tab = "mark" | "history";

export default function AttendanceClient({ batches, studentsByBatch }: Props) {
  const todayStr = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [tab, setTab] = useState<Tab>("mark");

  // --- Mark Attendance state ---
  const [batchId, setBatchId] = useState(batches[0]?.id ?? "");
  const [date, setDate] = useState(todayStr);
  const [subject, setSubject] = useState(batches[0]?.subjects?.[0] ?? "");
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // --- History state ---
  const [historyBatchId, setHistoryBatchId] = useState("all");
  const [historyFrom, setHistoryFrom] = useState(thirtyDaysAgo);
  const [historyTo, setHistoryTo] = useState(todayStr);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  // --- Edit session state ---
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editStatuses, setEditStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSaved, setEditSaved] = useState(false);

  const currentBatch = batches.find((b) => b.id === batchId);
  const students = studentsByBatch[batchId] ?? [];

  function onBatchChange(newBatchId: string) {
    setBatchId(newBatchId);
    const b = batches.find((x) => x.id === newBatchId);
    setSubject(b?.subjects?.[0] ?? "");
    setAttendance({});
    setSaved(false);
    setError("");
  }

  function markAll(status: AttendanceStatus) {
    const updated: Record<string, AttendanceStatus> = {};
    for (const s of students) updated[s.id] = status;
    setAttendance(updated);
  }

  function setStatus(studentId: string, status: AttendanceStatus) {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  }

  async function handleSave() {
    if (!batchId || !date || !subject) {
      setError("Please select batch, date, and subject.");
      return;
    }
    if (students.length === 0) {
      setError("No students in this batch.");
      return;
    }

    const records = students.map((s) => ({
      studentId: s.id,
      status: attendance[s.id] ?? "present",
    }));

    setLoading(true);
    setSaved(false);
    setError("");

    try {
      const res = await fetch(`${BASE}/api/v1/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId, date, subject, records }),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
      } else {
        setError(data.error ?? "Failed to save attendance.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const params = new URLSearchParams();
      if (historyBatchId !== "all") params.set("batchId", historyBatchId);
      if (historyFrom) params.set("from", historyFrom);
      if (historyTo) params.set("to", historyTo);
      const res = await fetch(`${BASE}/api/v1/attendance?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setSessions(data.data.sessions ?? []);
      } else {
        setHistoryError(data.error ?? "Failed to load history.");
      }
    } catch {
      setHistoryError("Network error. Please try again.");
    } finally {
      setHistoryLoading(false);
    }
  }, [historyBatchId, historyFrom, historyTo]);

  useEffect(() => {
    if (tab === "history") {
      fetchHistory();
    }
  }, [tab, fetchHistory]);

  // --- Edit helpers ---
  function startEdit(session: Session) {
    const statuses: Record<string, AttendanceStatus> = {};
    for (const r of session.records) {
      statuses[r.studentId] = r.status as AttendanceStatus;
    }
    setEditStatuses(statuses);
    setEditingKey(sessionKey(session));
    setEditError("");
    setEditSaved(false);
  }

  function cancelEdit() {
    setEditingKey(null);
    setEditStatuses({});
    setEditError("");
    setEditSaved(false);
  }

  function setEditStatus(studentId: string, status: AttendanceStatus) {
    setEditStatuses((prev) => ({ ...prev, [studentId]: status }));
  }

  function markAllEdit(session: Session, status: AttendanceStatus) {
    const updated: Record<string, AttendanceStatus> = {};
    for (const r of session.records) updated[r.studentId] = status;
    setEditStatuses(updated);
  }

  async function handleEditSave(session: Session) {
    setEditLoading(true);
    setEditError("");
    setEditSaved(false);

    const records = session.records.map((r) => ({
      studentId: r.studentId,
      status: editStatuses[r.studentId] ?? (r.status as AttendanceStatus),
    }));

    try {
      const res = await fetch(`${BASE}/api/v1/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId: session.batchId,
          date: session.date,
          subject: session.subject,
          records,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditSaved(true);
        // Update session in local state so UI reflects changes immediately
        setSessions((prev) =>
          prev.map((s) =>
            sessionKey(s) === editingKey
              ? {
                  ...s,
                  records: s.records.map((r) => ({
                    ...r,
                    status: editStatuses[r.studentId] ?? r.status,
                  })),
                }
              : s
          )
        );
        // Exit edit mode after a brief success flash
        setTimeout(() => {
          setEditingKey(null);
          setEditStatuses({});
          setEditSaved(false);
        }, 1200);
      } else {
        setEditError(data.error ?? "Failed to save changes.");
      }
    } catch {
      setEditError("Network error. Please try again.");
    } finally {
      setEditLoading(false);
    }
  }

  const presentCount = students.filter((s) => (attendance[s.id] ?? "present") === "present").length;
  const absentCount = students.filter((s) => attendance[s.id] === "absent").length;
  const lateCount = students.filter((s) => attendance[s.id] === "late").length;

  function sessionKey(s: Session) {
    return `${s.date}__${s.subject}__${s.batchId}`;
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }

  function statusColor(status: string) {
    if (status === "present") return "text-green-700 bg-green-50";
    if (status === "absent") return "text-[var(--color-maroon)] bg-red-50";
    return "text-amber-700 bg-amber-50";
  }

  function StatusToggle({
    studentId,
    currentStatus,
    onChange,
  }: {
    studentId: string;
    currentStatus: AttendanceStatus;
    onChange: (id: string, s: AttendanceStatus) => void;
  }) {
    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(studentId, "present")}
          title="Present"
          className={`p-1.5 rounded-lg transition-colors ${
            currentStatus === "present"
              ? "bg-green-500 text-white"
              : "bg-slate-100 text-slate-400 hover:bg-green-100 hover:text-green-600"
          }`}
        >
          <CheckCircle size={15} />
        </button>
        <button
          type="button"
          onClick={() => onChange(studentId, "late")}
          title="Late"
          className={`p-1.5 rounded-lg transition-colors ${
            currentStatus === "late"
              ? "bg-amber-500 text-white"
              : "bg-slate-100 text-slate-400 hover:bg-amber-100 hover:text-amber-600"
          }`}
        >
          <Clock size={15} />
        </button>
        <button
          type="button"
          onClick={() => onChange(studentId, "absent")}
          title="Absent"
          className={`p-1.5 rounded-lg transition-colors ${
            currentStatus === "absent"
              ? "bg-[var(--color-maroon)] text-white"
              : "bg-slate-100 text-slate-400 hover:bg-red-100 hover:text-[var(--color-maroon)]"
          }`}
        >
          <XCircle size={15} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setTab("mark")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
            tab === "mark"
              ? "bg-white text-[var(--color-navy)] shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Save size={15} />
          Mark Attendance
        </button>
        <button
          onClick={() => setTab("history")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
            tab === "history"
              ? "bg-white text-[var(--color-navy)] shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <History size={15} />
          History
        </button>
      </div>

      {/* ===== MARK ATTENDANCE TAB ===== */}
      {tab === "mark" && (
        <>
          <div className="card">
            <h2 className="font-bold text-[var(--color-navy)] mb-4 font-[family-name:var(--font-playfair)]">
              Session Details
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Batch</label>
                <select
                  value={batchId}
                  onChange={(e) => onBatchChange(e.target.value)}
                  className="input-field w-full"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}{b.timingLabel ? ` (${b.timingLabel})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Date</label>
                <input
                  type="date"
                  value={date}
                  max={todayStr}
                  onChange={(e) => { setDate(e.target.value); setSaved(false); }}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="input-field w-full"
                >
                  {(currentBatch?.subjects ?? []).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">
                  Student List
                </h2>
                <div className="flex gap-4 mt-1 text-xs">
                  <span className="text-green-600 font-medium">{presentCount} present</span>
                  <span className="text-[var(--color-maroon)] font-medium">{absentCount} absent</span>
                  {lateCount > 0 && <span className="text-amber-600 font-medium">{lateCount} late</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => markAll("present")}
                  className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 font-medium transition-colors"
                >
                  All Present
                </button>
                <button
                  onClick={() => markAll("absent")}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-[var(--color-maroon)] hover:bg-red-100 font-medium transition-colors"
                >
                  All Absent
                </button>
              </div>
            </div>

            {students.length === 0 ? (
              <div className="text-center py-10">
                <Users size={32} className="text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No students enrolled in this batch.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {students.map((s) => {
                  const status = attendance[s.id] ?? "present";
                  return (
                    <div key={s.id} className="py-3 flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 transition-colors ${
                          status === "present"
                            ? "bg-green-100 text-green-700"
                            : status === "absent"
                            ? "bg-red-100 text-[var(--color-maroon)]"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-[var(--color-navy)]">{s.name}</div>
                        <div className="text-xs text-slate-400">Roll #{s.rollNumber}</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setStatus(s.id, "present")}
                          title="Present"
                          className={`p-1.5 rounded-lg transition-colors ${
                            status === "present"
                              ? "bg-green-500 text-white"
                              : "bg-slate-100 text-slate-400 hover:bg-green-100 hover:text-green-600"
                          }`}
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={() => setStatus(s.id, "late")}
                          title="Late"
                          className={`p-1.5 rounded-lg transition-colors ${
                            status === "late"
                              ? "bg-amber-500 text-white"
                              : "bg-slate-100 text-slate-400 hover:bg-amber-100 hover:text-amber-600"
                          }`}
                        >
                          <Clock size={16} />
                        </button>
                        <button
                          onClick={() => setStatus(s.id, "absent")}
                          title="Absent"
                          className={`p-1.5 rounded-lg transition-colors ${
                            status === "absent"
                              ? "bg-[var(--color-maroon)] text-white"
                              : "bg-slate-100 text-slate-400 hover:bg-red-100 hover:text-[var(--color-maroon)]"
                          }`}
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
              {saved && (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-xl px-4 py-3 text-sm">
                  <CheckCircle size={16} /> Attendance saved successfully!
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 text-[var(--color-maroon)] bg-red-50 rounded-xl px-4 py-3 text-sm">
                  <AlertCircle size={16} /> {error}
                </div>
              )}
              <button
                onClick={handleSave}
                disabled={loading || students.length === 0}
                className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save size={15} />
                {loading ? "Saving…" : "Save Attendance"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ===== HISTORY TAB ===== */}
      {tab === "history" && (
        <>
          {/* Filters */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Filter size={15} className="text-[var(--color-navy)]" />
              <h2 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">
                Filter Records
              </h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Batch</label>
                <select
                  value={historyBatchId}
                  onChange={(e) => setHistoryBatchId(e.target.value)}
                  className="input-field w-full"
                >
                  <option value="all">All Batches</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}{b.timingLabel ? ` (${b.timingLabel})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">From</label>
                <input
                  type="date"
                  value={historyFrom}
                  max={historyTo || todayStr}
                  onChange={(e) => setHistoryFrom(e.target.value)}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">To</label>
                <input
                  type="date"
                  value={historyTo}
                  max={todayStr}
                  min={historyFrom || undefined}
                  onChange={(e) => setHistoryTo(e.target.value)}
                  className="input-field w-full"
                />
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={fetchHistory}
                disabled={historyLoading}
                className="btn-primary px-5 py-2 text-sm flex items-center gap-2 disabled:opacity-50"
              >
                {historyLoading ? <Loader2 size={14} className="animate-spin" /> : <Filter size={14} />}
                Apply Filters
              </button>
            </div>
          </div>

          {/* Summary Chart */}
          {!historyLoading && !historyError && sessions.length > 0 && (() => {
            // Aggregate present / absent / late counts by date
            const dateMap = new Map<string, { date: string; present: number; absent: number; late: number }>();
            for (const session of sessions) {
              if (!dateMap.has(session.date)) {
                dateMap.set(session.date, { date: session.date, present: 0, absent: 0, late: 0 });
              }
              const entry = dateMap.get(session.date)!;
              for (const r of session.records) {
                if (r.status === "present") entry.present += 1;
                else if (r.status === "absent") entry.absent += 1;
                else if (r.status === "late") entry.late += 1;
              }
            }
            const chartData = Array.from(dateMap.values())
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map((d) => ({
                ...d,
                label: new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
              }));

            return (
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart2 size={15} className="text-[var(--color-navy)]" />
                  <h2 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">
                    Attendance Summary
                  </h2>
                  <span className="text-xs text-slate-400 ml-auto">per session date</span>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 4 }} barSize={18}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #e2e8f0" }}
                      cursor={{ fill: "#f1f5f9" }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="present" name="Present" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="late" name="Late" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="absent" name="Absent" stackId="a" fill="#b91c1c" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            );
          })()}

          {/* Student Breakdown */}
          {!historyLoading && !historyError && sessions.length > 0 && (() => {
            // Aggregate per-student across all sessions in the filtered period
            const studentAggMap = new Map<string, {
              studentId: string;
              studentName: string;
              rollNumber: string;
              total: number;
              present: number;
              absent: number;
              late: number;
            }>();

            for (const session of sessions) {
              for (const r of session.records) {
                if (!studentAggMap.has(r.studentId)) {
                  studentAggMap.set(r.studentId, {
                    studentId: r.studentId,
                    studentName: r.studentName,
                    rollNumber: r.rollNumber,
                    total: 0,
                    present: 0,
                    absent: 0,
                    late: 0,
                  });
                }
                const entry = studentAggMap.get(r.studentId)!;
                entry.total += 1;
                if (r.status === "present") entry.present += 1;
                else if (r.status === "absent") entry.absent += 1;
                else if (r.status === "late") entry.late += 1;
              }
            }

            // Sort ascending by present % — lowest (most at-risk) first
            const breakdown = Array.from(studentAggMap.values()).sort(
              (a, b) =>
                a.total === 0 ? 1 : b.total === 0 ? -1 :
                a.present / a.total - b.present / b.total
            );

            const atRiskCount = breakdown.filter(
              (s) => s.total > 0 && s.present / s.total < 0.75
            ).length;

            return (
              <div className="card">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <Users size={15} className="text-[var(--color-navy)]" />
                  <h2 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">
                    Student Breakdown
                  </h2>
                  {atRiskCount > 0 && (
                    <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-[var(--color-maroon)]">
                      <AlertTriangle size={10} />
                      {atRiskCount} below 75%
                    </span>
                  )}
                  <span className="text-xs text-slate-400 ml-auto">
                    sorted: lowest first
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Individual attendance across {sessions.length} session
                  {sessions.length !== 1 ? "s" : ""} in the selected period
                </p>

                <div className="divide-y divide-slate-50">
                  {breakdown.map((s) => {
                    // Percentages are computed over the student's own recorded
                    // sessions (s.total), so the denominator is consistent per
                    // student even if some sessions had no record for them.
                    const presentPct =
                      s.total > 0
                        ? Math.round((s.present / s.total) * 100)
                        : 0;
                    const absentPct =
                      s.total > 0
                        ? Math.round((s.absent / s.total) * 100)
                        : 0;
                    const latePct =
                      s.total > 0
                        ? Math.round((s.late / s.total) * 100)
                        : 0;
                    const isAtRisk = presentPct < 75;
                    return (
                      <div
                        key={s.studentId}
                        className="py-3 flex items-center gap-3"
                      >
                        {/* Avatar */}
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                            isAtRisk
                              ? "bg-red-100 text-[var(--color-maroon)]"
                              : presentPct >= 85
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {s.studentName.charAt(0).toUpperCase()}
                        </div>

                        {/* Name + progress bar */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-sm font-semibold text-[var(--color-navy)] truncate">
                              {s.studentName}
                            </span>
                            {isAtRisk && (
                              <AlertTriangle
                                size={12}
                                className="text-[var(--color-maroon)] flex-shrink-0"
                              />
                            )}
                          </div>
                          <div className="text-xs text-slate-400 mb-1.5">
                            Roll #{s.rollNumber} · {s.total} session{s.total !== 1 ? "s" : ""}
                          </div>
                          {/* Stacked percentage bar: present | late | absent */}
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                            <div
                              className="h-full transition-all duration-500"
                              style={{ width: `${presentPct}%`, backgroundColor: "#22c55e" }}
                            />
                            {latePct > 0 && (
                              <div
                                className="h-full transition-all duration-500"
                                style={{ width: `${latePct}%`, backgroundColor: "#f59e0b" }}
                              />
                            )}
                            <div
                              className="h-full transition-all duration-500"
                              style={{ width: `${absentPct}%`, backgroundColor: "#b91c1c" }}
                            />
                          </div>
                        </div>

                        {/* All three percentages */}
                        <div className="text-right flex-shrink-0 ml-3 space-y-0.5">
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-[10px] text-green-600 font-medium">P</span>
                            <span
                              className={`text-sm font-bold ${
                                presentPct >= 85
                                  ? "text-green-600"
                                  : presentPct >= 75
                                  ? "text-amber-600"
                                  : "text-[var(--color-maroon)]"
                              }`}
                            >
                              {presentPct}%
                            </span>
                          </div>
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-[10px] text-[var(--color-maroon)] font-medium">A</span>
                            <span className="text-xs font-semibold text-[var(--color-maroon)]">
                              {absentPct}%
                            </span>
                          </div>
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-[10px] text-amber-600 font-medium">L</span>
                            <span className="text-xs font-semibold text-amber-600">
                              {latePct}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Results */}
          {historyLoading ? (
            <div className="card flex items-center justify-center py-16 gap-3 text-slate-400">
              <Loader2 size={22} className="animate-spin" />
              <span className="text-sm">Loading history…</span>
            </div>
          ) : historyError ? (
            <div className="card flex items-center gap-3 text-[var(--color-maroon)] bg-red-50 border border-red-100">
              <AlertCircle size={17} className="flex-shrink-0" />
              <p className="text-sm">{historyError}</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="card text-center py-16">
              <History size={36} className="text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-medium">No attendance records found</p>
              <p className="text-slate-300 text-xs mt-1">Try adjusting the filters or date range</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 px-1">
                {sessions.length} session{sessions.length !== 1 ? "s" : ""} found
              </p>
              {sessions.map((session) => {
                const key = sessionKey(session);
                const isExpanded = expandedKey === key;
                const isEditing = editingKey === key;
                const total = session.records.length;
                const present = session.records.filter((r) =>
                  isEditing ? editStatuses[r.studentId] === "present" : r.status === "present"
                ).length;
                const absent = session.records.filter((r) =>
                  isEditing ? editStatuses[r.studentId] === "absent" : r.status === "absent"
                ).length;
                const late = session.records.filter((r) =>
                  isEditing ? editStatuses[r.studentId] === "late" : r.status === "late"
                ).length;

                return (
                  <div key={key} className={`card p-0 overflow-hidden ${isEditing ? "ring-2 ring-[var(--color-teal)]/40" : ""}`}>
                    {/* Session header — always visible */}
                    <button
                      onClick={() => {
                        if (isEditing) return; // don't collapse while editing
                        setExpandedKey(isExpanded ? null : key);
                        if (!isExpanded) cancelEdit();
                      }}
                      className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-bold text-sm text-[var(--color-navy)]">
                            {formatDate(session.date)}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--color-navy)]/10 text-[var(--color-navy)]">
                            {session.subject}
                          </span>
                          <span className="text-xs text-slate-400">{session.batchName}</span>
                          {isEditing && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--color-teal)]/10 text-[var(--color-teal)]">
                              Editing
                            </span>
                          )}
                        </div>
                        <div className="flex gap-3 text-xs">
                          <span className="text-green-600 font-medium">{present} present</span>
                          {absent > 0 && <span className="text-[var(--color-maroon)] font-medium">{absent} absent</span>}
                          {late > 0 && <span className="text-amber-600 font-medium">{late} late</span>}
                          <span className="text-slate-400">{total} total</span>
                        </div>
                      </div>
                      <div className="text-slate-400 flex-shrink-0">
                        {(isExpanded || isEditing) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </button>

                    {/* Expanded student list */}
                    {(isExpanded || isEditing) && (
                      <div className="border-t border-slate-100">
                        {/* Edit / cancel bar */}
                        {!isEditing ? (
                          <div className="flex items-center justify-between px-5 py-2.5 bg-slate-50/60 border-b border-slate-100">
                            <span className="text-xs text-slate-400">
                              {total} student{total !== 1 ? "s" : ""}
                            </span>
                            <button
                              onClick={() => startEdit(session)}
                              className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-teal)] hover:text-[var(--color-navy)] transition-colors"
                            >
                              <Pencil size={12} />
                              Edit Session
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2 px-5 py-2.5 bg-[var(--color-teal)]/5 border-b border-[var(--color-teal)]/20">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={editLoading}
                                onClick={() => markAllEdit(session, "present")}
                                className="text-xs px-2.5 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none"
                              >All Present</button>
                              <button
                                type="button"
                                disabled={editLoading}
                                onClick={() => markAllEdit(session, "absent")}
                                className="text-xs px-2.5 py-1 rounded-lg bg-red-50 text-[var(--color-maroon)] hover:bg-red-100 font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none"
                              >All Absent</button>
                            </div>
                            <button
                              onClick={cancelEdit}
                              disabled={editLoading}
                              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none"
                            >
                              <X size={12} />
                              Cancel
                            </button>
                          </div>
                        )}

                        {/* Student rows */}
                        <div className="divide-y divide-slate-50">
                          {session.records
                            .sort((a, b) => a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true }))
                            .map((r) => {
                              const currentStatus = isEditing
                                ? (editStatuses[r.studentId] ?? r.status as AttendanceStatus)
                                : r.status;
                              return (
                                <div key={r.studentId} className="flex items-center gap-3 px-5 py-2.5">
                                  <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                      currentStatus === "present"
                                        ? "bg-green-100 text-green-700"
                                        : currentStatus === "absent"
                                        ? "bg-red-100 text-[var(--color-maroon)]"
                                        : "bg-amber-100 text-amber-700"
                                    }`}
                                  >
                                    {r.studentName.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-[var(--color-navy)]">{r.studentName}</div>
                                    <div className="text-xs text-slate-400">Roll #{r.rollNumber}</div>
                                  </div>
                                  {isEditing && r.isActive ? (
                                    <StatusToggle
                                      studentId={r.studentId}
                                      currentStatus={editStatuses[r.studentId] ?? r.status as AttendanceStatus}
                                      onChange={editLoading ? () => {} : setEditStatus}
                                    />
                                  ) : isEditing && !r.isActive ? (
                                    <div className="flex items-center gap-2">
                                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusColor(r.status)}`}>
                                        {r.status}
                                      </span>
                                      <span className="text-xs text-slate-400 italic">inactive</span>
                                    </div>
                                  ) : (
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusColor(r.status)}`}>
                                      {r.status}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                        </div>

                        {/* Save / feedback bar — only when editing */}
                        {isEditing && (
                          <div className="px-5 py-3.5 border-t border-slate-100 space-y-2.5">
                            {editError && (
                              <div className="flex items-center gap-2 text-[var(--color-maroon)] bg-red-50 rounded-lg px-3 py-2 text-xs">
                                <AlertCircle size={13} /> {editError}
                              </div>
                            )}
                            {editSaved && (
                              <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg px-3 py-2 text-xs">
                                <CheckCircle size={13} /> Changes saved successfully!
                              </div>
                            )}
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="flex-1 btn-outline py-2 text-sm"
                                disabled={editLoading}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEditSave(session)}
                                disabled={editLoading || editSaved}
                                className="flex-[2] btn-primary py-2 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                {editLoading ? (
                                  <><Loader2 size={14} className="animate-spin" /> Saving…</>
                                ) : (
                                  <><Save size={14} /> Save Changes</>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

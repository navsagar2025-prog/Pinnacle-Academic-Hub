"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle, XCircle, AlertCircle, Save, Users, Clock,
  History, ChevronDown, ChevronUp, Filter, Loader2,
} from "lucide-react";

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
                const total = session.records.length;
                const present = session.records.filter((r) => r.status === "present").length;
                const absent = session.records.filter((r) => r.status === "absent").length;
                const late = session.records.filter((r) => r.status === "late").length;

                return (
                  <div key={key} className="card p-0 overflow-hidden">
                    <button
                      onClick={() => setExpandedKey(isExpanded ? null : key)}
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
                        </div>
                        <div className="flex gap-3 text-xs">
                          <span className="text-green-600 font-medium">{present} present</span>
                          {absent > 0 && <span className="text-[var(--color-maroon)] font-medium">{absent} absent</span>}
                          {late > 0 && <span className="text-amber-600 font-medium">{late} late</span>}
                          <span className="text-slate-400">{total} total</span>
                        </div>
                      </div>
                      <div className="text-slate-400 flex-shrink-0">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-slate-100">
                        <div className="divide-y divide-slate-50">
                          {session.records
                            .sort((a, b) => a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true }))
                            .map((r) => (
                              <div key={r.studentId} className="flex items-center gap-3 px-5 py-2.5">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                    r.status === "present"
                                      ? "bg-green-100 text-green-700"
                                      : r.status === "absent"
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
                                <span
                                  className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusColor(r.status)}`}
                                >
                                  {r.status}
                                </span>
                              </div>
                            ))}
                        </div>
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

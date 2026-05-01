"use client";

import { useState } from "react";
import { CheckCircle, XCircle, AlertCircle, Save, Users, Clock } from "lucide-react";

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

export default function AttendanceClient({ batches, studentsByBatch }: Props) {
  const todayStr = new Date().toISOString().split("T")[0];

  const [batchId, setBatchId] = useState(batches[0]?.id ?? "");
  const [date, setDate] = useState(todayStr);
  const [subject, setSubject] = useState(batches[0]?.subjects?.[0] ?? "");
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

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
    for (const s of students) {
      updated[s.id] = status;
    }
    setAttendance(updated);
  }

  function toggle(studentId: string) {
    setAttendance((prev) => {
      const current = prev[studentId] ?? "present";
      const next: AttendanceStatus = current === "present" ? "absent" : current === "absent" ? "late" : "present";
      return { ...prev, [studentId]: next };
    });
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

  const presentCount = students.filter((s) => (attendance[s.id] ?? "present") === "present").length;
  const absentCount = students.filter((s) => attendance[s.id] === "absent").length;
  const lateCount = students.filter((s) => attendance[s.id] === "late").length;

  return (
    <div className="space-y-5">
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
    </div>
  );
}

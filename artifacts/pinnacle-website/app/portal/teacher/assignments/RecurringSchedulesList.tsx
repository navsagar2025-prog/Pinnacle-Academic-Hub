"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Repeat, Pause, Play, StopCircle, Calendar, Loader2, Pencil, X, Save } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

type Status = "active" | "paused" | "ended";
type Frequency = "daily" | "weekly" | "biweekly" | "monthly" | "custom";

interface Schedule {
  id: string;
  title: string;
  subject: string;
  frequency: Frequency;
  daysOfWeek: number[] | null;
  dayOfMonth: number | null;
  intervalDays: number | null;
  dueTimeOfDay: string;
  startDate: string;
  endDate: string | null;
  status: Status;
  lastMaterialisedDate: string | null;
  batchName: string | null;
}

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function describe(s: Schedule): string {
  switch (s.frequency) {
    case "daily":
      return `Daily at ${s.dueTimeOfDay}`;
    case "weekly":
      return `Weekly on ${(s.daysOfWeek ?? []).map((d) => DOW[d]).join(", ")} at ${s.dueTimeOfDay}`;
    case "biweekly":
      return `Every 2 weeks on ${(s.daysOfWeek ?? []).map((d) => DOW[d]).join(", ")} at ${s.dueTimeOfDay}`;
    case "monthly":
      return `Monthly on day ${s.dayOfMonth} at ${s.dueTimeOfDay}`;
    case "custom":
      return `Every ${s.intervalDays} days at ${s.dueTimeOfDay}`;
  }
}

const STATUS_STYLE: Record<Status, string> = {
  active: "bg-green-100 text-green-700",
  paused: "bg-amber-100 text-amber-700",
  ended: "bg-slate-100 text-slate-500",
};

interface EditDraft {
  title: string;
  frequency: Frequency;
  daysOfWeek: number[];
  dayOfMonth: number;
  intervalDays: number;
  dueTimeOfDay: string;
  endDate: string;
}

function toDraft(s: Schedule): EditDraft {
  return {
    title: s.title,
    frequency: s.frequency,
    daysOfWeek: s.daysOfWeek ?? [],
    dayOfMonth: s.dayOfMonth ?? 1,
    intervalDays: s.intervalDays ?? 1,
    dueTimeOfDay: s.dueTimeOfDay,
    endDate: s.endDate ? s.endDate.slice(0, 10) : "",
  };
}

export default function RecurringSchedulesList() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<Schedule[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditDraft | null>(null);

  async function load() {
    try {
      const res = await fetch(`${BASE}/api/v1/assignments/schedules`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) setSchedules(data.data);
      else setError(data.error ?? "Failed to load schedules");
    } catch {
      setError("Network error loading schedules");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function act(id: string, action: "pause" | "resume" | "end") {
    setBusyId(id);
    try {
      const res = await fetch(`${BASE}/api/v1/assignments/schedules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        await load();
        router.refresh();
      } else {
        setError(data.error ?? "Action failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setBusyId(null);
    }
  }

  function startEdit(s: Schedule) {
    setError(null);
    setEditingId(s.id);
    setDraft(toDraft(s));
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  async function saveEdit(id: string) {
    if (!draft) return;
    setBusyId(id);
    try {
      const payload: Record<string, unknown> = {
        action: "edit",
        title: draft.title,
        frequency: draft.frequency,
        dueTimeOfDay: draft.dueTimeOfDay,
        endDate: draft.endDate || null,
      };
      if (draft.frequency === "weekly" || draft.frequency === "biweekly") {
        payload.daysOfWeek = draft.daysOfWeek;
      } else if (draft.frequency === "monthly") {
        payload.dayOfMonth = draft.dayOfMonth;
      } else if (draft.frequency === "custom") {
        payload.intervalDays = draft.intervalDays;
      }

      const res = await fetch(`${BASE}/api/v1/assignments/schedules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        cancelEdit();
        await load();
        router.refresh();
      } else {
        setError(data.error ?? "Edit failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setBusyId(null);
    }
  }

  function toggleDow(d: number) {
    if (!draft) return;
    setDraft({
      ...draft,
      daysOfWeek: draft.daysOfWeek.includes(d)
        ? draft.daysOfWeek.filter((x) => x !== d)
        : [...draft.daysOfWeek, d].sort(),
    });
  }

  if (schedules === null && !error) {
    return (
      <div className="flex items-center gap-2 text-slate-400 text-sm py-6 justify-center">
        <Loader2 size={14} className="animate-spin" /> Loading recurring schedules…
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <Repeat size={16} className="text-[var(--color-navy)]" />
        <h2 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">
          Recurring schedules ({schedules?.length ?? 0})
        </h2>
      </div>

      {error && (
        <div className="text-sm text-[var(--color-maroon)] bg-red-50 rounded-lg px-3 py-2 mb-3">{error}</div>
      )}

      {schedules && schedules.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-8">
          No recurring schedules yet. Create an assignment with a Daily / Weekly / Monthly schedule and it will appear here.
        </p>
      ) : (
        <div className="divide-y divide-slate-100">
          {(schedules ?? []).map((s) => {
            const isEditing = editingId === s.id && draft !== null;
            return (
              <div key={s.id} className="py-4 flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="w-10 h-10 bg-[var(--color-teal)]/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Repeat size={16} className="text-[var(--color-teal)]" />
                </div>
                <div className="flex-1 min-w-0">
                  {!isEditing ? (
                    <>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-[var(--color-navy)]">{s.title}</span>
                        <span className="badge bg-slate-100 text-slate-600 text-xs">{s.subject}</span>
                        <span className={`badge text-xs ${STATUS_STYLE[s.status]}`}>{s.status}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1.5">{describe(s)}</div>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={10} />
                          {s.batchName ?? "All batches"}
                        </span>
                        <span>
                          {new Date(s.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          {s.endDate ? ` → ${new Date(s.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : " → ongoing"}
                        </span>
                        {s.lastMaterialisedDate && (
                          <span>last materialised {new Date(s.lastMaterialisedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3 bg-slate-50 rounded-lg p-3">
                      <div>
                        <label className="text-xs font-medium text-slate-600 block mb-1">Title</label>
                        <input
                          value={draft.title}
                          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                          className="w-full text-sm px-2 py-1.5 rounded border border-slate-200"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-slate-600 block mb-1">Frequency</label>
                          <select
                            value={draft.frequency}
                            onChange={(e) => setDraft({ ...draft, frequency: e.target.value as Frequency })}
                            className="w-full text-sm px-2 py-1.5 rounded border border-slate-200 bg-white"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="biweekly">Bi-weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="custom">Custom interval</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-600 block mb-1">Due time</label>
                          <input
                            type="time"
                            value={draft.dueTimeOfDay}
                            onChange={(e) => setDraft({ ...draft, dueTimeOfDay: e.target.value })}
                            className="w-full text-sm px-2 py-1.5 rounded border border-slate-200"
                          />
                        </div>
                      </div>

                      {(draft.frequency === "weekly" || draft.frequency === "biweekly") && (
                        <div>
                          <label className="text-xs font-medium text-slate-600 block mb-1">Days of week</label>
                          <div className="flex flex-wrap gap-1.5">
                            {DOW.map((d, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => toggleDow(i)}
                                className={`text-xs px-2 py-1 rounded border ${draft.daysOfWeek.includes(i) ? "bg-[var(--color-teal)] text-white border-[var(--color-teal)]" : "bg-white text-slate-600 border-slate-200"}`}
                              >
                                {d}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {draft.frequency === "monthly" && (
                        <div>
                          <label className="text-xs font-medium text-slate-600 block mb-1">Day of month (1–31)</label>
                          <input
                            type="number"
                            min={1}
                            max={31}
                            value={draft.dayOfMonth}
                            onChange={(e) => setDraft({ ...draft, dayOfMonth: Number(e.target.value) })}
                            className="w-24 text-sm px-2 py-1.5 rounded border border-slate-200"
                          />
                          <p className="text-[11px] text-slate-400 mt-1">Days past the end of a short month (e.g. 31 in Feb) clamp to the last day.</p>
                        </div>
                      )}

                      {draft.frequency === "custom" && (
                        <div>
                          <label className="text-xs font-medium text-slate-600 block mb-1">Repeat every (days)</label>
                          <input
                            type="number"
                            min={1}
                            max={365}
                            value={draft.intervalDays}
                            onChange={(e) => setDraft({ ...draft, intervalDays: Number(e.target.value) })}
                            className="w-24 text-sm px-2 py-1.5 rounded border border-slate-200"
                          />
                        </div>
                      )}

                      <div>
                        <label className="text-xs font-medium text-slate-600 block mb-1">End date (blank = ongoing)</label>
                        <input
                          type="date"
                          value={draft.endDate}
                          onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
                          className="text-sm px-2 py-1.5 rounded border border-slate-200"
                        />
                      </div>

                      <p className="text-[11px] text-slate-400">
                        Edits only affect future occurrences — assignments already created from this series stay as they are.
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 self-start flex-wrap">
                  {!isEditing ? (
                    <>
                      {s.status !== "ended" && (
                        <button
                          disabled={busyId === s.id}
                          onClick={() => startEdit(s)}
                          className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 disabled:opacity-50"
                        >
                          <Pencil size={12} /> Edit
                        </button>
                      )}
                      {s.status === "active" && (
                        <button
                          disabled={busyId === s.id}
                          onClick={() => act(s.id, "pause")}
                          className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 disabled:opacity-50"
                        >
                          <Pause size={12} /> Pause
                        </button>
                      )}
                      {s.status === "paused" && (
                        <button
                          disabled={busyId === s.id}
                          onClick={() => act(s.id, "resume")}
                          className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 disabled:opacity-50"
                        >
                          <Play size={12} /> Resume
                        </button>
                      )}
                      {s.status !== "ended" && (
                        <button
                          disabled={busyId === s.id}
                          onClick={() => {
                            if (confirm(`End the recurring schedule "${s.title}"? Past assignments stay; no new ones will be created.`)) {
                              act(s.id, "end");
                            }
                          }}
                          className="text-xs py-1.5 px-3 rounded-lg border border-red-200 text-[var(--color-maroon)] hover:bg-red-50 flex items-center gap-1 disabled:opacity-50"
                        >
                          <StopCircle size={12} /> End series
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        disabled={busyId === s.id}
                        onClick={() => saveEdit(s.id)}
                        className="text-xs py-1.5 px-3 rounded-lg bg-[var(--color-teal)] text-white hover:bg-[var(--color-teal-light)] flex items-center gap-1 disabled:opacity-50"
                      >
                        {busyId === s.id ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                        Save
                      </button>
                      <button
                        disabled={busyId === s.id}
                        onClick={cancelEdit}
                        className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 disabled:opacity-50"
                      >
                        <X size={12} /> Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

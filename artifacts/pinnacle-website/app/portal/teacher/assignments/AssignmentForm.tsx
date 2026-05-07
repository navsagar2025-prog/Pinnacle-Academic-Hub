"use client";

import { useState } from "react";
import { PlusCircle, CheckCircle, AlertCircle, X, Repeat, CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";
import FileUpload from "@/components/upload/FileUpload";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

interface Batch { id: string; name: string; timingLabel: string | null; }

const SUBJECTS = ["Physics", "Chemistry", "Biology", "Mathematics", "English", "General"];

type Frequency = "one_off" | "daily" | "weekly" | "biweekly" | "monthly" | "custom";
const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AssignmentForm({ batches }: { batches: Batch[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [form, setForm] = useState({
    title: "",
    subject: "Physics",
    batchId: batches[0]?.id ?? "",
    description: "",
    fileUrl: "",
    dueDate: "",
    maxMarks: "",
  });

  const [frequency, setFrequency] = useState<Frequency>("one_off");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 3, 5]);
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [intervalDays, setIntervalDays] = useState<number>(2);
  const [dueTimeOfDay, setDueTimeOfDay] = useState<string>("23:59");
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState<string>("");

  function toggleDow(d: number) {
    setDaysOfWeek((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  }

  function resetForm() {
    setForm({ title: "", subject: "Physics", batchId: batches[0]?.id ?? "", description: "", fileUrl: "", dueDate: "", maxMarks: "" });
    setFrequency("one_off");
    setDaysOfWeek([1, 3, 5]);
    setDayOfMonth(1);
    setIntervalDays(2);
    setDueTimeOfDay("23:59");
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.batchId) return;
    if (frequency === "one_off" && !form.dueDate) {
      setStatus("error");
      setErrorMsg("Due date is required for one-off assignments.");
      return;
    }
    if (frequency !== "one_off" && !startDate) {
      setStatus("error");
      setErrorMsg("Start date is required for recurring assignments.");
      return;
    }
    setLoading(true);
    setStatus("idle");
    setErrorMsg("");

    const payload: Record<string, unknown> = {
      title: form.title,
      subject: form.subject,
      batchId: form.batchId,
      description: form.description || undefined,
      fileUrl: form.fileUrl || undefined,
      maxMarks: form.maxMarks ? Number(form.maxMarks) : undefined,
    };
    if (frequency === "one_off") {
      payload.dueDate = form.dueDate;
    } else {
      payload.schedule = {
        frequency,
        daysOfWeek: frequency === "weekly" || frequency === "biweekly" ? daysOfWeek : null,
        dayOfMonth: frequency === "monthly" ? dayOfMonth : null,
        intervalDays: frequency === "custom" ? intervalDays : null,
        dueTimeOfDay,
        startDate,
        endDate: endDate || null,
      };
    }

    try {
      const res = await fetch(`${BASE}/api/v1/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("success");
        resetForm();
        setTimeout(() => { setOpen(false); setStatus("idle"); router.refresh(); }, 1500);
      } else {
        setStatus("error");
        setErrorMsg(data.error ?? "Failed to create assignment");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary py-2.5 px-5 text-sm flex items-center gap-2">
        <PlusCircle size={16} /> New Assignment
      </button>
    );
  }

  const isRecurring = frequency !== "one_off";

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">Create Assignment</h2>
        <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Title *</label>
            <input
              required
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input-field w-full"
              placeholder="e.g. Daily Physics Drill"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Subject</label>
            <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="input-field w-full">
              {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Batch</label>
            <select value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })} className="input-field w-full">
              {batches.map((b) => <option key={b.id} value={b.id}>{b.name}{b.timingLabel ? ` (${b.timingLabel})` : ""}</option>)}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5 flex items-center gap-1.5">
              <Repeat size={14} /> Schedule
            </label>
            <div className="flex flex-wrap gap-2">
              {([
                ["one_off", "One-off"],
                ["daily", "Daily"],
                ["weekly", "Weekly"],
                ["biweekly", "Bi-weekly"],
                ["monthly", "Monthly"],
                ["custom", "Every N days"],
              ] as [Frequency, string][]).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setFrequency(val)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    frequency === val
                      ? "bg-[var(--color-navy)] text-white border-[var(--color-navy)]"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {!isRecurring && (
            <div>
              <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Due Date *</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="input-field w-full"
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
          )}

          {isRecurring && (
            <>
              <div>
                <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Start date *</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">End date (optional)</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input-field w-full"
                  min={startDate}
                  placeholder="Until I cancel"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Due time</label>
                <input
                  type="time"
                  value={dueTimeOfDay}
                  onChange={(e) => setDueTimeOfDay(e.target.value)}
                  className="input-field w-full"
                />
              </div>

              {(frequency === "weekly" || frequency === "biweekly") && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Days of week</label>
                  <div className="flex flex-wrap gap-2">
                    {DOW_LABELS.map((label, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleDow(idx)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                          daysOfWeek.includes(idx)
                            ? "bg-[var(--color-teal)] text-white border-[var(--color-teal)]"
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {frequency === "biweekly" && (
                    <p className="text-xs text-slate-400 mt-1.5">Repeats every other week from the start date.</p>
                  )}
                </div>
              )}

              {frequency === "monthly" && (
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Day of month</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(Math.max(1, Math.min(31, Number(e.target.value) || 1)))}
                    className="input-field w-full"
                  />
                  <p className="text-xs text-slate-400 mt-1.5">Days &gt; 28 fall back to the last day of shorter months.</p>
                </div>
              )}

              {frequency === "custom" && (
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Every N days</label>
                  <input
                    type="number"
                    min={1}
                    value={intervalDays}
                    onChange={(e) => setIntervalDays(Math.max(1, Number(e.target.value) || 1))}
                    className="input-field w-full"
                  />
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Max Marks (optional)</label>
            <input
              type="number"
              min="1"
              value={form.maxMarks}
              onChange={(e) => setForm({ ...form, maxMarks: e.target.value })}
              className="input-field w-full"
              placeholder="e.g. 50"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Question Paper PDF (optional)</label>
            <FileUpload
              category="assignment_pdf"
              accept="pdf"
              label="Attach question paper PDF"
              hint="PDF only, max 20 MB"
              currentUrl={form.fileUrl || undefined}
              onUploaded={(_objectPath, servingUrl) => setForm((f) => ({ ...f, fileUrl: servingUrl }))}
            />
            {isRecurring && (
              <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                <CalendarDays size={11} /> The same paper will be attached to every occurrence.
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Instructions (optional)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="input-field w-full resize-none"
              placeholder="Any special instructions for students…"
            />
          </div>
        </div>

        {status === "success" && (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-xl px-4 py-3 text-sm">
            <CheckCircle size={16} /> {isRecurring ? "Schedule created — first occurrences are live." : "Assignment created successfully!"}
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center gap-2 text-[var(--color-maroon)] bg-red-50 rounded-xl px-4 py-3 text-sm">
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1 py-2.5 text-sm">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 py-2.5 text-sm disabled:opacity-50">
            {loading ? "Creating…" : isRecurring ? "Create schedule" : "Create Assignment"}
          </button>
        </div>
      </form>
    </div>
  );
}

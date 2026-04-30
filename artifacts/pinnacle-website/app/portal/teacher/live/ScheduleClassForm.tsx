"use client";

import { useState } from "react";
import { Plus, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

interface Batch { id: string; name: string; }

interface Props { batches: Batch[]; }

const SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Biology", "English"];

export default function ScheduleClassForm({ batches }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [hostUrl, setHostUrl] = useState("");
  const [form, setForm] = useState({
    topic: "",
    subject: "Physics",
    batchId: batches[0]?.id ?? "",
    scheduledAt: "",
    durationMinutes: "90",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.topic || !form.batchId || !form.scheduledAt) return;
    setLoading(true);
    setStatus("idle");

    try {
      const res = await fetch("/pinnacle-website/api/v1/live-classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: form.topic,
          subject: form.subject,
          batchId: form.batchId,
          scheduledAt: new Date(form.scheduledAt).toISOString(),
          durationMinutes: parseInt(form.durationMinutes),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("success");
        setHostUrl(data.data?.zoomHostUrl ?? "");
        setTimeout(() => { router.refresh(); }, 1000);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-primary py-2.5 px-5 text-sm flex items-center gap-2"
      >
        <Plus size={15} /> Schedule Class
      </button>
    );
  }

  return (
    <div className="card border border-[var(--color-teal)]/20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">Schedule New Class</h2>
        <button type="button" onClick={() => { setOpen(false); setStatus("idle"); }} className="text-slate-400 hover:text-slate-600 text-sm">Cancel</button>
      </div>

      {status === "success" ? (
        <div className="text-center py-4 space-y-3">
          <CheckCircle size={40} className="text-green-500 mx-auto" />
          <p className="font-semibold text-[var(--color-navy)]">Class scheduled successfully!</p>
          {hostUrl && (
            <a href={hostUrl} target="_blank" rel="noopener noreferrer" className="btn-primary py-2.5 px-6 text-sm inline-flex items-center gap-2">
              <ExternalLink size={14} /> Open in Zoom (Host)
            </a>
          )}
          <button onClick={() => { setOpen(false); setStatus("idle"); setHostUrl(""); }} className="block mx-auto text-sm text-slate-400 hover:text-slate-600 mt-2">
            Close
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Topic / Class Title *</label>
              <input
                type="text"
                required
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                className="input-field w-full"
                placeholder="e.g. Wave Optics — Diffraction"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Subject</label>
              <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="input-field w-full">
                {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Batch *</label>
              <select value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })} className="input-field w-full">
                {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Date & Time *</label>
              <input
                type="datetime-local"
                required
                value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                className="input-field w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Duration (minutes)</label>
              <select value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} className="input-field w-full">
                {["60", "90", "120"].map((d) => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
          </div>

          {status === "error" && (
            <div className="flex items-center gap-2 text-[var(--color-maroon)] bg-red-50 rounded-xl px-4 py-3 text-sm">
              <AlertCircle size={16} /> Failed to create class. Ensure Zoom credentials are configured.
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            <Plus size={16} />
            {loading ? "Creating Zoom Meeting..." : "Create Class & Zoom Link"}
          </button>
        </form>
      )}
    </div>
  );
}

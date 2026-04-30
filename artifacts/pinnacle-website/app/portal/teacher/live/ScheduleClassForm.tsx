"use client";

import { useState } from "react";
import { Plus, CheckCircle, AlertCircle, ExternalLink, Video, Link2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Batch { id: string; name: string; }

interface Props { batches: Batch[]; }

const SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Biology", "English"];

type MeetingType = "zoom" | "custom";

export default function ScheduleClassForm({ batches }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [hostUrl, setHostUrl] = useState("");
  const [meetingType, setMeetingType] = useState<MeetingType>("zoom");
  const [form, setForm] = useState({
    topic: "",
    subject: "Physics",
    batchId: batches[0]?.id ?? "",
    scheduledAt: "",
    durationMinutes: "90",
    customMeetingUrl: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.topic || !form.batchId || !form.scheduledAt) return;
    if (meetingType === "custom" && !form.customMeetingUrl) return;
    setLoading(true);
    setStatus("idle");

    try {
      const payload: Record<string, unknown> = {
        topic: form.topic,
        subject: form.subject,
        batchId: form.batchId,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        durationMinutes: parseInt(form.durationMinutes),
      };
      if (meetingType === "custom") {
        payload.customMeetingUrl = form.customMeetingUrl;
      }

      const res = await fetch("/pinnacle-website/api/v1/live-classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("success");
        setHostUrl(data.data?.zoomHostUrl ?? data.data?.zoomJoinUrl ?? "");
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
    <div className="card border border-[var(--color-teal)]/20 w-full">
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
              <ExternalLink size={14} /> Open Meeting Link
            </a>
          )}
          <button onClick={() => { setOpen(false); setStatus("idle"); setHostUrl(""); }} className="block mx-auto text-sm text-slate-400 hover:text-slate-600 mt-2">
            Close
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setMeetingType("zoom")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${meetingType === "zoom" ? "bg-white text-[var(--color-navy)] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <Video size={14} /> Auto Zoom Link
            </button>
            <button
              type="button"
              onClick={() => setMeetingType("custom")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${meetingType === "custom" ? "bg-white text-[var(--color-navy)] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <Link2 size={14} /> Custom Link
            </button>
          </div>

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

            {meetingType === "custom" && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">
                  Meeting Link * <span className="font-normal text-slate-400">(Zoom, Google Meet, Teams, etc.)</span>
                </label>
                <input
                  type="url"
                  required={meetingType === "custom"}
                  value={form.customMeetingUrl}
                  onChange={(e) => setForm({ ...form, customMeetingUrl: e.target.value })}
                  className="input-field w-full"
                  placeholder="https://meet.google.com/abc-defg-hij"
                />
              </div>
            )}

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
              <AlertCircle size={16} /> Failed to create class. {meetingType === "zoom" ? "Ensure Zoom credentials are configured or use a custom link." : "Please check the meeting URL and try again."}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            <Plus size={16} />
            {loading
              ? meetingType === "zoom" ? "Creating Zoom Meeting..." : "Scheduling Class..."
              : meetingType === "zoom" ? "Create Class & Zoom Link" : "Schedule Class"}
          </button>
        </form>
      )}
    </div>
  );
}

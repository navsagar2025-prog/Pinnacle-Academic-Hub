"use client";

import { useState } from "react";
import { Plus, CheckCircle, AlertCircle, Video, Link2, Pencil, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

interface Batch { id: string; name: string; }
interface Teacher { id: string; name: string; }

interface CreateProps {
  batches: Batch[];
  teachers: Teacher[];
  mode: "create";
}

interface EditProps {
  classId: string;
  currentMeetingUrl: string | null;
  currentRecordingUrl: string | null;
  topic: string;
  mode: "edit";
}

type Props = CreateProps | EditProps;

const SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Biology", "English"];
type MeetingType = "zoom" | "custom";

export function AdminCreateClassForm({ batches, teachers }: { batches: Batch[]; teachers: Teacher[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [meetingType, setMeetingType] = useState<MeetingType>("zoom");
  const [form, setForm] = useState({
    topic: "",
    subject: "Physics",
    batchId: batches[0]?.id ?? "",
    teacherId: teachers[0]?.id ?? "",
    scheduledAt: "",
    durationMinutes: "90",
    customMeetingUrl: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.topic || !form.batchId || !form.scheduledAt) return;
    setLoading(true);
    setStatus("idle");

    try {
      const payload: Record<string, unknown> = {
        topic: form.topic,
        subject: form.subject,
        batchId: form.batchId,
        teacherId: form.teacherId || undefined,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        durationMinutes: parseInt(form.durationMinutes),
      };
      if (meetingType === "custom" && form.customMeetingUrl) {
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
        setTimeout(() => { setOpen(false); setStatus("idle"); router.refresh(); }, 1500);
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
        <Plus size={15} /> Schedule Live Class
      </button>
    );
  }

  return (
    <div className="card border border-[var(--color-teal)]/20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">Schedule Live Class</h2>
        <button type="button" onClick={() => { setOpen(false); setStatus("idle"); }} className="text-slate-400 hover:text-slate-600 text-sm">Cancel</button>
      </div>

      {status === "success" ? (
        <div className="text-center py-4 space-y-2">
          <CheckCircle size={36} className="text-green-500 mx-auto" />
          <p className="font-semibold text-[var(--color-navy)]">Class scheduled!</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setMeetingType("zoom")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${meetingType === "zoom" ? "bg-white text-[var(--color-navy)] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <Video size={14} /> Auto Zoom
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
              <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Topic *</label>
              <input
                type="text"
                required
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                className="input-field w-full"
                placeholder="e.g. Thermodynamics — Heat Transfer"
              />
            </div>

            {meetingType === "custom" && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">
                  Meeting URL * <span className="font-normal text-slate-400">(Zoom, Google Meet, Teams…)</span>
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
              <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Teacher</label>
              <select value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} className="input-field w-full">
                <option value="">— Unassigned —</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
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
              <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Duration</label>
              <select value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} className="input-field w-full">
                {["60", "90", "120"].map((d) => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
          </div>

          {status === "error" && (
            <div className="flex items-center gap-2 text-[var(--color-maroon)] bg-red-50 rounded-xl px-4 py-3 text-sm">
              <AlertCircle size={16} /> Failed to create class. Check configuration and try again.
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            <Plus size={16} />
            {loading ? "Scheduling..." : "Schedule Class"}
          </button>
        </form>
      )}
    </div>
  );
}

export function AdminEditLinkForm({
  classId,
  currentMeetingUrl,
  currentRecordingUrl,
  topic,
}: {
  classId: string;
  currentMeetingUrl: string | null;
  currentRecordingUrl: string | null;
  topic: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [meetingUrl, setMeetingUrl] = useState(currentMeetingUrl ?? "");
  const [recordingUrl, setRecordingUrl] = useState(currentRecordingUrl ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");

    try {
      const res = await fetch(`/pinnacle-website/api/v1/live-classes/${classId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingUrl, recordingUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("success");
        setTimeout(() => { setOpen(false); setStatus("idle"); router.refresh(); }, 1000);
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
        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--color-teal)]/5 text-[var(--color-teal)] hover:bg-[var(--color-teal)] hover:text-white transition-colors flex items-center gap-1"
      >
        <Pencil size={11} /> Edit Links
      </button>
    );
  }

  return (
    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-[var(--color-navy)]">Edit Links — {topic}</span>
        <button type="button" onClick={() => { setOpen(false); setStatus("idle"); }} className="text-slate-400 text-xs hover:text-slate-600">Cancel</button>
      </div>

      {status === "success" ? (
        <div className="flex items-center gap-2 text-green-600 text-sm py-2">
          <CheckCircle size={16} /> Links updated!
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Meeting Link (Zoom / Google Meet)</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                className="input-field w-full text-xs"
                placeholder="https://zoom.us/j/... or https://meet.google.com/..."
              />
              {meetingUrl && (
                <a href={meetingUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 p-2 rounded-lg bg-[var(--color-teal)]/10 text-[var(--color-teal)] hover:bg-[var(--color-teal)] hover:text-white transition-colors">
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Recording URL (YouTube, Vimeo, Drive…)</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={recordingUrl}
                onChange={(e) => setRecordingUrl(e.target.value)}
                className="input-field w-full text-xs"
                placeholder="https://www.youtube.com/watch?v=..."
              />
              {recordingUrl && (
                <a href={recordingUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 p-2 rounded-lg bg-[var(--color-navy)]/10 text-[var(--color-navy)] hover:bg-[var(--color-navy)] hover:text-white transition-colors">
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>

          {status === "error" && (
            <div className="flex items-center gap-2 text-[var(--color-maroon)] text-xs">
              <AlertCircle size={13} /> Update failed. Try again.
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary text-xs py-2 px-4 w-full flex items-center justify-center gap-1">
            {loading ? "Saving..." : "Save Links"}
          </button>
        </form>
      )}
    </div>
  );
}

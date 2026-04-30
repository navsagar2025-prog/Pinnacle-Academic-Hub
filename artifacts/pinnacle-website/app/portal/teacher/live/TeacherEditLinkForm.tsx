"use client";

import { useState } from "react";
import { Pencil, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  classId: string;
  topic: string;
  currentMeetingUrl: string | null;
  currentRecordingUrl: string | null;
}

export default function TeacherEditLinkForm({ classId, topic, currentMeetingUrl, currentRecordingUrl }: Props) {
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
        className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-slate-400 hover:text-[var(--color-teal)] transition-colors"
      >
        <Pencil size={11} /> Edit Link
      </button>
    );
  }

  return (
    <div className="mt-3 p-3 bg-white rounded-xl border border-[var(--color-teal)]/20">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-[var(--color-navy)]">Update Links — {topic}</span>
        <button type="button" onClick={() => { setOpen(false); setStatus("idle"); }} className="text-slate-400 text-xs hover:text-slate-600">Cancel</button>
      </div>

      {status === "success" ? (
        <div className="flex items-center gap-2 text-green-600 text-sm py-1">
          <CheckCircle size={15} /> Links updated successfully!
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Meeting Link (Zoom / Google Meet / Teams)</label>
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
            <label className="block text-xs font-semibold text-slate-600 mb-1">Recording URL (YouTube, Google Drive, Vimeo…)</label>
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
              <AlertCircle size={13} /> Update failed. Please try again.
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

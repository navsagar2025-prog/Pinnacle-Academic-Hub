"use client";

import { useState } from "react";
import { PlusCircle, CheckCircle, AlertCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import FileUpload from "@/components/upload/FileUpload";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

interface Batch { id: string; name: string; timingLabel: string | null; }

const SUBJECTS = ["Physics", "Chemistry", "Biology", "Mathematics", "English", "General"];

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.batchId || !form.dueDate) return;
    setLoading(true);
    setStatus("idle");
    setErrorMsg("");

    try {
      const res = await fetch(`${BASE}/api/v1/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          subject: form.subject,
          batchId: form.batchId,
          description: form.description || undefined,
          fileUrl: form.fileUrl || undefined,
          dueDate: form.dueDate,
          maxMarks: form.maxMarks ? Number(form.maxMarks) : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("success");
        setForm({ title: "", subject: "Physics", batchId: batches[0]?.id ?? "", description: "", fileUrl: "", dueDate: "", maxMarks: "" });
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
              placeholder="e.g. Electrochemistry — Practice Set 1"
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

          <div>
            <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Due Date *</label>
            <input
              required
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="input-field w-full"
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

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
            <CheckCircle size={16} /> Assignment created successfully!
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
            {loading ? "Creating…" : "Create Assignment"}
          </button>
        </div>
      </form>
    </div>
  );
}

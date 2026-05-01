"use client";

import { useState } from "react";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import FileUpload from "@/components/upload/FileUpload";

interface Batch { id: string; name: string; timingLabel: string | null; }

interface Props {
  batches: Batch[];
  teacherId?: string;
  uploaderId: string;
}

const TYPES = ["Notes", "Summary", "Exercise", "Formula", "Previous Year", "Mock Test"] as const;
const SUBJECTS = ["Physics", "Chemistry", "Biology", "Mathematics", "English", "General"];

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

export default function TeacherMaterialUpload({ batches, uploaderId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [form, setForm] = useState({
    title: "",
    subject: "Physics",
    type: "Notes" as typeof TYPES[number],
    batchId: batches[0]?.id ?? "",
    fileUrl: "",
    description: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.fileUrl || !form.batchId) return;
    setLoading(true);
    setStatus("idle");

    try {
      const res = await fetch(`${BASE}/api/v1/materials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          subject: form.subject,
          type: form.type,
          batchId: form.batchId,
          fileUrl: form.fileUrl,
          description: form.description,
          uploadedBy: uploaderId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("success");
        setForm({ title: "", subject: "Physics", type: "Notes", batchId: batches[0]?.id ?? "", fileUrl: "", description: "" });
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

  return (
    <div className="card">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-[var(--color-teal)]/50 hover:bg-[var(--color-slate-light)] transition-colors cursor-pointer"
        >
          <Upload size={32} className="text-slate-400 mx-auto mb-3" />
          <div className="font-semibold text-[var(--color-navy)] mb-1">Upload Study Material</div>
          <p className="text-slate-500 text-sm">Click to add a new material for your students</p>
          <span className="btn-primary mt-4 py-2 px-6 text-sm inline-flex">Add Material</span>
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">Add New Material</h2>
            <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm">Cancel</button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Title *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="input-field w-full"
                placeholder="e.g. Wave Optics — Complete Notes"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Subject</label>
              <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="input-field w-full">
                {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as typeof TYPES[number] })} className="input-field w-full">
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Batch</label>
              <select value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })} className="input-field w-full">
                {batches.map((b) => <option key={b.id} value={b.id}>{b.name} {b.timingLabel ? `(${b.timingLabel})` : ""}</option>)}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">PDF File *</label>
              <FileUpload
                category="material_pdf"
                accept="pdf"
                label="Click or drag a PDF here"
                hint="PDF only, max 20 MB"
                currentUrl={form.fileUrl || undefined}
                onUploaded={(_objectPath, servingUrl) => setForm((f) => ({ ...f, fileUrl: servingUrl }))}
              />
              {!form.fileUrl && (
                <p className="text-xs text-slate-400 mt-1">You must upload a PDF before submitting.</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Description (optional)</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="input-field w-full resize-none"
                placeholder="Brief description of the material..."
              />
            </div>
          </div>

          {status === "success" && (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-xl px-4 py-3 text-sm">
              <CheckCircle size={16} /> Material added successfully!
            </div>
          )}
          {status === "error" && (
            <div className="flex items-center gap-2 text-[var(--color-maroon)] bg-red-50 rounded-xl px-4 py-3 text-sm">
              <AlertCircle size={16} /> Failed to add material. Please try again.
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !form.fileUrl}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Upload size={16} />
            {loading ? "Saving…" : "Add Material"}
          </button>
        </form>
      )}
    </div>
  );
}

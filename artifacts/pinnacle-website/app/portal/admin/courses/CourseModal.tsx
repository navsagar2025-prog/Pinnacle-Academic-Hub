"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Pencil } from "lucide-react";
import type { Course } from "@workspace/db/schema";

type Props = { course?: Course };

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

export function AddCourseButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn-primary py-2.5 px-5 text-sm" onClick={() => setOpen(true)}>
        <Plus size={15} /> Add Course
      </button>
      {open && <CourseModal onClose={() => setOpen(false)} />}
    </>
  );
}

export function EditCourseButton({ course }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="text-xs font-semibold text-[var(--color-teal)] hover:underline flex items-center gap-1" onClick={() => setOpen(true)}>
        <Pencil size={12} /> Edit
      </button>
      {open && <CourseModal course={course} onClose={() => setOpen(false)} />}
    </>
  );
}

function CourseModal({ course, onClose }: { course?: Course; onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    slug: course?.slug ?? "",
    title: course?.title ?? "",
    description: course?.description ?? "",
    durationLabel: course?.durationLabel ?? "",
    annualFee: course?.annualFee?.toString() ?? "",
    admissionFee: course?.admissionFee?.toString() ?? "2000",
    maxBatchSize: course?.maxBatchSize?.toString() ?? "35",
    eligibility: course?.eligibility ?? "",
    highlights: (course?.highlights ?? []).join("\n"),
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const payload = {
      ...form,
      annualFee: Number(form.annualFee),
      admissionFee: Number(form.admissionFee),
      maxBatchSize: Number(form.maxBatchSize),
      highlights: form.highlights.split("\n").map((s) => s.trim()).filter(Boolean),
    };
    const url = course ? `${BASE}/api/v1/courses/${course.id}` : `${BASE}/api/v1/courses`;
    const method = course ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Failed"); return; }
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-[family-name:var(--font-playfair)] font-bold text-[var(--color-navy)] text-lg">{course ? "Edit Course" : "Add Course"}</h2>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          {[
            { label: "Slug *", key: "slug", placeholder: "jee-main", disabled: !!course },
            { label: "Title *", key: "title", placeholder: "JEE Main & Advanced" },
            { label: "Duration", key: "durationLabel", placeholder: "1–2 years" },
            { label: "Annual Fee (₹) *", key: "annualFee", placeholder: "48000", type: "number" },
            { label: "Admission Fee (₹)", key: "admissionFee", placeholder: "2000", type: "number" },
            { label: "Max Batch Size", key: "maxBatchSize", placeholder: "35", type: "number" },
            { label: "Eligibility", key: "eligibility", placeholder: "Class 10 pass/appearing" },
          ].map(({ label, key, placeholder, type, disabled }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
              <input
                type={type ?? "text"}
                value={form[key as keyof typeof form]}
                onChange={(e) => set(key, e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)] disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Highlights (one per line)</label>
            <textarea value={form.highlights} onChange={(e) => set("highlights", e.target.value)} rows={4} placeholder="500+ hours of teaching&#10;Weekly mock tests" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-outline py-2.5 text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary py-2.5 text-sm">{loading ? "Saving…" : "Save Course"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

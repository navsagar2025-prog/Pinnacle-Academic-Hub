"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Pencil, UserX } from "lucide-react";
import FileUpload from "@/components/upload/FileUpload";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

interface TeacherRow {
  id: string;
  designation: string | null;
  qualification: string | null;
  subjects: string[] | null;
  experienceYears: number | null;
  initials: string | null;
  bio: string | null;
  isActive: boolean | null;
  photoUrl: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
}

export function AddFacultyButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn-primary py-2.5 px-5 text-sm flex items-center gap-2" onClick={() => setOpen(true)}>
        <Plus size={15} /> Add Faculty
      </button>
      {open && <TeacherModal onClose={() => setOpen(false)} />}
    </>
  );
}

export function EditFacultyButton({ teacher }: { teacher: TeacherRow }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-[var(--color-navy)]/5 text-[var(--color-navy)] hover:bg-[var(--color-navy)] hover:text-white transition-colors"
        onClick={() => setOpen(true)}
      >
        <Pencil size={11} className="inline mr-1" />Edit
      </button>
      {open && <TeacherModal teacher={teacher} onClose={() => setOpen(false)} />}
    </>
  );
}

export function RemoveFacultyButton({ teacherId, name }: { teacherId: string; name: string | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    if (!confirm(`Remove "${name ?? "this teacher"}" from faculty?`)) return;
    setLoading(true);
    await fetch(`${BASE}/api/v1/teachers/${teacherId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: false }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      disabled={loading}
      onClick={handleRemove}
      className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-[var(--color-maroon)]/5 text-[var(--color-maroon)] hover:bg-[var(--color-maroon)] hover:text-white transition-colors"
    >
      <UserX size={11} className="inline mr-1" />{loading ? "…" : "Remove"}
    </button>
  );
}

function TeacherModal({ teacher, onClose }: { teacher?: TeacherRow; onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: teacher?.name ?? "",
    email: teacher?.email ?? "",
    phone: teacher?.phone ?? "",
    designation: teacher?.designation ?? "",
    qualification: teacher?.qualification ?? "",
    subjects: (teacher?.subjects ?? []).join(", "),
    experienceYears: teacher?.experienceYears?.toString() ?? "",
    bio: teacher?.bio ?? "",
    initials: teacher?.initials ?? "",
    photoUrl: teacher?.photoUrl ?? "",
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const payload = {
      ...form,
      subjects: form.subjects.split(",").map((s) => s.trim()).filter(Boolean),
      experienceYears: form.experienceYears ? Number(form.experienceYears) : undefined,
      photoUrl: form.photoUrl || undefined,
    };
    const url = teacher ? `${BASE}/api/v1/teachers/${teacher.id}` : `${BASE}/api/v1/teachers`;
    const method = teacher ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Failed to save"); return; }
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-[family-name:var(--font-playfair)] font-bold text-[var(--color-navy)] text-lg">
            {teacher ? "Edit Faculty" : "Add Faculty"}
          </h2>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Full Name *", key: "name", req: true, full: true },
              { label: "Email *", key: "email", req: true, type: "email" },
              { label: "Phone", key: "phone", req: false },
              { label: "Designation *", key: "designation", req: true, full: true, placeholder: "Physics Faculty" },
              { label: "Qualification", key: "qualification", placeholder: "M.Sc., B.Ed." },
              { label: "Experience (years)", key: "experienceYears", type: "number" },
              { label: "Initials", key: "initials", placeholder: "AK" },
              { label: "Subjects (comma-separated)", key: "subjects", full: true, placeholder: "Physics, Chemistry" },
            ].map(({ label, key, req, type, full, placeholder }) => (
              <div key={key} className={full ? "col-span-2" : ""}>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
                <input
                  type={type ?? "text"}
                  required={req}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]"
                />
              </div>
            ))}

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Bio (optional)</label>
              <textarea
                value={form.bio}
                onChange={(e) => set("bio", e.target.value)}
                rows={2}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)] resize-none"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Faculty Photo</label>
              <FileUpload
                category="faculty_photo"
                accept="image"
                label="Upload photo"
                hint="JPG, PNG, or WebP — max 5 MB"
                currentUrl={form.photoUrl || undefined}
                onUploaded={(_objectPath, servingUrl) => set("photoUrl", servingUrl)}
              />
              {form.photoUrl && (
                <img src={form.photoUrl} alt="preview" className="mt-2 w-16 h-16 rounded-full object-cover border border-slate-200" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-outline py-2.5 text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary py-2.5 text-sm">
              {loading ? "Saving…" : teacher ? "Save Changes" : "Add Faculty"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

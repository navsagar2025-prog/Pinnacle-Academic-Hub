"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X, Eye, EyeOff } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

const CATEGORIES = ["General", "Classrooms", "Events", "Mock Tests", "Toppers' Celebration", "Campus", "Faculty", "Infrastructure"];

type GalleryItem = {
  id: string;
  title: string;
  caption: string | null;
  category: string;
  imageUrl: string;
  sortOrder: number | null;
  isVisible: boolean | null;
};

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-[family-name:var(--font-playfair)] text-lg font-bold text-[var(--color-navy)]">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors rounded-lg p-1">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function GalleryForm({
  initial,
  onSave,
  onClose,
}: {
  initial?: Partial<GalleryItem>;
  onSave: (data: Partial<GalleryItem>) => Promise<void>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [caption, setCaption] = useState(initial?.caption ?? "");
  const [category, setCategory] = useState(initial?.category ?? "General");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setError("Title is required");
    if (!imageUrl.trim()) return setError("Image URL is required");
    setSaving(true);
    setError("");
    try {
      await onSave({ title, caption, category, imageUrl, sortOrder: parseInt(sortOrder) || 0 });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <p className="text-sm text-[var(--color-maroon)] bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Title *</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="e.g. JEE Advanced 2025 Toppers" required />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Caption</label>
        <input value={caption} onChange={(e) => setCaption(e.target.value)} className="input-field" placeholder="Optional caption for the photo" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field">
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Sort Order</label>
          <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="input-field" min={0} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Image URL *</label>
        <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="input-field font-mono text-xs" placeholder="https://..." required />
        {imageUrl && (
          <img src={imageUrl} alt="Preview" className="mt-2 w-full h-32 object-cover rounded-lg border border-slate-200" onError={(e) => (e.currentTarget.style.display = "none")} />
        )}
      </div>
      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5 text-sm disabled:opacity-50">
          {saving ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5 text-sm">Cancel</button>
      </div>
    </form>
  );
}

export function AddGalleryButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleSave(data: Partial<GalleryItem>) {
    const res = await fetch(`${BASE}/api/v1/gallery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error ?? "Failed to create item");
    }
    router.refresh();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary py-2.5 px-5 text-sm flex items-center gap-2">
        <Plus size={15} /> Add Photo
      </button>
      {open && (
        <Modal title="Add Gallery Photo" onClose={() => setOpen(false)}>
          <GalleryForm onSave={handleSave} onClose={() => setOpen(false)} />
        </Modal>
      )}
    </>
  );
}

export function EditGalleryButton({ item }: { item: GalleryItem }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleSave(data: Partial<GalleryItem>) {
    const res = await fetch(`${BASE}/api/v1/gallery/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error ?? "Failed to update item");
    }
    router.refresh();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-xs text-[var(--color-teal)] hover:underline flex items-center gap-1">
        <Pencil size={12} /> Edit
      </button>
      {open && (
        <Modal title="Edit Gallery Photo" onClose={() => setOpen(false)}>
          <GalleryForm initial={item} onSave={handleSave} onClose={() => setOpen(false)} />
        </Modal>
      )}
    </>
  );
}

export function DeleteGalleryButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await fetch(`${BASE}/api/v1/gallery/${id}`, { method: "DELETE" });
    setDeleting(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-xs text-[var(--color-maroon)] hover:underline flex items-center gap-1">
        <Trash2 size={12} /> Delete
      </button>
      {open && (
        <Modal title="Delete Photo?" onClose={() => setOpen(false)}>
          <p className="text-slate-600 text-sm mb-4">
            Are you sure you want to delete <strong>&ldquo;{title}&rdquo;</strong>? This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button onClick={handleDelete} disabled={deleting} className="btn-primary bg-[var(--color-maroon)] hover:bg-[var(--color-maroon)]/90 flex-1 py-2.5 text-sm disabled:opacity-50">
              {deleting ? "Deleting…" : "Delete"}
            </button>
            <button onClick={() => setOpen(false)} className="btn-secondary flex-1 py-2.5 text-sm">Cancel</button>
          </div>
        </Modal>
      )}
    </>
  );
}

export function VisibilityToggle({ id, isVisible }: { id: string; isVisible: boolean | null }) {
  const router = useRouter();
  const [vis, setVis] = useState(isVisible ?? true);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const newVis = !vis;
    setVis(newVis);
    await fetch(`${BASE}/api/v1/gallery/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isVisible: newVis }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button onClick={toggle} disabled={loading} title={vis ? "Visible — click to hide" : "Hidden — click to show"} className="text-slate-400 hover:text-[var(--color-teal)] transition-colors">
      {vis ? <Eye size={15} /> : <EyeOff size={15} className="text-slate-300" />}
    </button>
  );
}

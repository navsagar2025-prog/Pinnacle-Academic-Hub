"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Pencil, Trash2, Globe } from "lucide-react";
import type { BlogPost } from "@workspace/db/schema";
import FileUpload from "@/components/upload/FileUpload";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

const CATEGORIES = ["JEE", "NEET", "Chemistry", "Mathematics", "Physics", "Biology", "Strategy", "General"];

export function AddBlogPostButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn-primary py-2.5 px-5 text-sm" onClick={() => setOpen(true)}>
        <Plus size={15} /> New Post
      </button>
      {open && <BlogModal onClose={() => setOpen(false)} />}
    </>
  );
}

export function EditBlogPostButton({ post }: { post: BlogPost }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="text-xs font-semibold text-[var(--color-teal)] hover:underline" onClick={() => setOpen(true)}>
        <Pencil size={12} className="inline mr-1" />Edit
      </button>
      {open && <BlogModal post={post} onClose={() => setOpen(false)} />}
    </>
  );
}

export function DeleteBlogPostButton({ postId }: { postId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this blog post?")) return;
    setLoading(true);
    await fetch(`${BASE}/api/v1/blog/${postId}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button disabled={loading} onClick={handleDelete} className="text-xs font-semibold text-[var(--color-maroon)] hover:underline">
      <Trash2 size={12} className="inline mr-1" />{loading ? "…" : "Delete"}
    </button>
  );
}

export function PublishToggleButton({ post }: { post: BlogPost }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const newStatus = post.status === "published" ? "draft" : "published";
    await fetch(`${BASE}/api/v1/blog/${post.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button disabled={loading} onClick={toggle} className="text-xs font-semibold text-slate-500 hover:text-[var(--color-navy)] flex items-center gap-1">
      <Globe size={12} />{loading ? "…" : post.status === "published" ? "Unpublish" : "Publish"}
    </button>
  );
}

function BlogModal({ post, onClose }: { post?: BlogPost; onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    slug: post?.slug ?? "",
    title: post?.title ?? "",
    excerpt: post?.excerpt ?? "",
    content: post?.content ?? "",
    category: post?.category ?? "General",
    tags: (post?.tags ?? []).join(", "),
    authorName: post?.authorName ?? "",
    featuredImageUrl: post?.featuredImageUrl ?? "",
    readMinutes: post?.readMinutes?.toString() ?? "5",
    status: post?.status ?? "draft",
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const payload = {
      ...form,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      readMinutes: Number(form.readMinutes),
      featuredImageUrl: form.featuredImageUrl || undefined,
    };
    const url = post ? `${BASE}/api/v1/blog/${post.id}` : `${BASE}/api/v1/blog`;
    const method = post ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Failed"); return; }
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <h2 className="font-[family-name:var(--font-playfair)] font-bold text-[var(--color-navy)] text-lg">{post ? "Edit Post" : "New Blog Post"}</h2>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Title *</label>
              <input type="text" value={form.title} onChange={(e) => set("title", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]" required />
            </div>

            <div className={post ? "col-span-2" : ""}>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Slug * {post && <span className="font-normal text-slate-400">(read-only)</span>}</label>
              <input type="text" value={form.slug} onChange={(e) => set("slug", e.target.value)} disabled={!!post} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)] disabled:bg-slate-50 disabled:text-slate-400" required />
            </div>

            {!post && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                <select value={form.status} onChange={(e) => set("status", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
              <select value={form.category} onChange={(e) => set("category", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]">
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Author Name *</label>
              <input type="text" value={form.authorName} onChange={(e) => set("authorName", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]" required />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Read Time (minutes)</label>
              <input type="number" min="1" value={form.readMinutes} onChange={(e) => set("readMinutes", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]" />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tags <span className="font-normal text-slate-400">(comma-separated)</span></label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => set("tags", e.target.value)}
                placeholder="JEE, Maths, Tips, 2025"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Featured Image</label>
              <FileUpload
                category="blog_image"
                accept="image"
                label="Upload featured image"
                hint="JPG, PNG, or WebP — max 5 MB"
                currentUrl={form.featuredImageUrl || undefined}
                onUploaded={(_objectPath, servingUrl) => set("featuredImageUrl", servingUrl)}
              />
              {form.featuredImageUrl && (
                <img src={form.featuredImageUrl} alt="preview" className="mt-2 rounded-lg h-24 w-full object-cover border border-slate-100" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Excerpt / Summary</label>
            <textarea value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Content</label>
            <textarea value={form.content} onChange={(e) => set("content", e.target.value)} rows={10} placeholder="Full article content..." className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)] font-mono" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-outline py-2.5 text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary py-2.5 text-sm">{loading ? "Saving…" : "Save Post"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

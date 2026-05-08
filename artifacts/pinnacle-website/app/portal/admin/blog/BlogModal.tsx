"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Pencil, Trash2, Globe, Sparkles, Search, Image, Zap, CheckCircle, AlertCircle } from "lucide-react";
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

export function EnhanceAllDraftsButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleEnhance() {
    if (!confirm("Enhance all draft posts that haven't been AI-enhanced yet? This will call the AI API for up to 10 posts.")) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${BASE}/api/v1/admin/ops/blog-enhance`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        const d = data.data ?? data;
        setResult(`Done: ${d.succeeded ?? 0} enhanced, ${d.failed ?? 0} failed out of ${d.processed ?? 0} posts.`);
        router.refresh();
      } else {
        setResult(`Error: ${data.error ?? "Unknown error"}`);
      }
    } catch {
      setResult("Network error — check console.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleEnhance}
        disabled={loading}
        className="inline-flex items-center gap-2 btn-secondary py-2.5 px-4 text-sm disabled:opacity-60"
      >
        <Zap size={14} className={loading ? "animate-pulse" : ""} />
        {loading ? "Enhancing…" : "Enhance All Drafts"}
      </button>
      {result && (
        <span className="text-xs text-slate-500">{result}</span>
      )}
    </div>
  );
}

type AiStatus = "idle" | "loading" | "done" | "error";

function AiBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-violet-100 text-violet-700 rounded px-1.5 py-0.5 ml-1">
      <Sparkles size={9} />AI
    </span>
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
    seoTitle: (post as BlogPost & { seoTitle?: string | null })?.seoTitle ?? "",
    metaDescription: (post as BlogPost & { metaDescription?: string | null })?.metaDescription ?? "",
    focusKeyword: (post as BlogPost & { focusKeyword?: string | null })?.focusKeyword ?? "",
  });

  const [aiFlags, setAiFlags] = useState({ content: !!(post as BlogPost & { aiEnhancedAt?: string | null })?.aiEnhancedAt, seo: !!(post as BlogPost & { seoTitle?: string | null })?.seoTitle, image: false });
  const [enhanceStatus, setEnhanceStatus] = useState<AiStatus>("idle");
  const [seoStatus, setSeoStatus] = useState<AiStatus>("idle");
  const [imageStatus, setImageStatus] = useState<AiStatus>("idle");
  const [aiError, setAiError] = useState("");

  const contentRef = useRef<HTMLTextAreaElement>(null);

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
      seoTitle: form.seoTitle || undefined,
      metaDescription: form.metaDescription || undefined,
      focusKeyword: form.focusKeyword || undefined,
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

  async function handleEnhance() {
    if (!post?.id) { setAiError("Save the post first before enhancing."); return; }
    setEnhanceStatus("loading");
    setAiError("");

    try {
      const res = await fetch(`${BASE}/api/v1/blog/${post.id}/enhance`, { method: "POST" });
      if (!res.ok) { setEnhanceStatus("error"); setAiError("Enhancement request failed."); return; }

      const reader = res.body?.getReader();
      if (!reader) { setEnhanceStatus("error"); return; }

      const decoder = new TextDecoder();
      let buffer = "";
      let newContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const json = JSON.parse(line.slice(6));
            if (json.content) {
              newContent += json.content;
              setForm((p) => ({ ...p, content: newContent }));
            }
            if (json.done) {
              if (json.readMinutes) setForm((p) => ({ ...p, readMinutes: String(json.readMinutes) }));
              if (json.excerpt) setForm((p) => ({ ...p, excerpt: json.excerpt }));
            }
            if (json.error) { setEnhanceStatus("error"); setAiError(json.error); return; }
          } catch { /* malformed SSE chunk, skip */ }
        }
      }

      setEnhanceStatus("done");
      setAiFlags((p) => ({ ...p, content: true }));
    } catch (e) {
      setEnhanceStatus("error");
      setAiError("Network error during enhancement.");
    }
  }

  async function handleGenerateSeo() {
    if (!post?.id) { setAiError("Save the post first before generating SEO."); return; }
    setSeoStatus("loading");
    setAiError("");

    try {
      const res = await fetch(`${BASE}/api/v1/blog/${post.id}/seo`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setSeoStatus("error"); setAiError(data.error ?? "SEO generation failed."); return; }

      const { seoTitle, metaDescription, focusKeyword } = data.data ?? data;
      setForm((p) => ({
        ...p,
        seoTitle: seoTitle ?? p.seoTitle,
        metaDescription: metaDescription ?? p.metaDescription,
        focusKeyword: focusKeyword ?? p.focusKeyword,
      }));
      setSeoStatus("done");
      setAiFlags((p) => ({ ...p, seo: true }));
    } catch {
      setSeoStatus("error");
      setAiError("Network error during SEO generation.");
    }
  }

  async function handleGenerateImage() {
    if (!post?.id) { setAiError("Save the post first before generating a hero image."); return; }
    setImageStatus("loading");
    setAiError("");

    try {
      const res = await fetch(`${BASE}/api/v1/blog/${post.id}/hero-image`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setImageStatus("error"); setAiError(data.error ?? "Image generation failed."); return; }

      const { featuredImageUrl } = data.data ?? data;
      if (featuredImageUrl) setForm((p) => ({ ...p, featuredImageUrl }));
      setImageStatus("done");
      setAiFlags((p) => ({ ...p, image: true }));
    } catch {
      setImageStatus("error");
      setAiError("Network error during image generation.");
    }
  }

  function statusIcon(s: AiStatus) {
    if (s === "loading") return <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full" />;
    if (s === "done") return <CheckCircle size={13} className="text-emerald-500" />;
    if (s === "error") return <AlertCircle size={13} className="text-red-500" />;
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <h2 className="font-[family-name:var(--font-playfair)] font-bold text-[var(--color-navy)] text-lg">{post ? "Edit Post" : "New Blog Post"}</h2>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
        </div>

        {post && (
          <div className="px-5 pt-4 pb-2 border-b border-slate-100 bg-slate-50/50">
            <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1"><Sparkles size={11} />AI Actions</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleEnhance}
                disabled={enhanceStatus === "loading"}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 disabled:opacity-60 transition-colors"
              >
                {statusIcon(enhanceStatus) ?? <Sparkles size={12} />}
                {enhanceStatus === "loading" ? "Enhancing…" : "Enhance with AI"}
                {aiFlags.content && enhanceStatus === "idle" && <span className="text-[9px] text-violet-400">(re-enhance)</span>}
              </button>

              <button
                type="button"
                onClick={handleGenerateSeo}
                disabled={seoStatus === "loading"}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-60 transition-colors"
              >
                {statusIcon(seoStatus) ?? <Search size={12} />}
                {seoStatus === "loading" ? "Generating SEO…" : "Generate SEO"}
              </button>

              <button
                type="button"
                onClick={handleGenerateImage}
                disabled={imageStatus === "loading"}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-60 transition-colors"
              >
                {statusIcon(imageStatus) ?? <Image size={12} />}
                {imageStatus === "loading" ? "Generating Image…" : "Generate Hero Image"}
              </button>
            </div>
            {aiError && <p className="text-red-600 text-xs mt-2 flex items-center gap-1"><AlertCircle size={11} />{aiError}</p>}
          </div>
        )}

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
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Featured Image
                {aiFlags.image && <AiBadge />}
              </label>
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
              {imageStatus === "done" && (
                <p className="text-xs text-amber-600 mt-1">AI image URL may expire in ~1 hour. Use the upload widget above to save it permanently.</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Excerpt / Summary</label>
            <textarea value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Content
              {aiFlags.content && <AiBadge />}
            </label>
            <textarea
              ref={contentRef}
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
              rows={10}
              placeholder="Full article content..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)] font-mono"
            />
          </div>

          <div className="border border-blue-100 rounded-xl p-4 bg-blue-50/30 space-y-3">
            <div className="flex items-center gap-1.5">
              <Search size={13} className="text-blue-500" />
              <span className="text-xs font-semibold text-slate-600">SEO Metadata</span>
              {aiFlags.seo && <AiBadge />}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">SEO Title <span className="font-normal text-slate-400">({form.seoTitle.length}/65 chars)</span></label>
              <input
                type="text"
                value={form.seoTitle}
                onChange={(e) => set("seoTitle", e.target.value)}
                placeholder="Keyword-rich title for Google (55–65 chars)"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Meta Description <span className="font-normal text-slate-400">({form.metaDescription.length}/160 chars)</span></label>
              <textarea
                value={form.metaDescription}
                onChange={(e) => set("metaDescription", e.target.value)}
                rows={2}
                placeholder="Click-worthy description for search results (140–160 chars)"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Focus Keyword</label>
              <input
                type="text"
                value={form.focusKeyword}
                onChange={(e) => set("focusKeyword", e.target.value)}
                placeholder="e.g. JEE mains preparation tips"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              />
            </div>
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

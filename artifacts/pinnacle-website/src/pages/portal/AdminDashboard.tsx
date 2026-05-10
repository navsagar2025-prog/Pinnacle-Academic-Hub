import { useState, useEffect, useCallback } from "react";
import { useAuth, useUser } from "@clerk/react";
import {
  LayoutDashboard, Bell, Users, BookOpen, Image, LogOut,
  Plus, Pencil, Trash2, Eye, EyeOff, X, Check, ChevronDown, RefreshCw,
  Menu,
} from "lucide-react";
import { useClerk } from "@clerk/react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Section = "overview" | "notices" | "enquiries" | "blog" | "gallery";

const NAV: { key: Section; label: string; Icon: React.ElementType }[] = [
  { key: "overview", label: "Overview", Icon: LayoutDashboard },
  { key: "notices", label: "Notices", Icon: Bell },
  { key: "enquiries", label: "Enquiries", Icon: Users },
  { key: "blog", label: "Blog", Icon: BookOpen },
  { key: "gallery", label: "Gallery", Icon: Image },
];

const NOTICE_CATS = ["Academic", "Test", "Fee", "Event", "Admissions", "General"];
const ENQUIRY_STATUSES = ["new", "contacted", "interested", "converted", "declined"];
const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-yellow-100 text-yellow-700",
  interested: "bg-purple-100 text-purple-700",
  converted: "bg-green-100 text-green-700",
  declined: "bg-red-100 text-red-700",
};

function useFetch<T>(path: string, getToken: () => Promise<string | null>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${BASE}/api/v1${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Request failed");
      setData(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load };
}

async function apiCall(
  method: string,
  path: string,
  body: object | null,
  getToken: () => Promise<string | null>,
): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  const token = await getToken();
  const res = await fetch(`${BASE}/api/v1${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return res.json();
}

// ── Stats Overview ──────────────────────────────────────────────────────────

function OverviewSection({ getToken }: { getToken: () => Promise<string | null> }) {
  const { data, loading, reload } = useFetch<{
    noticeCount: number; enquiryCount: number; blogCount: number;
    galleryCount: number; newEnquiryCount: number;
  }>("/admin/stats", getToken);

  const cards = [
    { label: "Notices", value: data?.noticeCount, icon: "📋", color: "bg-blue-50 text-blue-600" },
    { label: "Enquiries", value: data?.enquiryCount, icon: "📩", color: "bg-purple-50 text-purple-600", badge: data?.newEnquiryCount },
    { label: "Blog Posts", value: data?.blogCount, icon: "📝", color: "bg-teal-50 text-teal-600" },
    { label: "Gallery Items", value: data?.galleryCount, icon: "🖼️", color: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[var(--color-navy)]">Dashboard Overview</h2>
        <button onClick={reload} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[var(--color-navy)] transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card border border-slate-200 h-28 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cards.map((c) => (
            <div key={c.label} className="card border border-slate-200 flex flex-col gap-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${c.color}`}>
                {c.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--color-navy)]">
                  {c.value ?? "—"}
                  {c.badge != null && c.badge > 0 && (
                    <span className="ml-2 text-xs bg-blue-600 text-white rounded-full px-2 py-0.5">
                      {c.badge} new
                    </span>
                  )}
                </p>
                <p className="text-sm text-slate-500">{c.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 card border border-slate-200">
        <h3 className="font-bold text-[var(--color-navy)] mb-3">Quick Tips</h3>
        <ul className="space-y-2 text-sm text-slate-600">
          <li>• Use <strong>Notices</strong> to post announcements visible on the public notice board</li>
          <li>• <strong>Enquiries</strong> shows all admission leads from the website contact form</li>
          <li>• <strong>Blog</strong> posts in draft won't appear on the public site until published</li>
          <li>• <strong>Gallery</strong> items must be set to visible to appear on the public gallery page</li>
        </ul>
      </div>
    </div>
  );
}

// ── Notices ─────────────────────────────────────────────────────────────────

type Notice = {
  id: string; title: string; body: string; category: string;
  isPublic: boolean; publishedAt: string; expiresAt: string | null;
};

function NoticesSection({ getToken }: { getToken: () => Promise<string | null> }) {
  const { data, loading, reload } = useFetch<Notice[]>("/admin/notices", getToken);
  const [modal, setModal] = useState<{ mode: "create" | "edit"; item?: Notice } | null>(null);
  const [form, setForm] = useState({ title: "", body: "", category: "General", isPublic: true, expiresAt: "" });
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setForm({ title: "", body: "", category: "General", isPublic: true, expiresAt: "" });
    setModal({ mode: "create" });
  }
  function openEdit(item: Notice) {
    setForm({
      title: item.title, body: item.body, category: item.category,
      isPublic: item.isPublic, expiresAt: item.expiresAt ? item.expiresAt.split("T")[0] : "",
    });
    setModal({ mode: "edit", item });
  }

  async function save() {
    setSaving(true);
    const payload = { ...form, expiresAt: form.expiresAt || null };
    if (modal?.mode === "create") {
      await apiCall("POST", "/admin/notices", payload, getToken);
    } else {
      await apiCall("PATCH", `/admin/notices/${modal?.item?.id}`, payload, getToken);
    }
    setSaving(false);
    setModal(null);
    reload();
  }

  async function del(id: string) {
    if (!confirm("Delete this notice?")) return;
    await apiCall("DELETE", `/admin/notices/${id}`, null, getToken);
    reload();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[var(--color-navy)]">Notices</h2>
        <button onClick={openCreate} className="btn-primary px-4 py-2 flex items-center gap-2 text-sm">
          <Plus size={15} /> New Notice
        </button>
      </div>

      {loading ? <div className="text-slate-400 text-sm">Loading…</div> : (
        <div className="space-y-3">
          {(data ?? []).map((n) => (
            <div key={n.id} className="card border border-slate-200 flex gap-4 items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{n.category}</span>
                  {!n.isPublic && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">Hidden</span>}
                  {n.expiresAt && new Date(n.expiresAt) < new Date() && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Expired</span>
                  )}
                </div>
                <p className="font-semibold text-[var(--color-navy)] text-sm">{n.title}</p>
                <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">{n.body}</p>
                <p className="text-xs text-slate-400 mt-1">{new Date(n.publishedAt).toLocaleDateString("en-IN")}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEdit(n)} className="p-1.5 text-slate-400 hover:text-[var(--color-navy)] transition-colors"><Pencil size={14} /></button>
                <button onClick={() => del(n.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          {(data ?? []).length === 0 && <p className="text-slate-400 text-sm">No notices yet.</p>}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-bold text-[var(--color-navy)]">{modal.mode === "create" ? "New Notice" : "Edit Notice"}</h3>
              <button onClick={() => setModal(null)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Body *</label>
                <textarea rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none" value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {NOTICE_CATS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Expires (optional)</label>
                  <input type="date" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={form.isPublic} onChange={e => setForm(f => ({ ...f, isPublic: e.target.checked }))} className="rounded" />
                Visible to public
              </label>
            </div>
            <div className="flex justify-end gap-3 px-5 pb-5">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">Cancel</button>
              <button onClick={save} disabled={saving || !form.title || !form.body} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Enquiries ────────────────────────────────────────────────────────────────

type Enquiry = {
  id: string; name: string; phone: string; email: string | null;
  courseInterest: string | null; message: string | null; source: string;
  admissionStatus: string; isFollowedUp: boolean; notes: string | null;
  createdAt: string;
};

function EnquiriesSection({ getToken }: { getToken: () => Promise<string | null> }) {
  const { data, loading, reload } = useFetch<Enquiry[]>("/admin/enquiries", getToken);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selected, setSelected] = useState<Enquiry | null>(null);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  async function updateStatus(id: string, admissionStatus: string) {
    setUpdating(id);
    await apiCall("PATCH", `/admin/enquiries/${id}`, { admissionStatus }, getToken);
    setUpdating(null);
    reload();
  }

  async function toggleFollowUp(id: string, current: boolean) {
    setUpdating(id);
    await apiCall("PATCH", `/admin/enquiries/${id}`, { isFollowedUp: !current }, getToken);
    setUpdating(null);
    reload();
  }

  async function saveNotes() {
    if (!selected) return;
    setSavingNotes(true);
    await apiCall("PATCH", `/admin/enquiries/${selected.id}`, { notes }, getToken);
    setSavingNotes(false);
    setSelected(null);
    reload();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[var(--color-navy)]">Enquiries</h2>
        <button onClick={reload} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[var(--color-navy)] transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? <div className="text-slate-400 text-sm">Loading…</div> : (
        <div className="space-y-3">
          {(data ?? []).map((e) => (
            <div key={e.id} className={`card border rounded-xl p-4 ${e.admissionStatus === "new" ? "border-blue-300" : "border-slate-200"}`}>
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-[var(--color-navy)] text-sm">{e.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[e.admissionStatus] ?? "bg-slate-100 text-slate-600"}`}>
                      {e.admissionStatus}
                    </span>
                    {e.isFollowedUp && <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Followed up</span>}
                  </div>
                  <p className="text-xs text-slate-500">{e.phone}{e.email ? ` · ${e.email}` : ""}</p>
                  {e.courseInterest && <p className="text-xs text-slate-500 mt-0.5">Interest: {e.courseInterest}</p>}
                  {e.message && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{e.message}</p>}
                  {e.notes && <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 mt-1">📝 {e.notes}</p>}
                  <p className="text-xs text-slate-400 mt-1">{new Date(e.createdAt).toLocaleString("en-IN")}</p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <select
                    disabled={updating === e.id}
                    value={e.admissionStatus}
                    onChange={ev => updateStatus(e.id, ev.target.value)}
                    className="text-xs border border-slate-200 rounded px-2 py-1 bg-white"
                  >
                    {ENQUIRY_STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <button
                    onClick={() => toggleFollowUp(e.id, e.isFollowedUp)}
                    disabled={updating === e.id}
                    className={`text-xs px-2 py-1 rounded border transition-colors ${e.isFollowedUp ? "border-green-300 text-green-600" : "border-slate-200 text-slate-500"}`}
                  >
                    {e.isFollowedUp ? <><Check size={10} className="inline" /> Followed up</> : "Mark followed up"}
                  </button>
                  <button
                    onClick={() => { setSelected(e); setNotes(e.notes ?? ""); }}
                    className="text-xs px-2 py-1 rounded border border-slate-200 text-slate-500 hover:border-[var(--color-teal)] hover:text-[var(--color-teal)] transition-colors"
                  >
                    Add note
                  </button>
                </div>
              </div>
            </div>
          ))}
          {(data ?? []).length === 0 && <p className="text-slate-400 text-sm">No enquiries yet.</p>}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-bold text-[var(--color-navy)]">Notes for {selected.name}</h3>
              <button onClick={() => setSelected(null)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="p-5">
              <textarea rows={4} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add notes about this enquiry…" />
            </div>
            <div className="flex justify-end gap-3 px-5 pb-5">
              <button onClick={() => setSelected(null)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
              <button onClick={saveNotes} disabled={savingNotes} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">
                {savingNotes ? "Saving…" : "Save Note"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Blog ─────────────────────────────────────────────────────────────────────

type BlogPost = {
  id: string; slug: string; title: string; excerpt: string | null;
  category: string; authorName: string; status: string; readMinutes: number;
  publishedAt: string | null; createdAt: string;
};

function BlogSection({ getToken }: { getToken: () => Promise<string | null> }) {
  const { data, loading, reload } = useFetch<BlogPost[]>("/admin/blog", getToken);
  const [modal, setModal] = useState<{ mode: "create" | "edit"; item?: BlogPost } | null>(null);
  const [form, setForm] = useState({ slug: "", title: "", excerpt: "", category: "General", authorName: "", status: "draft", readMinutes: "5", content: "" });
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setForm({ slug: "", title: "", excerpt: "", category: "General", authorName: "", status: "draft", readMinutes: "5", content: "" });
    setModal({ mode: "create" });
  }
  function openEdit(item: BlogPost) {
    setForm({ slug: item.slug, title: item.title, excerpt: item.excerpt ?? "", category: item.category, authorName: item.authorName, status: item.status, readMinutes: String(item.readMinutes), content: "" });
    setModal({ mode: "edit", item });
  }

  function autoSlug(title: string) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  async function save() {
    setSaving(true);
    const payload = { ...form, readMinutes: parseInt(form.readMinutes) || 5 };
    if (modal?.mode === "create") {
      await apiCall("POST", "/admin/blog", payload, getToken);
    } else {
      const { slug: _s, ...rest } = payload;
      await apiCall("PATCH", `/admin/blog/${modal?.item?.id}`, rest, getToken);
    }
    setSaving(false);
    setModal(null);
    reload();
  }

  async function del(id: string) {
    if (!confirm("Delete this blog post?")) return;
    await apiCall("DELETE", `/admin/blog/${id}`, null, getToken);
    reload();
  }

  async function toggleStatus(item: BlogPost) {
    const newStatus = item.status === "published" ? "draft" : "published";
    await apiCall("PATCH", `/admin/blog/${item.id}`, { status: newStatus }, getToken);
    reload();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[var(--color-navy)]">Blog Posts</h2>
        <button onClick={openCreate} className="btn-primary px-4 py-2 flex items-center gap-2 text-sm">
          <Plus size={15} /> New Post
        </button>
      </div>

      {loading ? <div className="text-slate-400 text-sm">Loading…</div> : (
        <div className="space-y-3">
          {(data ?? []).map((p) => (
            <div key={p.id} className="card border border-slate-200 flex gap-4 items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status === "published" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                    {p.status}
                  </span>
                  <span className="text-xs text-slate-400">{p.category}</span>
                </div>
                <p className="font-semibold text-[var(--color-navy)] text-sm">{p.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">by {p.authorName} · {p.readMinutes} min read</p>
                {p.excerpt && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.excerpt}</p>}
                <p className="text-xs text-slate-400 mt-1">{new Date(p.createdAt).toLocaleDateString("en-IN")}</p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={() => toggleStatus(p)} className="p-1.5 text-slate-400 hover:text-[var(--color-teal)] transition-colors" title={p.status === "published" ? "Unpublish" : "Publish"}>
                  {p.status === "published" ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button onClick={() => openEdit(p)} className="p-1.5 text-slate-400 hover:text-[var(--color-navy)] transition-colors"><Pencil size={14} /></button>
                <button onClick={() => del(p.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          {(data ?? []).length === 0 && <p className="text-slate-400 text-sm">No blog posts yet.</p>}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-[var(--color-navy)]">{modal.mode === "create" ? "New Blog Post" : "Edit Post"}</h3>
              <button onClick={() => setModal(null)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: f.slug || autoSlug(e.target.value) }))} />
              </div>
              {modal.mode === "create" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Slug *</label>
                  <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Author *</label>
                  <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.authorName} onChange={e => setForm(f => ({ ...f, authorName: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Read time (min)</label>
                  <input type="number" min={1} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.readMinutes} onChange={e => setForm(f => ({ ...f, readMinutes: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Excerpt</label>
                <textarea rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none" value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Content (Markdown)</label>
                <textarea rows={6} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none font-mono" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="# Heading&#10;&#10;Write your article here..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-5 pb-5 shrink-0">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
              <button onClick={save} disabled={saving || !form.title || !form.authorName || (modal.mode === "create" && !form.slug)} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Gallery ───────────────────────────────────────────────────────────────────

type GalleryItem = {
  id: string; title: string; caption: string | null; category: string;
  imageUrl: string; sortOrder: number; isVisible: boolean; createdAt: string;
};

function GallerySection({ getToken }: { getToken: () => Promise<string | null> }) {
  const { data, loading, reload } = useFetch<GalleryItem[]>("/admin/gallery", getToken);
  const [modal, setModal] = useState<{ mode: "create" | "edit"; item?: GalleryItem } | null>(null);
  const [form, setForm] = useState({ title: "", imageUrl: "", caption: "", category: "General", sortOrder: "0", isVisible: true });
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setForm({ title: "", imageUrl: "", caption: "", category: "General", sortOrder: "0", isVisible: true });
    setModal({ mode: "create" });
  }
  function openEdit(item: GalleryItem) {
    setForm({ title: item.title, imageUrl: item.imageUrl, caption: item.caption ?? "", category: item.category, sortOrder: String(item.sortOrder), isVisible: item.isVisible });
    setModal({ mode: "edit", item });
  }

  async function save() {
    setSaving(true);
    const payload = { ...form, sortOrder: parseInt(form.sortOrder) || 0 };
    if (modal?.mode === "create") {
      await apiCall("POST", "/admin/gallery", payload, getToken);
    } else {
      await apiCall("PATCH", `/admin/gallery/${modal?.item?.id}`, payload, getToken);
    }
    setSaving(false);
    setModal(null);
    reload();
  }

  async function del(id: string) {
    if (!confirm("Delete this gallery item?")) return;
    await apiCall("DELETE", `/admin/gallery/${id}`, null, getToken);
    reload();
  }

  async function toggleVisibility(item: GalleryItem) {
    await apiCall("PATCH", `/admin/gallery/${item.id}`, { isVisible: !item.isVisible }, getToken);
    reload();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[var(--color-navy)]">Gallery</h2>
        <button onClick={openCreate} className="btn-primary px-4 py-2 flex items-center gap-2 text-sm">
          <Plus size={15} /> Add Image
        </button>
      </div>

      {loading ? <div className="text-slate-400 text-sm">Loading…</div> : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {(data ?? []).map((item) => (
            <div key={item.id} className={`card border rounded-xl overflow-hidden p-0 ${item.isVisible ? "border-slate-200" : "border-slate-100 opacity-60"}`}>
              <div className="relative">
                <img src={item.imageUrl} alt={item.title} className="w-full h-36 object-cover bg-slate-100" onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/400x200/e2e8f0/64748b?text=Image"; }} />
                <div className="absolute top-2 right-2 flex gap-1">
                  <button onClick={() => toggleVisibility(item)} className={`p-1.5 rounded-full shadow ${item.isVisible ? "bg-white text-teal-600" : "bg-white text-slate-400"}`}>
                    {item.isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>
                  <button onClick={() => openEdit(item)} className="p-1.5 rounded-full shadow bg-white text-slate-500"><Pencil size={12} /></button>
                  <button onClick={() => del(item.id)} className="p-1.5 rounded-full shadow bg-white text-red-400"><Trash2 size={12} /></button>
                </div>
              </div>
              <div className="p-3">
                <p className="font-semibold text-slate-800 text-sm truncate">{item.title}</p>
                {item.caption && <p className="text-xs text-slate-400 truncate">{item.caption}</p>}
                <p className="text-xs text-slate-400 mt-0.5">{item.category} · order {item.sortOrder}</p>
              </div>
            </div>
          ))}
          {(data ?? []).length === 0 && <p className="text-slate-400 text-sm col-span-3">No gallery items yet.</p>}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-bold text-[var(--color-navy)]">{modal.mode === "create" ? "Add Gallery Image" : "Edit Gallery Item"}</h3>
              <button onClick={() => setModal(null)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Image URL *</label>
                <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="https://…" value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} />
                {form.imageUrl && (
                  <img src={form.imageUrl} alt="preview" className="mt-2 w-full h-32 object-cover rounded-lg bg-slate-100" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sort Order</label>
                  <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Caption</label>
                <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.caption} onChange={e => setForm(f => ({ ...f, caption: e.target.value }))} />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={form.isVisible} onChange={e => setForm(f => ({ ...f, isVisible: e.target.checked }))} className="rounded" />
                Visible in public gallery
              </label>
            </div>
            <div className="flex justify-end gap-3 px-5 pb-5">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
              <button onClick={save} disabled={saving || !form.title || !form.imageUrl} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [section, setSection] = useState<Section>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const tokenFn = useCallback(() => getToken(), [getToken]);

  const sectionComponents: Record<Section, React.ReactElement> = {
    overview: <OverviewSection getToken={tokenFn} />,
    notices: <NoticesSection getToken={tokenFn} />,
    enquiries: <EnquiriesSection getToken={tokenFn} />,
    blog: <BlogSection getToken={tokenFn} />,
    gallery: <GallerySection getToken={tokenFn} />,
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex bg-[var(--color-slate-light)]">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-60 bg-[var(--color-navy)] flex flex-col transition-transform duration-300 top-0
        lg:static lg:translate-x-0 lg:z-auto
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-gold)] flex items-center justify-center text-[var(--color-navy)] font-bold text-sm">P</div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Pinnacle Admin</p>
              <p className="text-white/40 text-xs truncate max-w-[120px]">{user?.firstName ?? "Admin"}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-4 space-y-0.5 px-2">
          {NAV.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => { setSection(key); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                section === key
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>
        <div className="px-2 pb-4">
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 bg-[var(--color-navy)] px-4 py-3">
          <button onClick={() => setSidebarOpen(true)} className="text-white">
            <Menu size={20} />
          </button>
          <p className="text-white font-semibold text-sm">{NAV.find(n => n.key === section)?.label}</p>
        </div>
        <div className="p-6 max-w-5xl">
          {sectionComponents[section]}
        </div>
      </div>
    </div>
  );
}

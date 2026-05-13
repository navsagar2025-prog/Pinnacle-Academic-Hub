import { useState, useEffect, useCallback } from "react";
import { useAuth, useUser } from "@clerk/react";
import {
  LayoutDashboard, Bell, Users, BookOpen, Image, LogOut,
  Plus, Pencil, Trash2, Eye, EyeOff, X, Check, ChevronDown, RefreshCw,
  Menu, GraduationCap, School, Layers, CreditCard, Trophy, ClipboardList,
  CalendarDays, ClipboardCheck, FileText, UserCheck, Video, Play,
  MessageCircleQuestion, Megaphone, Database, BookMarked, Settings,
  SearchCode, Droplet, BarChart2, ShieldAlert, UserCog,
} from "lucide-react";
import { useClerk } from "@clerk/react";
import { AdminQuestionBank, AdminPracticeSets } from "./AdminQuestionBank";
import { AdminSchedules } from "./AdminSchedules";
import { AdminAssignments } from "./AdminAssignments";
import { AdminStudyMaterials } from "./AdminStudyMaterials";
import { AdminAttendance } from "./AdminAttendance";
import { AdminLiveClasses } from "./AdminLiveClasses";
import { AdminDoubts } from "./AdminDoubts";
import { AdminPromotions } from "./AdminPromotions";
import { AdminUsers } from "./AdminUsers";
import { AdminSiteSettings, AdminSEO, AdminWatermarks, AdminGA4Setup } from "./AdminSiteSettings";
import { AdminAnalytics, AdminSecurity } from "./AdminSecurity";
import { AdminRecordingsSection } from "./AdminRecordings";
import { ToastProvider, SkeletonList, useToast } from "./portalUtils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Section = "overview" | "notices" | "enquiries" | "blog" | "gallery"
  | "students" | "teachers" | "courses" | "batches" | "fees" | "results" | "mock-tests"
  | "attendance" | "doubts" | "users"
  | "timetable" | "assignments" | "study-materials" | "live-classes" | "recordings"
  | "question-bank" | "practice-sets"
  | "promotions"
  | "site-settings" | "seo" | "watermarks" | "ga4-setup" | "analytics" | "security";

const NAV: { key: Section; label: string; Icon: React.ElementType; group?: string }[] = [
  { key: "overview", label: "Overview", Icon: LayoutDashboard },
  { key: "students", label: "Students", Icon: GraduationCap, group: "People" },
  { key: "teachers", label: "Teachers", Icon: School, group: "People" },
  { key: "attendance", label: "Attendance", Icon: UserCheck, group: "People" },
  { key: "doubts", label: "Doubts / Q&A", Icon: MessageCircleQuestion, group: "People" },
  { key: "users", label: "All Users", Icon: UserCog, group: "People" },
  { key: "courses", label: "Courses", Icon: BookOpen, group: "Academics" },
  { key: "batches", label: "Batches", Icon: Layers, group: "Academics" },
  { key: "timetable", label: "Timetable", Icon: CalendarDays, group: "Academics" },
  { key: "assignments", label: "Assignments", Icon: ClipboardCheck, group: "Academics" },
  { key: "study-materials", label: "Study Materials", Icon: FileText, group: "Academics" },
  { key: "live-classes", label: "Live Classes", Icon: Video, group: "Academics" },
  { key: "recordings", label: "Recordings", Icon: Play, group: "Academics" },
  { key: "mock-tests", label: "Mock Tests", Icon: ClipboardList, group: "Academics" },
  { key: "question-bank", label: "Question Bank", Icon: Database, group: "Academics" },
  { key: "practice-sets", label: "Practice Sets", Icon: BookMarked, group: "Academics" },
  { key: "fees", label: "Fee Records", Icon: CreditCard, group: "Finance" },
  { key: "results", label: "Toppers / Results", Icon: Trophy, group: "Content" },
  { key: "notices", label: "Notices", Icon: Bell, group: "Content" },
  { key: "blog", label: "Blog", Icon: BookOpen, group: "Content" },
  { key: "gallery", label: "Gallery", Icon: Image, group: "Content" },
  { key: "promotions", label: "Promotions", Icon: Megaphone, group: "Content" },
  { key: "enquiries", label: "Enquiries", Icon: Users, group: "Admissions" },
  { key: "site-settings", label: "Site Settings", Icon: Settings, group: "Settings" },
  { key: "seo", label: "SEO", Icon: SearchCode, group: "Settings" },
  { key: "watermarks", label: "Watermarks", Icon: Droplet, group: "Settings" },
  { key: "ga4-setup", label: "Google Analytics", Icon: BarChart2, group: "Settings" },
  { key: "analytics", label: "Analytics", Icon: BarChart2, group: "Settings" },
  { key: "security", label: "Security", Icon: ShieldAlert, group: "Settings" },
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
    studentCount: number; teacherCount: number; batchCount: number; openDoubtsCount: number;
    pendingApprovalCount: number;
  }>("/admin/stats", getToken);

  const cards = [
    { label: "Students", value: data?.studentCount, icon: "🎓", color: "bg-blue-50 text-blue-600" },
    { label: "Teachers", value: data?.teacherCount, icon: "👨‍🏫", color: "bg-teal-50 text-teal-700" },
    { label: "Batches", value: data?.batchCount, icon: "🏫", color: "bg-indigo-50 text-indigo-600" },
    { label: "Open Doubts", value: data?.openDoubtsCount, icon: "❓", color: "bg-orange-50 text-orange-600" },
    { label: "Notices", value: data?.noticeCount, icon: "📋", color: "bg-sky-50 text-sky-600" },
    { label: "Enquiries", value: data?.enquiryCount, icon: "📩", color: "bg-purple-50 text-purple-600", badge: data?.newEnquiryCount },
    { label: "Pending Approval", value: data?.pendingApprovalCount, icon: "⏳", color: "bg-amber-50 text-amber-600" },
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card border border-slate-200 h-28 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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

      {loading ? <SkeletonList rows={4} /> : (
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

      {loading ? <SkeletonList rows={4} /> : (
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

      {loading ? <SkeletonList rows={4} /> : (
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

      {loading ? <SkeletonList rows={4} /> : (
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

// ── Students Section ──────────────────────────────────────────────────────────
type StudentRow = { id: string; rollNumber: string; feePlan: string | null; isActive: boolean | null; enrolledAt: string; guardianName: string | null; guardianPhone: string | null; batchId: string | null; batchName: string | null; userName: string | null; userEmail: string | null; userPhone: string | null; courseName: string | null };

function StudentsSection({ getToken }: { getToken: () => Promise<string | null> }) {
  const { data, loading, reload } = useFetch<StudentRow[]>("/admin/students", getToken);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[var(--color-navy)]">Students</h2>
        <button onClick={reload} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[var(--color-navy)]"><RefreshCw size={14} /> Refresh</button>
      </div>
      {loading ? <SkeletonList rows={4} /> : (
        <>
          <p className="text-sm text-slate-500 mb-4">{data?.length ?? 0} enrolled students</p>
          <div className="space-y-2">
            {(data ?? []).map(s => (
              <div key={s.id} className="card border border-slate-200 flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold shrink-0">
                  {(s.userName ?? s.rollNumber).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--color-navy)] text-sm">{s.userName ?? "—"}</p>
                  <p className="text-xs text-slate-500 truncate">{s.rollNumber} · {s.courseName ?? "No course"} · {s.batchName ?? "No batch"}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-slate-500">{s.userEmail ?? ""}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${s.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>{s.isActive ? "Active" : "Inactive"}</span>
                </div>
              </div>
            ))}
            {(data ?? []).length === 0 && <p className="text-slate-400 text-sm">No students enrolled yet.</p>}
          </div>
        </>
      )}
    </div>
  );
}

// ── Teachers Section ──────────────────────────────────────────────────────────
type TeacherRow = { id: string; designation: string; qualification: string | null; subjects: string[] | null; experienceYears: number | null; isActive: boolean | null; isExaminer: boolean | null; photoUrl: string | null; joinedAt: string; userName: string | null; userEmail: string | null };

function TeachersSection({ getToken }: { getToken: () => Promise<string | null> }) {
  const { data, loading, reload } = useFetch<TeacherRow[]>("/admin/teachers", getToken);
  const [modal, setModal] = useState<{ mode: "edit"; item: TeacherRow } | null>(null);
  const [form, setForm] = useState({ designation: "", qualification: "", subjects: "", experienceYears: "", isActive: true, isExaminer: false, photoUrl: "" });
  const [saving, setSaving] = useState(false);

  function openEdit(item: TeacherRow) {
    setForm({ designation: item.designation, qualification: item.qualification ?? "", subjects: (item.subjects ?? []).join(", "), experienceYears: String(item.experienceYears ?? ""), isActive: item.isActive ?? true, isExaminer: item.isExaminer ?? false, photoUrl: item.photoUrl ?? "" });
    setModal({ mode: "edit", item });
  }

  async function save() {
    if (!modal) return;
    setSaving(true);
    await apiCall("PATCH", `/admin/teachers/${modal.item.id}`, {
      designation: form.designation, qualification: form.qualification || null,
      subjects: form.subjects.split(",").map(s => s.trim()).filter(Boolean),
      experienceYears: form.experienceYears ? Number(form.experienceYears) : null,
      isActive: form.isActive, isExaminer: form.isExaminer, photoUrl: form.photoUrl || null,
    }, getToken);
    setSaving(false); setModal(null); reload();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[var(--color-navy)]">Teachers</h2>
        <button onClick={reload} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[var(--color-navy)]"><RefreshCw size={14} /> Refresh</button>
      </div>
      {loading ? <SkeletonList rows={4} /> : (
        <div className="space-y-2">
          {(data ?? []).map(t => (
            <div key={t.id} className="card border border-slate-200 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold shrink-0">
                {t.photoUrl ? <img src={t.photoUrl} className="w-10 h-10 rounded-full object-cover" alt="" /> : (t.userName ?? "T").charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[var(--color-navy)] text-sm">{t.userName ?? "—"}</p>
                <p className="text-xs text-slate-500">{t.designation} · {(t.subjects ?? []).join(", ") || "No subjects"}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {t.isExaminer && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Examiner</span>}
                <span className={`text-xs px-2 py-0.5 rounded-full ${t.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>{t.isActive ? "Active" : "Inactive"}</span>
                <button onClick={() => openEdit(t)} className="text-slate-400 hover:text-[var(--color-navy)]"><Pencil size={14} /></button>
              </div>
            </div>
          ))}
          {(data ?? []).length === 0 && <p className="text-slate-400 text-sm">No teachers added yet.</p>}
        </div>
      )}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b"><h3 className="font-bold text-[var(--color-navy)]">Edit Teacher</h3><button onClick={() => setModal(null)}><X size={18} /></button></div>
            <div className="px-5 py-4 space-y-3">
              <div><label className="block text-xs font-medium text-slate-600 mb-1">Designation</label><input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))} /></div>
              <div><label className="block text-xs font-medium text-slate-600 mb-1">Qualification</label><input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.qualification} onChange={e => setForm(f => ({ ...f, qualification: e.target.value }))} /></div>
              <div><label className="block text-xs font-medium text-slate-600 mb-1">Subjects (comma-separated)</label><input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.subjects} onChange={e => setForm(f => ({ ...f, subjects: e.target.value }))} /></div>
              <div><label className="block text-xs font-medium text-slate-600 mb-1">Experience (years)</label><input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.experienceYears} onChange={e => setForm(f => ({ ...f, experienceYears: e.target.value }))} /></div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" /> Active</label>
                <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.isExaminer} onChange={e => setForm(f => ({ ...f, isExaminer: e.target.checked }))} className="rounded" /> Examiner</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-5 pb-5"><button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-slate-600">Cancel</button><button onClick={save} disabled={saving} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">{saving ? "Saving…" : "Save"}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Courses Section ───────────────────────────────────────────────────────────
type CourseRow = { id: string; slug: string; title: string; description: string | null; category: string | null; annualFee: number; admissionFee: number | null; maxBatchSize: number | null; eligibility: string | null; isActive: boolean | null };

function CoursesSection({ getToken }: { getToken: () => Promise<string | null> }) {
  const { data, loading, reload } = useFetch<CourseRow[]>("/admin/courses", getToken);
  const [modal, setModal] = useState<{ mode: "create" | "edit"; item?: CourseRow } | null>(null);
  const [form, setForm] = useState({ slug: "", title: "", description: "", category: "JEE", annualFee: "", admissionFee: "2000", maxBatchSize: "35", eligibility: "", isActive: true });
  const [saving, setSaving] = useState(false);

  function openCreate() { setForm({ slug: "", title: "", description: "", category: "JEE", annualFee: "", admissionFee: "2000", maxBatchSize: "35", eligibility: "", isActive: true }); setModal({ mode: "create" }); }
  function openEdit(item: CourseRow) { setForm({ slug: item.slug, title: item.title, description: item.description ?? "", category: item.category ?? "JEE", annualFee: String(item.annualFee), admissionFee: String(item.admissionFee ?? 2000), maxBatchSize: String(item.maxBatchSize ?? 35), eligibility: item.eligibility ?? "", isActive: item.isActive ?? true }); setModal({ mode: "edit", item }); }

  async function save() {
    setSaving(true);
    const payload = { ...form, annualFee: Number(form.annualFee), admissionFee: Number(form.admissionFee), maxBatchSize: Number(form.maxBatchSize) };
    if (modal?.mode === "create") await apiCall("POST", "/admin/courses", payload, getToken);
    else await apiCall("PATCH", `/admin/courses/${modal?.item?.id}`, payload, getToken);
    setSaving(false); setModal(null); reload();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[var(--color-navy)]">Courses</h2>
        <button onClick={openCreate} className="btn-primary text-sm px-4 py-2 flex items-center gap-2"><Plus size={14} /> Add Course</button>
      </div>
      {loading ? <SkeletonList rows={4} /> : (
        <div className="space-y-3">
          {(data ?? []).map(c => (
            <div key={c.id} className="card border border-slate-200 flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-[var(--color-navy)] text-sm">{c.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${c.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>{c.isActive ? "Active" : "Inactive"}</span>
                </div>
                {c.category && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full mr-2">{c.category}</span>}
                <p className="text-xs text-slate-500 mt-1">Annual: ₹{c.annualFee.toLocaleString("en-IN")} · Admission: ₹{(c.admissionFee ?? 0).toLocaleString("en-IN")} · Max {c.maxBatchSize} per batch</p>
                {c.eligibility && <p className="text-xs text-slate-400 mt-0.5">{c.eligibility}</p>}
              </div>
              <button onClick={() => openEdit(c)} className="text-slate-400 hover:text-[var(--color-navy)] shrink-0"><Pencil size={14} /></button>
            </div>
          ))}
          {(data ?? []).length === 0 && <p className="text-slate-400 text-sm">No courses created yet.</p>}
        </div>
      )}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b shrink-0"><h3 className="font-bold text-[var(--color-navy)]">{modal.mode === "create" ? "Add Course" : "Edit Course"}</h3><button onClick={() => setModal(null)}><X size={18} /></button></div>
            <div className="px-5 py-4 space-y-3 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-slate-600 mb-1">Title *</label><input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
                <div><label className="block text-xs font-medium text-slate-600 mb-1">Slug *</label><input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} /></div>
              </div>
              <div><label className="block text-xs font-medium text-slate-600 mb-1">Category</label><select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}><option>JEE</option><option>NEET</option><option>Foundation</option><option>General</option></select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-slate-600 mb-1">Annual Fee (₹)</label><input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.annualFee} onChange={e => setForm(f => ({ ...f, annualFee: e.target.value }))} /></div>
                <div><label className="block text-xs font-medium text-slate-600 mb-1">Admission Fee (₹)</label><input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.admissionFee} onChange={e => setForm(f => ({ ...f, admissionFee: e.target.value }))} /></div>
              </div>
              <div><label className="block text-xs font-medium text-slate-600 mb-1">Max Students/Batch</label><input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.maxBatchSize} onChange={e => setForm(f => ({ ...f, maxBatchSize: e.target.value }))} /></div>
              <div><label className="block text-xs font-medium text-slate-600 mb-1">Eligibility</label><input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.eligibility} onChange={e => setForm(f => ({ ...f, eligibility: e.target.value }))} /></div>
              <div><label className="block text-xs font-medium text-slate-600 mb-1">Description</label><textarea rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" /> Active</label>
            </div>
            <div className="flex justify-end gap-3 px-5 pb-5 shrink-0"><button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-slate-600">Cancel</button><button onClick={save} disabled={saving || !form.title || !form.slug || !form.annualFee} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">{saving ? "Saving…" : "Save"}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Batches Section ───────────────────────────────────────────────────────────
type BatchRow = { id: string; name: string; timingLabel: string; daysLabel: string; status: string | null; maxStudents: number | null; room: string | null; startDate: string | null; endDate: string | null; courseId: string | null; courseName: string | null };
const BATCH_STATUSES = ["active", "upcoming", "full", "completed"];

function BatchesSection({ getToken }: { getToken: () => Promise<string | null> }) {
  const { data, loading, reload } = useFetch<BatchRow[]>("/admin/batches", getToken);
  const { data: coursesData } = useFetch<CourseRow[]>("/admin/courses", getToken);
  const [modal, setModal] = useState<{ mode: "create" | "edit"; item?: BatchRow } | null>(null);
  const [form, setForm] = useState({ name: "", timingLabel: "", daysLabel: "", maxStudents: "30", room: "", courseId: "", status: "active" });
  const [saving, setSaving] = useState(false);

  function openCreate() { setForm({ name: "", timingLabel: "", daysLabel: "", maxStudents: "30", room: "", courseId: "", status: "active" }); setModal({ mode: "create" }); }
  function openEdit(item: BatchRow) { setForm({ name: item.name, timingLabel: item.timingLabel, daysLabel: item.daysLabel, maxStudents: String(item.maxStudents ?? 30), room: item.room ?? "", courseId: item.courseId ?? "", status: item.status ?? "active" }); setModal({ mode: "edit", item }); }

  async function save() {
    setSaving(true);
    const payload = { ...form, maxStudents: Number(form.maxStudents), courseId: form.courseId || null, room: form.room || null };
    if (modal?.mode === "create") await apiCall("POST", "/admin/batches", payload, getToken);
    else await apiCall("PATCH", `/admin/batches/${modal?.item?.id}`, payload, getToken);
    setSaving(false); setModal(null); reload();
  }

  const STATUS_BADGE: Record<string, string> = { active: "bg-green-100 text-green-700", upcoming: "bg-blue-100 text-blue-700", full: "bg-orange-100 text-orange-700", completed: "bg-slate-100 text-slate-500" };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[var(--color-navy)]">Batches</h2>
        <button onClick={openCreate} className="btn-primary text-sm px-4 py-2 flex items-center gap-2"><Plus size={14} /> Add Batch</button>
      </div>
      {loading ? <SkeletonList rows={4} /> : (
        <div className="space-y-3">
          {(data ?? []).map(b => (
            <div key={b.id} className="card border border-slate-200 flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-[var(--color-navy)] text-sm">{b.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[b.status ?? ""] ?? "bg-slate-100 text-slate-500"}`}>{b.status}</span>
                </div>
                {b.courseName && <p className="text-xs text-slate-500">{b.courseName}</p>}
                <p className="text-xs text-slate-400 mt-0.5">{b.timingLabel} · {b.daysLabel}{b.room ? ` · Room ${b.room}` : ""} · Max {b.maxStudents}</p>
              </div>
              <button onClick={() => openEdit(b)} className="text-slate-400 hover:text-[var(--color-navy)] shrink-0"><Pencil size={14} /></button>
            </div>
          ))}
          {(data ?? []).length === 0 && <p className="text-slate-400 text-sm">No batches created yet.</p>}
        </div>
      )}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b"><h3 className="font-bold text-[var(--color-navy)]">{modal.mode === "create" ? "Add Batch" : "Edit Batch"}</h3><button onClick={() => setModal(null)}><X size={18} /></button></div>
            <div className="px-5 py-4 space-y-3">
              <div><label className="block text-xs font-medium text-slate-600 mb-1">Batch Name *</label><input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><label className="block text-xs font-medium text-slate-600 mb-1">Course</label><select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.courseId} onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}><option value="">-- None --</option>{(coursesData ?? []).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-slate-600 mb-1">Timing (e.g. 7–9 AM)</label><input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.timingLabel} onChange={e => setForm(f => ({ ...f, timingLabel: e.target.value }))} /></div>
                <div><label className="block text-xs font-medium text-slate-600 mb-1">Days (e.g. Mon/Wed/Fri)</label><input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.daysLabel} onChange={e => setForm(f => ({ ...f, daysLabel: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-slate-600 mb-1">Room</label><input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} /></div>
                <div><label className="block text-xs font-medium text-slate-600 mb-1">Max Students</label><input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.maxStudents} onChange={e => setForm(f => ({ ...f, maxStudents: e.target.value }))} /></div>
              </div>
              <div><label className="block text-xs font-medium text-slate-600 mb-1">Status</label><select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>{BATCH_STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
            </div>
            <div className="flex justify-end gap-3 px-5 pb-5"><button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-slate-600">Cancel</button><button onClick={save} disabled={saving || !form.name || !form.timingLabel || !form.daysLabel} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">{saving ? "Saving…" : "Save"}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Fee Records Section ───────────────────────────────────────────────────────
type FeeRow = { id: string; period: string; amount: number; paidAmount: number; dueDate: string; paidDate: string | null; status: string; paymentMethod: string | null; transactionRef: string | null; notes: string | null; studentId: string | null; rollNumber: string | null; studentName: string | null };
type FeeStudentOption = { id: string; rollNumber: string; userName: string | null };
const FEE_STATUSES = ["due", "partial", "paid", "overdue", "waived"];
const FEE_COLORS: Record<string, string> = { paid: "bg-green-100 text-green-700", partial: "bg-yellow-100 text-yellow-700", due: "bg-red-100 text-red-600", overdue: "bg-red-200 text-red-800", waived: "bg-slate-100 text-slate-600" };
const EMPTY_CREATE = { studentId: "", period: "", amount: "", dueDate: "" };

function FeesSection({ getToken }: { getToken: () => Promise<string | null> }) {
  const { toast } = useToast();
  const { data, loading, reload } = useFetch<FeeRow[]>("/admin/fee-records", getToken);
  const [modal, setModal] = useState<FeeRow | null>(null);
  const [form, setForm] = useState({ status: "due", paidAmount: "", paidDate: "", paymentMethod: "", transactionRef: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [creating, setCreating] = useState(false);
  const [students, setStudents] = useState<FeeStudentOption[]>([]);
  const [filterStudentId, setFilterStudentId] = useState("");

  useEffect(() => {
    (async () => {
      const token = await getToken();
      const res = await fetch(`${BASE}/api/v1/admin/students`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.ok) setStudents(json.data);
    })();
  }, [getToken]);

  function openEdit(item: FeeRow) {
    setForm({ status: item.status, paidAmount: String(item.paidAmount), paidDate: item.paidDate ? item.paidDate.split("T")[0] : "", paymentMethod: item.paymentMethod ?? "", transactionRef: item.transactionRef ?? "", notes: item.notes ?? "" });
    setModal(item);
  }

  function openCreate() { setCreateForm(EMPTY_CREATE); setShowCreate(true); }

  async function save() {
    if (!modal) return;
    setSaving(true);
    const result = await apiCall("PATCH", `/admin/fee-records/${modal.id}`, { status: form.status, paidAmount: Number(form.paidAmount), paidDate: form.paidDate || null, paymentMethod: form.paymentMethod || null, transactionRef: form.transactionRef || null, notes: form.notes || null }, getToken);
    setSaving(false);
    if (result.ok) { toast("success", "Fee record updated"); setModal(null); reload(); }
    else toast("error", (result as { error?: string }).error ?? "Failed to update fee record");
  }

  async function create() {
    if (!createForm.studentId || !createForm.period || !createForm.amount || !createForm.dueDate) return;
    if (Number(createForm.amount) <= 0) { toast("error", "Amount must be greater than zero"); return; }
    setCreating(true);
    const result = await apiCall("POST", "/admin/fee-records", { studentId: createForm.studentId, period: createForm.period, amount: Number(createForm.amount), dueDate: createForm.dueDate }, getToken);
    setCreating(false);
    if (result.ok) { toast("success", "Fee installment added"); setShowCreate(false); reload(); }
    else toast("error", (result as { error?: string }).error ?? "Failed to add fee record");
  }

  const filtered = filterStudentId ? (data ?? []).filter(f => f.studentId === filterStudentId) : (data ?? []);
  const overdueCnt = (data ?? []).filter(f => f.status === "overdue" || f.status === "due").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-navy)]">Fee Records</h2>
          {overdueCnt > 0 && <p className="text-xs text-red-500 mt-0.5">{overdueCnt} records need attention</p>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={reload} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[var(--color-navy)]"><RefreshCw size={14} /> Refresh</button>
          <button onClick={openCreate} className="btn-primary text-sm px-4 py-2 flex items-center gap-2"><Plus size={14} /> Add Fee Record</button>
        </div>
      </div>
      {students.length > 0 && (
        <div className="mb-4">
          <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 w-full max-w-xs" value={filterStudentId} onChange={e => setFilterStudentId(e.target.value)}>
            <option value="">All students</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.rollNumber} — {s.userName ?? "Unknown"}</option>)}
          </select>
        </div>
      )}
      {loading ? <SkeletonList rows={4} /> : (
        <div className="space-y-2">
          {filtered.map(f => (
            <div key={f.id} className="card border border-slate-200 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[var(--color-navy)] text-sm">{f.studentName ?? "Unknown"} — {f.period}</p>
                <p className="text-xs text-slate-500 mt-0.5">Roll: {f.rollNumber ?? "—"} · ₹{f.amount.toLocaleString("en-IN")} total · ₹{f.paidAmount.toLocaleString("en-IN")} paid · Outstanding: ₹{(f.amount - f.paidAmount).toLocaleString("en-IN")}</p>
                <p className="text-xs text-slate-400 mt-0.5">Due: {new Date(f.dueDate).toLocaleDateString("en-IN")}{f.paidDate ? ` · Paid: ${new Date(f.paidDate).toLocaleDateString("en-IN")}` : ""}{f.paymentMethod ? ` · ${f.paymentMethod}` : ""}{f.transactionRef ? ` · Ref: ${f.transactionRef}` : ""}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${FEE_COLORS[f.status] ?? "bg-slate-100 text-slate-600"}`}>{f.status}</span>
                <button onClick={() => openEdit(f)} className="text-slate-400 hover:text-[var(--color-navy)]"><Pencil size={14} /></button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-slate-400 text-sm">{filterStudentId ? "No records for this student." : "No fee records found."}</p>}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-bold text-[var(--color-navy)]">Add Fee Installment</h3>
              <button onClick={() => setShowCreate(false)}><X size={18} /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Student</label>
                <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={createForm.studentId} onChange={e => setCreateForm(f => ({ ...f, studentId: e.target.value }))}>
                  <option value="">Select student…</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.rollNumber} — {s.userName ?? "Unknown"}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Period (e.g. "Term 1 2025")</label>
                <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Term 1 2025" value={createForm.period} onChange={e => setCreateForm(f => ({ ...f, period: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Amount (₹)</label>
                  <input type="number" min="0" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="0" value={createForm.amount} onChange={e => setCreateForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Due Date</label>
                  <input type="date" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={createForm.dueDate} onChange={e => setCreateForm(f => ({ ...f, dueDate: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-5 pb-5">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
              <button onClick={create} disabled={creating || !createForm.studentId || !createForm.period || !createForm.amount || !createForm.dueDate} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">{creating ? "Adding…" : "Add Installment"}</button>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b"><h3 className="font-bold text-[var(--color-navy)]">Update Fee Record</h3><button onClick={() => setModal(null)}><X size={18} /></button></div>
            <div className="px-5 py-3 bg-slate-50 text-sm"><p className="font-medium text-[var(--color-navy)]">{modal.studentName} · {modal.period}</p><p className="text-xs text-slate-500">Total: ₹{modal.amount.toLocaleString("en-IN")} · Due: {new Date(modal.dueDate).toLocaleDateString("en-IN")}</p></div>
            <div className="px-5 py-4 space-y-3">
              <div><label className="block text-xs font-medium text-slate-600 mb-1">Status</label><select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>{FEE_STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
              <div><label className="block text-xs font-medium text-slate-600 mb-1">Amount Paid (₹)</label><input type="number" min="0" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.paidAmount} onChange={e => setForm(f => ({ ...f, paidAmount: e.target.value }))} /></div>
              <div><label className="block text-xs font-medium text-slate-600 mb-1">Date Paid</label><input type="date" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.paidDate} onChange={e => setForm(f => ({ ...f, paidDate: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-slate-600 mb-1">Payment Method</label><input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Cash / UPI / Bank" value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))} /></div>
                <div><label className="block text-xs font-medium text-slate-600 mb-1">Transaction Ref</label><input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.transactionRef} onChange={e => setForm(f => ({ ...f, transactionRef: e.target.value }))} /></div>
              </div>
              <div><label className="block text-xs font-medium text-slate-600 mb-1">Notes</label><textarea rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
            </div>
            <div className="flex justify-end gap-3 px-5 pb-5"><button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-slate-600">Cancel</button><button onClick={save} disabled={saving} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">{saving ? "Saving…" : "Save"}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Results / Toppers Section ─────────────────────────────────────────────────
type ResultRow = { id: string; studentName: string; examName: string; subject: string | null; marks: string | null; rank: string; college: string | null; batch: string | null; academicYear: string; quote: string | null; initials: string; isTopper: boolean | null };

function ResultsSection({ getToken }: { getToken: () => Promise<string | null> }) {
  const { data, loading, reload } = useFetch<ResultRow[]>("/admin/results", getToken);
  const [modal, setModal] = useState<{ mode: "create" | "edit"; item?: ResultRow } | null>(null);
  const [form, setForm] = useState({ studentName: "", examName: "JEE Advanced", subject: "", marks: "", rank: "", college: "", batch: "", academicYear: new Date().getFullYear().toString(), quote: "", initials: "", isTopper: false });
  const [saving, setSaving] = useState(false);

  function openCreate() { setForm({ studentName: "", examName: "JEE Advanced", subject: "", marks: "", rank: "", college: "", batch: "", academicYear: new Date().getFullYear().toString(), quote: "", initials: "", isTopper: false }); setModal({ mode: "create" }); }
  function openEdit(item: ResultRow) {
    setForm({ studentName: item.studentName, examName: item.examName, subject: item.subject ?? "", marks: item.marks ?? "", rank: item.rank, college: item.college ?? "", batch: item.batch ?? "", academicYear: item.academicYear, quote: item.quote ?? "", initials: item.initials, isTopper: item.isTopper ?? false });
    setModal({ mode: "edit", item });
  }

  async function save() {
    setSaving(true);
    const payload = { ...form, subject: form.subject || null, marks: form.marks || null, college: form.college || null, batch: form.batch || null, quote: form.quote || null };
    if (modal?.mode === "create") await apiCall("POST", "/admin/results", payload, getToken);
    else await apiCall("PATCH", `/admin/results/${modal?.item?.id}`, payload, getToken);
    setSaving(false); setModal(null); reload();
  }

  async function del(id: string) {
    if (!confirm("Delete this result?")) return;
    await apiCall("DELETE", `/admin/results/${id}`, null, getToken);
    reload();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[var(--color-navy)]">Toppers & Results</h2>
        <button onClick={openCreate} className="btn-primary text-sm px-4 py-2 flex items-center gap-2"><Plus size={14} /> Add Result</button>
      </div>
      {loading ? <SkeletonList rows={4} /> : (
        <div className="space-y-3">
          {(data ?? []).map(r => (
            <div key={r.id} className="card border border-slate-200 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm shrink-0">{r.initials}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-[var(--color-navy)] text-sm">{r.studentName}</p>
                  {r.isTopper && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">⭐ Topper</span>}
                </div>
                <p className="text-xs text-slate-500">{r.examName} {r.subject ? `· ${r.subject}` : ""} · Rank {r.rank} · {r.academicYear}</p>
                {r.college && <p className="text-xs text-slate-400 mt-0.5">{r.college}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(r)} className="text-slate-400 hover:text-[var(--color-navy)]"><Pencil size={14} /></button>
                <button onClick={() => del(r.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          {(data ?? []).length === 0 && <p className="text-slate-400 text-sm">No results added yet.</p>}
        </div>
      )}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b shrink-0"><h3 className="font-bold text-[var(--color-navy)]">{modal.mode === "create" ? "Add Result" : "Edit Result"}</h3><button onClick={() => setModal(null)}><X size={18} /></button></div>
            <div className="px-5 py-4 space-y-3 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-slate-600 mb-1">Student Name *</label><input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.studentName} onChange={e => setForm(f => ({ ...f, studentName: e.target.value }))} /></div>
                <div><label className="block text-xs font-medium text-slate-600 mb-1">Initials *</label><input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="A.K." value={form.initials} onChange={e => setForm(f => ({ ...f, initials: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-slate-600 mb-1">Exam *</label><input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.examName} onChange={e => setForm(f => ({ ...f, examName: e.target.value }))} /></div>
                <div><label className="block text-xs font-medium text-slate-600 mb-1">Rank *</label><input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="AIR 245" value={form.rank} onChange={e => setForm(f => ({ ...f, rank: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-slate-600 mb-1">Subject</label><input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Physics/Maths" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} /></div>
                <div><label className="block text-xs font-medium text-slate-600 mb-1">Marks</label><input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="310/360" value={form.marks} onChange={e => setForm(f => ({ ...f, marks: e.target.value }))} /></div>
              </div>
              <div><label className="block text-xs font-medium text-slate-600 mb-1">College / Institute</label><input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.college} onChange={e => setForm(f => ({ ...f, college: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-slate-600 mb-1">Academic Year *</label><input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="2024" value={form.academicYear} onChange={e => setForm(f => ({ ...f, academicYear: e.target.value }))} /></div>
                <div><label className="block text-xs font-medium text-slate-600 mb-1">Batch</label><input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.batch} onChange={e => setForm(f => ({ ...f, batch: e.target.value }))} /></div>
              </div>
              <div><label className="block text-xs font-medium text-slate-600 mb-1">Student Quote</label><textarea rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.quote} onChange={e => setForm(f => ({ ...f, quote: e.target.value }))} /></div>
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.isTopper} onChange={e => setForm(f => ({ ...f, isTopper: e.target.checked }))} className="rounded" /> Mark as Topper</label>
            </div>
            <div className="flex justify-end gap-3 px-5 pb-5 shrink-0"><button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-slate-600">Cancel</button><button onClick={save} disabled={saving || !form.studentName || !form.rank || !form.initials || !form.academicYear} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">{saving ? "Saving…" : "Save"}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mock Tests Section ────────────────────────────────────────────────────────
type MockTestRow = { id: string; title: string; subject: string; examType: string | null; durationMinutes: number; isPublished: boolean; isPublic: boolean; scheduledStart: string | null; scheduledEnd: string | null; createdAt: string; batchId: string | null; batchName: string | null };

function MockTestsSection({ getToken }: { getToken: () => Promise<string | null> }) {
  const { data, loading, reload } = useFetch<MockTestRow[]>("/admin/mock-tests", getToken);
  const [toggling, setToggling] = useState<string | null>(null);

  async function togglePublish(item: MockTestRow) {
    setToggling(item.id);
    await apiCall("PATCH", `/admin/mock-tests/${item.id}`, { isPublished: !item.isPublished, isPublic: item.isPublic }, getToken);
    setToggling(null); reload();
  }

  async function togglePublic(item: MockTestRow) {
    setToggling(item.id);
    await apiCall("PATCH", `/admin/mock-tests/${item.id}`, { isPublished: item.isPublished, isPublic: !item.isPublic }, getToken);
    setToggling(null); reload();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[var(--color-navy)]">Mock Tests</h2>
        <button onClick={reload} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[var(--color-navy)]"><RefreshCw size={14} /> Refresh</button>
      </div>
      <p className="text-sm text-slate-500 mb-4">Use this section to publish/unpublish tests. To create questions, use the full mock test builder.</p>
      {loading ? <SkeletonList rows={4} /> : (
        <div className="space-y-3">
          {(data ?? []).map(t => (
            <div key={t.id} className="card border border-slate-200 flex items-start gap-3">
              <div className="flex-1">
                <p className="font-semibold text-[var(--color-navy)] text-sm">{t.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{t.subject} · {t.examType ?? "Mixed"} · {t.durationMinutes} min{t.batchName ? ` · ${t.batchName}` : ""}</p>
                {t.scheduledStart && <p className="text-xs text-slate-400 mt-0.5">Scheduled: {new Date(t.scheduledStart).toLocaleString("en-IN")}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => togglePublish(t)} disabled={toggling === t.id} className={`text-xs px-2 py-1 rounded-lg font-medium transition-colors ${t.isPublished ? "bg-green-100 text-green-700 hover:bg-red-50 hover:text-red-600" : "bg-slate-100 text-slate-600 hover:bg-green-50 hover:text-green-700"}`}>
                  {t.isPublished ? "Published" : "Draft"}
                </button>
                <button onClick={() => togglePublic(t)} disabled={toggling === t.id} className={`text-xs px-2 py-1 rounded-lg font-medium transition-colors ${t.isPublic ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                  {t.isPublic ? "Public" : "Batch only"}
                </button>
              </div>
            </div>
          ))}
          {(data ?? []).length === 0 && <p className="text-slate-400 text-sm">No mock tests created yet.</p>}
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
  const [visited, setVisited] = useState<Set<Section>>(() => new Set<Section>(["overview"]));
  const [qbPendingCount, setQbPendingCount] = useState(0);
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") setSidebarOpen(false); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/v1/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.ok) {
          setQbPendingCount(json.data.pendingQBReviewCount ?? 0);
          setPendingApprovalCount(json.data.pendingApprovalCount ?? 0);
        }
      } catch { /* best-effort */ }
    })();
  }, [getToken]);

  const tokenFn = useCallback(() => getToken(), [getToken]);

  const sectionComponents: Record<Section, React.ReactElement> = {
    overview: <OverviewSection getToken={tokenFn} />,
    students: <StudentsSection getToken={tokenFn} />,
    teachers: <TeachersSection getToken={tokenFn} />,
    attendance: <AdminAttendance getToken={tokenFn} />,
    doubts: <AdminDoubts getToken={tokenFn} />,
    users: <AdminUsers getToken={tokenFn} />,
    courses: <CoursesSection getToken={tokenFn} />,
    batches: <BatchesSection getToken={tokenFn} />,
    timetable: <AdminSchedules getToken={tokenFn} />,
    assignments: <AdminAssignments getToken={tokenFn} />,
    "study-materials": <AdminStudyMaterials getToken={tokenFn} />,
    "live-classes": <AdminLiveClasses getToken={tokenFn} />,
    recordings: <AdminRecordingsSection getToken={tokenFn} />,
    "mock-tests": <MockTestsSection getToken={tokenFn} />,
    "question-bank": <AdminQuestionBank getToken={tokenFn} onReviewComplete={() => {
      (async () => {
        try {
          const token = await tokenFn();
          const res = await fetch(`${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/v1/admin/stats`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const json = await res.json();
          if (json.ok) setQbPendingCount(json.data.pendingQBReviewCount ?? 0);
        } catch { /* best-effort */ }
      })();
    }} />,
    "practice-sets": <AdminPracticeSets getToken={tokenFn} />,
    fees: <FeesSection getToken={tokenFn} />,
    results: <ResultsSection getToken={tokenFn} />,
    notices: <NoticesSection getToken={tokenFn} />,
    blog: <BlogSection getToken={tokenFn} />,
    gallery: <GallerySection getToken={tokenFn} />,
    promotions: <AdminPromotions getToken={tokenFn} />,
    enquiries: <EnquiriesSection getToken={tokenFn} />,
    "site-settings": <AdminSiteSettings getToken={tokenFn} />,
    seo: <AdminSEO getToken={tokenFn} />,
    watermarks: <AdminWatermarks getToken={tokenFn} />,
    "ga4-setup": <AdminGA4Setup getToken={tokenFn} />,
    analytics: <AdminAnalytics getToken={tokenFn} />,
    security: <AdminSecurity getToken={tokenFn} />,
  };

  return (
    <ToastProvider>
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
        <nav className="flex-1 py-3 px-2 overflow-y-auto">
          {(() => {
            const items: React.ReactNode[] = [];
            let lastGroup: string | undefined = undefined;
            NAV.forEach(({ key, label, Icon, group }) => {
              if (group !== lastGroup) {
                if (group) {
                  items.push(
                    <p key={`g-${group}`} className="text-white/30 text-[10px] font-semibold uppercase tracking-wider px-3 pt-3 pb-1">{group}</p>
                  );
                }
                lastGroup = group;
              }
              items.push(
                <button key={key} onClick={() => { setSection(key); setVisited(v => new Set([...v, key])); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${section === key ? "bg-white/15 text-white" : "text-white/60 hover:text-white hover:bg-white/10"}`}>
                  <Icon size={15} />
                  <span className="flex-1 text-left">{label}</span>
                  {key === "question-bank" && qbPendingCount > 0 && (
                    <span className="text-[10px] bg-orange-500 text-white rounded-full px-1.5 py-0.5 leading-none font-semibold">{qbPendingCount}</span>
                  )}
                  {key === "users" && pendingApprovalCount > 0 && (
                    <span className="text-[10px] bg-red-500 text-white rounded-full px-1.5 py-0.5 leading-none font-semibold">{pendingApprovalCount}</span>
                  )}
                </button>
              );
            });
            return items;
          })()}
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
          {(Object.keys(sectionComponents) as Section[]).map(key =>
            visited.has(key) ? (
              <div key={key} className={key === section ? "block" : "hidden"}>
                {sectionComponents[key]}
              </div>
            ) : null
          )}
        </div>
      </div>
    </div>
    </ToastProvider>
  );
}

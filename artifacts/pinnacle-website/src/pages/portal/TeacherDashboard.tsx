import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth, useUser, useClerk } from "@clerk/react";
import { LayoutDashboard, Bell, Calendar, Users, LogOut, Menu, AlertCircle, AlertTriangle, Share2, Send, Check, X, Clock, XCircle, CheckCircle, Link2, Upload } from "lucide-react";
import { useFetch, useToast, ToastProvider } from "./portalUtils";

type Section = "overview" | "schedule" | "batches" | "notices" | "social-posts";
const NAV: { key: Section; label: string; Icon: React.ElementType }[] = [
  { key: "overview", label: "Overview", Icon: LayoutDashboard },
  { key: "schedule", label: "My Schedule", Icon: Calendar },
  { key: "batches", label: "My Batches", Icon: Users },
  { key: "notices", label: "Notices", Icon: Bell },
  { key: "social-posts", label: "Social Posts", Icon: Share2 },
];

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
type ScheduleRow = { id: string; subject: string; topic: string | null; dayOfWeek: number; startTime: string; endTime: string; room: string | null; batchName: string | null };
type BatchRow = { id: string; name: string; timingLabel: string; daysLabel: string; status: string; maxStudents: number | null; courseName: string | null };
type Notice = { id: string; title: string; body: string; category: string; publishedAt: string };

const CAT_COLOR: Record<string, string> = {
  Academic: "bg-blue-100 text-blue-700", Test: "bg-purple-100 text-purple-700",
  Fee: "bg-red-100 text-red-700", Event: "bg-green-100 text-green-700",
  General: "bg-slate-100 text-slate-600",
};
const STATUS_COLOR: Record<string, string> = {
  active: "bg-green-100 text-green-700", upcoming: "bg-blue-100 text-blue-700",
  full: "bg-orange-100 text-orange-700", completed: "bg-slate-100 text-slate-500",
};

function NoProfile() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4"><AlertCircle size={28} /></div>
      <h2 className="text-xl font-bold text-[var(--color-navy)] mb-2">Teacher Profile Not Linked</h2>
      <p className="text-slate-500 text-sm max-w-sm">
        Your teacher profile hasn't been set up yet. Contact the admin at{" "}
        <a href="tel:+919971862138" className="text-[var(--color-teal)] font-semibold">+91 99718 62138</a>.
      </p>
    </div>
  );
}

type RejectionSummary = { count: number; posts: { id: string; content: string; rejectionNote: string | null; createdAt: string }[] };

function Overview({ teacher, getToken, rejections, onGoToSocial }: {
  teacher: TeacherInfo; getToken: () => Promise<string | null>;
  rejections: RejectionSummary | null;
  onGoToSocial: () => void;
}) {
  const { data: schedData } = useFetch<{ data: ScheduleRow[] }>("/portal/teacher/schedule", getToken);
  const { data: batchData } = useFetch<{ data: BatchRow[] }>("/portal/teacher/batches", getToken);
  const today = new Date().getDay();
  const todaySchedule = (schedData?.data ?? []).filter(s => s.dayOfWeek === today).sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div>
      {/* Rejection notification — shown immediately on overview before teacher navigates to Social Posts */}
      {rejections && rejections.count > 0 && (
        <div className="mb-5 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <XCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-red-700 text-sm">
              {rejections.count} social post{rejections.count > 1 ? "s" : ""} rejected by admin
            </p>
            {rejections.posts[0]?.rejectionNote && (
              <p className="text-xs text-red-600 mt-0.5 line-clamp-2">
                &ldquo;{rejections.posts[0].rejectionNote}&rdquo;
              </p>
            )}
            <button onClick={onGoToSocial}
              className="mt-2 text-xs font-medium text-red-700 underline hover:text-red-900 transition-colors">
              Review in Social Posts →
            </button>
          </div>
        </div>
      )}
      <div className="card border border-slate-200 mb-6 bg-gradient-to-br from-[#4b0082] to-[#7c3aed] text-white">
        <p className="text-white/60 text-sm mb-1">Welcome back</p>
        <h2 className="text-2xl font-bold font-[family-name:var(--font-playfair)]">{teacher.name}</h2>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <span className="bg-white/10 rounded-full px-3 py-1">🎓 {teacher.designation}</span>
          {teacher.qualification && <span className="bg-white/10 rounded-full px-3 py-1">📚 {teacher.qualification}</span>}
          {teacher.experienceYears && <span className="bg-white/10 rounded-full px-3 py-1">⏱ {teacher.experienceYears}y experience</span>}
        </div>
        {(teacher.subjects ?? []).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {teacher.subjects!.map(s => <span key={s} className="text-xs bg-white/10 rounded px-2 py-0.5">{s}</span>)}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card border border-slate-200 text-center">
          <p className="text-3xl font-bold text-[var(--color-navy)]">{batchData?.data?.length ?? "—"}</p>
          <p className="text-xs text-slate-500 mt-1">My Batches</p>
        </div>
        <div className="card border border-slate-200 text-center">
          <p className="text-3xl font-bold text-[var(--color-navy)]">{todaySchedule.length}</p>
          <p className="text-xs text-slate-500 mt-1">Classes Today</p>
        </div>
      </div>
      {todaySchedule.length > 0 && (
        <div className="card border border-slate-200">
          <p className="font-semibold text-[var(--color-navy)] text-sm mb-3">Today's Classes ({DAYS[today]})</p>
          <div className="space-y-2">
            {todaySchedule.map(s => (
              <div key={s.id} className="flex items-center gap-3 text-sm">
                <span className="text-purple-600 font-mono text-xs w-20 shrink-0">{s.startTime}–{s.endTime}</span>
                <span className="font-medium text-[var(--color-navy)]">{s.subject}</span>
                <span className="text-slate-400 text-xs">{s.batchName ?? ""}{s.room ? ` · Room ${s.room}` : ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type TeacherInfo = { name: string; designation: string; qualification: string | null; subjects: string[] | null; experienceYears: number | null };

function ScheduleSection({ getToken }: { getToken: () => Promise<string | null> }) {
  const { data, loading } = useFetch<{ data: ScheduleRow[] }>("/portal/teacher/schedule", getToken);
  if (loading) return <div className="text-slate-400 text-sm">Loading…</div>;
  const byDay = DAYS.map((day, idx) => ({
    day, rows: (data?.data ?? []).filter(s => s.dayOfWeek === idx).sort((a, b) => a.startTime.localeCompare(b.startTime)),
  })).filter(d => d.rows.length > 0);
  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-navy)] mb-5">Weekly Schedule</h2>
      {byDay.length === 0 && <p className="text-slate-400 text-sm">No schedule assigned yet.</p>}
      <div className="space-y-4">
        {byDay.map(({ day, rows }) => (
          <div key={day} className="card border border-slate-200">
            <p className="font-semibold text-[var(--color-navy)] text-sm mb-3">{day}</p>
            <div className="space-y-2">
              {rows.map(s => (
                <div key={s.id} className="flex items-center gap-3 text-sm bg-purple-50 rounded-lg px-3 py-2">
                  <span className="text-purple-600 font-mono text-xs w-20 shrink-0">{s.startTime}–{s.endTime}</span>
                  <div className="flex-1">
                    <span className="font-medium text-[var(--color-navy)]">{s.subject}</span>
                    {s.topic && <span className="text-slate-500 text-xs ml-2">({s.topic})</span>}
                  </div>
                  <div className="text-right shrink-0">
                    {s.batchName && <p className="text-xs text-slate-500">{s.batchName}</p>}
                    {s.room && <p className="text-xs text-slate-400">Room {s.room}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BatchesSection({ getToken }: { getToken: () => Promise<string | null> }) {
  const { data, loading } = useFetch<{ data: BatchRow[] }>("/portal/teacher/batches", getToken);
  if (loading) return <div className="text-slate-400 text-sm">Loading…</div>;
  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-navy)] mb-5">My Batches</h2>
      <div className="space-y-3">
        {(data?.data ?? []).map(b => (
          <div key={b.id} className="card border border-slate-200">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-[var(--color-navy)] text-sm">{b.name}</p>
                {b.courseName && <p className="text-xs text-slate-500 mt-0.5">{b.courseName}</p>}
                <p className="text-xs text-slate-400 mt-0.5">{b.timingLabel} · {b.daysLabel}</p>
                {b.maxStudents && <p className="text-xs text-slate-400 mt-0.5">Max {b.maxStudents} students</p>}
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[b.status] ?? "bg-slate-100 text-slate-500"}`}>{b.status}</span>
            </div>
          </div>
        ))}
        {(data?.data ?? []).length === 0 && <p className="text-slate-400 text-sm">No batches assigned yet.</p>}
      </div>
    </div>
  );
}

function NoticesSection({ getToken }: { getToken: () => Promise<string | null> }) {
  const { data, loading } = useFetch<{ data: Notice[] }>("/portal/teacher/notices", getToken);
  if (loading) return <div className="text-slate-400 text-sm">Loading…</div>;
  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-navy)] mb-5">Notices</h2>
      <div className="space-y-3">
        {(data?.data ?? []).map(n => (
          <div key={n.id} className="card border border-slate-200">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CAT_COLOR[n.category] ?? "bg-slate-100 text-slate-600"}`}>{n.category}</span>
              <span className="text-xs text-slate-400">{new Date(n.publishedAt).toLocaleDateString("en-IN")}</span>
            </div>
            <p className="font-semibold text-[var(--color-navy)] text-sm">{n.title}</p>
            <p className="text-slate-500 text-sm mt-1">{n.body}</p>
          </div>
        ))}
        {(data?.data ?? []).length === 0 && <p className="text-slate-400 text-sm">No notices at this time.</p>}
      </div>
    </div>
  );
}

const PLATFORM_LABELS: Record<string, string> = {
  facebook: "📘 Facebook",
  instagram: "📷 Instagram",
  twitter: "🐦 Twitter/X",
  linkedin: "💼 LinkedIn",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; Icon: React.ElementType }> = {
  pending:   { label: "Pending Approval", color: "text-amber-600 bg-amber-50 border-amber-200",   Icon: Clock },
  approved:  { label: "Approved",         color: "text-blue-600 bg-blue-50 border-blue-200",      Icon: CheckCircle },
  rejected:  { label: "Rejected",         color: "text-red-600 bg-red-50 border-red-200",         Icon: XCircle },
  scheduled: { label: "Scheduled",        color: "text-purple-600 bg-purple-50 border-purple-200", Icon: Clock },
  published: { label: "Published",        color: "text-green-600 bg-green-50 border-green-200",   Icon: CheckCircle },
};

type SocialAccess = { isEnabled: boolean; platformsAllowed: string[]; connectedPlatforms: string[] };
type SocialPost = {
  id: string; content: string; mediaUrls: string[]; platformTargets: string[];
  status: string; scheduledAt: string | null; publishedAt: string | null;
  postedByName: string; rejectionNote: string | null; createdAt: string;
};

type LinkItem = { id: string; title: string };

function TeacherSocialSection({ getToken }: { getToken: () => Promise<string | null> }) {
  const { addToast } = useToast();
  const { data: accessData, loading: accessLoading } = useFetch<{ ok: boolean; data: SocialAccess }>("/portal/teacher/social/access", getToken);
  const { data: postsData, loading: postsLoading, reload: refetchPosts } = useFetch<{ ok: boolean; data: SocialPost[] }>("/portal/teacher/social/posts", getToken);
  const { data: noticesData } = useFetch<{ ok: boolean; data: LinkItem[] }>("/portal/teacher/notices", getToken);
  const { data: blogPostsData } = useFetch<{ ok: boolean; data: LinkItem[] }>("/portal/teacher/social/blog-posts", getToken);

  const access = accessData?.data;
  const posts = postsData?.data ?? [];
  const noticeOptions = noticesData?.data ?? [];
  const blogOptions = blogPostsData?.data ?? [];

  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [mediaUrlInput, setMediaUrlInput] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [linkedNoticeId, setLinkedNoticeId] = useState("");
  const [linkedBlogId, setLinkedBlogId] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"compose" | "history">("compose");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedPlatforms = access?.platformsAllowed ?? [];
  const connectedPlatforms = new Set(access?.connectedPlatforms ?? []);
  // Only platforms that are both allowed AND connected can actually be submitted.
  const selectablePlatforms = allowedPlatforms.filter(p => connectedPlatforms.has(p));
  const disconnectedAllowed = allowedPlatforms.filter(p => !connectedPlatforms.has(p));

  function togglePlatform(p: string) {
    setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  }

  function addMediaUrl() {
    const url = mediaUrlInput.trim();
    if (!url) return;
    try { new URL(url); } catch { addToast("Enter a valid URL", "error"); return; }
    if (mediaUrls.includes(url)) return;
    setMediaUrls(prev => [...prev, url]);
    setMediaUrlInput("");
  }

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const token = await getToken();
      const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${BASE}/api/v1/portal/teacher/social/media-upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Upload failed");
      setMediaUrls(prev => [...prev, json.url]);
      addToast("File uploaded", "success");
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  }

  async function submitPost() {
    if (!content.trim()) { addToast("Post content is required", "error"); return; }
    if (!selectedPlatforms.length) { addToast("Select at least one platform", "error"); return; }
    setSaving(true);
    try {
      const token = await getToken();
      const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${BASE}/api/v1/portal/teacher/social/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
        content: content.trim(), platformTargets: selectedPlatforms, mediaUrls,
        linkedNoticeId: linkedNoticeId || undefined, linkedBlogId: linkedBlogId || undefined,
      }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Failed");
      addToast("Post submitted for admin approval", "success");
      setContent(""); setSelectedPlatforms([]); setMediaUrls([]); setMediaUrlInput("");
      setLinkedNoticeId(""); setLinkedBlogId("");
      refetchPosts();
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed to submit", "error");
    } finally {
      setSaving(false);
    }
  }

  if (accessLoading) return <div className="py-12 text-center text-slate-500 text-sm">Loading social access…</div>;

  if (!access?.isEnabled) {
    return (
      <div className="text-center py-16">
        <Share2 size={40} className="mx-auto mb-4 text-slate-300" />
        <p className="font-semibold text-slate-700 mb-2">Social media access not enabled</p>
        <p className="text-sm text-slate-500">Ask your admin to enable social media posting for your account.</p>
      </div>
    );
  }

  const rejectedPosts = posts.filter(p => p.status === "rejected");

  return (
    <div>
      {rejectedPosts.length > 0 && (
        <div className="mb-4 flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <XCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
          <div>
            <p className="font-semibold">{rejectedPosts.length} post{rejectedPosts.length > 1 ? "s" : ""} rejected by admin</p>
            {rejectedPosts[0].rejectionNote && (
              <p className="text-xs mt-0.5 text-red-600">Latest: &ldquo;{rejectedPosts[0].rejectionNote}&rdquo;</p>
            )}
            <button onClick={() => setActiveTab("history")} className="text-xs mt-1 underline text-red-600 hover:text-red-800">
              View History →
            </button>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Social Posts</h2>
          <p className="text-sm text-slate-500 mt-0.5">Submit posts for admin approval before they go live.</p>
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {(["compose", "history"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${activeTab === tab ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"}`}>
              {tab === "compose" ? "Compose" : `History (${posts.length})`}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "compose" && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 max-w-2xl">
          {/* Platform selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Post to *</label>
            <div className="flex flex-wrap gap-2">
              {selectablePlatforms.map(p => {
                const isSelected = selectedPlatforms.includes(p);
                return (
                  <button key={p} onClick={() => togglePlatform(p)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${isSelected ? "border-purple-400 bg-purple-50 text-purple-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                    {PLATFORM_LABELS[p] ?? p}
                    {isSelected && <Check size={11} />}
                  </button>
                );
              })}
              {disconnectedAllowed.map(p => (
                <span key={p} title="Admin has not connected this platform yet"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed opacity-60">
                  {PLATFORM_LABELS[p] ?? p}
                  <span className="text-[10px]">(not connected)</span>
                </span>
              ))}
            </div>
            {disconnectedAllowed.length > 0 && (
              <p className="text-xs text-amber-600 mt-1.5">
                Some platforms are not yet connected by your admin and cannot be selected.
              </p>
            )}
            {selectedPlatforms.includes("instagram") && mediaUrls.length === 0 && (
              <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                <AlertTriangle size={13} className="shrink-0 text-amber-500" />
                Instagram requires at least one image or video — add media below or deselect Instagram.
              </div>
            )}
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Post Content *</label>
            <textarea rows={5}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:ring-1 focus:ring-purple-400 focus:border-purple-400 outline-none"
              placeholder="Write your post…"
              value={content} onChange={e => setContent(e.target.value)} />
            <p className="text-xs text-slate-400 mt-1">{content.length} characters</p>
          </div>

          {/* Media — upload or paste URL */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
              <Link2 size={13} /> Media (optional)
            </label>
            <div className="flex gap-2 mb-2">
              <input className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-purple-400 focus:border-purple-400 outline-none"
                placeholder="Paste an image or video URL…"
                value={mediaUrlInput} onChange={e => setMediaUrlInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addMediaUrl(); } }} />
              <button onClick={addMediaUrl} type="button"
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">Add</button>
            </div>
            <div>
              <input ref={fileInputRef} type="file" accept="image/*,video/mp4,video/quicktime" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ""; }} />
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-dashed border-slate-300 text-slate-500 hover:border-purple-400 hover:text-purple-600 transition-colors disabled:opacity-50">
                <Upload size={12} /> {uploading ? "Uploading…" : "Upload from device"}
              </button>
            </div>
            {mediaUrls.length > 0 && (
              <ul className="mt-2 space-y-1">
                {mediaUrls.map((url, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-1.5">
                    <span className="flex-1 truncate">{url}</span>
                    <button onClick={() => setMediaUrls(prev => prev.filter((_, j) => j !== i))}
                      className="text-slate-400 hover:text-red-500 transition-colors"><X size={12} /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Link to notice or blog post (optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Link Notice (optional)</label>
              <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-purple-400 focus:border-purple-400 outline-none bg-white"
                value={linkedNoticeId} onChange={e => setLinkedNoticeId(e.target.value)}>
                <option value="">— None —</option>
                {noticeOptions.map(n => <option key={n.id} value={n.id}>{n.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Link Blog Post (optional)</label>
              <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-purple-400 focus:border-purple-400 outline-none bg-white"
                value={linkedBlogId} onChange={e => setLinkedBlogId(e.target.value)}>
                <option value="">— None —</option>
                {blogOptions.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button onClick={submitPost}
              disabled={saving || !content.trim() || !selectedPlatforms.length || (selectedPlatforms.includes("instagram") && mediaUrls.length === 0)}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-purple-700 text-white text-sm font-medium hover:bg-purple-800 transition-colors disabled:opacity-50">
              <Send size={14} /> {saving ? "Submitting…" : "Submit for Approval"}
            </button>
            <p className="text-xs text-slate-400 mt-2">Your post will be reviewed by an admin before publishing.</p>
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div>
          {postsLoading ? (
            <div className="py-8 text-center text-slate-400 text-sm">Loading…</div>
          ) : posts.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">No posts yet. Compose your first post above.</div>
          ) : (
            <div className="space-y-3">
              {posts.map(post => {
                const statusConf = STATUS_CONFIG[post.status] ?? STATUS_CONFIG.pending;
                const StatusIcon = statusConf.Icon;
                return (
                  <div key={post.id} className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="text-sm text-slate-800 whitespace-pre-line line-clamp-3 flex-1">{post.content}</p>
                      <span className={`shrink-0 flex items-center gap-1 text-xs font-medium border rounded-full px-2 py-0.5 ${statusConf.color}`}>
                        <StatusIcon size={11} /> {statusConf.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {post.platformTargets.map(p => (
                        <span key={p} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{PLATFORM_LABELS[p] ?? p}</span>
                      ))}
                      {post.mediaUrls?.length > 0 && (
                        <span className="text-xs text-slate-400 flex items-center gap-0.5"><Link2 size={10} /> {post.mediaUrls.length} media</span>
                      )}
                      <span className="text-xs text-slate-400 ml-auto">{new Date(post.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                    {post.status === "rejected" && post.rejectionNote && (
                      <p className="mt-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-1.5">
                        <strong>Reason:</strong> {post.rejectionNote}
                      </p>
                    )}
                    {post.status === "published" && post.publishedAt && (
                      <p className="mt-2 text-xs text-green-600">Published {new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TeacherDashboard() {
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const [section, setSection] = useState<Section>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const tokenFn = useCallback(() => getToken(), [getToken]);
  const { data: meData } = useFetch<{ data: { user: { name: string }; roleRecord: TeacherInfo | null } | null }>("/portal/me", tokenFn);
  const teacher = meData?.data?.roleRecord;

  // Fetch unread rejected posts at root level so the badge and Overview alert
  // are visible regardless of which section the teacher is currently viewing.
  const { data: rejectionsData, reload: reloadRejections } = useFetch<{ ok: boolean; data: RejectionSummary }>("/portal/teacher/social/unread-rejections", tokenFn);
  const rejections = rejectionsData?.data ?? null;
  const rejectionCount = rejections?.count ?? 0;

  // When teacher opens the social-posts section, mark all unread rejections as seen
  // so the badge clears and the notifications are acknowledged.
  useEffect(() => {
    if (section === "social-posts" && rejectionCount > 0) {
      getToken().then(token => {
        if (!token) return;
        const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
        fetch(`${base}/api/v1/portal/teacher/social/rejections/mark-seen`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        }).then(() => reloadRejections()).catch(() => { /* non-critical */ });
      });
    }
  }, [section, rejectionCount]);

  function goToSocial() { setSection("social-posts"); setSidebarOpen(false); }

  return (
    <ToastProvider>
    <div className="min-h-[calc(100vh-4rem)] flex bg-[var(--color-slate-light)]">
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 bg-[#4b0082] flex flex-col transition-transform duration-300 top-0 lg:static lg:translate-x-0 lg:z-auto ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center text-white font-bold text-sm">T</div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Teacher Portal</p>
              <p className="text-white/40 text-xs truncate max-w-[120px]">{clerkUser?.firstName ?? "Teacher"}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-4 space-y-0.5 px-2">
          {NAV.map(({ key, label, Icon }) => (
            <button key={key} onClick={() => { setSection(key); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${section === key ? "bg-white/15 text-white" : "text-white/60 hover:text-white hover:bg-white/10"}`}>
              <Icon size={16} />
              <span className="flex-1 text-left">{label}</span>
              {/* Badge — shows count of rejected social posts directly on nav item */}
              {key === "social-posts" && rejectionCount > 0 && (
                <span className="min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full bg-red-500 text-white px-1">
                  {rejectionCount}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="px-2 pb-4">
          <button onClick={() => signOut()} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <div className="flex-1 min-w-0">
        <div className="lg:hidden flex items-center gap-3 bg-[#4b0082] px-4 py-3">
          <button onClick={() => setSidebarOpen(true)} className="text-white"><Menu size={20} /></button>
          <p className="text-white font-semibold text-sm">{NAV.find(n => n.key === section)?.label}</p>
          {rejectionCount > 0 && (
            <span className="ml-auto min-w-[20px] h-5 flex items-center justify-center text-[10px] font-bold rounded-full bg-red-500 text-white px-1">
              {rejectionCount}
            </span>
          )}
        </div>
        <div className="p-6 max-w-4xl">
          {!teacher && section === "overview" ? <NoProfile /> : (
            <>
              {section === "overview" && teacher && (
                <Overview
                  teacher={{ ...teacher, name: meData?.data?.user.name ?? "" }}
                  getToken={tokenFn}
                  rejections={rejections}
                  onGoToSocial={goToSocial}
                />
              )}
              {section === "schedule" && <ScheduleSection getToken={tokenFn} />}
              {section === "batches" && <BatchesSection getToken={tokenFn} />}
              {section === "notices" && <NoticesSection getToken={tokenFn} />}
              {section === "social-posts" && <TeacherSocialSection getToken={tokenFn} />}
            </>
          )}
        </div>
      </div>
    </div>
    </ToastProvider>
  );
}

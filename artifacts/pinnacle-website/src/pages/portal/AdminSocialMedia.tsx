import { useState, useCallback, useEffect, useRef } from "react";
import {
  Share2, Plus, X, Check, AlertTriangle, RefreshCw,
  Clock, CheckCircle, XCircle, Send, Link2, Calendar, CalendarClock,
  Trash2, Wifi, WifiOff, Settings, Users, FileText,
  ChevronDown, ExternalLink, Eye, Image as ImageIcon, Upload,
} from "lucide-react";
import { SkeletonList, useToast } from "./portalUtils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type GetToken = () => Promise<string | null>;

async function apiFetch(path: string, getToken: GetToken, opts?: RequestInit) {
  const token = await getToken();
  const res = await fetch(`${BASE}/api/v1${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(opts?.headers ?? {}),
    },
  });
  return res.json();
}

// ── Platform Config ──────────────────────────────────────────────────────────

const PLATFORMS = [
  {
    id: "facebook",
    label: "Facebook",
    color: "#1877F2",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    emoji: "📘",
    tokenLabel: "Page Access Token",
    hint: "Create a Facebook App at developers.facebook.com, add the Pages API product, and generate a long-lived Page Access Token with pages_manage_posts and pages_read_engagement permissions.",
    docsUrl: "https://developers.facebook.com/docs/pages-api",
    pageIdLabel: "Page ID",
    pageIdHint: "The numeric ID of your Facebook Page (visible in Page Settings → General)",
  },
  {
    id: "instagram",
    label: "Instagram",
    color: "#E1306C",
    bg: "bg-pink-50",
    border: "border-pink-200",
    text: "text-pink-700",
    emoji: "📸",
    tokenLabel: "Graph API Access Token",
    hint: "Instagram posting uses the Facebook Graph API. Set up a Facebook Business App, connect your Instagram Professional Account, and generate a token with instagram_basic and instagram_content_publish permissions.",
    docsUrl: "https://developers.facebook.com/docs/instagram-api",
    pageIdLabel: "Instagram Business Account ID",
    pageIdHint: "The numeric ID of your Instagram Business Account (found via Graph API Explorer)",
  },
  {
    id: "twitter",
    label: "Twitter / X",
    color: "#000000",
    bg: "bg-slate-50",
    border: "border-slate-200",
    text: "text-slate-700",
    emoji: "🐦",
    tokenLabel: "OAuth 2.0 Access Token",
    hint: "Register an app at developer.twitter.com (Essential access or higher), enable 'Read and Write' permissions, and generate a user OAuth 2.0 token using the OAuth 2.0 PKCE flow.",
    docsUrl: "https://developer.twitter.com/en/docs/twitter-api",
    pageIdLabel: "Twitter App Client ID",
    pageIdHint: "Your Twitter Developer App Client ID (from the Developer Portal dashboard)",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    color: "#0A66C2",
    bg: "bg-sky-50",
    border: "border-sky-200",
    text: "text-sky-700",
    emoji: "💼",
    tokenLabel: "OAuth 2.0 Access Token",
    hint: "Create an app at linkedin.com/developers, request the 'Share on LinkedIn' and 'Sign In with LinkedIn' products, then generate a user access token with r_liteprofile and w_member_social scopes.",
    docsUrl: "https://learn.microsoft.com/en-us/linkedin/marketing/",
    pageIdLabel: "Organization ID (optional)",
    pageIdHint: "To post as a company page, enter the LinkedIn Organization URN numeric ID",
  },
];

const POST_STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-teal-100 text-teal-700",
  rejected: "bg-red-100 text-red-600",
  published: "bg-green-100 text-green-700",
  scheduled: "bg-blue-100 text-blue-700",
  failed: "bg-red-100 text-red-600",
};

// ── Types ────────────────────────────────────────────────────────────────────

type SocialAccount = {
  id: string; platform: string; accountName: string; accountId: string | null;
  pageId: string | null; status: string; connectedBy: string | null; connectedAt: string | null;
  tokenExpiresAt: string | null; createdAt: string; updatedAt: string;
};
type SocialPost = {
  id: string; content: string; mediaUrls: string[]; platformTargets: string[];
  status: string; scheduledAt: string | null; publishedAt: string | null;
  postedByName: string | null; rejectionNote: string | null;
  publishedUrls: Record<string, string>; errorMessage: string | null;
  createdAt: string; updatedAt: string;
};
type TeacherAccess = {
  id: string | null; userId: string; userName: string; userEmail: string;
  platformsAllowed: string[]; isEnabled: boolean;
};
type TeacherUser = { id: string; name: string; email: string };

// ── Accounts Tab ─────────────────────────────────────────────────────────────

function AccountsTab({ getToken, accounts, reload }: {
  getToken: GetToken;
  accounts: SocialAccount[];
  reload: () => void;
}) {
  const { addToast } = useToast();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [form, setForm] = useState({ accountName: "", accessToken: "", refreshToken: "", tokenExpiresAt: "", pageId: "", accountId: "" });
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const platformAccount = (pid: string) => accounts.find(a => a.platform === pid);

  async function connect(platformId: string) {
    if (!form.accountName || !form.accessToken) {
      addToast("Account name and access token are required", "error"); return;
    }
    setSaving(true);
    try {
      const json = await apiFetch("/admin/social/accounts", getToken, {
        method: "POST",
        body: JSON.stringify({
          platform: platformId, accountName: form.accountName,
          accessToken: form.accessToken, refreshToken: form.refreshToken || undefined,
          tokenExpiresAt: form.tokenExpiresAt || undefined,
          pageId: form.pageId || undefined, accountId: form.accountId || undefined,
        }),
      });
      if (!json.ok) throw new Error(json.error ?? "Failed");
      addToast(`${PLATFORMS.find(p => p.id === platformId)?.label} connected`, "success");
      setConnecting(null);
      setForm({ accountName: "", accessToken: "", refreshToken: "", tokenExpiresAt: "", pageId: "", accountId: "" });
      reload();
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Connection failed", "error");
    } finally {
      setSaving(false);
    }
  }

  async function connectViaOAuth(platformId: string) {
    try {
      const json = await apiFetch(`/admin/social/oauth/initiate/${platformId}`, getToken);
      if (!json.ok) { addToast(json.error ?? "OAuth not configured — use manual token entry", "error"); return; }
      const popup = window.open(json.url, "social_oauth", "width=600,height=700,scrollbars=yes");
      if (!popup) { addToast("Popup blocked — please allow popups for this site", "error"); return; }
      function onMessage(e: MessageEvent) {
        // Reject messages from unexpected origins to prevent injection
        if (e.origin !== window.location.origin) return;
        if (e.data?.type === "social_oauth_success") {
          addToast(`${PLATFORMS.find(p => p.id === e.data.platform)?.label} connected via OAuth`, "success");
          setConnecting(null);
          reload();
          window.removeEventListener("message", onMessage);
        } else if (e.data?.type === "social_oauth_error") {
          addToast(e.data.error ?? "OAuth failed", "error");
          window.removeEventListener("message", onMessage);
        }
      }
      window.addEventListener("message", onMessage);
      // Clean up listener if popup is closed without messaging
      const poll = setInterval(() => {
        if (popup.closed) { clearInterval(poll); window.removeEventListener("message", onMessage); }
      }, 500);
    } catch (e) {
      addToast(e instanceof Error ? e.message : "OAuth failed", "error");
    }
  }

  async function disconnect(accountId: string, label: string) {
    if (!confirm(`Disconnect ${label}? This will prevent future posting to this platform.`)) return;
    setDisconnecting(accountId);
    try {
      await apiFetch(`/admin/social/accounts/${accountId}`, getToken, { method: "DELETE" });
      addToast(`${label} disconnected`, "success");
      reload();
    } finally {
      setDisconnecting(null);
    }
  }

  const expiredAccounts = accounts.filter(a => {
    if (a.status === "expired") return true;
    if (a.tokenExpiresAt && new Date(a.tokenExpiresAt) < new Date()) return true;
    return false;
  });
  // Accounts that are explicitly disconnected or have no token stored (status != "connected")
  // and are not already flagged as expired — they cannot post without reconnection.
  const disconnectedAccounts = accounts.filter(a =>
    a.status !== "connected" && !expiredAccounts.includes(a)
  );

  return (
    <div className="space-y-4">
      {expiredAccounts.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <AlertTriangle size={16} className="shrink-0 text-amber-500" />
          <span>
            <strong>{expiredAccounts.map(a => PLATFORMS.find(p => p.id === a.platform)?.label).join(", ")}</strong>
            {" "}token{expiredAccounts.length > 1 ? "s have" : " has"} expired. Reconnect to restore posting.
          </span>
        </div>
      )}
      {disconnectedAccounts.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          <AlertTriangle size={16} className="shrink-0 text-red-500" />
          <span>
            <strong>{disconnectedAccounts.map(a => PLATFORMS.find(p => p.id === a.platform)?.label).join(", ")}</strong>
            {" "}{disconnectedAccounts.length > 1 ? "are" : "is"} disconnected or missing a token. Connect {disconnectedAccounts.length > 1 ? "these accounts" : "this account"} to enable posting.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PLATFORMS.map(platform => {
          const account = platformAccount(platform.id);
          const isExpired = account && (
            account.status === "expired" ||
            (account.tokenExpiresAt && new Date(account.tokenExpiresAt) < new Date())
          );

          return (
            <div key={platform.id} className={`border rounded-xl p-4 ${account && !isExpired ? platform.border + " " + platform.bg : "border-slate-200 bg-white"}`}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{platform.emoji}</span>
                <div className="flex-1">
                  <p className="font-semibold text-[var(--color-navy)] text-sm">{platform.label}</p>
                  {account ? (
                    <p className="text-xs text-slate-500 truncate">{account.accountName}</p>
                  ) : (
                    <p className="text-xs text-slate-400">Not connected</p>
                  )}
                </div>
                {account && !isExpired ? (
                  <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                    <Wifi size={12} /> Connected
                  </span>
                ) : isExpired ? (
                  <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                    <AlertTriangle size={12} /> Expired
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <WifiOff size={12} /> Disconnected
                  </span>
                )}
              </div>

              {account && !isExpired ? (
                <div className="space-y-2">
                  {account.tokenExpiresAt && (
                    <p className="text-xs text-slate-500">
                      Token expires: {new Date(account.tokenExpiresAt).toLocaleDateString("en-IN")}
                    </p>
                  )}
                  {account.connectedBy && (
                    <p className="text-xs text-slate-400">Connected by {account.connectedBy}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setConnecting(platform.id); setForm({ accountName: account.accountName, accessToken: "", refreshToken: "", tokenExpiresAt: account.tokenExpiresAt?.split("T")[0] ?? "", pageId: account.pageId ?? "", accountId: account.accountId ?? "" }); }}
                      className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:border-[var(--color-teal)] hover:text-[var(--color-teal)] transition-colors"
                    >
                      Update Token
                    </button>
                    <button
                      onClick={() => disconnect(account.id, platform.label)}
                      disabled={disconnecting === account.id}
                      className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setConnecting(platform.id); setForm({ accountName: "", accessToken: "", refreshToken: "", tokenExpiresAt: "", pageId: "", accountId: "" }); }}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-dashed border-slate-300 text-slate-500 hover:border-[var(--color-teal)] hover:text-[var(--color-teal)] transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={13} /> Connect {platform.label}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Connect modal */}
      {connecting && (() => {
        const platform = PLATFORMS.find(p => p.id === connecting)!;
        return (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{platform.emoji}</span>
                  <h3 className="font-bold text-[var(--color-navy)]">Connect {platform.label}</h3>
                </div>
                <button onClick={() => setConnecting(null)}><X size={18} className="text-slate-400" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700 space-y-1">
                  <p className="font-semibold">Setup instructions</p>
                  <p>{platform.hint}</p>
                  <a href={platform.docsUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline mt-1">
                    <ExternalLink size={11} /> View Documentation
                  </a>
                </div>

                {/* OAuth connect (when server OAuth is configured) */}
                <button
                  type="button"
                  onClick={() => connectViaOAuth(platform.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-navy)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <span className="text-base">{platform.emoji}</span>
                  Connect {platform.label} via OAuth
                </button>
                <div className="flex items-center gap-2">
                  <div className="flex-1 border-t border-slate-200" />
                  <span className="text-xs text-slate-400">or connect manually</span>
                  <div className="flex-1 border-t border-slate-200" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Account / Page Name *</label>
                  <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Pinnacle Academic Classes" value={form.accountName} onChange={e => setForm(f => ({ ...f, accountName: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{platform.tokenLabel} *</label>
                  <textarea rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono resize-none" placeholder="Paste token here…" value={form.accessToken} onChange={e => setForm(f => ({ ...f, accessToken: e.target.value }))} />
                  <p className="text-xs text-slate-400 mt-1">Token is encrypted before storage — only used for platform API calls. The field is masked after saving.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{platform.pageIdLabel}</label>
                    <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Optional" value={form.pageId} onChange={e => setForm(f => ({ ...f, pageId: e.target.value }))} />
                    <p className="text-xs text-slate-400 mt-1">{platform.pageIdHint}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Token Expiry Date</label>
                    <input type="date" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.tokenExpiresAt} onChange={e => setForm(f => ({ ...f, tokenExpiresAt: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 px-5 pb-5">
                <button onClick={() => setConnecting(null)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">Cancel</button>
                <button onClick={() => connect(connecting)} disabled={saving || !form.accountName || !form.accessToken} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">
                  {saving ? "Connecting…" : "Connect Account"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── Compose Tab ──────────────────────────────────────────────────────────────

function ComposeTab({ getToken, accounts, notices, blogPosts, isAdmin, reload }: {
  getToken: GetToken;
  accounts: SocialAccount[];
  notices: { id: string; title: string }[];
  blogPosts: { id: string; title: string }[];
  isAdmin: boolean;
  reload: () => void;
}) {
  const { addToast } = useToast();
  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [linkedNoticeId, setLinkedNoticeId] = useState("");
  const [linkedBlogId, setLinkedBlogId] = useState("");
  const [mediaUrlInput, setMediaUrlInput] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadMedia(file: File) {
    setUploading(true);
    try {
      const token = await getToken();
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

  const connectedPlatforms = accounts.filter(a => a.status === "connected" && !(a.tokenExpiresAt && new Date(a.tokenExpiresAt) < new Date()));

  function togglePlatform(pid: string) {
    setSelectedPlatforms(prev => prev.includes(pid) ? prev.filter(p => p !== pid) : [...prev, pid]);
  }

  async function submit(publishNow: boolean) {
    if (!content.trim()) { addToast("Post content is required", "error"); return; }
    if (!selectedPlatforms.length) { addToast("Select at least one platform", "error"); return; }
    if (scheduleMode && !scheduledAt) { addToast("Select a scheduled date/time", "error"); return; }
    setSaving(true);
    try {
      const json = await apiFetch("/admin/social/posts", getToken, {
        method: "POST",
        body: JSON.stringify({
          content: content.trim(), platformTargets: selectedPlatforms,
          mediaUrls,
          scheduledAt: scheduleMode && scheduledAt ? scheduledAt : undefined,
          linkedNoticeId: linkedNoticeId || undefined,
          linkedBlogId: linkedBlogId || undefined,
          publishNow: publishNow && isAdmin,
        }),
      });
      if (!json.ok) throw new Error(json.error ?? "Failed");
      addToast(publishNow && isAdmin ? "Post published!" : isAdmin && scheduleMode ? "Post scheduled" : "Post submitted for approval", "success");
      setContent(""); setSelectedPlatforms([]); setScheduleMode(false);
      setScheduledAt(""); setLinkedNoticeId(""); setLinkedBlogId("");
      setMediaUrls([]); setMediaUrlInput("");
      reload();
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed to submit post", "error");
    } finally {
      setSaving(false);
    }
  }

  const charCount = content.length;
  const maxChars = selectedPlatforms.includes("twitter") ? 280 : 2200;

  return (
    <div className="space-y-4 max-w-2xl">
      {connectedPlatforms.length === 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 flex items-center gap-2">
          <AlertTriangle size={15} className="shrink-0" />
          No platforms connected. Connect at least one platform in the Accounts tab to post.
        </div>
      )}

      {/* Platform selection */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Post to *</label>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map(platform => {
            const isConnected = connectedPlatforms.some(a => a.platform === platform.id);
            const isSelected = selectedPlatforms.includes(platform.id);
            return (
              <button
                key={platform.id}
                disabled={!isConnected}
                onClick={() => togglePlatform(platform.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  !isConnected ? "opacity-40 cursor-not-allowed border-slate-200 text-slate-400" :
                  isSelected ? "border-[var(--color-teal)] bg-teal-50 text-[var(--color-teal)]" :
                  "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <span>{PLATFORMS.find(p => p.id === platform.id)?.emoji}</span>
                {platform.label}
                {isSelected && <Check size={11} />}
                {!isConnected && <span className="text-[9px]">(not connected)</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Post Content *</label>
        <textarea
          rows={5}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:ring-1 focus:ring-[var(--color-teal)] focus:border-[var(--color-teal)] outline-none"
          placeholder="Write your post content…"
          value={content}
          onChange={e => setContent(e.target.value)}
          maxLength={maxChars}
        />
        <div className="flex justify-between mt-1">
          <p className="text-xs text-slate-400">
            {selectedPlatforms.includes("twitter") && "Twitter limit: 280 characters"}
          </p>
          <p className={`text-xs ${charCount > maxChars * 0.9 ? "text-amber-600" : "text-slate-400"}`}>
            {charCount}/{maxChars}
          </p>
        </div>
      </div>

      {/* Media — upload or paste URL */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
          <ImageIcon size={13} /> Media (optional)
        </label>
        <div className="flex gap-2 mb-2">
          <input
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-[var(--color-teal)] focus:border-[var(--color-teal)] outline-none"
            placeholder="Paste an image or video URL…"
            value={mediaUrlInput}
            onChange={e => setMediaUrlInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") {
                e.preventDefault();
                const url = mediaUrlInput.trim();
                if (!url) return;
                try { new URL(url); } catch { addToast("Enter a valid URL", "error"); return; }
                if (!mediaUrls.includes(url)) setMediaUrls(prev => [...prev, url]);
                setMediaUrlInput("");
              }
            }}
          />
          <button type="button" onClick={() => {
            const url = mediaUrlInput.trim();
            if (!url) return;
            try { new URL(url); } catch { addToast("Enter a valid URL", "error"); return; }
            if (!mediaUrls.includes(url)) setMediaUrls(prev => [...prev, url]);
            setMediaUrlInput("");
          }} className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
            Add URL
          </button>
        </div>
        <div>
          <input ref={fileInputRef} type="file" accept="image/*,video/mp4,video/quicktime" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadMedia(f); e.target.value = ""; }} />
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-dashed border-slate-300 text-slate-500 hover:border-[var(--color-teal)] hover:text-[var(--color-teal)] transition-colors disabled:opacity-50">
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

      {/* Link to notice or blog */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><Link2 size={13} /> Link Notice</label>
          <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={linkedNoticeId} onChange={e => setLinkedNoticeId(e.target.value)}>
            <option value="">None</option>
            {notices.map(n => <option key={n.id} value={n.id}>{n.title}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><FileText size={13} /> Link Blog Post</label>
          <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={linkedBlogId} onChange={e => setLinkedBlogId(e.target.value)}>
            <option value="">None</option>
            {blogPosts.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
          </select>
        </div>
      </div>

      {/* Schedule toggle */}
      {isAdmin && (
        <div>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={scheduleMode} onChange={e => setScheduleMode(e.target.checked)} className="rounded" />
            <Calendar size={14} /> Schedule for later
          </label>
          {scheduleMode && (
            <input type="datetime-local" className="mt-2 border border-slate-200 rounded-lg px-3 py-2 text-sm w-full max-w-xs" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} min={new Date().toISOString().slice(0, 16)} />
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        {isAdmin && !scheduleMode && (
          <button
            onClick={() => submit(true)}
            disabled={saving || !content.trim() || !selectedPlatforms.length}
            className="btn-primary px-5 py-2 text-sm flex items-center gap-2 disabled:opacity-50"
          >
            <Send size={14} /> Publish Now
          </button>
        )}
        {isAdmin && scheduleMode && (
          <button
            onClick={() => submit(false)}
            disabled={saving || !content.trim() || !selectedPlatforms.length || !scheduledAt}
            className="btn-primary px-5 py-2 text-sm flex items-center gap-2 disabled:opacity-50"
          >
            <Calendar size={14} /> Schedule Post
          </button>
        )}
        {!isAdmin && (
          <button
            onClick={() => submit(false)}
            disabled={saving || !content.trim() || !selectedPlatforms.length}
            className="btn-primary px-5 py-2 text-sm flex items-center gap-2 disabled:opacity-50"
          >
            <Send size={14} /> Submit for Approval
          </button>
        )}
      </div>

      {!isAdmin && (
        <p className="text-xs text-slate-400">Your post will be reviewed by an admin before publishing.</p>
      )}
    </div>
  );
}

// ── Pending Tab ──────────────────────────────────────────────────────────────

function PendingTab({ getToken, posts, reload }: { getToken: GetToken; posts: SocialPost[]; reload: () => void }) {
  const { addToast } = useToast();
  const [rejectModal, setRejectModal] = useState<SocialPost | null>(null);
  const [scheduleModal, setScheduleModal] = useState<SocialPost | null>(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [acting, setActing] = useState<string | null>(null);

  const pending = posts.filter(p => p.status === "pending");

  async function approveNow(post: SocialPost) {
    setActing(post.id);
    try {
      const json = await apiFetch(`/admin/social/posts/${post.id}`, getToken, {
        method: "PATCH",
        body: JSON.stringify({ status: "approved" }),
      });
      if (!json.ok) throw new Error(json.error ?? "Failed");
      addToast("Post approved and published", "success");
      reload();
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed to approve", "error");
    } finally {
      setActing(null);
    }
  }

  async function approveScheduled() {
    if (!scheduleModal) return;
    if (!scheduleDate) { addToast("Please pick a date and time", "error"); return; }
    const dt = new Date(scheduleDate);
    if (dt <= new Date()) { addToast("Scheduled time must be in the future", "error"); return; }
    setActing(scheduleModal.id);
    try {
      const json = await apiFetch(`/admin/social/posts/${scheduleModal.id}`, getToken, {
        method: "PATCH",
        body: JSON.stringify({ status: "approved", scheduledAt: dt.toISOString() }),
      });
      if (!json.ok) throw new Error(json.error ?? "Failed");
      addToast("Post approved and scheduled", "success");
      setScheduleModal(null);
      setScheduleDate("");
      reload();
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed to schedule", "error");
    } finally {
      setActing(null);
    }
  }

  async function reject(post: SocialPost) {
    setActing(post.id);
    try {
      const json = await apiFetch(`/admin/social/posts/${post.id}`, getToken, {
        method: "PATCH",
        body: JSON.stringify({ status: "rejected", rejectionNote: rejectionNote || undefined }),
      });
      if (!json.ok) throw new Error(json.error ?? "Failed");
      addToast("Post rejected", "success");
      setRejectModal(null);
      setRejectionNote("");
      reload();
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed to reject", "error");
    } finally {
      setActing(null);
    }
  }

  if (pending.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <CheckCircle size={40} className="mx-auto mb-3 text-green-300" />
        <p className="text-sm font-medium">All clear — no posts waiting for approval</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">{pending.length} post{pending.length !== 1 ? "s" : ""} awaiting review</p>
      {pending.map(post => (
        <div key={post.id} className="border border-amber-200 bg-amber-50 rounded-xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {post.platformTargets.map(pid => (
                  <span key={pid} className="text-xs bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                    {PLATFORMS.find(p => p.id === pid)?.emoji} {PLATFORMS.find(p => p.id === pid)?.label}
                  </span>
                ))}
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{post.content}</p>
              {post.mediaUrls && post.mediaUrls.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {post.mediaUrls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={url}
                        alt={`Media ${i + 1}`}
                        className="h-16 w-16 object-cover rounded-lg border border-amber-200 hover:opacity-90 transition-opacity"
                        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </a>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-400 mt-2">
                Submitted by {post.postedByName ?? "Unknown"} · {new Date(post.createdAt).toLocaleString("en-IN")}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => approveNow(post)}
              disabled={acting === post.id}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <Check size={14} /> Approve & Publish
            </button>
            <button
              onClick={() => { setScheduleModal(post); setScheduleDate(""); }}
              disabled={acting === post.id}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-[var(--color-teal)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors"
            >
              <CalendarClock size={14} /> Approve & Schedule
            </button>
            <button
              onClick={() => { setRejectModal(post); setRejectionNote(""); }}
              disabled={acting === post.id}
              className="flex items-center gap-1.5 px-4 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              <XCircle size={14} /> Reject
            </button>
          </div>
        </div>
      ))}

      {scheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-bold text-[var(--color-navy)]">Approve & Schedule</h3>
              <button onClick={() => setScheduleModal(null)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-600 line-clamp-3 bg-slate-50 p-3 rounded-lg italic">"{scheduleModal.content}"</p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Publish at</label>
                <input
                  type="datetime-local"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  value={scheduleDate}
                  min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                  onChange={e => setScheduleDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-5 pb-5">
              <button onClick={() => setScheduleModal(null)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
              <button
                onClick={approveScheduled}
                disabled={acting === scheduleModal.id || !scheduleDate}
                className="px-4 py-2 text-sm bg-[var(--color-teal)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {acting === scheduleModal.id ? "Scheduling…" : "Approve & Schedule"}
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-bold text-[var(--color-navy)]">Reject Post</h3>
              <button onClick={() => setRejectModal(null)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-slate-600 line-clamp-3 bg-slate-50 p-3 rounded-lg italic">"{rejectModal.content}"</p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason for rejection (optional)</label>
                <textarea rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none" placeholder="Explain why this post was rejected…" value={rejectionNote} onChange={e => setRejectionNote(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-5 pb-5">
              <button onClick={() => setRejectModal(null)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
              <button onClick={() => reject(rejectModal)} disabled={acting === rejectModal.id} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                {acting === rejectModal.id ? "Rejecting…" : "Reject Post"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── History Tab ───────────────────────────────────────────────────────────────

function HistoryTab({ getToken, posts, reload }: { getToken: GetToken; posts: SocialPost[]; reload: () => void }) {
  const { addToast } = useToast();
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [deleting, setDeleting] = useState<string | null>(null);

  async function deletePost(id: string) {
    if (!confirm("Delete this post record?")) return;
    setDeleting(id);
    try {
      await apiFetch(`/admin/social/posts/${id}`, getToken, { method: "DELETE" });
      addToast("Post deleted", "success");
      reload();
    } finally {
      setDeleting(null);
    }
  }

  const filtered = posts.filter(p => {
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    if (filterPlatform !== "all" && !p.platformTargets.includes(filterPlatform)) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <select className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All statuses</option>
          {["draft", "pending", "approved", "rejected", "published", "scheduled", "failed"].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm" value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)}>
          <option value="all">All platforms</option>
          {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.emoji} {p.label}</option>)}
        </select>
        <button onClick={reload} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[var(--color-navy)] transition-colors ml-auto">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-slate-400 text-sm py-6 text-center">No posts match these filters.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(post => (
            <div key={post.id} className="border border-slate-200 rounded-xl p-4 bg-white">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${POST_STATUS_COLORS[post.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {post.status}
                    </span>
                    {post.platformTargets.map(pid => (
                      <span key={pid} className="text-xs text-slate-500">
                        {PLATFORMS.find(p => p.id === pid)?.emoji} {PLATFORMS.find(p => p.id === pid)?.label}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-slate-700 line-clamp-2">{post.content}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 flex-wrap">
                    <span>By {post.postedByName ?? "Unknown"}</span>
                    {post.publishedAt && <span>· Published {new Date(post.publishedAt).toLocaleString("en-IN")}</span>}
                    {post.scheduledAt && post.status === "scheduled" && <span>· Scheduled {new Date(post.scheduledAt).toLocaleString("en-IN")}</span>}
                    {post.rejectionNote && <span className="text-red-500">· Rejected: {post.rejectionNote}</span>}
                  </div>
                  {Object.keys(post.publishedUrls ?? {}).length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {Object.entries(post.publishedUrls).map(([platform, url]) => (
                        <a key={platform} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-[var(--color-teal)] hover:underline">
                          <ExternalLink size={11} /> View on {PLATFORMS.find(p => p.id === platform)?.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => deletePost(post.id)} disabled={deleting === post.id} className="p-1.5 text-slate-300 hover:text-red-400 transition-colors shrink-0 disabled:opacity-50">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Access Tab ────────────────────────────────────────────────────────────────

function AccessTab({ getToken }: { getToken: GetToken }) {
  const { addToast } = useToast();
  const [data, setData] = useState<{ access: TeacherAccess[]; teachers: TeacherUser[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const json = await apiFetch("/admin/social/teacher-access", getToken);
    if (json.ok) setData(json.data);
    setLoading(false);
  }, [getToken]);

  useEffect(() => { load(); }, [load]);

  const getAccess = (userId: string): TeacherAccess => {
    const existing = data?.access.find(a => a.userId === userId);
    const teacher = data?.teachers.find(t => t.id === userId);
    return existing ?? {
      id: null, userId, userName: teacher?.name ?? "Unknown", userEmail: teacher?.email ?? "",
      platformsAllowed: [], isEnabled: false,
    };
  };

  async function updateAccess(userId: string, isEnabled: boolean, platformsAllowed: string[]) {
    setSaving(userId);
    try {
      const json = await apiFetch(`/admin/social/teacher-access/${userId}`, getToken, {
        method: "PUT",
        body: JSON.stringify({ isEnabled, platformsAllowed }),
      });
      if (!json.ok) throw new Error(json.error ?? "Failed");
      addToast("Access updated", "success");
      load();
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed to update", "error");
    } finally {
      setSaving(null);
    }
  }

  if (loading) return <SkeletonList rows={4} />;

  const allTeachers = data?.teachers ?? [];

  if (allTeachers.length === 0) {
    return <p className="text-slate-400 text-sm">No teachers found. Add teachers in the Teachers section first.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">Control which teachers can submit social media posts for approval, and which platforms they're allowed to post to.</p>
      {allTeachers.map(teacher => {
        const access = getAccess(teacher.id);
        const isSaving = saving === teacher.id;
        return (
          <div key={teacher.id} className="border border-slate-200 rounded-xl p-4 bg-white">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <p className="font-medium text-sm text-[var(--color-navy)]">{teacher.name}</p>
                  <p className="text-xs text-slate-400">{teacher.email}</p>
                </div>
                {access.isEnabled && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <p className="text-xs text-slate-500 w-full">Allowed platforms:</p>
                    {PLATFORMS.map(platform => {
                      const allowed = access.platformsAllowed.includes(platform.id);
                      return (
                        <button
                          key={platform.id}
                          disabled={isSaving}
                          onClick={() => {
                            const newAllowed = allowed
                              ? access.platformsAllowed.filter(p => p !== platform.id)
                              : [...access.platformsAllowed, platform.id];
                            updateAccess(teacher.id, access.isEnabled, newAllowed);
                          }}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border transition-colors ${
                            allowed ? "border-[var(--color-teal)] bg-teal-50 text-[var(--color-teal)]" : "border-slate-200 text-slate-400 hover:border-slate-300"
                          }`}
                        >
                          {platform.emoji} {platform.label} {allowed && <Check size={10} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="shrink-0 flex items-center gap-2">
                {isSaving && <div className="w-4 h-4 border-2 border-[var(--color-teal)] border-t-transparent rounded-full animate-spin" />}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={access.isEnabled}
                    disabled={isSaving}
                    onChange={e => updateAccess(teacher.id, e.target.checked, access.platformsAllowed)}
                  />
                  <div className={`w-10 h-5 rounded-full transition-colors ${access.isEnabled ? "bg-[var(--color-teal)]" : "bg-slate-200"}`}>
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${access.isEnabled ? "translate-x-5" : ""}`} />
                  </div>
                </label>
                <span className="text-xs text-slate-500">{access.isEnabled ? "Enabled" : "Disabled"}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

type Tab = "accounts" | "compose" | "pending" | "history" | "access";

export function AdminSocialMedia({ getToken, defaultTab }: { getToken: GetToken; defaultTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(defaultTab ?? "accounts");
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [notices, setNotices] = useState<{ id: string; title: string }[]>([]);
  const [blogPosts, setBlogPosts] = useState<{ id: string; title: string }[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const loadAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    const json = await apiFetch("/admin/social/accounts", getToken);
    if (json.ok) setAccounts(json.data);
    setLoadingAccounts(false);
  }, [getToken]);

  const loadPosts = useCallback(async () => {
    setLoadingPosts(true);
    const json = await apiFetch("/admin/social/posts", getToken);
    if (json.ok) setPosts(json.data);
    setLoadingPosts(false);
  }, [getToken]);

  const loadLinked = useCallback(async () => {
    const [nJson, bJson] = await Promise.all([
      apiFetch("/admin/notices", getToken),
      apiFetch("/admin/blog", getToken),
    ]);
    if (nJson.ok) setNotices((nJson.data as { id: string; title: string }[]).slice(0, 50));
    if (bJson.ok) setBlogPosts((bJson.data as { id: string; title: string }[]).filter((b: { status?: string }) => b.status === "published").slice(0, 50));
  }, [getToken]);

  useEffect(() => {
    loadAccounts();
    loadPosts();
    loadLinked();
  }, [loadAccounts, loadPosts, loadLinked]);

  const pendingCount = posts.filter(p => p.status === "pending").length;
  const expiredCount = accounts.filter(a => a.status === "expired" || (a.tokenExpiresAt && new Date(a.tokenExpiresAt) < new Date())).length;
  const disconnectedCount = accounts.filter(a => a.status !== "connected" && !(a.status === "expired" || (a.tokenExpiresAt && new Date(a.tokenExpiresAt) < new Date()))).length;
  const accountWarnCount = expiredCount + disconnectedCount;

  const TABS: { id: Tab; label: string; badge?: number; warn?: number }[] = [
    { id: "accounts", label: "Accounts", warn: accountWarnCount },
    { id: "compose", label: "Compose" },
    { id: "pending", label: "Pending Approval", badge: pendingCount },
    { id: "history", label: "Post History" },
    { id: "access", label: "Teacher Access" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Share2 size={20} className="text-[var(--color-navy)]" />
          <h2 className="text-xl font-bold text-[var(--color-navy)]">Social Media</h2>
        </div>
        <div className="flex items-center gap-2">
          {accountWarnCount > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
              <AlertTriangle size={12} />
              {expiredCount > 0 && `${expiredCount} expired`}
              {expiredCount > 0 && disconnectedCount > 0 && ", "}
              {disconnectedCount > 0 && `${disconnectedCount} disconnected`}
            </span>
          )}
          <button onClick={() => { loadAccounts(); loadPosts(); }} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[var(--color-navy)] transition-colors">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t.id
                ? "border-[var(--color-teal)] text-[var(--color-teal)]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
            {t.badge != null && t.badge > 0 && (
              <span className="text-[10px] bg-amber-500 text-white rounded-full px-1.5 py-0.5 leading-none font-semibold">{t.badge}</span>
            )}
            {t.warn != null && t.warn > 0 && (
              <span className="text-[10px] bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5 leading-none font-semibold">!</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "accounts" && (
        loadingAccounts ? <SkeletonList rows={4} /> : <AccountsTab getToken={getToken} accounts={accounts} reload={loadAccounts} />
      )}
      {tab === "compose" && (
        <ComposeTab getToken={getToken} accounts={accounts} notices={notices} blogPosts={blogPosts} isAdmin={true} reload={loadPosts} />
      )}
      {tab === "pending" && (
        loadingPosts ? <SkeletonList rows={3} /> : <PendingTab getToken={getToken} posts={posts} reload={loadPosts} />
      )}
      {tab === "history" && (
        loadingPosts ? <SkeletonList rows={4} /> : <HistoryTab getToken={getToken} posts={posts} reload={loadPosts} />
      )}
      {tab === "access" && (
        <AccessTab getToken={getToken} />
      )}
    </div>
  );
}

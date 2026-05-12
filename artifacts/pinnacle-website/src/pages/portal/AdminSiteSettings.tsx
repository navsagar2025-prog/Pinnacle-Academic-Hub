import { useState, useEffect, useCallback } from "react";
import { Save, Plus, X, Pencil, Trash2, BarChart2, CheckCircle2, AlertCircle, Loader2, Unlink } from "lucide-react";
import { useToast, SkeletonList, useModalEscape, apiMutation } from "./portalUtils";
import { useLocation } from "wouter";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function useFetch<T>(path: string, getToken: () => Promise<string | null>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${BASE}/api/v1${path}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json(); setData(json.data);
    } finally { setLoading(false); }
  }, [path]);
  useEffect(() => { load(); }, [load]);
  return { data, loading, reload: load };
}

type SiteSetting = { id: string; key: string; value: string | null; label: string | null };
type SeoOverride = { id: string; route: string; title: string | null; description: string | null; focusKeyword: string | null; noIndex: boolean };
type WatermarkSetting = { id: string; docType: string; enabled: boolean; textTemplate: string; position: string; opacity: number; rotation: number; fontSize: number; color: string; useGlobal: boolean };

// ─── Site Settings ────────────────────────────────────────────────────────────
export function AdminSiteSettings({ getToken }: { getToken: () => Promise<string | null> }) {
  const { toast } = useToast();
  const { data: settings, loading, reload } = useFetch<SiteSetting[]>("/admin/site-settings", getToken);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      const m: Record<string, string> = {};
      settings.forEach(s => { m[s.key] = s.value ?? ""; });
      setValues(m);
    }
  }, [settings]);

  const saveAll = async () => {
    setSaving(true);
    try {
      const updates = (settings ?? []).map(s => ({ key: s.key, value: values[s.key] ?? "", label: s.label ?? undefined }));
      const res = await apiMutation("PATCH", "/admin/site-settings/bulk", { updates }, getToken);
      if (res.ok) { toast("success", "Settings saved"); reload(); }
      else toast("error", "Save failed");
    } catch { toast("error", "Network error"); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[var(--color-navy)]">Site Settings</h2>
        <button onClick={saveAll} disabled={saving} className="btn-primary px-4 py-2 flex items-center gap-2 text-sm disabled:opacity-50">
          <Save size={14} /> {saving ? "Saving…" : "Save All"}
        </button>
      </div>
      {loading && <SkeletonList rows={4} />}
      {(settings ?? []).length === 0 && !loading && (
        <div className="card border border-slate-200 text-center py-8">
          <p className="text-slate-400 text-sm">No settings configured yet.</p>
          <p className="text-slate-400 text-xs mt-1">Settings rows are seeded via the DB or API.</p>
        </div>
      )}
      <div className="space-y-3">
        {(settings ?? []).map(s => (
          <div key={s.id} className="card border border-slate-200">
            <label className="block text-xs font-semibold text-slate-500 mb-1">{s.label ?? s.key} <span className="font-mono font-normal text-slate-400">({s.key})</span></label>
            <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={values[s.key] ?? ""} onChange={e => setValues(v => ({ ...v, [s.key]: e.target.value }))} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SEO Overrides ────────────────────────────────────────────────────────────
export function AdminSEO({ getToken }: { getToken: () => Promise<string | null> }) {
  const { toast } = useToast();
  const { data: overrides, loading, reload } = useFetch<SeoOverride[]>("/admin/seo", getToken);
  const [modal, setModal] = useState<{ mode: "create" | "edit"; item?: SeoOverride } | null>(null);
  const [form, setForm] = useState({ route: "", title: "", description: "", focusKeyword: "", noIndex: false });
  const [saving, setSaving] = useState(false);

  useModalEscape(() => setModal(null), !!modal);

  const openCreate = () => { setForm({ route: "", title: "", description: "", focusKeyword: "", noIndex: false }); setModal({ mode: "create" }); };
  const openEdit = (o: SeoOverride) => { setForm({ route: o.route, title: o.title ?? "", description: o.description ?? "", focusKeyword: o.focusKeyword ?? "", noIndex: o.noIndex }); setModal({ mode: "edit", item: o }); };

  const save = async () => {
    setSaving(true);
    const p = { ...form, title: form.title || null, description: form.description || null, focusKeyword: form.focusKeyword || null };
    try {
      const res = modal?.mode === "create"
        ? await apiMutation("POST", "/admin/seo", p, getToken)
        : await apiMutation("PATCH", `/admin/seo/${modal?.item?.id}`, p, getToken);
      if (res.ok) { toast("success", modal?.mode === "create" ? "Override added" : "Override updated"); setModal(null); reload(); }
      else toast("error", (res as { error?: string }).error ?? "Save failed");
    } catch { toast("error", "Network error"); }
    finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this SEO override?")) return;
    const res = await apiMutation("DELETE", `/admin/seo/${id}`, null, getToken);
    if (res.ok) { toast("success", "Override deleted"); reload(); }
    else toast("error", "Delete failed");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[var(--color-navy)]">SEO Overrides</h2>
        <button onClick={openCreate} className="btn-primary px-4 py-2 flex items-center gap-2 text-sm"><Plus size={14} /> Add Override</button>
      </div>
      {loading && <SkeletonList rows={3} />}
      <div className="space-y-2">
        {(overrides ?? []).map(o => (
          <div key={o.id} className="card border border-slate-200 flex gap-3 items-center">
            <div className="flex-1 min-w-0">
              <p className="font-mono text-sm font-medium text-[var(--color-navy)]">{o.route}</p>
              {o.title && <p className="text-xs text-slate-600 truncate">{o.title}</p>}
              {o.description && <p className="text-xs text-slate-400 truncate">{o.description}</p>}
              <div className="flex gap-2 mt-1">
                {o.focusKeyword && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{o.focusKeyword}</span>}
                {o.noIndex && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">noindex</span>}
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => openEdit(o)} className="p-1.5 text-slate-400 hover:text-[var(--color-navy)]"><Pencil size={14} /></button>
              <button onClick={() => del(o.id)} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {(overrides ?? []).length === 0 && !loading && <p className="text-slate-400 text-sm">No SEO overrides yet.</p>}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[var(--color-navy)]">{modal.mode === "create" ? "Add SEO Override" : "Edit SEO Override"}</h3>
              <button onClick={() => setModal(null)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Route *</label>
                <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono" placeholder="/courses" value={form.route} onChange={e => setForm(f => ({ ...f, route: e.target.value }))} disabled={modal.mode === "edit"} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Page Title</label>
                <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Meta Description</label>
                <textarea rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Focus Keyword</label>
                <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.focusKeyword} onChange={e => setForm(f => ({ ...f, focusKeyword: e.target.value }))} />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={form.noIndex} onChange={e => setForm(f => ({ ...f, noIndex: e.target.checked }))} />
                noindex (hide from search engines)
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
              <button onClick={save} disabled={saving || !form.route} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── GA4 OAuth Setup ──────────────────────────────────────────────────────────
type GA4Status = { connected: boolean; source: "env" | "db" | null; propertyId: string | null; measurementId: string | null };

export function AdminGA4Setup({ getToken }: { getToken: () => Promise<string | null> }) {
  const { toast } = useToast();
  const [location] = useLocation();
  const [status, setStatus] = useState<GA4Status | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [form, setForm] = useState({ clientId: "", clientSecret: "", propertyId: "", measurementId: "" });
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const loadStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${BASE}/api/v1/admin/ga4/status`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.ok) setStatus(json.data);
    } catch { }
    finally { setStatusLoading(false); }
  }, [getToken]);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ga4Param = params.get("ga4");
    if (ga4Param === "connected") {
      toast("success", "Google Analytics 4 connected successfully!");
      window.history.replaceState({}, "", window.location.pathname + "?section=ga4-setup");
      loadStatus();
    } else if (ga4Param === "error") {
      const reason = params.get("reason") ?? "unknown";
      const hint = params.get("hint");
      const msg = reason === "no_refresh_token"
        ? "No refresh token received — please revoke access in your Google account and try again."
        : `Connection failed (${reason}).`;
      toast("error", hint ? `${msg} ${hint}` : msg);
      window.history.replaceState({}, "", window.location.pathname + "?section=ga4-setup");
    }
  }, [location]);

  const connect = async () => {
    if (!form.clientId.trim() || !form.clientSecret.trim() || !form.propertyId.trim()) {
      toast("error", "Client ID, Client Secret, and Property ID are required");
      return;
    }
    setConnecting(true);
    try {
      const res = await apiMutation("POST", "/admin/ga4/oauth/start", {
        clientId: form.clientId.trim(),
        clientSecret: form.clientSecret.trim(),
        propertyId: form.propertyId.trim(),
        measurementId: form.measurementId.trim() || undefined,
      }, getToken) as { ok?: boolean; authUrl?: string; error?: string };
      if (res.ok && res.authUrl) {
        window.location.href = res.authUrl;
      } else {
        toast("error", res.error ?? "Failed to start OAuth flow");
      }
    } catch { toast("error", "Network error"); }
    finally { setConnecting(false); }
  };

  const disconnect = async () => {
    if (!confirm("Disconnect Google Analytics 4? This will remove all stored credentials.")) return;
    setDisconnecting(true);
    try {
      const res = await apiMutation("DELETE", "/admin/ga4/oauth", null, getToken) as { ok?: boolean; error?: string };
      if (res.ok) { toast("success", "GA4 disconnected"); loadStatus(); }
      else toast("error", res.error ?? "Failed to disconnect");
    } catch { toast("error", "Network error"); }
    finally { setDisconnecting(false); }
  };

  const isEnvConnected = status?.source === "env";
  const isDbConnected = status?.source === "db";
  const isConnected = status?.connected;

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <BarChart2 size={20} className="text-[var(--color-teal)]" />
        <h2 className="text-xl font-bold text-[var(--color-navy)]">Google Analytics 4</h2>
        {!statusLoading && isConnected && (
          <span className="ml-auto text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 size={11} /> Connected
          </span>
        )}
        {!statusLoading && !isConnected && (
          <span className="ml-auto text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
            <AlertCircle size={11} /> Not connected
          </span>
        )}
      </div>

      {statusLoading && (
        <div className="flex items-center gap-2 text-slate-400 text-sm py-8 justify-center">
          <Loader2 size={16} className="animate-spin" /> Checking connection…
        </div>
      )}

      {!statusLoading && isConnected && (
        <div className="space-y-4">
          <div className="card border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-emerald-800 text-sm mb-1 flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> GA4 is active
                  {isEnvConnected && <span className="text-xs font-normal text-emerald-600 ml-1">(via environment variables)</span>}
                  {isDbConnected && <span className="text-xs font-normal text-emerald-600 ml-1">(via OAuth — stored in database)</span>}
                </p>
                {status?.propertyId && (
                  <p className="text-xs text-emerald-700">Property ID: <span className="font-mono font-medium">{status.propertyId}</span></p>
                )}
                {status?.measurementId && (
                  <p className="text-xs text-emerald-700">Measurement ID: <span className="font-mono font-medium">{status.measurementId}</span></p>
                )}
                <p className="text-xs text-emerald-600 mt-2">Live analytics are visible in the Analytics dashboard tab.</p>
              </div>
              {isDbConnected && (
                <button onClick={disconnect} disabled={disconnecting}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg disabled:opacity-50 transition-colors">
                  {disconnecting ? <Loader2 size={12} className="animate-spin" /> : <Unlink size={12} />}
                  {disconnecting ? "Disconnecting…" : "Disconnect"}
                </button>
              )}
            </div>
          </div>

          {isEnvConnected && (
            <div className="card border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
              Connected via environment variables. To switch to the database-stored OAuth connection, remove the <span className="font-mono">GOOGLE_OAUTH_*</span> environment variables and use the form below.
            </div>
          )}
        </div>
      )}

      {!statusLoading && !isConnected && (
        <div className="space-y-4">
          <div className="card border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-semibold mb-1">Connect GA4 with one click</p>
            <p className="text-amber-700 text-xs">Enter your Google Cloud OAuth credentials and click "Connect with Google". You will be redirected to Google's consent screen — no manual token copying needed.</p>
          </div>

          <div className="card border border-slate-200 p-5 space-y-4">
            <p className="text-sm font-semibold text-[var(--color-navy)]">OAuth 2.0 Credentials</p>

            <div className="grid gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Client ID <span className="text-red-400">*</span></label>
                <input
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono"
                  placeholder="123456789-abc.apps.googleusercontent.com"
                  value={form.clientId}
                  onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Client Secret <span className="text-red-400">*</span></label>
                <input
                  type="password"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono"
                  placeholder="GOCSPX-…"
                  value={form.clientSecret}
                  onChange={e => setForm(f => ({ ...f, clientSecret: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">GA4 Property ID <span className="text-red-400">*</span></label>
                <input
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono"
                  placeholder="123456789"
                  value={form.propertyId}
                  onChange={e => setForm(f => ({ ...f, propertyId: e.target.value }))}
                />
                <p className="text-xs text-slate-400 mt-1">Numeric ID from GA4 Admin → Property Settings</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Measurement ID <span className="text-slate-400 font-normal">(optional, for client-side tracking)</span></label>
                <input
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono"
                  placeholder="G-XXXXXXXXXX"
                  value={form.measurementId}
                  onChange={e => setForm(f => ({ ...f, measurementId: e.target.value }))}
                />
                <p className="text-xs text-slate-400 mt-1">From GA4 Admin → Data Streams. Also set <span className="font-mono">VITE_GA4_MEASUREMENT_ID</span> in env for full page tracking.</p>
              </div>
            </div>

            <button
              onClick={connect}
              disabled={connecting || !form.clientId || !form.clientSecret || !form.propertyId}
              className="w-full btn-primary py-2.5 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
              {connecting ? <><Loader2 size={15} className="animate-spin" /> Opening Google consent screen…</> : <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Connect with Google
              </>}
            </button>
          </div>

          <div className="card border border-slate-100 p-4">
            <p className="text-xs font-semibold text-slate-600 mb-2">How to set up credentials</p>
            <ol className="text-xs text-slate-500 space-y-1.5 list-decimal list-inside">
              <li>In <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-[var(--color-teal)] underline">Google Cloud Console</a>, enable the <strong>Google Analytics Data API</strong>.</li>
              <li>Go to APIs &amp; Services → Credentials → Create Credentials → OAuth 2.0 Client ID.</li>
              <li>Set Application type to <strong>Web application</strong>. Add your site URL as an Authorized redirect URI — the system will show the exact URI after you click Connect.</li>
              <li>Copy the Client ID and Client Secret into the form above.</li>
              <li>Enter your GA4 Property ID (numeric, from GA4 Admin → Property Settings).</li>
              <li>Click <strong>Connect with Google</strong> and approve the Analytics read scope.</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Watermark Settings ───────────────────────────────────────────────────────
export function AdminWatermarks({ getToken }: { getToken: () => Promise<string | null> }) {
  const { toast } = useToast();
  const { data: watermarks, loading, reload } = useFetch<WatermarkSetting[]>("/admin/watermarks", getToken);
  const [editing, setEditing] = useState<string | null>(null);
  const [forms, setForms] = useState<Record<string, Partial<WatermarkSetting>>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const save = async (docType: string) => {
    setSaving(docType);
    try {
      const res = await apiMutation("PATCH", `/admin/watermarks/${docType}`, forms[docType] ?? {}, getToken);
      if (res.ok) { toast("success", "Watermark saved"); setEditing(null); reload(); }
      else toast("error", "Save failed");
    } catch { toast("error", "Network error"); }
    finally { setSaving(null); }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-navy)] mb-6">Watermark Settings</h2>
      {loading && <SkeletonList rows={3} />}
      {(watermarks ?? []).length === 0 && !loading && (
        <p className="text-slate-400 text-sm">No watermark settings configured. They will appear here once initialized.</p>
      )}
      <div className="space-y-3">
        {(watermarks ?? []).map(w => {
          const f = forms[w.docType] ?? w;
          const isEditing = editing === w.docType;
          return (
            <div key={w.id} className="card border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-sm text-[var(--color-navy)] capitalize">{w.docType.replace(/_/g, " ")}</p>
                  {w.useGlobal && w.docType !== "global" && <p className="text-xs text-slate-400">Using global settings</p>}
                </div>
                <div className="flex gap-2 items-center">
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input type="checkbox" checked={f.enabled ?? w.enabled} onChange={e => setForms(prev => ({ ...prev, [w.docType]: { ...(prev[w.docType] ?? w), enabled: e.target.checked } }))} />
                    Enabled
                  </label>
                  <button onClick={() => setEditing(isEditing ? null : w.docType)} className="p-1.5 text-slate-400 hover:text-[var(--color-navy)]"><Pencil size={14} /></button>
                </div>
              </div>
              {isEditing && (
                <div className="space-y-3 mt-3 pt-3 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Text Template</label>
                    <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-xs" value={String(f.textTemplate ?? w.textTemplate)} onChange={e => setForms(p => ({ ...p, [w.docType]: { ...(p[w.docType] ?? w), textTemplate: e.target.value } }))} />
                    <p className="text-xs text-slate-400 mt-1">Variables: {"{{centreName}}"} {"{{userName}}"} {"{{date}}"}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Position</label>
                      <select className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs" value={String(f.position ?? w.position)} onChange={e => setForms(p => ({ ...p, [w.docType]: { ...(p[w.docType] ?? w), position: e.target.value } }))}>
                        <option value="tile">Tile</option>
                        <option value="center">Center</option>
                        <option value="footer">Footer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Opacity (0-100)</label>
                      <input type="number" min="0" max="100" className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs" value={Number(f.opacity ?? w.opacity)} onChange={e => setForms(p => ({ ...p, [w.docType]: { ...(p[w.docType] ?? w), opacity: parseInt(e.target.value) } }))} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Colour</label>
                      <div className="flex gap-1">
                        <input type="color" className="w-9 h-8 border border-slate-200 rounded cursor-pointer" value={String(f.color ?? w.color)} onChange={e => setForms(p => ({ ...p, [w.docType]: { ...(p[w.docType] ?? w), color: e.target.value } }))} />
                        <input className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono" value={String(f.color ?? w.color)} onChange={e => setForms(p => ({ ...p, [w.docType]: { ...(p[w.docType] ?? w), color: e.target.value } }))} />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditing(null)} className="px-3 py-1.5 text-sm text-slate-600">Cancel</button>
                    <button onClick={() => save(w.docType)} disabled={saving === w.docType} className="btn-primary px-3 py-1.5 text-sm disabled:opacity-50">{saving === w.docType ? "Saving…" : "Save"}</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

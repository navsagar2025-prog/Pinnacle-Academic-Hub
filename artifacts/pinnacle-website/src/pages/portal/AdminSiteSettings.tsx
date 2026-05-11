import { useState, useEffect, useCallback } from "react";
import { Save, Plus, X, Pencil, Trash2 } from "lucide-react";
import { useToast, SkeletonList, useModalEscape, apiMutation } from "./portalUtils";

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

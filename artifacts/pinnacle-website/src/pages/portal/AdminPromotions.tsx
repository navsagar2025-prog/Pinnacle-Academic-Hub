import { useState, useEffect, useCallback } from "react";
import { Plus, X, Pencil, Archive } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function api(method: string, path: string, body: object | null, getToken: () => Promise<string | null>) {
  const token = await getToken();
  const res = await fetch(`${BASE}/api/v1${path}`, {
    method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return res.json();
}

type Promotion = { id: string; title: string; body: string; displayType: string; audience: string; startsAt: string; endsAt: string; ctaLabel: string | null; ctaUrl: string | null; bgColour: string; ctaColour: string; archivedAt: string | null; createdAt: string };

function usePromotions(getToken: () => Promise<string | null>) {
  const [data, setData] = useState<Promotion[] | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${BASE}/api/v1/admin/promotions`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json(); setData(json.data);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  return { data, loading, reload: load };
}

const EMPTY = { title: "", body: "", displayType: "banner", audience: "public", startsAt: "", endsAt: "", ctaLabel: "", ctaUrl: "", bgColour: "#1a2e5a", ctaColour: "#2a9d8f" };

export function AdminPromotions({ getToken }: { getToken: () => Promise<string | null> }) {
  const { data: promos, loading, reload } = usePromotions(getToken);
  const [tab, setTab] = useState<"active" | "archived">("active");
  const [modal, setModal] = useState<{ mode: "create" | "edit"; item?: Promotion } | null>(null);
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  const openCreate = () => { setForm({ ...EMPTY }); setModal({ mode: "create" }); };
  const openEdit = (p: Promotion) => {
    setForm({ title: p.title, body: p.body, displayType: p.displayType, audience: p.audience, startsAt: p.startsAt.slice(0, 16), endsAt: p.endsAt.slice(0, 16), ctaLabel: p.ctaLabel ?? "", ctaUrl: p.ctaUrl ?? "", bgColour: p.bgColour, ctaColour: p.ctaColour });
    setModal({ mode: "edit", item: p });
  };
  const save = async () => {
    setSaving(true);
    const p = { ...form, ctaLabel: form.ctaLabel || null, ctaUrl: form.ctaUrl || null };
    if (modal?.mode === "create") await api("POST", "/admin/promotions", p, getToken);
    else await api("PATCH", `/admin/promotions/${modal?.item?.id}`, p, getToken);
    setSaving(false); setModal(null); reload();
  };
  const archive = async (id: string) => {
    if (!confirm("Archive this promotion?")) return;
    await api("DELETE", `/admin/promotions/${id}`, null, getToken);
    reload();
  };

  const filtered = (promos ?? []).filter(p => tab === "active" ? !p.archivedAt : !!p.archivedAt);
  const isActive = (p: Promotion) => !p.archivedAt && new Date(p.endsAt) > new Date();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[var(--color-navy)]">Promotions & Banners</h2>
        <button onClick={openCreate} className="btn-primary px-4 py-2 flex items-center gap-2 text-sm"><Plus size={14} /> New Promotion</button>
      </div>

      <div className="flex gap-2 mb-4">
        {(["active", "archived"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${tab === t ? "bg-[var(--color-navy)] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading && <p className="text-slate-400 text-sm">Loading…</p>}
      <div className="space-y-3">
        {filtered.map(p => (
          <div key={p.id} className="card border border-slate-200 overflow-hidden">
            <div className="h-2" style={{ background: p.bgColour }} />
            <div className="p-4 flex gap-3 items-start">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-1.5 mb-1">
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{p.displayType}</span>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{p.audience}</span>
                  {isActive(p) && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Live</span>}
                  {!p.archivedAt && new Date(p.endsAt) < new Date() && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Expired</span>}
                </div>
                <p className="font-semibold text-sm text-[var(--color-navy)]">{p.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{p.body}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(p.startsAt).toLocaleDateString("en-IN")} – {new Date(p.endsAt).toLocaleDateString("en-IN")}
                </p>
              </div>
              {!p.archivedAt && (
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(p)} className="p-1.5 text-slate-400 hover:text-[var(--color-navy)]"><Pencil size={14} /></button>
                  <button onClick={() => archive(p.id)} className="p-1.5 text-slate-400 hover:text-orange-500"><Archive size={14} /></button>
                </div>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && !loading && <p className="text-slate-400 text-sm">No {tab} promotions.</p>}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white">
              <h3 className="font-bold text-[var(--color-navy)]">{modal.mode === "create" ? "New Promotion" : "Edit Promotion"}</h3>
              <button onClick={() => setModal(null)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Title *</label>
                <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Body *</label>
                <textarea rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none" value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Display Type</label>
                  <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.displayType} onChange={e => setForm(f => ({ ...f, displayType: e.target.value }))}>
                    <option value="banner">Banner</option>
                    <option value="popup">Popup</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Audience</label>
                  <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.audience} onChange={e => setForm(f => ({ ...f, audience: e.target.value }))}>
                    <option value="public">Public</option>
                    <option value="student">Students</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Starts At *</label>
                  <input type="datetime-local" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.startsAt} onChange={e => setForm(f => ({ ...f, startsAt: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Ends At *</label>
                  <input type="datetime-local" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.endsAt} onChange={e => setForm(f => ({ ...f, endsAt: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">CTA Label</label>
                  <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Learn More" value={form.ctaLabel} onChange={e => setForm(f => ({ ...f, ctaLabel: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">CTA URL</label>
                  <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="/admissions" value={form.ctaUrl} onChange={e => setForm(f => ({ ...f, ctaUrl: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Background Colour</label>
                  <div className="flex gap-2">
                    <input type="color" className="w-10 h-9 border border-slate-200 rounded cursor-pointer" value={form.bgColour} onChange={e => setForm(f => ({ ...f, bgColour: e.target.value }))} />
                    <input className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono" value={form.bgColour} onChange={e => setForm(f => ({ ...f, bgColour: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">CTA Colour</label>
                  <div className="flex gap-2">
                    <input type="color" className="w-10 h-9 border border-slate-200 rounded cursor-pointer" value={form.ctaColour} onChange={e => setForm(f => ({ ...f, ctaColour: e.target.value }))} />
                    <input className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono" value={form.ctaColour} onChange={e => setForm(f => ({ ...f, ctaColour: e.target.value }))} />
                  </div>
                </div>
              </div>
              {(form.title || form.body) && (
                <div className="rounded-xl p-4 text-white text-sm" style={{ background: form.bgColour }}>
                  <p className="font-bold">{form.title || "Preview Title"}</p>
                  <p className="text-white/80 text-xs mt-1">{form.body || "Preview body text"}</p>
                  {form.ctaLabel && <button className="mt-2 px-3 py-1 rounded text-xs font-medium" style={{ background: form.ctaColour }}>{form.ctaLabel}</button>}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 px-5 pb-5">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
              <button onClick={save} disabled={saving || !form.title || !form.body || !form.startsAt || !form.endsAt} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

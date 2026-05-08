"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Pencil, Archive, Eye, Megaphone } from "lucide-react";
import type { Promotion } from "@workspace/db/schema";
import { apiUrl } from "@/lib/utils";

function toLocalDatetimeValue(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AddPromotionButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn-primary py-2.5 px-5 text-sm" onClick={() => setOpen(true)}>
        <Plus size={15} /> New Promotion
      </button>
      {open && <PromotionModal onClose={() => setOpen(false)} />}
    </>
  );
}

export function EditPromotionButton({ promo }: { promo: Promotion }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="text-xs font-semibold text-[var(--color-teal)] hover:underline flex items-center gap-1" onClick={() => setOpen(true)}>
        <Pencil size={12} />Edit
      </button>
      {open && <PromotionModal promo={promo} onClose={() => setOpen(false)} />}
    </>
  );
}

export function ArchivePromotionButton({ promoId }: { promoId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleArchive() {
    if (!confirm("Archive this promotion? It will stop showing immediately.")) return;
    setLoading(true);
    await fetch(apiUrl(`/api/v1/promotions/${promoId}`), { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button disabled={loading} onClick={handleArchive} className="text-xs font-semibold text-slate-400 hover:text-[var(--color-maroon)] flex items-center gap-1">
      <Archive size={12} />{loading ? "…" : "Archive"}
    </button>
  );
}

export function PreviewPromotionButton({ promo }: { promo: Promotion }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="text-xs font-semibold text-violet-600 hover:underline flex items-center gap-1">
        <Eye size={12} />Preview
      </button>
      {open && <PromoPreviewModal promo={promo} onClose={() => setOpen(false)} />}
    </>
  );
}

function PromoPreviewModal({ promo, onClose }: { promo: Promotion; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-semibold text-[var(--color-navy)]">Preview — {promo.displayType === "banner" ? "Top Banner" : "Modal Popup"}</h3>
          <button onClick={onClose}><X size={18} className="text-slate-400" /></button>
        </div>

        <div className="p-6 bg-slate-50">
          {promo.displayType === "banner" ? (
            <BannerPreview promo={promo} />
          ) : (
            <PopupPreview promo={promo} />
          )}
        </div>

        <div className="px-5 py-3 border-t bg-white">
          <p className="text-xs text-slate-400">This is an admin preview — the live site shows this to {promo.audience === "both" ? "all users" : promo.audience === "student" ? "logged-in students" : "public visitors"} from {new Date(promo.startsAt).toLocaleString("en-IN")} to {new Date(promo.endsAt).toLocaleString("en-IN")}.</p>
        </div>
      </div>
    </div>
  );
}

function BannerPreview({ promo }: { promo: Promotion }) {
  return (
    <div
      className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg text-white text-sm"
      style={{ backgroundColor: promo.bgColour }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Megaphone size={14} className="shrink-0 opacity-80" />
        <p className="font-semibold truncate">{promo.title}</p>
        <span className="hidden sm:inline text-white/80 text-xs truncate">— {promo.body}</span>
      </div>
      {promo.ctaLabel && promo.ctaUrl && (
        <span
          className="shrink-0 text-xs font-bold px-3 py-1 rounded-full text-white"
          style={{ backgroundColor: promo.ctaColour }}
        >
          {promo.ctaLabel}
        </span>
      )}
      <button className="shrink-0 text-white/60 hover:text-white">
        <X size={14} />
      </button>
    </div>
  );
}

function PopupPreview({ promo }: { promo: Promotion }) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-100 max-w-sm mx-auto overflow-hidden">
      <div className="px-5 py-4 text-white" style={{ backgroundColor: promo.bgColour }}>
        <div className="flex items-center justify-between">
          <p className="font-bold text-base">{promo.title}</p>
          <X size={16} className="text-white/60 cursor-pointer" />
        </div>
      </div>
      <div className="p-5 space-y-4">
        <p className="text-slate-600 text-sm leading-relaxed">{promo.body}</p>
        {promo.ctaLabel && promo.ctaUrl && (
          <button
            className="w-full py-2.5 rounded-lg text-sm font-bold text-white"
            style={{ backgroundColor: promo.ctaColour }}
          >
            {promo.ctaLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function PromotionModal({ promo, onClose }: { promo?: Promotion; onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: promo?.title ?? "",
    body: promo?.body ?? "",
    displayType: promo?.displayType ?? "banner",
    audience: promo?.audience ?? "public",
    startsAt: toLocalDatetimeValue(promo?.startsAt),
    endsAt: toLocalDatetimeValue(promo?.endsAt),
    ctaLabel: promo?.ctaLabel ?? "",
    ctaUrl: promo?.ctaUrl ?? "",
    bgColour: promo?.bgColour ?? "#1a2e5a",
    ctaColour: promo?.ctaColour ?? "#2a9d8f",
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.startsAt || !form.endsAt) { setError("Start and end dates are required"); return; }

    const startsAt = new Date(form.startsAt).toISOString();
    const endsAt = new Date(form.endsAt).toISOString();
    if (new Date(endsAt) <= new Date(startsAt)) { setError("End date must be after start date"); return; }

    setLoading(true);
    const payload = { ...form, startsAt, endsAt };
    const url = promo
      ? apiUrl(`/api/v1/promotions/${promo.id}`)
      : apiUrl("/api/v1/promotions");
    const method = promo ? "PATCH" : "POST";

    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error ?? "Failed to save"); return; }
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <h2 className="font-[family-name:var(--font-playfair)] font-bold text-[var(--color-navy)] text-lg">
            {promo ? "Edit Promotion" : "New Promotion"}
          </h2>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Title *</label>
            <input type="text" value={form.title} onChange={(e) => set("title", e.target.value)} required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Body / Message *</label>
            <textarea value={form.body} onChange={(e) => set("body", e.target.value)} required rows={3}
              placeholder="Main announcement text shown to users…"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Display Type</label>
              <select value={form.displayType} onChange={(e) => set("displayType", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]">
                <option value="banner">Top Banner</option>
                <option value="popup">Modal Popup</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Target Audience</label>
              <select value={form.audience} onChange={(e) => set("audience", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]">
                <option value="public">Public Website</option>
                <option value="student">Student Portal</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Starts At *</label>
              <input type="datetime-local" value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Ends At *</label>
              <input type="datetime-local" value={form.endsAt} onChange={(e) => set("endsAt", e.target.value)} required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">CTA Button Label</label>
              <input type="text" value={form.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)}
                placeholder="e.g. Enrol Now"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">CTA URL</label>
              <input type="url" value={form.ctaUrl} onChange={(e) => set("ctaUrl", e.target.value)}
                placeholder="https://…"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Background Colour</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.bgColour} onChange={(e) => set("bgColour", e.target.value)}
                  className="w-10 h-9 rounded border border-slate-200 cursor-pointer" />
                <input type="text" value={form.bgColour} onChange={(e) => set("bgColour", e.target.value)}
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">CTA Button Colour</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.ctaColour} onChange={(e) => set("ctaColour", e.target.value)}
                  className="w-10 h-9 rounded border border-slate-200 cursor-pointer" />
                <input type="text" value={form.ctaColour} onChange={(e) => set("ctaColour", e.target.value)}
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]" />
              </div>
            </div>
          </div>

          <div
            className="rounded-lg p-3 text-white text-sm flex items-center gap-2"
            style={{ backgroundColor: form.bgColour }}
          >
            <Megaphone size={14} className="opacity-80 shrink-0" />
            <span className="font-semibold truncate">{form.title || "Your title here"}</span>
            {form.ctaLabel && (
              <span className="ml-auto shrink-0 text-xs font-bold px-2.5 py-1 rounded-full text-white"
                style={{ backgroundColor: form.ctaColour }}>{form.ctaLabel}</span>
            )}
          </div>
          <p className="text-xs text-slate-400 -mt-2">Live colour preview above</p>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-outline py-2.5 text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary py-2.5 text-sm">{loading ? "Saving…" : "Save Promotion"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

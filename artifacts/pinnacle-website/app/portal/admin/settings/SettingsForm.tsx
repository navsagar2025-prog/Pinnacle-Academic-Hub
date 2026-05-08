"use client";
import { useState } from "react";
import { AnalyticsSettings } from "./AnalyticsSettings";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

const SETTING_FIELDS = [
  { key: "institute_name", label: "Institute Name", placeholder: "Pinnacle Academic Classes" },
  { key: "tagline", label: "Tagline", placeholder: "Greater Noida's Premier Coaching Institute" },
  { key: "contact_phone", label: "Primary Phone", placeholder: "+91 99990 00111" },
  { key: "contact_email", label: "Email Address", placeholder: "info@pinnacleacademic.in" },
  { key: "whatsapp_number", label: "WhatsApp Number", placeholder: "919999000111" },
  { key: "address_line1", label: "Address Line 1", placeholder: "Knowledge Park II" },
  { key: "address_city", label: "City", placeholder: "Greater Noida, UP — 201306" },
  { key: "maps_url", label: "Google Maps URL", placeholder: "https://maps.google.com/..." },
  { key: "instagram_url", label: "Instagram URL", placeholder: "https://instagram.com/..." },
  { key: "facebook_url", label: "Facebook URL", placeholder: "https://facebook.com/..." },
  { key: "youtube_url", label: "YouTube URL", placeholder: "https://youtube.com/..." },
  { key: "admission_fee_jee", label: "JEE Annual Fee (₹)", placeholder: "48000", type: "number" },
  { key: "admission_fee_neet", label: "NEET Annual Fee (₹)", placeholder: "48000", type: "number" },
  { key: "demo_class_available", label: "Demo Class Available", placeholder: "true / false" },
];

type Props = { settings: Record<string, string> };

export function SettingsForm({ settings }: Props) {
  const [form, setForm] = useState<Record<string, string>>(settings);
  function handleAnalyticsUpdate(key: string, value: string) {
    setForm((p) => ({ ...p, [key]: value }));
  }
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    const res = await fetch(`${BASE}/api/v1/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      const d = await res.json();
      setError(d.error ?? "Failed to save");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {success && (
        <div className="bg-[var(--color-teal)]/10 border border-[var(--color-teal)]/20 rounded-xl px-4 py-3 text-sm text-[var(--color-teal)] font-medium">
          Settings saved successfully.
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <div className="card">
        <h2 className="font-semibold text-[var(--color-navy)] mb-5 pb-3 border-b border-slate-100">Institute Configuration</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {SETTING_FIELDS.map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
              <input
                type={type ?? "text"}
                value={form[key] ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]"
              />
            </div>
          ))}
        </div>
      </div>

      <AnalyticsSettings settings={form} onUpdate={handleAnalyticsUpdate} />

      <div className="card">
        <h2 className="font-semibold text-[var(--color-navy)] mb-1 pb-3 border-b border-slate-100">Script Injection</h2>
        <p className="text-xs text-slate-500 mb-5">
          Paste raw JavaScript snippets (e.g. Google Tag Manager, LiveChat, Clarity). These are injected on every public page.
          The <strong>head injection</strong> runs before page content; the <strong>body injection</strong> runs after all content.
          Do <em>not</em> wrap in <code>&lt;script&gt;</code> tags — paste only the inner code.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Head Injection <span className="font-normal text-slate-400">(runs early — ideal for tag managers &amp; analytics)</span>
            </label>
            <textarea
              value={form["head_injection"] ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, head_injection: e.target.value }))}
              rows={5}
              placeholder={"// Example: Google Tag Manager snippet\n(function(w,d,s,l,i){...})(window,document,'script','dataLayer','GTM-XXXX');"}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)] resize-y"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Body Injection <span className="font-normal text-slate-400">(runs after content — ideal for chat widgets &amp; exit-intent)</span>
            </label>
            <textarea
              value={form["body_injection"] ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, body_injection: e.target.value }))}
              rows={5}
              placeholder={"// Example: LiveChat, HotJar, etc.\n(function(h,o,t,j,a,r){ ... })();"}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)] resize-y"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="btn-primary px-8 py-2.5 text-sm">
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </div>
    </form>
  );
}

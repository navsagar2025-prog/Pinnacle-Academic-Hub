"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Save, Eye, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

type Position = "tile" | "center" | "footer";
type DocTypeKey = "receipt" | "study_material" | "assignment" | "question_bank";
type ScopeKey = "global" | DocTypeKey;

interface RowShape {
  id: string;
  docType: string;
  enabled: boolean;
  textTemplate: string;
  position: string;
  opacity: number;
  rotation: number;
  fontSize: number;
  color: string;
  logoObjectPath: string | null;
  useGlobal: boolean;
}

interface FormState {
  enabled: boolean;
  textTemplate: string;
  position: Position;
  opacity: number;
  rotation: number;
  fontSize: number;
  color: string;
  logoObjectPath: string | null;
  useGlobal: boolean;
}

function rowToForm(r: RowShape | undefined, fallback: FormState): FormState {
  if (!r) return fallback;
  return {
    enabled: r.enabled,
    textTemplate: r.textTemplate,
    position: (r.position as Position) ?? "tile",
    opacity: r.opacity,
    rotation: r.rotation,
    fontSize: r.fontSize,
    color: r.color,
    logoObjectPath: r.logoObjectPath,
    useGlobal: r.useGlobal,
  };
}

export function WatermarkSettingsForm({
  initialGlobal,
  initialOverrides,
  docTypes,
  placeholders,
}: {
  initialGlobal: RowShape;
  initialOverrides: Partial<Record<DocTypeKey, RowShape>>;
  docTypes: { key: DocTypeKey; label: string }[];
  placeholders: { key: string; description: string }[];
}) {
  const [activeScope, setActiveScope] = useState<ScopeKey>("global");
  const initialGlobalForm = rowToForm(initialGlobal, {
    enabled: true,
    textTemplate: "{{centreName}} • {{userName}} • {{date}}",
    position: "tile",
    opacity: 12,
    rotation: 45,
    fontSize: 36,
    color: "#888888",
    logoObjectPath: null,
    useGlobal: false,
  });

  const [forms, setForms] = useState<Record<ScopeKey, FormState>>(() => {
    const initial: Record<string, FormState> = { global: initialGlobalForm };
    for (const dt of docTypes) {
      initial[dt.key] = rowToForm(initialOverrides[dt.key], { ...initialGlobalForm, useGlobal: true });
    }
    return initial as Record<ScopeKey, FormState>;
  });

  const current = forms[activeScope];
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [previewing, setPreviewing] = useState(false);
  const previewObjectUrlRef = useRef<string | null>(null);

  const placeholderInsertRef = useRef<HTMLTextAreaElement | null>(null);

  function update(patch: Partial<FormState>) {
    setForms((f) => ({ ...f, [activeScope]: { ...f[activeScope], ...patch } }));
  }

  function insertPlaceholder(key: string) {
    const ta = placeholderInsertRef.current;
    const tag = `{{${key}}}`;
    if (!ta) {
      update({ textTemplate: (current.textTemplate || "") + tag });
      return;
    }
    const start = ta.selectionStart ?? current.textTemplate.length;
    const end = ta.selectionEnd ?? current.textTemplate.length;
    const next = current.textTemplate.slice(0, start) + tag + current.textTemplate.slice(end);
    update({ textTemplate: next });
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + tag.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  // Effective config used by the preview: when an override has useGlobal=true,
  // the server resolves it to the global config — so the preview should mirror
  // that.
  const effective = useMemo<FormState>(() => {
    if (activeScope === "global") return current;
    if (current.useGlobal) return forms.global;
    return current;
  }, [activeScope, current, forms]);

  async function refreshPreview() {
    setPreviewing(true);
    try {
      const res = await fetch(`${BASE}/api/v1/admin/ops/watermark-preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: activeScope === "global" ? "Watermark Preview" : `Preview: ${activeScope}`,
          config: {
            textTemplate: effective.textTemplate,
            position: effective.position,
            opacity: effective.opacity,
            rotation: effective.rotation,
            fontSize: effective.fontSize,
            color: effective.color,
            logoObjectPath: effective.logoObjectPath,
          },
        }),
      });
      if (!res.ok) throw new Error("Preview failed");
      const blob = await res.blob();
      if (previewObjectUrlRef.current) URL.revokeObjectURL(previewObjectUrlRef.current);
      const url = URL.createObjectURL(blob);
      previewObjectUrlRef.current = url;
      setPreviewUrl(url);
    } catch (e) {
      setFeedback({ ok: false, msg: e instanceof Error ? e.message : "Preview failed" });
    } finally {
      setPreviewing(false);
    }
  }

  // Initial preview + refresh whenever the active config changes (debounced).
  useEffect(() => {
    const t = window.setTimeout(refreshPreview, 350);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    effective.textTemplate,
    effective.position,
    effective.opacity,
    effective.rotation,
    effective.fontSize,
    effective.color,
    effective.logoObjectPath,
  ]);

  useEffect(() => () => {
    if (previewObjectUrlRef.current) URL.revokeObjectURL(previewObjectUrlRef.current);
  }, []);

  async function save() {
    setSaving(true);
    setFeedback(null);
    try {
      const payload =
        activeScope === "global"
          ? {
              docType: "global",
              enabled: current.enabled,
              textTemplate: current.textTemplate,
              position: current.position,
              opacity: current.opacity,
              rotation: current.rotation,
              fontSize: current.fontSize,
              color: current.color,
              logoObjectPath: current.logoObjectPath,
            }
          : {
              docType: activeScope,
              enabled: current.enabled,
              useGlobal: current.useGlobal,
              textTemplate: current.textTemplate,
              position: current.position,
              opacity: current.opacity,
              rotation: current.rotation,
              fontSize: current.fontSize,
              color: current.color,
              logoObjectPath: current.logoObjectPath,
            };
      const res = await fetch(`${BASE}/api/v1/admin/ops/watermark-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Save failed");
      setFeedback({ ok: true, msg: "Saved. New downloads use the updated watermark." });
    } catch (e) {
      setFeedback({ ok: false, msg: e instanceof Error ? e.message : "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  const scopeLabels: { key: ScopeKey; label: string }[] = [
    { key: "global", label: "Global default" },
    ...docTypes.map((d) => ({ key: d.key as ScopeKey, label: d.label })),
  ];

  const isOverride = activeScope !== "global";
  const lockFields = isOverride && current.useGlobal;

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-5">
        <div className="card space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Scope</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {scopeLabels.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setActiveScope(s.key)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    activeScope === s.key
                      ? "bg-[var(--color-navy)] text-white border-[var(--color-navy)]"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={current.enabled}
              onChange={(e) => update({ enabled: e.target.checked })}
            />
            <span className="font-semibold text-[var(--color-navy)]">Watermarking enabled</span>
            {!current.enabled && (
              <span className="text-xs text-amber-600 ml-1">(downloads will be served unstamped)</span>
            )}
          </label>

          {isOverride && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={current.useGlobal}
                onChange={(e) => update({ useGlobal: e.target.checked })}
              />
              <span className="font-semibold text-[var(--color-navy)]">Use global settings for this doc type</span>
            </label>
          )}
        </div>

        <div className={`card space-y-4 ${lockFields ? "opacity-60 pointer-events-none" : ""}`}>
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Text template</label>
            <textarea
              ref={placeholderInsertRef}
              rows={2}
              value={current.textTemplate}
              onChange={(e) => update({ textTemplate: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
              placeholder="{{centreName}} • {{userName}} • {{date}}"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {placeholders.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => insertPlaceholder(p.key)}
                  title={p.description}
                  className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 font-mono"
                >
                  {`{{${p.key}}}`}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Position</span>
              <select
                value={current.position}
                onChange={(e) => update({ position: e.target.value as Position })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="tile">Tile (repeat across page)</option>
                <option value="center">Center (single, rotated)</option>
                <option value="footer">Footer (single, horizontal)</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Color</span>
              <input
                type="color"
                value={current.color.startsWith("#") ? current.color : `#${current.color}`}
                onChange={(e) => update({ color: e.target.value })}
                className="mt-1 w-full h-10 rounded-lg border border-slate-300"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">
                Opacity ({current.opacity}%)
              </span>
              <input
                type="range"
                min={1}
                max={100}
                value={current.opacity}
                onChange={(e) => update({ opacity: Number(e.target.value) })}
                className="mt-2 w-full"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">
                Rotation ({current.rotation}°)
              </span>
              <input
                type="range"
                min={-90}
                max={90}
                value={current.rotation}
                onChange={(e) => update({ rotation: Number(e.target.value) })}
                className="mt-2 w-full"
              />
            </label>
            <label className="block col-span-2">
              <span className="text-xs font-semibold text-slate-600">Font size (pt)</span>
              <input
                type="number"
                min={6}
                max={200}
                value={current.fontSize}
                onChange={(e) => update({ fontSize: Math.max(6, Math.min(200, Number(e.target.value) || 0)) })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">Logo object path (optional)</label>
            <input
              value={current.logoObjectPath ?? ""}
              onChange={(e) => update({ logoObjectPath: e.target.value || null })}
              placeholder="/objects/public/blog/<uuid>"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Upload the logo via the Blog/Gallery image upload, then paste the resulting object
              path here. PNG and JPG are supported.
            </p>
          </div>
        </div>

        {feedback && (
          <div
            className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
              feedback.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}
          >
            {feedback.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />} {feedback.msg}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="btn-primary py-2.5 px-5 text-sm flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={15} /> {saving ? "Saving…" : `Save ${activeScope === "global" ? "global" : activeScope} settings`}
          </button>
          <button
            type="button"
            onClick={refreshPreview}
            className="btn-secondary py-2.5 px-4 text-sm flex items-center gap-2"
          >
            <RefreshCw size={15} className={previewing ? "animate-spin" : ""} /> Refresh preview
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-navy)]">
          <Eye size={15} /> Live preview
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden" style={{ minHeight: 600 }}>
          {previewUrl ? (
            <iframe src={previewUrl} className="w-full" style={{ height: 700, border: 0 }} title="Watermark preview" />
          ) : (
            <div className="text-center text-slate-400 text-sm py-32">Generating preview…</div>
          )}
        </div>
        <p className="text-[11px] text-slate-500">
          Preview uses your own profile (name, email, phone, IP) so you can see how the placeholders
          will be expanded for the downloading user.
        </p>
      </div>
    </div>
  );
}

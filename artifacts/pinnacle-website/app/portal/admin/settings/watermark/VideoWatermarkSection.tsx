"use client";

import { useEffect, useMemo, useState } from "react";
import { Save, Video, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

type Anchor = "tl" | "tr" | "bl" | "br" | "center" | "tm";

interface Cfg {
  enabled: boolean;
  textTemplate: string;
  opacity: number;
  fontSize: number;
  color: string;
  cycleSeconds: number;
  anchors: Anchor[];
}

const ANCHOR_OPTS: { key: Anchor; label: string }[] = [
  { key: "tl", label: "Top-left" },
  { key: "tm", label: "Top-middle" },
  { key: "tr", label: "Top-right" },
  { key: "bl", label: "Bottom-left" },
  { key: "br", label: "Bottom-right" },
  { key: "center", label: "Center" },
];

const ANCHOR_STYLES: Record<Anchor, React.CSSProperties> = {
  tl: { top: 8, left: 8 },
  tr: { top: 8, right: 8 },
  bl: { bottom: 8, left: 8 },
  br: { bottom: 8, right: 8 },
  center: { top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
  tm: { top: 8, left: "50%", transform: "translateX(-50%)" },
};

export function VideoWatermarkSection({
  initialConfig,
  previewName,
  previewPhone,
}: {
  initialConfig: Cfg;
  previewName: string;
  previewPhone: string;
}) {
  const [cfg, setCfg] = useState<Cfg>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [previewIdx, setPreviewIdx] = useState(0);

  // Cycle the preview overlay just like the real one.
  useEffect(() => {
    if (cfg.anchors.length === 0) return;
    const t = window.setInterval(() => {
      setPreviewIdx((i) => (i + 1) % cfg.anchors.length);
    }, Math.max(1, cfg.cycleSeconds) * 1000);
    return () => window.clearInterval(t);
  }, [cfg.cycleSeconds, cfg.anchors.length]);

  function update<K extends keyof Cfg>(k: K, v: Cfg[K]) {
    setCfg((c) => ({ ...c, [k]: v }));
  }

  function toggleAnchor(a: Anchor) {
    setCfg((c) => {
      const has = c.anchors.includes(a);
      const next = has ? c.anchors.filter((x) => x !== a) : [...c.anchors, a];
      return { ...c, anchors: next.length ? next : [a] };
    });
  }

  async function save() {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(`${BASE}/api/v1/admin/ops/video-watermark`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Save failed");
      setFeedback({ ok: true, msg: "Saved. New playbacks use the updated overlay." });
    } catch (e) {
      setFeedback({ ok: false, msg: e instanceof Error ? e.message : "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  const previewText = useMemo(() => {
    return cfg.textTemplate
      .replace(/\{\{\s*userName\s*\}\}/g, previewName)
      .replace(/\{\{\s*userPhone\s*\}\}/g, previewPhone)
      .replace(/\{\{\s*date\s*\}\}/g, new Date().toLocaleDateString("en-IN"));
  }, [cfg.textTemplate, previewName, previewPhone]);

  const anchor = cfg.anchors[previewIdx % Math.max(1, cfg.anchors.length)] ?? "tl";

  return (
    <div className="card space-y-6 mt-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[var(--color-teal)]/10 rounded-xl flex items-center justify-center">
          <Video size={20} className="text-[var(--color-teal)]" />
        </div>
        <div>
          <h2 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">
            Video watermark (recorded classes)
          </h2>
          <p className="text-slate-500 text-xs">
            Cycling personalised overlay over the in-portal video player. Stored in the same
            <span className="font-mono"> watermark_settings </span> table as the PDF watermark.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={cfg.enabled}
              onChange={(e) => update("enabled", e.target.checked)}
            />
            <span className="font-semibold text-[var(--color-navy)]">Overlay enabled</span>
            {!cfg.enabled && (
              <span className="text-xs text-amber-600 ml-1">(students will watch un-watermarked)</span>
            )}
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Text template</span>
            <input
              value={cfg.textTemplate}
              onChange={(e) => update("textTemplate", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
              placeholder="Pinnacle • {{userName}} • {{userPhone}}"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Available placeholders: <code>{"{{userName}}"}</code>, <code>{"{{userPhone}}"}</code>,{" "}
              <code>{"{{userEmail}}"}</code>, <code>{"{{date}}"}</code>.
            </p>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Opacity ({cfg.opacity}%)</span>
              <input
                type="range" min={0} max={100} value={cfg.opacity}
                onChange={(e) => update("opacity", Number(e.target.value))}
                className="mt-2 w-full"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Font size ({cfg.fontSize}px)</span>
              <input
                type="range" min={10} max={48} value={cfg.fontSize}
                onChange={(e) => update("fontSize", Number(e.target.value))}
                className="mt-2 w-full"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Cycle every ({cfg.cycleSeconds}s)</span>
              <input
                type="range" min={3} max={30} value={cfg.cycleSeconds}
                onChange={(e) => update("cycleSeconds", Number(e.target.value))}
                className="mt-2 w-full"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Color</span>
              <input
                type="color"
                value={cfg.color.startsWith("#") ? cfg.color : `#${cfg.color}`}
                onChange={(e) => update("color", e.target.value)}
                className="mt-1 w-full h-10 rounded-lg border border-slate-300"
              />
            </label>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-600">Anchor positions (cycles through these)</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {ANCHOR_OPTS.map((o) => {
                const on = cfg.anchors.includes(o.key);
                return (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => toggleAnchor(o.key)}
                    className={`text-xs px-3 py-1.5 rounded-full border ${on ? "bg-[var(--color-navy)] text-white border-[var(--color-navy)]" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>

          {feedback && (
            <div className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm ${feedback.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {feedback.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />} {feedback.msg}
            </div>
          )}

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="btn-primary py-2.5 px-5 text-sm flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={15} /> {saving ? "Saving…" : "Save video watermark"}
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-navy)]">
            <RefreshCw size={15} /> Live preview (your name + phone)
          </div>
          <div
            className="relative w-full bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl overflow-hidden"
            style={{ aspectRatio: "16 / 9" }}
          >
            <div className="absolute inset-0 flex items-center justify-center text-white/40 text-xs">
              [ video frame ]
            </div>
            {cfg.enabled && (
              <div
                style={{
                  position: "absolute",
                  pointerEvents: "none",
                  fontWeight: 600,
                  fontSize: cfg.fontSize,
                  color: cfg.color,
                  opacity: cfg.opacity / 100,
                  mixBlendMode: "difference",
                  textShadow: "0 1px 2px rgba(0,0,0,0.6)",
                  whiteSpace: "nowrap",
                  transition: "all 0.6s",
                  ...ANCHOR_STYLES[anchor],
                }}
              >
                {previewText}
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            Anchor changes every {cfg.cycleSeconds}s. The real overlay also pauses playback if it
            is removed from the DOM (deterrent only).
          </p>
        </div>
      </div>
    </div>
  );
}

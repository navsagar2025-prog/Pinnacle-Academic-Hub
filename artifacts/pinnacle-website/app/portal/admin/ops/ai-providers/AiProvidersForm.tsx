"use client";

import { useState } from "react";
import { Cpu, Check, AlertCircle, Save, PlugZap } from "lucide-react";

type Provider = "openai" | "gemini" | "anthropic" | "openrouter";

interface FeatureRow {
  key: string;
  label: string;
  provider: Provider;
  model: string;
}

interface ProviderRow {
  key: Provider;
  configured: boolean;
}

const SUGGESTED_MODELS: Record<Provider, string[]> = {
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini", "o4-mini"],
  gemini: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"],
  anthropic: ["claude-sonnet-4-5", "claude-opus-4-5", "claude-haiku-4-5"],
  openrouter: ["openai/gpt-4o", "anthropic/claude-sonnet-4-5", "google/gemini-2.5-pro"],
};

export function AiProvidersForm({
  initialFeatures,
  providers,
}: {
  initialFeatures: FeatureRow[];
  providers: ProviderRow[];
}) {
  const [rows, setRows] = useState<FeatureRow[]>(initialFeatures);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, { ok: boolean; msg: string }>>({});
  const [testResult, setTestResult] = useState<
    Record<string, { ok: boolean; latencyMs: number; msg: string }>
  >({});

  async function testConnection(row: FeatureRow) {
    setTestingKey(row.key);
    setTestResult((t) => ({ ...t, [row.key]: { ok: true, latencyMs: 0, msg: "Testing…" } }));
    try {
      const res = await fetch("/pinnacle-website/api/v1/admin/ops/ai-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: row.provider, model: row.model, featureKey: row.key }),
      });
      const json = await res.json();
      if (json.success) {
        const d = json.data as { ok: boolean; latencyMs: number; reply?: string; error?: string };
        setTestResult((t) => ({
          ...t,
          [row.key]: {
            ok: d.ok,
            latencyMs: d.latencyMs,
            msg: d.ok ? `OK · ${d.latencyMs}ms` : d.error ?? "Failed",
          },
        }));
      } else {
        setTestResult((t) => ({
          ...t,
          [row.key]: { ok: false, latencyMs: 0, msg: json.error ?? "Test failed" },
        }));
      }
    } catch (e) {
      setTestResult((t) => ({
        ...t,
        [row.key]: { ok: false, latencyMs: 0, msg: (e as Error).message },
      }));
    } finally {
      setTestingKey(null);
    }
  }

  async function save(row: FeatureRow) {
    setSavingKey(row.key);
    setFeedback((f) => ({ ...f, [row.key]: { ok: true, msg: "Saving…" } }));
    try {
      const res = await fetch("/pinnacle-website/api/v1/admin/ops/ai-models", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featureKey: row.key, provider: row.provider, model: row.model }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedback((f) => ({ ...f, [row.key]: { ok: true, msg: "Saved" } }));
      } else {
        setFeedback((f) => ({ ...f, [row.key]: { ok: false, msg: json.error ?? "Save failed" } }));
      }
    } catch (e) {
      setFeedback((f) => ({ ...f, [row.key]: { ok: false, msg: (e as Error).message } }));
    } finally {
      setSavingKey(null);
      setTimeout(() => setFeedback((f) => ({ ...f, [row.key]: undefined as never })), 3000);
    }
  }

  function patch(idx: number, patch: Partial<FeatureRow>) {
    setRows((r) => r.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  }

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <h2 className="text-sm font-semibold text-[var(--color-navy)] flex items-center gap-2 mb-3">
          <Cpu size={16} /> Provider connection status
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {providers.map((p) => (
            <div key={p.key} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
              <span className="text-sm capitalize">{p.key}</span>
              <span
                className={`text-xs font-semibold rounded-full px-2 py-0.5 ${
                  p.configured ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                }`}
              >
                {p.configured ? "Configured" : "Not set"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="text-left px-4 py-3">Feature</th>
              <th className="text-left px-4 py-3">Provider</th>
              <th className="text-left px-4 py-3">Model</th>
              <th className="text-right px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, idx) => {
              const fb = feedback[row.key];
              return (
                <tr key={row.key}>
                  <td className="px-4 py-3 align-top">
                    <div className="font-mono text-xs text-slate-500">{row.key}</div>
                    <div className="text-sm text-slate-700">{row.label}</div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <select
                      value={row.provider}
                      onChange={(e) => patch(idx, { provider: e.target.value as Provider, model: SUGGESTED_MODELS[e.target.value as Provider][0] ?? row.model })}
                      className="rounded-md border border-slate-200 px-2 py-1 text-sm"
                    >
                      {providers.map((p) => (
                        <option key={p.key} value={p.key} disabled={!p.configured}>
                          {p.key}{p.configured ? "" : " (not set)"}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <input
                      list={`models-${row.key}`}
                      value={row.model}
                      onChange={(e) => patch(idx, { model: e.target.value })}
                      className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm font-mono"
                    />
                    <datalist id={`models-${row.key}`}>
                      {SUGGESTED_MODELS[row.provider].map((m) => (
                        <option key={m} value={m} />
                      ))}
                    </datalist>
                  </td>
                  <td className="px-4 py-3 align-top text-right">
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      {fb && (
                        <span className={`text-xs flex items-center gap-1 ${fb.ok ? "text-emerald-700" : "text-rose-700"}`}>
                          {fb.ok ? <Check size={12} /> : <AlertCircle size={12} />}
                          {fb.msg}
                        </span>
                      )}
                      {testResult[row.key] && (
                        <span
                          className={`text-xs flex items-center gap-1 ${
                            testResult[row.key].ok ? "text-emerald-700" : "text-rose-700"
                          }`}
                          title={testResult[row.key].msg}
                        >
                          {testResult[row.key].ok ? <Check size={12} /> : <AlertCircle size={12} />}
                          {testResult[row.key].msg.length > 40
                            ? testResult[row.key].msg.slice(0, 40) + "…"
                            : testResult[row.key].msg}
                        </span>
                      )}
                      <button
                        onClick={() => testConnection(row)}
                        disabled={testingKey === row.key}
                        className="btn btn-secondary inline-flex items-center gap-1 text-xs"
                      >
                        <PlugZap size={12} /> {testingKey === row.key ? "Testing…" : "Test"}
                      </button>
                      <button
                        onClick={() => save(row)}
                        disabled={savingKey === row.key}
                        className="btn btn-secondary inline-flex items-center gap-1 text-xs"
                      >
                        <Save size={12} /> Save
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Activity, RefreshCw, Database, HardDrive, Mail, Cpu, AlertTriangle, Clock } from "lucide-react";
import type { HealthSnapshot, ProbeResult, ProbeStatus } from "@/lib/server/ops-health";

const STATUS_COLORS: Record<ProbeStatus, string> = {
  ok: "bg-emerald-100 text-emerald-700 border-emerald-200",
  degraded: "bg-amber-100 text-amber-800 border-amber-200",
  fail: "bg-rose-100 text-rose-700 border-rose-200",
  skipped: "bg-slate-100 text-slate-500 border-slate-200",
};

function ProbeBadge({ p }: { p: ProbeResult }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[p.status]}`}>
        {p.status}
      </span>
      {p.latencyMs !== null && <span className="text-xs text-slate-500 font-mono">{p.latencyMs}ms</span>}
      {p.detail && <span className="text-xs text-slate-500 truncate max-w-[280px]" title={p.detail}>{p.detail}</span>}
    </div>
  );
}

function Tile({ icon, label, probe }: { icon: React.ReactNode; label: string; probe: ProbeResult }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-[var(--color-navy)]">
        {icon}
        {label}
      </div>
      <ProbeBadge p={probe} />
    </div>
  );
}

const CRON_HEALTH: Record<"green" | "amber" | "red", string> = {
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-rose-100 text-rose-700",
};

export function HealthDashboard({ initial }: { initial: HealthSnapshot }) {
  const [snap, setSnap] = useState<HealthSnapshot>(initial);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  async function refresh(force = false) {
    setLoading(true);
    try {
      const res = await fetch(`/pinnacle-website/api/v1/admin/ops/health${force ? "?force=1" : ""}`);
      const json = await res.json();
      if (json.success) setSnap(json.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => refresh(false), 30_000);
    return () => clearInterval(id);
  }, [autoRefresh]);

  const generatedAgoSec = Math.floor((Date.now() - new Date(snap.generatedAt).getTime()) / 1000);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--color-navy)]/10 rounded-xl flex items-center justify-center">
            <Activity size={20} className="text-[var(--color-navy)]" />
          </div>
          <div>
            <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">System Health</h1>
            <p className="text-slate-500 text-sm">Snapshot {generatedAgoSec}s ago · auto-refresh every 30s</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-slate-500">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="accent-[var(--color-navy)]"
            />
            Auto-refresh
          </label>
          <button
            className="btn btn-secondary inline-flex items-center gap-2 text-sm"
            onClick={() => refresh(true)}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh now
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Tile icon={<Database size={16} />} label="PostgreSQL" probe={snap.database} />
        <Tile icon={<HardDrive size={16} />} label="Object Storage (GCS)" probe={snap.objectStorage} />
        <Tile icon={<Mail size={16} />} label="Resend Email" probe={snap.resend} />
        <Tile icon={<Cpu size={16} />} label="OpenAI" probe={snap.ai.openai} />
        <Tile icon={<Cpu size={16} />} label="Gemini" probe={snap.ai.gemini} />
        <Tile icon={<Cpu size={16} />} label="Anthropic" probe={snap.ai.anthropic} />
        <Tile icon={<Cpu size={16} />} label="OpenRouter" probe={snap.ai.openrouter} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-[var(--color-navy)] flex items-center gap-2 mb-3">
            <Clock size={16} /> Cron Heartbeats
          </h2>
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500 uppercase">
              <tr>
                <th className="text-left py-1">Job</th>
                <th className="text-left py-1">Last run</th>
                <th className="text-right py-1">Health</th>
              </tr>
            </thead>
            <tbody>
              {snap.cronHeartbeats.map((c) => (
                <tr key={c.job} className="border-t border-slate-100">
                  <td className="py-2 font-mono text-xs">{c.job}</td>
                  <td className="py-2 text-xs text-slate-600">
                    {c.lastRunAt
                      ? `${new Date(c.lastRunAt).toLocaleString("en-IN")} (${c.ageHours!.toFixed(1)}h ago)`
                      : "never"}
                  </td>
                  <td className="py-2 text-right">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${CRON_HEALTH[c.health]}`}>
                      {c.health}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card p-4">
          <h2 className="text-sm font-semibold text-[var(--color-navy)] mb-3">Process</h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-slate-500">Node</dt><dd className="font-mono text-xs">{snap.process.nodeVersion}</dd>
            <dt className="text-slate-500">Uptime</dt><dd className="font-mono text-xs">{Math.floor(snap.process.uptimeSec / 60)}m {snap.process.uptimeSec % 60}s</dd>
            <dt className="text-slate-500">RSS</dt><dd className="font-mono text-xs">{snap.process.rssMb} MB</dd>
            <dt className="text-slate-500">Heap used</dt><dd className="font-mono text-xs">{snap.process.heapUsedMb} MB</dd>
          </dl>
        </div>
      </div>

      <div className="card p-4">
        <h2 className="text-sm font-semibold text-[var(--color-navy)] flex items-center gap-2 mb-3">
          <AlertTriangle size={16} /> Recent Errors (in-process, last 20)
        </h2>
        {snap.recentErrors.length === 0 ? (
          <p className="text-sm text-slate-400">No errors captured this process lifetime.</p>
        ) : (
          <pre className="text-xs bg-slate-50 rounded-md p-3 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-96 text-slate-700">
{snap.recentErrors.join("\n")}
          </pre>
        )}
      </div>
    </div>
  );
}

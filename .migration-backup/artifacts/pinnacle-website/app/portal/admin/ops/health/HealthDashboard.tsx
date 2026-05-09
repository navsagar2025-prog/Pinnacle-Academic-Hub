"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Activity, RefreshCw, Database, HardDrive, Mail, Cpu,
  AlertTriangle, Clock, Server, Trash2, ScanSearch,
  CheckCircle2, XCircle, Loader2,
} from "lucide-react";
import dynamic from "next/dynamic";
import type { HealthSnapshot, ProbeResult, ProbeStatus } from "@/lib/server/ops-health";

const LineChartClient = dynamic(() => import("@/components/charts/LineChartClient"), { ssr: false });

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface SystemStats {
  cpu: { percent: number | null };
  memory: { usedMb: number; totalMb: number; freeMb: number };
  disk: { usedGb: number | null; totalGb: number | null };
  process: { uptimeSec: number; rssMb: number; heapUsedMb: number; heapTotalMb: number; nodeVersion: string };
}

interface DbTable {
  table_name: string;
  row_count: number;
  total_size: string;
  total_size_bytes: number;
  index_size: string;
}

interface DbStats {
  tables: DbTable[];
  total: { pretty: string; mb: number };
}

interface SparkRow {
  day: string;
  cpu: number;
  disk: number;
  mem: number;
  [key: string]: string | number;
}

type CleanupTarget =
  | "expired_stream_tokens"
  | "expired_reset_tokens"
  | "expired_impersonation_sessions"
  | "old_audit_logs"
  | "old_rate_limit_hits"
  | "old_security_events";

interface CleanupResult {
  dryRun: boolean;
  count?: number;
  deleted?: number;
  description: string;
}

interface OrphanFile { name: string; sizeBytes: number; updated: string }

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";
const apiFetch = (path: string, opts?: RequestInit) => fetch(`${BASE}${path}`, opts);

// ---------------------------------------------------------------------------
// Sub-components — existing probe tiles
// ---------------------------------------------------------------------------
const STATUS_COLORS: Record<ProbeStatus, string> = {
  ok:       "bg-emerald-100 text-emerald-700 border-emerald-200",
  degraded: "bg-amber-100  text-amber-800  border-amber-200",
  fail:     "bg-rose-100   text-rose-700   border-rose-200",
  skipped:  "bg-slate-100  text-slate-500  border-slate-200",
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
      <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-[var(--color-navy)]">{icon}{label}</div>
      <ProbeBadge p={probe} />
    </div>
  );
}

const CRON_HEALTH: Record<"green" | "amber" | "red", string> = {
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-800",
  red:   "bg-rose-100 text-rose-700",
};

// ---------------------------------------------------------------------------
// Gauge bar
// ---------------------------------------------------------------------------
function GaugeBar({ value, max, color = "#0A1F5C", unit = "%" }: {
  value: number; max: number; color?: string; unit?: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const barColor = pct > 85 ? "#dc2626" : pct > 70 ? "#d97706" : color;
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>{value.toFixed(1)}{unit}</span>
        <span>{max.toFixed(1)}{unit}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: barColor }} />
      </div>
      <p className="text-right text-xs text-slate-400 mt-0.5">{pct}%</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cleanup action row
// ---------------------------------------------------------------------------
const CLEANUP_LABELS: Record<CleanupTarget, string> = {
  expired_stream_tokens:          "Expired recording stream tokens",
  expired_reset_tokens:           "Expired password-reset tokens",
  expired_impersonation_sessions: "Expired impersonation sessions",
  old_audit_logs:                 "Audit logs > 180 days",
  old_rate_limit_hits:            "Rate-limit hits > 24 h",
  old_security_events:            "Security events > 90 days",
};

function CleanupRow({ target }: { target: CleanupTarget }) {
  const [state, setState] = useState<"idle" | "counting" | "confirming" | "deleting" | "done">("idle");
  const [count, setCount] = useState<number | null>(null);
  const [deleted, setDeleted] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function dryRun() {
    setState("counting");
    setError(null);
    try {
      const res = await apiFetch("/api/v1/admin/ops/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setCount(json.data.count);
      setState("confirming");
    } catch (e) {
      setError((e as Error).message);
      setState("idle");
    }
  }

  async function confirm() {
    setState("deleting");
    try {
      const res = await apiFetch("/api/v1/admin/ops/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, confirm: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setDeleted(json.data.deleted ?? 0);
      setState("done");
    } catch (e) {
      setError((e as Error).message);
      setState("idle");
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b last:border-b-0 border-slate-100">
      <div>
        <p className="text-sm font-medium text-slate-700">{CLEANUP_LABELS[target]}</p>
        {state === "confirming" && count !== null && (
          <p className="text-xs text-amber-600 mt-0.5">{count} rows will be deleted</p>
        )}
        {state === "done" && deleted !== null && (
          <p className="text-xs text-emerald-600 mt-0.5 flex items-center gap-1"><CheckCircle2 size={11} /> Deleted {deleted} rows</p>
        )}
        {error && <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1"><XCircle size={11} /> {error}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {(state === "idle" || state === "done") && (
          <button onClick={dryRun} className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
            Dry run
          </button>
        )}
        {state === "counting" && <Loader2 size={14} className="animate-spin text-slate-400" />}
        {state === "confirming" && (
          <>
            <button onClick={() => setState("idle")} className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500">Cancel</button>
            <button onClick={confirm} className="text-xs px-3 py-1.5 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700">
              Delete {count} rows
            </button>
          </>
        )}
        {state === "deleting" && <Loader2 size={14} className="animate-spin text-slate-400" />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main dashboard
// ---------------------------------------------------------------------------
export function HealthDashboard({
  initial,
  initialSnapshots,
}: {
  initial: HealthSnapshot;
  initialSnapshots: SparkRow[];
}) {
  const [snap, setSnap] = useState<HealthSnapshot>(initial);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Server resource stats (polled every 30 s)
  const [sysStats, setSysStats] = useState<SystemStats | null>(null);
  const [sysLoading, setSysLoading] = useState(false);

  // DB stats
  const [dbStats, setDbStats] = useState<DbStats | null>(null);
  const [dbLoading, setDbLoading] = useState(false);
  const [vacuuming, setVacuuming] = useState(false);
  const [vacuumed, setVacuumed] = useState(false);

  // Storage stats
  const [storageConfigured, setStorageConfigured] = useState<boolean | null>(null);
  const [storageCount, setStorageCount] = useState<number | null>(null);
  const [storageBytes, setStorageBytes] = useState<number | null>(null);
  const [storageLoading, setStorageLoading] = useState(false);
  const [orphans, setOrphans] = useState<OrphanFile[] | null>(null);
  const [scanLoading, setScanLoading] = useState(false);

  // Sparkline data
  const [sparkRows] = useState<SparkRow[]>(initialSnapshots);

  // ---- Probe refresh ----
  async function refreshProbes(force = false) {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/v1/admin/ops/health${force ? "?force=1" : ""}`);
      const json = await res.json();
      if (json.success) setSnap(json.data);
    } finally { setLoading(false); }
  }

  // ---- System stats ----
  const loadSysStats = useCallback(async () => {
    setSysLoading(true);
    try {
      const res = await apiFetch("/api/v1/admin/ops/system-stats");
      const json = await res.json();
      if (json.success) setSysStats(json.data);
    } finally { setSysLoading(false); }
  }, []);

  // ---- DB stats ----
  const loadDbStats = useCallback(async () => {
    setDbLoading(true);
    try {
      const res = await apiFetch("/api/v1/admin/ops/db-stats");
      const json = await res.json();
      if (json.success) setDbStats(json.data);
    } finally { setDbLoading(false); }
  }, []);

  async function runVacuum() {
    setVacuuming(true);
    try {
      const res = await apiFetch("/api/v1/admin/ops/db-stats?vacuum=1");
      const json = await res.json();
      if (res.ok && json.success) {
        setVacuumed(true);
        setTimeout(() => setVacuumed(false), 3000);
      }
    } finally {
      setVacuuming(false);
      await loadDbStats();
    }
  }

  // ---- Storage stats ----
  const loadStorageStats = useCallback(async () => {
    setStorageLoading(true);
    try {
      const res = await apiFetch("/api/v1/admin/ops/storage-stats");
      const json = await res.json();
      if (json.success) {
        setStorageConfigured(json.data.configured);
        setStorageCount(json.data.objectCount ?? null);
        setStorageBytes(json.data.totalBytes ?? null);
      }
    } finally { setStorageLoading(false); }
  }, []);

  async function scanOrphans() {
    setScanLoading(true);
    try {
      const res = await apiFetch("/api/v1/admin/ops/storage-stats?scan=orphans");
      const json = await res.json();
      if (json.success) setOrphans(json.data.orphans ?? []);
    } finally { setScanLoading(false); }
  }

  // ---- Initial loads + polling ----
  useEffect(() => {
    loadSysStats();
    loadDbStats();
    loadStorageStats();
  }, [loadSysStats, loadDbStats, loadStorageStats]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      refreshProbes(false);
      loadSysStats();
    }, 30_000);
    return () => clearInterval(id);
  }, [autoRefresh, loadSysStats]);

  const generatedAgoSec = Math.floor((Date.now() - new Date(snap.generatedAt).getTime()) / 1000);

  function fmtBytes(b: number) {
    if (b >= 1_073_741_824) return `${(b / 1_073_741_824).toFixed(2)} GB`;
    if (b >= 1_048_576)     return `${(b / 1_048_576).toFixed(1)} MB`;
    if (b >= 1024)          return `${(b / 1024).toFixed(1)} KB`;
    return `${b} B`;
  }

  function fmtUptime(s: number) {
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    return d > 0 ? `${d}d ${h}h ${m}m` : h > 0 ? `${h}h ${m}m` : `${m}m ${s % 60}s`;
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
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
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="accent-[var(--color-navy)]" />
            Auto-refresh
          </label>
          <button className="btn btn-secondary inline-flex items-center gap-2 text-sm" onClick={() => { refreshProbes(true); loadSysStats(); }} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh now
          </button>
        </div>
      </div>

      {/* ── Section 1: Server Resources ── */}
      <section className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--color-navy)] flex items-center gap-2"><Server size={15} /> Server Resources</h2>
          {sysLoading && <Loader2 size={14} className="animate-spin text-slate-400" />}
        </div>

        {sysStats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* CPU */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">CPU Usage</p>
              {sysStats.cpu.percent !== null ? (
                <GaugeBar value={sysStats.cpu.percent} max={100} unit="%" />
              ) : (
                <p className="text-xs text-slate-400">/proc/stat unavailable</p>
              )}
            </div>
            {/* Memory */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Memory</p>
              <GaugeBar value={sysStats.memory.usedMb} max={sysStats.memory.totalMb} unit=" MB" />
            </div>
            {/* Disk */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Disk /</p>
              {sysStats.disk.usedGb !== null && sysStats.disk.totalGb !== null ? (
                <GaugeBar value={sysStats.disk.usedGb} max={sysStats.disk.totalGb} unit=" GB" />
              ) : (
                <p className="text-xs text-slate-400">df unavailable</p>
              )}
            </div>
            {/* Process */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Process</p>
              <dl className="space-y-1 text-xs">
                <div className="flex justify-between"><dt className="text-slate-500">Uptime</dt><dd className="font-mono">{fmtUptime(sysStats.process.uptimeSec)}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">RSS</dt><dd className="font-mono">{sysStats.process.rssMb} MB</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Heap</dt><dd className="font-mono">{sysStats.process.heapUsedMb}/{sysStats.process.heapTotalMb} MB</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Node</dt><dd className="font-mono">{sysStats.process.nodeVersion}</dd></div>
              </dl>
            </div>
          </div>
        ) : (
          <div className="h-16 flex items-center justify-center text-slate-400 text-sm">Loading…</div>
        )}
      </section>

      {/* ── Section 2: Connectivity Probes ── */}
      <section>
        <h2 className="text-sm font-semibold text-[var(--color-navy)] flex items-center gap-2 mb-3"><Activity size={15} /> Connectivity Probes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Tile icon={<Database size={16} />} label="PostgreSQL" probe={snap.database} />
          <Tile icon={<HardDrive size={16} />} label="Object Storage (GCS)" probe={snap.objectStorage} />
          <Tile icon={<Mail size={16} />} label="Resend Email" probe={snap.resend} />
          <Tile icon={<Cpu size={16} />} label="OpenAI" probe={snap.ai.openai} />
          <Tile icon={<Cpu size={16} />} label="Gemini" probe={snap.ai.gemini} />
          <Tile icon={<Cpu size={16} />} label="Anthropic" probe={snap.ai.anthropic} />
          <Tile icon={<Cpu size={16} />} label="OpenRouter" probe={snap.ai.openrouter} />
        </div>
      </section>

      {/* ── Section 3: Database ── */}
      <section className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--color-navy)] flex items-center gap-2"><Database size={15} /> Database Tables</h2>
          <div className="flex items-center gap-2">
            {dbLoading && <Loader2 size={14} className="animate-spin text-slate-400" />}
            {vacuumed && <span className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 size={12} /> ANALYZE done</span>}
            <button onClick={runVacuum} disabled={vacuuming || dbLoading}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1.5">
              {vacuuming ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
              ANALYZE
            </button>
            <button onClick={loadDbStats} disabled={dbLoading}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
              Refresh
            </button>
          </div>
        </div>

        {dbStats ? (
          <>
            <p className="text-xs text-slate-500">Total DB size: <span className="font-semibold text-slate-700">{dbStats.total.pretty}</span></p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                  <tr>
                    {["Table", "Rows", "Total Size", "Index Size"].map((h) => (
                      <th key={h} className="text-left px-3 py-2 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {dbStats.tables.map((t) => (
                    <tr key={t.table_name} className="hover:bg-slate-50/50">
                      <td className="px-3 py-2 font-mono text-xs text-slate-700">{t.table_name}</td>
                      <td className="px-3 py-2 text-xs text-right font-mono">{t.row_count.toLocaleString()}</td>
                      <td className="px-3 py-2 text-xs text-right font-mono text-slate-500">{t.total_size}</td>
                      <td className="px-3 py-2 text-xs text-right font-mono text-slate-400">{t.index_size}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="h-20 flex items-center justify-center text-slate-400 text-sm">Loading…</div>
        )}
      </section>

      {/* ── Section 4: Object Storage ── */}
      <section className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--color-navy)] flex items-center gap-2"><HardDrive size={15} /> Object Storage</h2>
          <div className="flex items-center gap-2">
            {(storageLoading || scanLoading) && <Loader2 size={14} className="animate-spin text-slate-400" />}
            <button onClick={loadStorageStats} disabled={storageLoading}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
              Refresh
            </button>
            {storageConfigured && (
              <button onClick={scanOrphans} disabled={scanLoading}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1.5">
                <ScanSearch size={12} /> Scan orphans
              </button>
            )}
          </div>
        </div>

        {storageConfigured === false ? (
          <p className="text-sm text-slate-400">Object storage not configured (DEFAULT_OBJECT_STORAGE_BUCKET_ID not set).</p>
        ) : storageConfigured === null ? (
          <div className="h-12 flex items-center justify-center text-slate-400 text-sm">Loading…</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-[var(--color-navy)]">{storageCount?.toLocaleString() ?? "—"}</p>
              <p className="text-xs text-slate-500 mt-1">Total Objects</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-[var(--color-navy)]">{storageBytes !== null ? fmtBytes(storageBytes) : "—"}</p>
              <p className="text-xs text-slate-500 mt-1">Total Size</p>
            </div>
          </div>
        )}

        {orphans !== null && (
          <div className="mt-2">
            <p className="text-xs font-semibold text-slate-600 mb-2">
              {orphans.length === 0 ? "No orphaned files found 🎉" : `${orphans.length} possible orphaned file${orphans.length !== 1 ? "s" : ""}`}
            </p>
            {orphans.length > 0 && (
              <div className="overflow-x-auto border border-slate-100 rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
                    <tr>
                      <th className="text-left px-3 py-2">Path</th>
                      <th className="text-right px-3 py-2">Size</th>
                      <th className="text-right px-3 py-2">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {orphans.map((f) => (
                      <tr key={f.name}>
                        <td className="px-3 py-2 font-mono text-slate-700 max-w-[260px] truncate">{f.name}</td>
                        <td className="px-3 py-2 text-right text-slate-500">{fmtBytes(f.sizeBytes)}</td>
                        <td className="px-3 py-2 text-right text-slate-400">{new Date(f.updated).toLocaleDateString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Section 5: Cleanup Actions ── */}
      <section className="card p-5">
        <h2 className="text-sm font-semibold text-[var(--color-navy)] flex items-center gap-2 mb-1"><Trash2 size={15} /> Cleanup Actions</h2>
        <p className="text-xs text-slate-400 mb-4">Run a dry-run first to see how many rows will be affected before confirming deletion.</p>
        {(["expired_stream_tokens", "expired_reset_tokens", "expired_impersonation_sessions", "old_audit_logs", "old_rate_limit_hits", "old_security_events"] as CleanupTarget[])
          .map((t) => <CleanupRow key={t} target={t} />)}
      </section>

      {/* ── Section 6: Cron Heartbeats + Process ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-[var(--color-navy)] flex items-center gap-2 mb-3"><Clock size={16} /> Cron Heartbeats</h2>
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
                    {c.lastRunAt ? `${new Date(c.lastRunAt).toLocaleString("en-IN")} (${c.ageHours!.toFixed(1)}h ago)` : "never"}
                  </td>
                  <td className="py-2 text-right">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${CRON_HEALTH[c.health]}`}>{c.health}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card p-4">
          <h2 className="text-sm font-semibold text-[var(--color-navy)] mb-3">Process Info</h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-slate-500">Node</dt><dd className="font-mono text-xs">{snap.process.nodeVersion}</dd>
            <dt className="text-slate-500">Uptime</dt><dd className="font-mono text-xs">{Math.floor(snap.process.uptimeSec / 60)}m {snap.process.uptimeSec % 60}s</dd>
            <dt className="text-slate-500">RSS</dt><dd className="font-mono text-xs">{snap.process.rssMb} MB</dd>
            <dt className="text-slate-500">Heap used</dt><dd className="font-mono text-xs">{snap.process.heapUsedMb} MB</dd>
          </dl>
        </div>
      </div>

      {/* ── Section 7: 30-day Sparklines ── */}
      {sparkRows.length > 0 && (
        <section className="card p-5 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-navy)] flex items-center gap-2 mb-1"><Activity size={15} /> 30-Day Trends</h2>
            <p className="text-xs text-slate-400">Recorded by the health-snapshot cron endpoint. Older snapshots show as the leftmost points.</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">CPU %</p>
            <LineChartClient
              data={sparkRows}
              xKey="day"
              lines={[{ key: "cpu", label: "CPU %", color: "#0A1F5C" }]}
              height={140}
              unit="%"
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Disk Used (GB)</p>
            <LineChartClient
              data={sparkRows}
              xKey="day"
              lines={[{ key: "disk", label: "Disk GB", color: "#0D7377" }]}
              height={140}
              unit=" GB"
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Memory Used (MB)</p>
            <LineChartClient
              data={sparkRows}
              xKey="day"
              lines={[{ key: "mem", label: "Mem MB", color: "#8B1A1A" }]}
              height={140}
              unit=" MB"
            />
          </div>
        </section>
      )}

      {sparkRows.length === 0 && (
        <div className="card p-5 text-center text-slate-400">
          <Activity size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No health snapshots yet. Call <code className="font-mono text-xs bg-slate-100 px-1 rounded">POST /api/v1/admin/ops/health-snapshot</code> from a cron job to start building the 30-day trend.</p>
        </div>
      )}

      {/* ── Section 8: Recent Errors ── */}
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

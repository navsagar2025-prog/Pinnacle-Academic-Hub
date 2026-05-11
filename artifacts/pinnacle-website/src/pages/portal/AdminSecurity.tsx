import { useState, useEffect, useCallback } from "react";
import { Shield, BarChart2, ClipboardList, RefreshCw, Unlock } from "lucide-react";
import { useToast, SkeletonList, apiMutation } from "./portalUtils";

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

type SecurityEvent = { id: string; eventType: string; actorEmail: string | null; ip: string | null; route: string | null; outcome: string; createdAt: string };
type IpLockout = { id: string; ip: string; attempts: number; lockedUntil: string | null; route: string | null; unlockedAt: string | null; createdAt: string };
type AuditLog = { id: string; actorName: string | null; action: string; entityType: string | null; entityId: string | null; createdAt: string };
type PageViewData = { date: string; total: number };
type TopPage = { path: string; total: number };

const OUTCOME_COLORS: Record<string, string> = { success: "bg-green-100 text-green-700", fail: "bg-red-100 text-red-700", blocked: "bg-orange-100 text-orange-700" };

// ─── Analytics ────────────────────────────────────────────────────────────────
export function AdminAnalytics({ getToken }: { getToken: () => Promise<string | null> }) {
  const { data: pageviews, loading: pvLoading } = useFetch<PageViewData[]>("/admin/analytics/pageviews?days=30", getToken);
  const { data: topPages, loading: tpLoading } = useFetch<TopPage[]>("/admin/analytics/top-pages?days=30", getToken);

  const maxCount = Math.max(...(pageviews ?? []).map(p => p.total), 1);

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <BarChart2 size={20} className="text-[var(--color-teal)]" />
        <h2 className="text-xl font-bold text-[var(--color-navy)]">Analytics (Last 30 Days)</h2>
      </div>

      <div className="card border border-slate-200 mb-6">
        <h3 className="font-semibold text-sm text-[var(--color-navy)] mb-4">Page Views Over Time</h3>
        {pvLoading && <SkeletonList rows={1} />}
        {!pvLoading && (pageviews ?? []).length === 0 && <p className="text-slate-400 text-sm">No page view data yet.</p>}
        {!pvLoading && (pageviews ?? []).length > 0 && (
          <div className="flex items-end gap-0.5 h-32">
            {(pageviews ?? []).slice(-30).map(d => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="relative flex-1 w-full flex items-end">
                  <div
                    className="w-full bg-[var(--color-teal)] rounded-sm opacity-70 group-hover:opacity-100 transition-opacity"
                    style={{ height: `${(d.total / maxCount) * 100}%`, minHeight: "2px" }}
                  />
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[var(--color-navy)] text-white text-xs px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                    {d.date.slice(5)}: {d.total}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card border border-slate-200">
        <h3 className="font-semibold text-sm text-[var(--color-navy)] mb-4">Top Pages</h3>
        {tpLoading && <SkeletonList rows={4} />}
        <div className="space-y-2">
          {(topPages ?? []).slice(0, 10).map((p, i) => {
            const maxTP = topPages?.[0]?.total ?? 1;
            return (
              <div key={p.path} className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-4 text-right shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-xs font-mono text-slate-700 truncate">{p.path}</p>
                    <span className="text-xs text-slate-500 shrink-0">{p.total}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--color-teal)] rounded-full" style={{ width: `${(p.total / maxTP) * 100}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
          {(topPages ?? []).length === 0 && !tpLoading && <p className="text-slate-400 text-sm">No data yet.</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Security ─────────────────────────────────────────────────────────────────
export function AdminSecurity({ getToken }: { getToken: () => Promise<string | null> }) {
  const { toast } = useToast();
  const [tab, setTab] = useState<"events" | "lockouts" | "audit">("events");
  const { data: events, loading: evLoading, reload: reloadEvents } = useFetch<SecurityEvent[]>("/admin/security/events", getToken);
  const { data: lockouts, loading: loLoading, reload: reloadLockouts } = useFetch<IpLockout[]>("/admin/security/lockouts", getToken);
  const { data: auditLogs, loading: alLoading, reload: reloadAudit } = useFetch<AuditLog[]>("/admin/audit-log", getToken);
  const [unlocking, setUnlocking] = useState<string | null>(null);

  const unlock = async (id: string) => {
    setUnlocking(id);
    const res = await apiMutation("PATCH", `/admin/security/lockouts/${id}/unlock`, {}, getToken);
    if (res.ok) { toast("success", "IP unlocked"); reloadLockouts(); }
    else toast("error", "Unlock failed");
    setUnlocking(null);
  };

  const tabs = [
    { key: "events", label: "Security Events", Icon: Shield },
    { key: "lockouts", label: "IP Lockouts", Icon: Shield },
    { key: "audit", label: "Audit Log", Icon: ClipboardList },
  ] as const;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Shield size={20} className="text-[var(--color-teal)]" />
          <h2 className="text-xl font-bold text-[var(--color-navy)]">Security</h2>
        </div>
        <button onClick={() => { reloadEvents(); reloadLockouts(); reloadAudit(); }} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[var(--color-navy)]">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {tabs.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key as typeof tab)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${tab === key ? "bg-[var(--color-navy)] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "events" && (
        <div className="space-y-2">
          {evLoading && <SkeletonList rows={5} />}
          {(events ?? []).map(e => (
            <div key={e.id} className="card border border-slate-200 flex gap-3 items-center text-sm">
              <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${OUTCOME_COLORS[e.outcome] ?? "bg-slate-100 text-slate-600"}`}>{e.outcome}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 text-xs">{e.eventType}</p>
                <p className="text-xs text-slate-400 truncate">{e.actorEmail ?? "—"}{e.ip && ` · ${e.ip}`}{e.route && ` · ${e.route}`}</p>
              </div>
              <p className="text-xs text-slate-400 shrink-0">{new Date(e.createdAt).toLocaleString("en-IN")}</p>
            </div>
          ))}
          {(events ?? []).length === 0 && !evLoading && <p className="text-slate-400 text-sm">No security events yet.</p>}
        </div>
      )}

      {tab === "lockouts" && (
        <div className="space-y-2">
          {loLoading && <SkeletonList rows={3} />}
          {(lockouts ?? []).map(l => (
            <div key={l.id} className="card border border-slate-200 flex gap-3 items-center">
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm font-medium text-[var(--color-navy)]">{l.ip}</p>
                <p className="text-xs text-slate-500">{l.attempts} attempts{l.route && ` on ${l.route}`}</p>
                {l.lockedUntil && <p className="text-xs text-red-500">Locked until: {new Date(l.lockedUntil).toLocaleString("en-IN")}</p>}
                {l.unlockedAt && <p className="text-xs text-green-600">Unlocked: {new Date(l.unlockedAt).toLocaleString("en-IN")}</p>}
              </div>
              {l.lockedUntil && !l.unlockedAt && (
                <button onClick={() => unlock(l.id)} disabled={unlocking === l.id} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 disabled:opacity-50">
                  <Unlock size={12} /> {unlocking === l.id ? "Unlocking…" : "Unlock"}
                </button>
              )}
            </div>
          ))}
          {(lockouts ?? []).length === 0 && !loLoading && <p className="text-slate-400 text-sm">No active IP lockouts.</p>}
        </div>
      )}

      {tab === "audit" && (
        <div className="space-y-2">
          {alLoading && <SkeletonList rows={5} />}
          {(auditLogs ?? []).map(a => (
            <div key={a.id} className="card border border-slate-200 text-sm">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">{a.action}</span>
                {a.entityType && <span className="text-xs text-slate-500">{a.entityType}</span>}
                <span className="text-xs text-slate-400 ml-auto">{new Date(a.createdAt).toLocaleString("en-IN")}</span>
              </div>
              <p className="text-xs text-slate-500">{a.actorName ?? "System"}{a.entityId && ` · ${a.entityId.slice(0, 8)}…`}</p>
            </div>
          ))}
          {(auditLogs ?? []).length === 0 && !alLoading && <p className="text-slate-400 text-sm">No audit log entries yet.</p>}
        </div>
      )}
    </div>
  );
}

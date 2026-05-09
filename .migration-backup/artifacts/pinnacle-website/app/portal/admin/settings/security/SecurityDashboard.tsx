"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Shield,
  ShieldOff,
  Lock,
  Unlock,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
} from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

interface LockoutRow {
  id: string;
  ip: string;
  attempts: number;
  lockedUntil: string | null;
  route: string | null;
  unlockedAt: string | null;
  unlockedBy: string | null;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

interface EventRow {
  id: string;
  eventType: string;
  actorEmail: string | null;
  ip: string | null;
  userAgent: string | null;
  route: string | null;
  outcome: string;
  createdAt: string;
}

const OUTCOME_BADGE: Record<string, string> = {
  success: "bg-emerald-100 text-emerald-700",
  fail: "bg-red-100 text-red-700",
  blocked: "bg-amber-100 text-amber-800",
};

const EVENT_BADGE: Record<string, string> = {
  login_success: "bg-emerald-100 text-emerald-700",
  login_fail: "bg-red-100 text-red-700",
  rate_limited: "bg-amber-100 text-amber-800",
  ip_blocked: "bg-rose-100 text-rose-700",
  ip_unblocked: "bg-sky-100 text-sky-700",
};

const PAGE_SIZE = 50;

export function SecurityDashboard() {
  const [tab, setTab] = useState<"lockouts" | "events">("lockouts");

  // --- Lockouts ---
  const [lockouts, setLockouts] = useState<LockoutRow[]>([]);
  const [lockoutsLoading, setLockoutsLoading] = useState(false);
  const [unlocking, setUnlocking] = useState<string | null>(null);

  // --- Events ---
  const [events, setEvents] = useState<EventRow[]>([]);
  const [eventsTotal, setEventsTotal] = useState(0);
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [outcomeFilter, setOutcomeFilter] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [ipFilter, setIpFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // --- Load lockouts ---
  const loadLockouts = useCallback(async () => {
    setLockoutsLoading(true);
    try {
      const res = await fetch(`${BASE}/api/v1/admin/ops/ip-lockouts`);
      const json = await res.json();
      if (json.success) setLockouts(json.data);
    } finally {
      setLockoutsLoading(false);
    }
  }, []);

  // --- Load events ---
  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const sp = new URLSearchParams({
        page: String(eventsPage),
        limit: String(PAGE_SIZE),
      });
      if (outcomeFilter) sp.set("outcome", outcomeFilter);
      if (eventTypeFilter) sp.set("eventType", eventTypeFilter);
      if (ipFilter.trim()) sp.set("ip", ipFilter.trim());
      if (dateFrom) sp.set("dateFrom", new Date(dateFrom).toISOString());
      if (dateTo) sp.set("dateTo", new Date(dateTo + "T23:59:59").toISOString());
      const res = await fetch(`${BASE}/api/v1/admin/ops/security-events?${sp}`);
      const json = await res.json();
      if (json.success) {
        setEvents(json.data);
        setEventsTotal(json.meta?.total ?? 0);
      }
    } finally {
      setEventsLoading(false);
    }
  }, [eventsPage, outcomeFilter, eventTypeFilter, ipFilter, dateFrom, dateTo]);

  useEffect(() => { loadLockouts(); }, [loadLockouts]);
  useEffect(() => { if (tab === "events") loadEvents(); }, [tab, loadEvents]);

  async function handleUnblock(ip: string) {
    setUnlocking(ip);
    try {
      const res = await fetch(
        `${BASE}/api/v1/admin/ops/ip-lockouts/${encodeURIComponent(ip)}`,
        { method: "DELETE" },
      );
      if (res.ok) await loadLockouts();
    } finally {
      setUnlocking(null);
    }
  }

  const activeLockouts = lockouts.filter((l) => l.isActive);
  const totalPages = Math.max(1, Math.ceil(eventsTotal / PAGE_SIZE));
  const hasFilters = outcomeFilter || eventTypeFilter || ipFilter || dateFrom || dateTo;

  function clearFilters() {
    setOutcomeFilter("");
    setEventTypeFilter("");
    setIpFilter("");
    setDateFrom("");
    setDateTo("");
    setEventsPage(1);
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {(["lockouts", "events"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-[var(--color-navy)] text-[var(--color-navy)]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "lockouts" ? (
              <span className="flex items-center gap-2">
                <Lock size={14} /> Blocked IPs
                {activeLockouts.length > 0 && (
                  <span className="bg-rose-100 text-rose-700 rounded-full px-1.5 py-0.5 text-xs font-semibold">
                    {activeLockouts.length}
                  </span>
                )}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Shield size={14} /> Event Log
              </span>
            )}
          </button>
        ))}
        <div className="ml-auto flex items-center pb-1">
          <button
            onClick={tab === "lockouts" ? loadLockouts : loadEvents}
            className="btn btn-secondary inline-flex items-center gap-1 text-xs py-1 px-2"
            disabled={lockoutsLoading || eventsLoading}
          >
            <RefreshCw size={12} className={(lockoutsLoading || eventsLoading) ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Blocked IPs tab */}
      {tab === "lockouts" && (
        <div className="space-y-3">
          {activeLockouts.length === 0 && !lockoutsLoading && (
            <div className="card p-6 text-center">
              <ShieldOff size={32} className="mx-auto mb-2 text-slate-300" />
              <p className="text-slate-400 text-sm">No IPs are currently blocked.</p>
              <p className="text-slate-400 text-xs mt-1">
                IPs are auto-blocked after {10} failed login attempts within 15 minutes.
              </p>
            </div>
          )}

          {lockouts.length > 0 && (
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="text-left px-4 py-3">IP Address</th>
                    <th className="text-left px-4 py-3">Attempts</th>
                    <th className="text-left px-4 py-3">Route</th>
                    <th className="text-left px-4 py-3">Locked Until</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-right px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lockoutsLoading && (
                    <tr><td colSpan={6} className="py-8 text-center text-slate-400 text-sm">Loading…</td></tr>
                  )}
                  {lockouts.map((row) => (
                    <tr key={row.id} className={row.isActive ? "bg-rose-50/40" : ""}>
                      <td className="px-4 py-3 font-mono text-xs">{row.ip}</td>
                      <td className="px-4 py-3 text-center font-semibold">
                        <span className="bg-slate-100 rounded px-2 py-0.5 text-xs">{row.attempts}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 truncate max-w-[140px]">
                        {row.route ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {row.lockedUntil
                          ? new Date(row.lockedUntil).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {row.isActive ? (
                          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 rounded-full px-2 py-0.5 text-xs font-semibold">
                            <Lock size={10} /> Blocked
                          </span>
                        ) : row.unlockedAt ? (
                          <span className="inline-flex items-center gap-1 bg-sky-100 text-sky-700 rounded-full px-2 py-0.5 text-xs font-semibold">
                            <Unlock size={10} /> Unblocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 rounded-full px-2 py-0.5 text-xs">
                            Expired
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {row.isActive && (
                          <button
                            onClick={() => handleUnblock(row.ip)}
                            disabled={unlocking === row.ip}
                            className="btn btn-secondary inline-flex items-center gap-1 text-xs py-1 px-2 text-rose-600 hover:bg-rose-50"
                          >
                            <Unlock size={12} />
                            {unlocking === row.ip ? "…" : "Unblock"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Event log tab */}
      {tab === "events" && (
        <div className="space-y-3">
          {/* Filters */}
          <div className="card p-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <select
                value={outcomeFilter}
                onChange={(e) => { setOutcomeFilter(e.target.value); setEventsPage(1); }}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">All outcomes</option>
                <option value="success">Success</option>
                <option value="fail">Fail</option>
                <option value="blocked">Blocked</option>
              </select>
              <select
                value={eventTypeFilter}
                onChange={(e) => { setEventTypeFilter(e.target.value); setEventsPage(1); }}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">All event types</option>
                <option value="login_success">Login success</option>
                <option value="login_fail">Login fail</option>
                <option value="rate_limited">Rate limited</option>
                <option value="ip_blocked">IP blocked</option>
                <option value="ip_unblocked">IP unblocked</option>
              </select>
              <input
                value={ipFilter}
                onChange={(e) => { setIpFilter(e.target.value); setEventsPage(1); }}
                placeholder="Filter by IP…"
                className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setEventsPage(1); }}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setEventsPage(1); }}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="mt-2 text-xs text-slate-500 hover:text-slate-700 inline-flex items-center gap-1"
              >
                <X size={12} /> Clear filters
              </button>
            )}
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="text-left px-4 py-3">Time</th>
                    <th className="text-left px-4 py-3">Event</th>
                    <th className="text-left px-4 py-3">Outcome</th>
                    <th className="text-left px-4 py-3">IP</th>
                    <th className="text-left px-4 py-3">Actor</th>
                    <th className="text-left px-4 py-3">Route</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {eventsLoading && (
                    <tr><td colSpan={6} className="py-8 text-center text-slate-400 text-sm">Loading…</td></tr>
                  )}
                  {!eventsLoading && events.length === 0 && (
                    <tr><td colSpan={6} className="py-8 text-center text-slate-400 text-sm">No events match your filters.</td></tr>
                  )}
                  {events.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleString("en-IN", {
                          day: "numeric", month: "short",
                          hour: "2-digit", minute: "2-digit", second: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${EVENT_BADGE[r.eventType] ?? "bg-slate-100 text-slate-600"}`}>
                          {r.eventType.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${OUTCOME_BADGE[r.outcome] ?? "bg-slate-100 text-slate-600"}`}>
                          {r.outcome}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{r.ip ?? "—"}</td>
                      <td className="px-4 py-3 text-xs text-slate-600 truncate max-w-[160px]">
                        {r.actorEmail ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 truncate max-w-[140px]">
                        {r.route ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-sm">
              <span className="text-slate-500">
                {eventsTotal.toLocaleString("en-IN")} events · page {eventsPage} of {totalPages}
              </span>
              <div className="flex gap-1">
                <button
                  disabled={eventsPage <= 1}
                  onClick={() => setEventsPage((p) => Math.max(1, p - 1))}
                  className="btn btn-secondary px-2 py-1 disabled:opacity-50"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  disabled={eventsPage >= totalPages}
                  onClick={() => setEventsPage((p) => Math.min(totalPages, p + 1))}
                  className="btn btn-secondary px-2 py-1 disabled:opacity-50"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { ScrollText, Search, Download, Filter, X, ChevronLeft, ChevronRight } from "lucide-react";

interface Row {
  id: string;
  actorId: string | null;
  actorName: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

interface Facets {
  actions: { action: string; n: number }[];
  entityTypes: { entityType: string | null; n: number }[];
  actors?: { actorId: string | null; actorName: string | null; n: number }[];
}

const PAGE_SIZE = 50;

export function AuditLogViewer() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [facets, setFacets] = useState<Facets | null>(null);
  const [drawer, setDrawer] = useState<Row | null>(null);

  const [q, setQ] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [actorId, setActorId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const buildQuery = useCallback(
    (extra: Record<string, string> = {}) => {
      const sp = new URLSearchParams();
      if (q.trim()) sp.set("q", q.trim());
      if (action) sp.set("action", action);
      if (entityType) sp.set("entityType", entityType);
      if (actorId) sp.set("actorId", actorId);
      if (dateFrom) sp.set("dateFrom", new Date(dateFrom).toISOString());
      if (dateTo) sp.set("dateTo", new Date(dateTo + "T23:59:59").toISOString());
      for (const [k, v] of Object.entries(extra)) sp.set(k, v);
      return sp;
    },
    [q, action, entityType, actorId, dateFrom, dateTo],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sp = buildQuery({ page: String(page), limit: String(PAGE_SIZE) });
      const res = await fetch(`/pinnacle-website/api/v1/audit-logs?${sp}`);
      const json = await res.json();
      if (json.success) {
        setRows(json.data);
        setTotal(json.meta?.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [buildQuery, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetch("/pinnacle-website/api/v1/audit-logs?facets=1")
      .then((r) => r.json())
      .then((j) => j.success && setFacets(j.data));
  }, []);

  // One-click preset for the most common compliance query: "show me every
  // watermarked PDF download". The action name is fixed by the download
  // proxy so we can hard-code it here without consulting facets.
  function showWatermarkDownloads() {
    setQ("");
    setEntityType("");
    setActorId("");
    setDateFrom("");
    setDateTo("");
    setAction("download.pdf");
    setPage(1);
  }

  function clearFilters() {
    setQ("");
    setAction("");
    setEntityType("");
    setActorId("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  function exportCsv() {
    const sp = buildQuery({ format: "csv" });
    window.open(`/pinnacle-website/api/v1/audit-logs?${sp}`, "_blank");
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = q || action || entityType || actorId || dateFrom || dateTo;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--color-navy)]/10 rounded-xl flex items-center justify-center">
            <ScrollText size={20} className="text-[var(--color-navy)]" />
          </div>
          <div>
            <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Audit Log Viewer</h1>
            <p className="text-slate-500 text-sm">{total.toLocaleString("en-IN")} events · page {page} of {totalPages}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={showWatermarkDownloads}
            className={`btn inline-flex items-center gap-2 text-sm ${action === "download.pdf" ? "btn-gold" : "btn-secondary"}`}
            title="Show every watermarked PDF download"
          >
            <Filter size={14} /> Watermark downloads
          </button>
          <button onClick={exportCsv} className="btn btn-secondary inline-flex items-center gap-2 text-sm">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="relative lg:col-span-2">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Search actor, action, id, details…"
              className="w-full rounded-md border border-slate-200 pl-9 pr-3 py-2 text-sm"
            />
          </div>
          <select
            value={action}
            onChange={(e) => { setAction(e.target.value); setPage(1); }}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All actions</option>
            {facets?.actions.map((a) => (
              <option key={a.action} value={a.action}>{a.action} ({a.n})</option>
            ))}
          </select>
          <select
            value={entityType}
            onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All entity types</option>
            {facets?.entityTypes.map((t) => (
              <option key={t.entityType ?? ""} value={t.entityType ?? ""}>{t.entityType} ({t.n})</option>
            ))}
          </select>
          <select
            value={actorId}
            onChange={(e) => { setActorId(e.target.value); setPage(1); }}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
            title="Filter by actor"
          >
            <option value="">All actors</option>
            {facets?.actors?.map((a) => (
              <option key={a.actorId ?? ""} value={a.actorId ?? ""}>
                {a.actorName ?? "(unnamed)"} ({a.n})
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="rounded-md border border-slate-200 px-2 py-2 text-xs flex-1" />
            <span className="text-slate-400">–</span>
            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="rounded-md border border-slate-200 px-2 py-2 text-xs flex-1" />
          </div>
        </div>
        {hasFilters && (
          <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-slate-700 inline-flex items-center gap-1">
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
                <th className="text-left px-4 py-3">Actor</th>
                <th className="text-left px-4 py-3">Action</th>
                <th className="text-left px-4 py-3">Entity</th>
                <th className="text-left px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr><td colSpan={5} className="py-8 text-center text-slate-400 text-sm">Loading…</td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-slate-400 text-sm">No events match your filters.</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setDrawer(r)}>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </td>
                  <td className="px-4 py-3 text-sm">{r.actorName ?? "System"}</td>
                  <td className="px-4 py-3"><code className="text-xs bg-slate-100 rounded px-1.5 py-0.5">{r.action}</code></td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {r.entityType && <span><span className="font-medium">{r.entityType}</span>{r.entityId && <> #{r.entityId.slice(0, 12)}</>}</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 truncate max-w-[280px]">
                    {r.details ? JSON.stringify(r.details).slice(0, 100) : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-sm">
          <span className="text-slate-500">Page {page} of {totalPages}</span>
          <div className="flex gap-1">
            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="btn btn-secondary px-2 py-1 disabled:opacity-50"><ChevronLeft size={14} /></button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="btn btn-secondary px-2 py-1 disabled:opacity-50"><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>

      {drawer && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end" onClick={() => setDrawer(null)}>
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold text-[var(--color-navy)]">Event details</h2>
              <button onClick={() => setDrawer(null)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <dl className="text-sm space-y-2">
              <div><dt className="text-xs text-slate-500">Time</dt><dd className="font-mono text-xs">{drawer.createdAt}</dd></div>
              <div><dt className="text-xs text-slate-500">Actor</dt><dd>{drawer.actorName ?? "System"} <span className="font-mono text-xs text-slate-400">{drawer.actorId ?? ""}</span></dd></div>
              <div><dt className="text-xs text-slate-500">Action</dt><dd className="font-mono text-xs">{drawer.action}</dd></div>
              <div><dt className="text-xs text-slate-500">Entity</dt><dd className="font-mono text-xs">{drawer.entityType ?? "—"} {drawer.entityId ? `#${drawer.entityId}` : ""}</dd></div>
              <div>
                <dt className="text-xs text-slate-500 mb-1">Details</dt>
                <pre className="bg-slate-50 rounded-md p-3 text-xs overflow-x-auto whitespace-pre-wrap">{JSON.stringify(drawer.details, null, 2)}</pre>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}

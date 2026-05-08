import { db } from "@workspace/db";
import { pageViews } from "@workspace/db/schema";
import { sql, desc } from "drizzle-orm";
import { Globe, TrendingUp, Users, Eye, MousePointerClick } from "lucide-react";
import DonutChartClient from "@/components/charts/DonutChartClient";
import BarChartClient from "@/components/charts/BarChartClient";
import { getGa4Credentials, runReport } from "@/lib/server/ga4";
import { RealtimeCard } from "./RealtimeCard";

export const metadata = { title: "Website Traffic — Admin Analytics" };

const CHART_COLORS = ["#0A1F5C", "#0D7377", "#8B1A1A", "#C9A84C", "#4f46e5", "#059669", "#dc2626", "#d97706"];

// ---------------------------------------------------------------------------
// GA4 helpers
// ---------------------------------------------------------------------------

type Ga4Summary = {
  sessions: number;
  users: number;
  pageViews: number;
  bounceRate: number;
};

type TopPage = { path: string; views: number };
type SourceRow = { name: string; value: number; color: string };
type DeviceRow = { name: string; value: number; color: string };
type DailyRow = { day: string; Views: number };

async function fetchGa4Data(propertyId: string, serviceAccountJson: string) {
  const creds = { propertyId, serviceAccountJson };
  const dateRanges = [{ startDate: "30daysAgo", endDate: "today" }];

  const [summaryRes, topPagesRes, sourcesRes, devicesRes, dailyRes] = await Promise.allSettled([
    runReport(creds, dateRanges,
      [],
      [
        { name: "sessions" }, { name: "totalUsers" },
        { name: "screenPageViews" }, { name: "bounceRate" },
      ],
    ),
    runReport(creds, dateRanges,
      [{ name: "pagePath" }],
      [{ name: "screenPageViews" }],
      10,
    ),
    runReport(creds, dateRanges,
      [{ name: "sessionDefaultChannelGroup" }],
      [{ name: "sessions" }],
    ),
    runReport(creds, dateRanges,
      [{ name: "deviceCategory" }],
      [{ name: "sessions" }],
    ),
    runReport(creds, dateRanges,
      [{ name: "date" }],
      [{ name: "screenPageViews" }],
    ),
  ]);

  const summary: Ga4Summary = (() => {
    if (summaryRes.status !== "fulfilled" || !summaryRes.value) return { sessions: 0, users: 0, pageViews: 0, bounceRate: 0 };
    const row = summaryRes.value.rows[0];
    if (!row) return { sessions: 0, users: 0, pageViews: 0, bounceRate: 0 };
    return {
      sessions: parseInt(row.metricValues[0]?.value ?? "0", 10),
      users: parseInt(row.metricValues[1]?.value ?? "0", 10),
      pageViews: parseInt(row.metricValues[2]?.value ?? "0", 10),
      bounceRate: Math.round(parseFloat(row.metricValues[3]?.value ?? "0") * 100),
    };
  })();

  const topPages: TopPage[] = (() => {
    if (topPagesRes.status !== "fulfilled" || !topPagesRes.value) return [];
    return topPagesRes.value.rows.map((r) => ({
      path: r.dimensionValues[0]?.value ?? "/",
      views: parseInt(r.metricValues[0]?.value ?? "0", 10),
    }));
  })();

  const sources: SourceRow[] = (() => {
    if (sourcesRes.status !== "fulfilled" || !sourcesRes.value) return [];
    return sourcesRes.value.rows.map((r, i) => ({
      name: r.dimensionValues[0]?.value ?? "Other",
      value: parseInt(r.metricValues[0]?.value ?? "0", 10),
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));
  })();

  const devices: DeviceRow[] = (() => {
    if (devicesRes.status !== "fulfilled" || !devicesRes.value) return [];
    return devicesRes.value.rows.map((r, i) => ({
      name: (r.dimensionValues[0]?.value ?? "other").charAt(0).toUpperCase() + (r.dimensionValues[0]?.value ?? "other").slice(1),
      value: parseInt(r.metricValues[0]?.value ?? "0", 10),
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));
  })();

  const daily: DailyRow[] = (() => {
    if (dailyRes.status !== "fulfilled" || !dailyRes.value) return [];
    return dailyRes.value.rows
      .map((r) => {
        const d = r.dimensionValues[0]?.value ?? "";
        // Format YYYYMMDD → "MMM D"
        const year = d.slice(0, 4);
        const month = d.slice(4, 6);
        const day = d.slice(6, 8);
        const label = new Date(`${year}-${month}-${day}`).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
        return { day: label, Views: parseInt(r.metricValues[0]?.value ?? "0", 10) };
      })
      .sort((a, b) => a.day.localeCompare(b.day));
  })();

  return { summary, topPages, sources, devices, daily };
}

// ---------------------------------------------------------------------------
// Internal fallback — page_views table
// ---------------------------------------------------------------------------

async function fetchInternalData() {
  const [topPagesRows, dailyRows, deviceRows, totalRows] = await Promise.all([
    db.execute(sql`
      SELECT path, sum(count)::int AS views
      FROM page_views
      WHERE date >= to_char(now() - interval '30 days', 'YYYY-MM-DD')
      GROUP BY path
      ORDER BY views DESC
      LIMIT 10
    `),
    db.execute(sql`
      SELECT date, sum(count)::int AS views
      FROM page_views
      WHERE date >= to_char(now() - interval '30 days', 'YYYY-MM-DD')
      GROUP BY date
      ORDER BY date
    `),
    db.execute(sql`
      SELECT device_type, sum(count)::int AS views
      FROM page_views
      WHERE date >= to_char(now() - interval '30 days', 'YYYY-MM-DD')
      GROUP BY device_type
      ORDER BY views DESC
    `),
    db.select({ total: sql<number>`coalesce(sum(count), 0)::int` })
      .from(pageViews)
      .where(sql`date >= to_char(now() - interval '30 days', 'YYYY-MM-DD')`),
  ]);

  const topPages: TopPage[] = (topPagesRows.rows as { path: string; views: number }[]).map((r) => ({
    path: r.path, views: r.views,
  }));

  const daily: DailyRow[] = (dailyRows.rows as { date: string; views: number }[]).map((r) => ({
    day: new Date(r.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
    Views: r.views,
  }));

  const devices: DeviceRow[] = (deviceRows.rows as { device_type: string | null; views: number }[]).map((r, i) => ({
    name: (r.device_type ?? "Unknown").charAt(0).toUpperCase() + (r.device_type ?? "Unknown").slice(1),
    value: r.views,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  // Use the actual sum from the DB — not the top-10 sum — to get the
  // correct 30-day total including pages that fell off the top-10 list.
  const totalViews = totalRows[0]?.total ?? 0;

  return { topPages, daily, devices, totalViews };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function TrafficPage() {
  const ga4Creds = await getGa4Credentials();
  const ga4Configured = !!ga4Creds;

  const ga4Data = ga4Configured
    ? await fetchGa4Data(ga4Creds.propertyId, ga4Creds.serviceAccountJson)
    : null;

  const internalData = await fetchInternalData();

  const summaryCards = ga4Configured && ga4Data
    ? [
        { label: "Sessions (30d)", value: ga4Data.summary.sessions.toLocaleString("en-IN"), icon: TrendingUp, color: "navy" },
        { label: "Users (30d)", value: ga4Data.summary.users.toLocaleString("en-IN"), icon: Users, color: "teal" },
        { label: "Page Views (30d)", value: ga4Data.summary.pageViews.toLocaleString("en-IN"), icon: Eye, color: "maroon" },
        { label: "Bounce Rate (30d)", value: `${ga4Data.summary.bounceRate}%`, icon: MousePointerClick, color: "gold" },
      ]
    : [
        { label: "Page Views (30d)", value: internalData.totalViews.toLocaleString("en-IN"), icon: Eye, color: "navy" },
        { label: "Unique Paths", value: internalData.topPages.length.toLocaleString("en-IN"), icon: Globe, color: "teal" },
      ];

  const colorBorder: Record<string, string> = {
    navy: "border-l-[var(--color-navy)]",
    teal: "border-l-[var(--color-teal)]",
    maroon: "border-l-[var(--color-maroon)]",
    gold: "border-l-[var(--color-gold)]",
  };
  const colorIcon: Record<string, string> = {
    navy: "bg-[var(--color-navy)]/10 text-[var(--color-navy)]",
    teal: "bg-[var(--color-teal)]/10 text-[var(--color-teal)]",
    maroon: "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]",
    gold: "bg-[var(--color-gold)]/10 text-[var(--color-navy)]",
  };

  const topPages = ga4Data?.topPages ?? internalData.topPages;
  const dailyData = ga4Data?.daily ?? internalData.daily;
  const devices = ga4Data?.devices ?? internalData.devices;
  const sources = ga4Data?.sources ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">
            Website Traffic
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {ga4Configured
              ? "Live data from Google Analytics 4 — last 30 days"
              : "Internal tracker data — configure GA4 in Settings → Analytics for richer insights"}
          </p>
        </div>
        {!ga4Configured && (
          <a
            href="../settings"
            className="text-xs text-[var(--color-teal)] border border-[var(--color-teal)]/30 rounded-lg px-3 py-1.5 hover:bg-[var(--color-teal)]/5 transition-colors"
          >
            Configure GA4 →
          </a>
        )}
      </div>

      <RealtimeCard />

      <div className={`grid grid-cols-2 ${summaryCards.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-2"} gap-4`}>
        {summaryCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`card flex flex-col gap-3 border-l-4 ${colorBorder[s.color]}`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorIcon[s.color]}`}>
                <Icon size={17} />
              </div>
              <div>
                <div className="text-2xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">
                  {s.value}
                </div>
                <div className="text-slate-500 text-xs">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <h2 className="font-semibold text-[var(--color-navy)] mb-4 font-[family-name:var(--font-playfair)]">
          Daily Page Views — Last 30 Days
        </h2>
        {dailyData.length === 0 ? (
          <p className="text-slate-400 text-sm py-8 text-center">No data recorded yet.</p>
        ) : (
          <BarChartClient
            data={dailyData}
            bars={[{ key: "Views", label: "Page Views", color: "#0A1F5C" }]}
            xKey="day"
            height={240}
          />
        )}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 card">
          <h2 className="font-semibold text-[var(--color-navy)] mb-4 font-[family-name:var(--font-playfair)]">
            Top 10 Pages
          </h2>
          {topPages.length === 0 ? (
            <p className="text-slate-400 text-sm">No page-view data yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">#</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Page</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Views</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {topPages.map((p, i) => {
                    const total = topPages.reduce((s, r) => s + r.views, 0);
                    const pct = total > 0 ? Math.round((p.views / total) * 100) : 0;
                    return (
                      <tr key={p.path} className="hover:bg-[var(--color-slate-light)]/50 transition-colors">
                        <td className="py-2 px-3 text-slate-400 text-xs">{i + 1}</td>
                        <td className="py-2 px-3 font-medium text-[var(--color-navy)] truncate max-w-[260px]">
                          <span title={p.path}>{p.path}</span>
                        </td>
                        <td className="py-2 px-3 text-right text-slate-600">{p.views.toLocaleString("en-IN")}</td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-1.5 rounded-full bg-[var(--color-navy)]"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-500 w-8 text-right">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="font-semibold text-[var(--color-navy)] mb-2 font-[family-name:var(--font-playfair)]">
              Devices
            </h2>
            {devices.length === 0 ? (
              <p className="text-slate-400 text-sm py-4 text-center">No device data.</p>
            ) : (
              <DonutChartClient data={devices} height={180} />
            )}
          </div>

          {sources.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-[var(--color-navy)] mb-2 font-[family-name:var(--font-playfair)]">
                Traffic Sources
              </h2>
              <DonutChartClient data={sources} height={180} />
            </div>
          )}
        </div>
      </div>

      {!ga4Configured && (
        <div className="card bg-[var(--color-navy)]/3 border border-[var(--color-navy)]/10">
          <div className="flex gap-3 items-start">
            <Globe size={18} className="text-[var(--color-navy)] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[var(--color-navy)]">Connect Google Analytics 4 for richer insights</p>
              <p className="text-xs text-slate-500 mt-1">
                Add your GA4 Property ID and a service-account JSON key in{" "}
                <a href="../settings" className="underline text-[var(--color-teal)]">Settings → Analytics</a>{" "}
                to unlock sessions, users, bounce rate, traffic sources, and real-time visitor counts.
                Until then, the internal page-view tracker above provides a privacy-friendly fallback.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { runAudit, SITE_URL, PUBLIC_PAGES } from "@/lib/seo/page-registry";
import { CheckCircle, AlertTriangle, XCircle, ExternalLink, Globe, FileText, Search } from "lucide-react";
import Link from "next/link";
import type { SeoStatus } from "@/lib/seo/page-registry";
import { apiUrl } from "@/lib/utils";
import { db } from "@workspace/db";
import { seoOverrides } from "@workspace/db/schema";
import { SeoOverridesTable } from "./SeoOverridesEditor";
import { BulkSeoFill, type BulkSeoRow } from "./BulkSeoFill";

export const metadata = { title: "SEO Health Dashboard — Admin" };

function StatusBadge({ status }: { status: SeoStatus }) {
  if (status === "pass") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle size={10} /> Pass
      </span>
    );
  }
  if (status === "warn") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <AlertTriangle size={10} /> Warn
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
      <XCircle size={10} /> Fail
    </span>
  );
}

function BoolCell({ ok }: { ok: boolean }) {
  return ok ? (
    <CheckCircle size={14} className="text-emerald-500 mx-auto" />
  ) : (
    <XCircle size={14} className="text-red-400 mx-auto" />
  );
}

function TitleLengthCell({ title }: { title: string }) {
  const len = title.length;
  const color =
    len >= 50 && len <= 60
      ? "text-emerald-600"
      : len > 0
      ? "text-amber-600"
      : "text-red-600";
  return (
    <span className={`text-xs font-medium ${color}`}>
      {len > 0 ? `${len}` : "—"}
    </span>
  );
}

function DescLengthCell({ desc }: { desc: string }) {
  const len = desc.length;
  const color =
    len >= 140 && len <= 165
      ? "text-emerald-600"
      : len >= 100
      ? "text-amber-600"
      : "text-red-600";
  return (
    <span className={`text-xs font-medium ${color}`}>
      {len > 0 ? `${len}` : "—"}
    </span>
  );
}

export default async function SeoAuditPage() {
  const [auditResults, overrideRows] = await Promise.all([
    Promise.resolve(runAudit()),
    db.select().from(seoOverrides),
  ]);

  const overrideMap = Object.fromEntries(overrideRows.map((r) => [r.route, r]));
  const bulkRows: BulkSeoRow[] = PUBLIC_PAGES.map((p) => {
    const ov = overrideMap[p.route];
    return {
      route: p.route,
      label: p.label,
      defaultTitle: p.title,
      defaultDescription: p.description,
      dbTitle: ov?.title ?? null,
      dbDescription: ov?.description ?? null,
      dbFocusKeyword: ov?.focusKeyword ?? null,
    };
  });

  const passCount = auditResults.filter((r) => r.status === "pass").length;
  const warnCount = auditResults.filter((r) => r.status === "warn").length;
  const failCount = auditResults.filter((r) => r.status === "fail").length;
  const total = auditResults.length;

  const scorePercent = total > 0 ? Math.round((passCount / total) * 100) : 0;

  const allIssues = auditResults.flatMap((r) =>
    r.issues.map((issue) => ({ page: r.label, route: r.route, issue }))
  );

  const topIssues = Object.entries(
    allIssues.reduce<Record<string, string[]>>((acc, { issue, page }) => {
      acc[issue] = acc[issue] ?? [];
      acc[issue].push(page);
      return acc;
    }, {})
  )
    .sort(([, a], [, b]) => b.length - a.length)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">
            SEO Health Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Metadata completeness audit for all {total} public pages
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={apiUrl("/sitemap.xml")}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[var(--color-teal)]/30 text-[var(--color-teal)] hover:bg-[var(--color-teal)]/5 transition-colors"
          >
            <Globe size={13} /> sitemap.xml
          </a>
          <a
            href={apiUrl("/robots.txt")}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <FileText size={13} /> robots.txt
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card flex flex-col gap-2 border-l-4 border-l-[var(--color-navy)]">
          <div className="w-9 h-9 rounded-lg bg-[var(--color-navy)]/10 flex items-center justify-center">
            <Search size={16} className="text-[var(--color-navy)]" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">
              {passCount}/{total}
            </div>
            <div className="text-slate-500 text-xs">Fully Optimised</div>
            <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--color-navy)] rounded-full"
                style={{ width: `${scorePercent}%` }}
              />
            </div>
          </div>
        </div>
        <div className="card flex flex-col gap-2 border-l-4 border-l-emerald-500">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
            <CheckCircle size={16} className="text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600 font-[family-name:var(--font-playfair)]">
              {passCount}
            </div>
            <div className="text-slate-500 text-xs">Pages Passing</div>
          </div>
        </div>
        <div className="card flex flex-col gap-2 border-l-4 border-l-amber-500">
          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
            <AlertTriangle size={16} className="text-amber-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600 font-[family-name:var(--font-playfair)]">
              {warnCount}
            </div>
            <div className="text-slate-500 text-xs">Pages with Warnings</div>
          </div>
        </div>
        <div className="card flex flex-col gap-2 border-l-4 border-l-red-500">
          <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
            <XCircle size={16} className="text-red-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600 font-[family-name:var(--font-playfair)]">
              {failCount}
            </div>
            <div className="text-slate-500 text-xs">Pages Failing</div>
          </div>
        </div>
      </div>

      {topIssues.length > 0 && (
        <div className="card border border-amber-200 bg-amber-50/30">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={15} className="text-amber-600" />
            <h2 className="font-semibold text-[var(--color-navy)] text-sm">
              Top Issues to Fix ({allIssues.length} total)
            </h2>
          </div>
          <div className="space-y-2">
            {topIssues.map(([issue, pages]) => (
              <div key={issue} className="flex items-start gap-3 text-sm">
                <span className="text-amber-600 font-medium shrink-0 min-w-0">
                  {pages.length} page{pages.length > 1 ? "s" : ""}
                </span>
                <span className="text-slate-700">{issue}</span>
                <span className="text-slate-400 text-xs shrink-0 ml-auto">
                  {pages.slice(0, 3).join(", ")}
                  {pages.length > 3 ? ` +${pages.length - 3}` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card overflow-x-auto">
        <h2 className="font-semibold text-[var(--color-navy)] mb-4 font-[family-name:var(--font-playfair)]">
          Page-by-Page Audit
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Page</th>
              <th className="text-center py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Title (len)</th>
              <th className="text-center py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Desc (len)</th>
              <th className="text-center py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">OG</th>
              <th className="text-center py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">OG Img</th>
              <th className="text-center py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Canonical</th>
              <th className="text-center py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Schema</th>
              <th className="text-center py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="text-center py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Live</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {auditResults.map((r) => (
              <tr
                key={r.route}
                className={`hover:bg-[var(--color-slate-light)]/50 transition-colors ${
                  r.status === "fail" ? "bg-red-50/30" : r.status === "warn" ? "bg-amber-50/20" : ""
                }`}
              >
                <td className="py-2.5 px-3">
                  <div className="font-medium text-[var(--color-navy)]">{r.label}</div>
                  <div className="text-xs text-slate-400 font-mono">{r.route}</div>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <TitleLengthCell title={r.title} />
                </td>
                <td className="py-2.5 px-3 text-center">
                  <DescLengthCell desc={r.description} />
                </td>
                <td className="py-2.5 px-3 text-center">
                  <BoolCell ok={r.hasOgTitle && r.hasOgDescription && r.hasOgUrl} />
                </td>
                <td className="py-2.5 px-3 text-center">
                  <BoolCell ok={r.hasOgImage} />
                </td>
                <td className="py-2.5 px-3 text-center">
                  <BoolCell ok={r.hasCanonical} />
                </td>
                <td className="py-2.5 px-3 text-center">
                  <BoolCell ok={r.hasStructuredData} />
                </td>
                <td className="py-2.5 px-3 text-center">
                  <StatusBadge status={r.status} />
                </td>
                <td className="py-2.5 px-3 text-center">
                  <a
                    href={`${SITE_URL}${r.route}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-slate-400 hover:text-[var(--color-teal)] transition-colors inline-flex items-center justify-center"
                    title={`Open ${r.label}`}
                  >
                    <ExternalLink size={13} />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {auditResults.some((r) => r.issues.length > 0) && (
        <div className="card">
          <h2 className="font-semibold text-[var(--color-navy)] mb-4 font-[family-name:var(--font-playfair)]">
            Issue Details by Page
          </h2>
          <div className="space-y-4">
            {auditResults
              .filter((r) => r.issues.length > 0)
              .map((r) => (
                <div key={r.route} className="border border-slate-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <StatusBadge status={r.status} />
                    <span className="font-medium text-[var(--color-navy)] text-sm">{r.label}</span>
                    <span className="text-xs text-slate-400 font-mono">{r.route}</span>
                  </div>
                  <ul className="space-y-1">
                    {r.issues.map((issue, i) => (
                      <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                        <span className="mt-0.5 shrink-0 text-amber-500">›</span>
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="card">
        <BulkSeoFill rows={bulkRows} />
      </div>

      <div className="card">
        <SeoOverridesTable rows={overrideRows} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-semibold text-[var(--color-navy)] mb-3 font-[family-name:var(--font-playfair)] text-sm">
            Technical Files
          </h2>
          <div className="space-y-2">
            {[
              { label: "sitemap.xml", href: apiUrl("/sitemap.xml"), desc: `${total} pages · auto-generated` },
              { label: "robots.txt", href: apiUrl("/robots.txt"), desc: "Allows public, disallows /portal/ /api/" },
            ].map((f) => (
              <a
                key={f.label}
                href={f.href}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-[var(--color-teal)]/30 hover:bg-[var(--color-teal)]/5 transition-all group"
              >
                <FileText size={15} className="text-slate-400 group-hover:text-[var(--color-teal)]" />
                <div>
                  <div className="text-sm font-medium text-[var(--color-navy)] font-mono">{f.label}</div>
                  <div className="text-xs text-slate-400">{f.desc}</div>
                </div>
                <ExternalLink size={12} className="ml-auto text-slate-300 group-hover:text-[var(--color-teal)]" />
              </a>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold text-[var(--color-navy)] mb-3 font-[family-name:var(--font-playfair)] text-sm">
            Remaining Improvements
          </h2>
          <ul className="space-y-2">
            {[
              "Add og:image for all pages (1200×630px recommended)",
              "JSON-LD structured data added: LocalBusiness + Course schemas ✓",
              "Add <link rel=\"canonical\"> tags to all pages (prevents duplicate-content penalties)",
              "Submit sitemap to Google Search Console",
              "Add hreflang tags when multilingual support is added",
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                <span className="mt-0.5 w-4 h-4 rounded-full bg-[var(--color-navy)]/10 text-[var(--color-navy)] flex items-center justify-center font-semibold shrink-0 text-[10px]">
                  {i + 1}
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

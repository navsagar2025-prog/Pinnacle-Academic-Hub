import { db } from "@workspace/db";
import { promotions } from "@workspace/db/schema";
import { isNull, desc } from "drizzle-orm";
import { Megaphone } from "lucide-react";
import { AddPromotionButton, EditPromotionButton, ArchivePromotionButton, PreviewPromotionButton } from "./PromotionsModal";

export const metadata = { title: "Promotions & Banners — Admin Panel" };

function statusBadge(promo: { startsAt: Date; endsAt: Date; archivedAt: Date | null }) {
  const now = new Date();
  if (promo.archivedAt) return { label: "Archived", cls: "bg-slate-100 text-slate-400" };
  if (now < promo.startsAt) return { label: "Scheduled", cls: "bg-blue-100 text-blue-600" };
  if (now > promo.endsAt) return { label: "Expired", cls: "bg-red-50 text-red-400" };
  return { label: "Live", cls: "bg-emerald-100 text-emerald-700" };
}

export default async function AdminPromotionsPage() {
  const rows = await db
    .select()
    .from(promotions)
    .where(isNull(promotions.archivedAt))
    .orderBy(desc(promotions.createdAt));

  const live = rows.filter((r) => {
    const now = new Date();
    return now >= r.startsAt && now <= r.endsAt && !r.archivedAt;
  }).length;

  const formatDt = (d: Date) =>
    new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Promotions & Banners</h1>
          <p className="text-slate-500 text-sm mt-1">{rows.length} active · {live} currently live</p>
        </div>
        <AddPromotionButton />
      </div>

      <div className="card p-4 border-l-4 border-l-[var(--color-teal)] bg-[var(--color-teal)]/5">
        <p className="text-xs text-slate-600">
          <strong>How it works:</strong> Promotions outside their start–end window are never shown. Banner promotions appear as a dismissible top bar on the public website or student portal. Modal promotions appear as a full popup on a student's first login of the day.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          <Megaphone size={32} className="mx-auto mb-3 opacity-30" />
          <p>No promotions yet. Create one to start showing announcements on the site.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--color-slate-light)] border-b border-slate-100">
                <tr>
                  {["Promotion", "Type", "Audience", "Schedule", "Status", "Colour", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((p) => {
                  const { label, cls } = statusBadge(p);
                  return (
                    <tr key={p.id} className="hover:bg-[var(--color-slate-light)]/50 transition-colors">
                      <td className="px-4 py-3 max-w-[220px]">
                        <div className="font-semibold text-sm text-[var(--color-navy)] line-clamp-1">{p.title}</div>
                        <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">{p.body}</div>
                        {p.ctaLabel && (
                          <div className="text-xs text-[var(--color-teal)] mt-0.5">CTA: {p.ctaLabel}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`badge text-xs ${p.displayType === "banner" ? "bg-indigo-100 text-indigo-700" : "bg-purple-100 text-purple-700"}`}>
                          {p.displayType === "banner" ? "Top Banner" : "Modal Popup"}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="badge text-xs bg-slate-100 text-slate-600 capitalize">{p.audience}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        <div>{formatDt(p.startsAt)}</div>
                        <div className="text-slate-400">→ {formatDt(p.endsAt)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${cls}`}>{label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded border border-slate-200" style={{ backgroundColor: p.bgColour }} title={`BG: ${p.bgColour}`} />
                          <div className="w-5 h-5 rounded border border-slate-200" style={{ backgroundColor: p.ctaColour }} title={`CTA: ${p.ctaColour}`} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <PreviewPromotionButton promo={p} />
                          <EditPromotionButton promo={p} />
                          <ArchivePromotionButton promoId={p.id} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

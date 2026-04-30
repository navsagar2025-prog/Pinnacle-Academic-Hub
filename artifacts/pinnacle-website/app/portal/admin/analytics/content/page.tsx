import { db } from "@workspace/db";
import { studyMaterials, classRecordings } from "@workspace/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { BookOpen, Play, AlertTriangle } from "lucide-react";
import BarChartClient from "@/components/charts/BarChartClient";
import DonutChartClient from "@/components/charts/DonutChartClient";

export const metadata = { title: "Content Engagement — Admin Analytics" };

const NOTICE_CATEGORY_COLORS: Record<string, string> = {
  Academic: "#0A1F5C",
  Test: "#8B1A1A",
  Fee: "#C9A84C",
  Event: "#0D7377",
  Admissions: "#4f46e5",
  General: "#94a3b8",
};

export default async function ContentEngagementPage() {
  const [
    topMaterials,
    topRecordings,
    batchMaterialRows,
    noticeRows,
    [{ matTotal }],
    [{ recTotal }],
  ] = await Promise.all([
    db
      .select({
        id: studyMaterials.id,
        title: studyMaterials.title,
        subject: studyMaterials.subject,
        type: studyMaterials.type,
        downloadCount: studyMaterials.downloadCount,
      })
      .from(studyMaterials)
      .where(eq(studyMaterials.isVisible, true))
      .orderBy(desc(studyMaterials.downloadCount))
      .limit(10),
    db
      .select({
        id: classRecordings.id,
        title: classRecordings.title,
        subject: classRecordings.subject,
        teacherName: classRecordings.teacherName,
        viewCount: classRecordings.viewCount,
        durationMinutes: classRecordings.durationMinutes,
      })
      .from(classRecordings)
      .where(eq(classRecordings.isVisible, true))
      .orderBy(desc(classRecordings.viewCount))
      .limit(10),
    db.execute(sql`
      SELECT
        b.name AS batch_name,
        count(sm.id)::int AS material_count
      FROM batches b
      LEFT JOIN study_materials sm ON sm.batch_id = b.id AND sm.is_visible = true
      WHERE b.status = 'active'
      GROUP BY b.id, b.name
      ORDER BY material_count DESC
    `),
    db.execute(sql`
      SELECT category, count(*)::int AS total
      FROM notices
      GROUP BY category
      ORDER BY total DESC
    `),
    db.select({ matTotal: sql<number>`count(*)::int` }).from(studyMaterials).where(eq(studyMaterials.isVisible, true)),
    db.select({ recTotal: sql<number>`count(*)::int` }).from(classRecordings).where(eq(classRecordings.isVisible, true)),
  ]);

  const batchData = (batchMaterialRows.rows as { batch_name: string; material_count: number }[]).map((r) => ({
    batch: r.batch_name.length > 16 ? r.batch_name.slice(0, 14) + "…" : r.batch_name,
    Materials: r.material_count,
  }));

  const noticeCats = (noticeRows.rows as { category: string; total: number }[]).map((r) => ({
    name: r.category,
    value: r.total,
    color: NOTICE_CATEGORY_COLORS[r.category] ?? "#94a3b8",
  }));

  const zeroBatches = batchData.filter((b) => b.Materials === 0);

  const totalDownloads = topMaterials.reduce((s, m) => s + (m.downloadCount ?? 0), 0);
  const totalViews = topRecordings.reduce((s, r) => s + (r.viewCount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">
          Content Engagement
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Material downloads, recording views, and notice activity across batches
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Study Materials", value: matTotal, icon: BookOpen, color: "navy" },
          { label: "Total Downloads", value: totalDownloads, icon: BookOpen, color: "teal" },
          { label: "Class Recordings", value: recTotal, icon: Play, color: "maroon" },
          { label: "Total Views", value: totalViews, icon: Play, color: "gold" },
        ].map((s) => {
          const Icon = s.icon;
          const border = { navy: "border-l-[var(--color-navy)]", teal: "border-l-[var(--color-teal)]", maroon: "border-l-[var(--color-maroon)]", gold: "border-l-[var(--color-gold)]" }[s.color];
          const icon = { navy: "bg-[var(--color-navy)]/10 text-[var(--color-navy)]", teal: "bg-[var(--color-teal)]/10 text-[var(--color-teal)]", maroon: "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]", gold: "bg-[var(--color-gold)]/10 text-[var(--color-navy)]" }[s.color];
          return (
            <div key={s.label} className={`card flex flex-col gap-3 border-l-4 ${border}`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${icon}`}>
                <Icon size={17} />
              </div>
              <div>
                <div className="text-2xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">{s.value}</div>
                <div className="text-slate-500 text-xs">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {zeroBatches.length > 0 && (
        <div className="card bg-amber-50 border border-amber-100 flex items-start gap-3">
          <AlertTriangle size={17} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-amber-800 text-sm">
              {zeroBatches.length} batch{zeroBatches.length > 1 ? "es" : ""} with no materials uploaded
            </div>
            <p className="text-amber-700 text-xs mt-0.5">
              {zeroBatches.map((b) => b.batch).join(", ")} — ask the assigned teacher to upload study materials.
            </p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 card">
          <h2 className="font-semibold text-[var(--color-navy)] mb-4 font-[family-name:var(--font-playfair)]">
            Materials Uploaded per Batch
          </h2>
          {batchData.length === 0 ? (
            <p className="text-slate-400 text-sm py-8 text-center">No batches found.</p>
          ) : (
            <BarChartClient
              data={batchData}
              bars={[{ key: "Materials", label: "Materials", color: "#0A1F5C" }]}
              xKey="batch"
              height={240}
            />
          )}
        </div>
        <div className="lg:col-span-2 card">
          <h2 className="font-semibold text-[var(--color-navy)] mb-1 font-[family-name:var(--font-playfair)]">
            Notices by Category
          </h2>
          {noticeCats.length === 0 ? (
            <p className="text-slate-400 text-sm py-8 text-center">No notices published yet.</p>
          ) : (
            <DonutChartClient data={noticeCats} height={220} />
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={16} className="text-[var(--color-navy)]" />
            <h2 className="font-semibold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">Top Downloaded Materials</h2>
          </div>
          {topMaterials.length === 0 ? (
            <p className="text-slate-400 text-sm py-4">No materials uploaded yet.</p>
          ) : (
            <div className="space-y-2">
              {topMaterials.map((m, i) => (
                <div key={m.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                  <span className="text-xs font-bold text-slate-300 w-5 text-right shrink-0">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--color-navy)] truncate">{m.title}</div>
                    <div className="flex gap-2 mt-0.5">
                      <span className="text-xs text-slate-400">{m.subject}</span>
                      <span className="badge text-[10px] bg-[var(--color-teal)]/10 text-[var(--color-teal)]">{m.type}</span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-[var(--color-navy)] shrink-0">{m.downloadCount ?? 0} ↓</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Play size={16} className="text-[var(--color-maroon)]" />
            <h2 className="font-semibold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">Top Viewed Recordings</h2>
          </div>
          {topRecordings.length === 0 ? (
            <p className="text-slate-400 text-sm py-4">No recordings available yet.</p>
          ) : (
            <div className="space-y-2">
              {topRecordings.map((r, i) => (
                <div key={r.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                  <span className="text-xs font-bold text-slate-300 w-5 text-right shrink-0">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--color-navy)] truncate">{r.title}</div>
                    <div className="flex gap-2 mt-0.5">
                      <span className="text-xs text-slate-400">{r.subject}</span>
                      {r.durationMinutes && (
                        <span className="text-xs text-slate-400">{Math.floor(r.durationMinutes / 60)}h {r.durationMinutes % 60}m</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-[var(--color-maroon)] shrink-0">{r.viewCount ?? 0} ▶</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

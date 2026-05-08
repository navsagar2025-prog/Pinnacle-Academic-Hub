import Link from "next/link";
import { Video } from "lucide-react";
import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { classRecordings, batches, users } from "@workspace/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { AdminRecordingsManager } from "./AdminRecordingsManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Recordings — Admin Panel" };

export default async function AdminRecordingsPage() {
  await requirePortalRole("admin");

  const [allBatches, rows] = await Promise.all([
    db.select({ id: batches.id, name: batches.name }).from(batches).orderBy(batches.name),
    db
      .select({
        id: classRecordings.id,
        title: classRecordings.title,
        subject: classRecordings.subject,
        teacherName: classRecordings.teacherName,
        recordingUrl: classRecordings.recordingUrl,
        sourceProvider: classRecordings.sourceProvider,
        classDate: classRecordings.classDate,
        durationMinutes: classRecordings.durationMinutes,
        isVisible: classRecordings.isVisible,
        viewCount: classRecordings.viewCount,
        archivedAt: classRecordings.archivedAt,
        createdAt: classRecordings.createdAt,
        batchId: classRecordings.batchId,
        batchIds: classRecordings.batchIds,
        createdByName: users.name,
      })
      .from(classRecordings)
      .leftJoin(users, eq(classRecordings.createdById, users.id))
      .orderBy(desc(classRecordings.createdAt))
      .limit(200),
  ]);

  // Resolve every batch id referenced anywhere on the page in one query so
  // the manager can render display names alongside multi-batch arrays.
  const allIds = new Set<string>();
  for (const r of rows) {
    for (const id of r.batchIds ?? []) allIds.add(id);
    if (r.batchId) allIds.add(r.batchId);
  }
  const nameMap = new Map<string, string>();
  if (allIds.size > 0) {
    const found = await db
      .select({ id: batches.id, name: batches.name })
      .from(batches)
      .where(inArray(batches.id, Array.from(allIds)));
    for (const b of found) nameMap.set(b.id, b.name);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--color-navy)]/10 rounded-xl flex items-center justify-center">
            <Video size={20} className="text-[var(--color-navy)]" />
          </div>
          <div>
            <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">
              Recorded Classes
            </h1>
            <p className="text-slate-500 text-sm">
              {rows.length} recording{rows.length === 1 ? "" : "s"} · students see them in their
              batch&apos;s portal under <span className="font-mono">/portal/student/recordings</span>.
              Watermark + cycling overlay are configured in{" "}
              <Link href="/portal/admin/settings/watermark" className="text-[var(--color-teal)] hover:underline">
                Watermark settings
              </Link>
              .
            </p>
          </div>
        </div>
      </div>

      <AdminRecordingsManager
        initialRows={rows.map((r) => ({
          ...r,
          classDate: r.classDate ? r.classDate.toISOString() : null,
          archivedAt: r.archivedAt ? r.archivedAt.toISOString() : null,
          createdAt: r.createdAt.toISOString(),
          batchName: r.batchId ? nameMap.get(r.batchId) ?? null : null,
          batchNames: (r.batchIds ?? []).map((id) => nameMap.get(id) ?? id),
        }))}
        batches={allBatches}
      />
    </div>
  );
}

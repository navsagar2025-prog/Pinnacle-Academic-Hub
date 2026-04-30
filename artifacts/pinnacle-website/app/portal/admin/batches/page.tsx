import { db } from "@workspace/db";
import { batches, courses } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { Users, Clock, Plus } from "lucide-react";

export const metadata = { title: "Batches — Admin Panel" };

export default async function AdminBatchesPage() {
  const rows = await db
    .select({
      id: batches.id,
      name: batches.name,
      timingLabel: batches.timingLabel,
      daysLabel: batches.daysLabel,
      maxStudents: batches.maxStudents,
      status: batches.status,
      room: batches.room,
      startDate: batches.startDate,
      courseTitle: courses.title,
    })
    .from(batches)
    .leftJoin(courses, eq(batches.courseId, courses.id))
    .orderBy(batches.createdAt);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Batches</h1>
          <p className="text-slate-500 text-sm mt-1">{rows.length} batches · {rows.filter((b) => b.status === "active").length} active</p>
        </div>
        <button className="btn-primary py-2.5 px-5 text-sm"><Plus size={15} />Create Batch</button>
      </div>

      {rows.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">No batches found. Create a batch to get started.</div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {rows.map((b) => (
            <div key={b.id} className="card hover:shadow-elevated transition-all">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)] text-sm">{b.name}</h3>
                <span className={`badge text-xs ${b.status === "active" ? "bg-[var(--color-teal)]/10 text-[var(--color-teal)]" : b.status === "full" ? "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]" : "bg-[var(--color-gold)]/15 text-[var(--color-navy)]"}`}>
                  {b.status}
                </span>
              </div>
              <div className="space-y-2 text-xs text-slate-500">
                <div className="flex items-center gap-2"><Clock size={12} />{b.timingLabel} · {b.daysLabel}</div>
                {b.room && <div className="flex items-center gap-2">Room: {b.room}</div>}
                <div className="text-xs text-slate-400">{b.courseTitle ?? "—"}</div>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">Max Capacity</span>
                  <span className="font-semibold text-[var(--color-navy)]">{b.maxStudents ?? 30} seats</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[var(--color-teal)]" style={{ width: "40%" }} />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
                <button className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-[var(--color-navy)]/5 text-[var(--color-navy)] hover:bg-[var(--color-navy)] hover:text-white transition-colors">Manage</button>
                <button className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-[var(--color-teal)]/5 text-[var(--color-teal)] hover:bg-[var(--color-teal)] hover:text-white transition-colors">Timetable</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

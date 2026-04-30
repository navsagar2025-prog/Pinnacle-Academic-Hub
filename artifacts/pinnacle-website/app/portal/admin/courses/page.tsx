import { db } from "@workspace/db";
import { courses, batches } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import { BookOpen, Archive } from "lucide-react";
import { AddCourseButton, EditCourseButton, ArchiveCourseButton } from "./CourseModal";

export const metadata = { title: "Courses — Admin Panel" };

export default async function AdminCoursesPage() {
  const rows = await db.select().from(courses).orderBy(courses.createdAt);
  const batchCounts = await db
    .select({ courseId: batches.courseId, count: sql<number>`count(*)::int` })
    .from(batches)
    .where(eq(batches.status, "active"))
    .groupBy(batches.courseId);
  const batchMap = Object.fromEntries(batchCounts.map((b) => [b.courseId, b.count]));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Courses</h1>
          <p className="text-slate-500 text-sm mt-1">{rows.filter((r) => r.isActive).length} active · {rows.length} total</p>
        </div>
        <AddCourseButton />
      </div>

      {rows.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
          <p>No courses yet. Add your first course to get started.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--color-slate-light)] border-b border-slate-100">
                <tr>
                  {["Course", "Duration", "Annual Fee", "Active Batches", "Eligibility", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((c) => (
                  <tr key={c.id} className={`hover:bg-[var(--color-slate-light)]/50 transition-colors ${!c.isActive ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-sm text-[var(--color-navy)]">{c.title}</div>
                      <div className="text-xs text-slate-400 font-mono">{c.slug}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{c.durationLabel ?? "—"}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-[var(--color-teal)] whitespace-nowrap">
                      ₹{c.annualFee.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-slate-600">{batchMap[c.id] ?? 0}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[180px]">{c.eligibility ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`badge text-xs ${c.isActive ? "bg-[var(--color-teal)]/10 text-[var(--color-teal)]" : "bg-slate-100 text-slate-400"}`}>
                        {c.isActive ? "Active" : <><Archive size={10} className="inline mr-1" />Archived</>}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1.5">
                        <EditCourseButton course={c} />
                        <ArchiveCourseButton course={c} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

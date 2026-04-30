import { db } from "@workspace/db";
import { results } from "@workspace/db/schema";
import { sql, desc } from "drizzle-orm";
import { Trophy, Star } from "lucide-react";
import { AddResultButton, EditResultButton, DeleteResultButton } from "./ResultModal";

export const metadata = { title: "Results Management — Admin Panel" };

export default async function AdminResultsPage() {
  const rows = await db.select().from(results).orderBy(desc(results.academicYear), desc(results.createdAt));
  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(results);

  const byYear = rows.reduce<Record<string, typeof rows>>((acc, r) => {
    if (!acc[r.academicYear]) acc[r.academicYear] = [];
    acc[r.academicYear].push(r);
    return acc;
  }, {});

  const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Results & Toppers</h1>
          <p className="text-slate-500 text-sm mt-1">{total} records · {rows.filter((r) => r.isTopper).length} featured toppers</p>
        </div>
        <AddResultButton />
      </div>

      {rows.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          <Trophy size={32} className="mx-auto mb-3 opacity-30" />
          <p>No results yet. Add student achievements to showcase on the public results page.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {years.map((year) => (
            <div key={year}>
              <h2 className="font-semibold text-[var(--color-navy)] text-sm mb-3 flex items-center gap-2">
                <span className="badge bg-[var(--color-navy)]/10 text-[var(--color-navy)]">{year}</span>
                {byYear[year].length} results
              </h2>
              <div className="card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[var(--color-slate-light)] border-b border-slate-100">
                      <tr>
                        {["Student", "Exam", "Rank", "College", "Batch", "Featured", "Actions"].map((h) => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {byYear[year].map((r) => (
                        <tr key={r.id} className="hover:bg-[var(--color-slate-light)]/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-maroon)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {r.initials}
                              </div>
                              <span className="font-semibold text-sm text-[var(--color-navy)]">{r.studentName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{r.examName}</td>
                          <td className="px-4 py-3 text-sm font-bold text-[var(--color-teal)] whitespace-nowrap">{r.rank}</td>
                          <td className="px-4 py-3 text-xs text-slate-500 max-w-[160px] truncate">{r.college ?? "—"}</td>
                          <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{r.batch ?? "—"}</td>
                          <td className="px-4 py-3">
                            {r.isTopper && (
                              <span className="badge bg-[var(--color-gold)]/15 text-[var(--color-navy)] text-xs flex items-center gap-1 w-fit">
                                <Star size={10} fill="currentColor" />Topper
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <EditResultButton result={r} />
                              <DeleteResultButton resultId={r.id} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

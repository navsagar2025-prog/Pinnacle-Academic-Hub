import { db } from "@workspace/db";
import { students, users, batches } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import { Users, Plus, CheckCircle, Clock } from "lucide-react";

export const metadata = { title: "Students — Admin Panel" };

export default async function AdminStudentsPage() {
  const rows = await db
    .select({
      id: students.id,
      rollNumber: students.rollNumber,
      enrolledAt: students.enrolledAt,
      isActive: students.isActive,
      name: users.name,
      phone: users.phone,
      email: users.email,
      batchName: batches.name,
    })
    .from(students)
    .leftJoin(users, eq(students.userId, users.id))
    .leftJoin(batches, eq(students.batchId, batches.id))
    .where(eq(students.isActive, true))
    .orderBy(students.enrolledAt);

  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(students);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Students</h1>
          <p className="text-slate-500 text-sm mt-1">{rows.length} active · {total} total enrolled</p>
        </div>
        <button className="btn-primary py-2.5 px-5 text-sm"><Plus size={15} />Add Student</button>
      </div>

      {rows.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          <Users size={32} className="mx-auto mb-3 opacity-30" />
          <p>No students enrolled yet. Students appear here after registration.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--color-slate-light)] border-b border-slate-100">
                <tr>
                  {["Roll No.", "Name", "Batch", "Phone", "Enrolled", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((s) => (
                  <tr key={s.id} className="hover:bg-[var(--color-slate-light)]/50 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-slate-500 whitespace-nowrap">{s.rollNumber}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-[var(--color-navy)]/10 rounded-full flex items-center justify-center text-[var(--color-navy)] text-xs font-bold flex-shrink-0">
                          {s.name?.charAt(0) ?? "?"}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-[var(--color-navy)] whitespace-nowrap">{s.name ?? "—"}</div>
                          {s.email && <div className="text-xs text-slate-400">{s.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{s.batchName ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{s.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(s.enrolledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-xs font-semibold text-[var(--color-teal)] hover:underline">View</button>
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

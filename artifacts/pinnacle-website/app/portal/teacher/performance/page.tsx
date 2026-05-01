import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { teachers, schedules, batches, students, users, studentTestResults, courses } from "@workspace/db/schema";
import { eq, and, sql, avg, max, min, count, inArray } from "drizzle-orm";
import { TrendingUp, Users, AlertCircle, BarChart3, Award, ArrowDown } from "lucide-react";

export const metadata = { title: "Student Performance — Teacher Portal" };

export default async function TeacherPerformancePage() {
  const dbUser = await requirePortalRole("teacher");

  const [teacher] = await db
    .select({ id: teachers.id, designation: teachers.designation })
    .from(teachers)
    .where(and(eq(teachers.userId, dbUser.id), eq(teachers.isActive, true)))
    .limit(1);

  const assignedBatches = teacher
    ? await db
        .selectDistinct({
          batchId: batches.id,
          batchName: batches.name,
          courseTitle: courses.title,
        })
        .from(schedules)
        .leftJoin(batches, eq(schedules.batchId, batches.id))
        .leftJoin(courses, eq(batches.courseId, courses.id))
        .where(eq(schedules.teacherId, teacher.id))
    : [];

  const batchIds = assignedBatches.map((b) => b.batchId).filter((id): id is string => id !== null);

  const studentRows =
    batchIds.length > 0
      ? await db
          .select({
            studentId: students.id,
            studentName: users.name,
            rollNumber: students.rollNumber,
            batchId: students.batchId,
            batchName: batches.name,
          })
          .from(students)
          .leftJoin(users, eq(students.userId, users.id))
          .leftJoin(batches, eq(students.batchId, batches.id))
          .where(
            and(
              eq(students.isActive, true),
              inArray(students.batchId, batchIds)
            )
          )
      : [];

  const studentIds = studentRows.map((s) => s.studentId);

  const resultStats =
    studentIds.length > 0
      ? await db
          .select({
            studentId: studentTestResults.studentId,
            examCount: count(studentTestResults.id),
            avgMarks: avg(studentTestResults.marksObtained),
            maxMarks: max(studentTestResults.marksObtained),
            minMarks: min(studentTestResults.marksObtained),
            avgTotal: avg(studentTestResults.totalMarks),
            lastExam: sql<string>`MAX(${studentTestResults.examDate}::text)`,
          })
          .from(studentTestResults)
          .where(inArray(studentTestResults.studentId, studentIds))
          .groupBy(studentTestResults.studentId)
      : [];

  const statsMap: Record<
    string,
    { examCount: number; avgMarks: number; maxMarks: number; minMarks: number; avgTotal: number; lastExam: string }
  > = {};
  for (const r of resultStats) {
    statsMap[r.studentId] = {
      examCount: Number(r.examCount),
      avgMarks: parseFloat(String(r.avgMarks ?? "0")),
      maxMarks: Number(r.maxMarks ?? 0),
      minMarks: Number(r.minMarks ?? 0),
      avgTotal: parseFloat(String(r.avgTotal ?? "0")),
      lastExam: r.lastExam ?? "",
    };
  }

  const tableRows = studentRows.map((s) => {
    const st = statsMap[s.studentId];
    const pct = st && st.avgTotal > 0 ? (st.avgMarks / st.avgTotal) * 100 : null;
    return { ...s, ...st, pct };
  });

  const byBatch: Record<
    string,
    { batchName: string; rows: typeof tableRows }
  > = {};
  for (const row of tableRows) {
    const key = row.batchId ?? "unknown";
    if (!byBatch[key]) byBatch[key] = { batchName: row.batchName ?? "Batch", rows: [] };
    byBatch[key].rows.push(row);
  }

  for (const key of Object.keys(byBatch)) {
    byBatch[key].rows.sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1));
  }

  const allPcts = tableRows.map((r) => r.pct).filter((p): p is number => p !== null && p !== undefined);
  const overallAvg = allPcts.length > 0 ? allPcts.reduce((a, b) => a + b, 0) / allPcts.length : null;
  const topPct = allPcts.length > 0 ? Math.max(...allPcts) : null;
  const bottomPct = allPcts.length > 0 ? Math.min(...allPcts) : null;

  function pctColor(pct: number | null | undefined) {
    if (pct === null || pct === undefined) return "text-slate-400";
    if (pct >= 75) return "text-green-600";
    if (pct >= 50) return "text-amber-600";
    return "text-[var(--color-maroon)]";
  }

  function barWidth(pct: number | null | undefined) {
    return `${Math.min(Math.max(pct ?? 0, 0), 100)}%`;
  }

  function barColor(pct: number | null | undefined) {
    if (pct === null || pct === undefined) return "bg-slate-200";
    if (pct >= 75) return "bg-green-500";
    if (pct >= 50) return "bg-amber-400";
    return "bg-[var(--color-maroon)]";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">
          Student Performance
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Overview of test scores across your assigned batches
        </p>
      </div>

      {!teacher && (
        <div className="card bg-amber-50 border border-amber-100 flex items-start gap-3">
          <AlertCircle size={17} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-amber-800 text-sm">Your teacher profile is not yet set up. Contact admin.</p>
        </div>
      )}

      {teacher && studentRows.length === 0 && (
        <div className="card text-center py-12">
          <BarChart3 size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No students found in your batches.</p>
        </div>
      )}

      {teacher && studentRows.length > 0 && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card flex flex-col gap-2 border-l-4 border-l-[var(--color-navy)]">
              <div className="w-9 h-9 rounded-lg bg-[var(--color-navy)]/10 flex items-center justify-center text-[var(--color-navy)]">
                <Users size={17} />
              </div>
              <div className="text-2xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">{studentRows.length}</div>
              <div className="text-slate-500 text-xs">Total Students</div>
            </div>
            <div className="card flex flex-col gap-2 border-l-4 border-l-[var(--color-teal)]">
              <div className="w-9 h-9 rounded-lg bg-[var(--color-teal)]/10 flex items-center justify-center text-[var(--color-teal)]">
                <TrendingUp size={17} />
              </div>
              <div className="text-2xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">
                {overallAvg !== null ? `${overallAvg.toFixed(1)}%` : "—"}
              </div>
              <div className="text-slate-500 text-xs">Batch Average</div>
            </div>
            <div className="card flex flex-col gap-2 border-l-4 border-l-green-500">
              <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                <Award size={17} />
              </div>
              <div className="text-2xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">
                {topPct !== null ? `${topPct.toFixed(1)}%` : "—"}
              </div>
              <div className="text-slate-500 text-xs">Highest Score</div>
            </div>
            <div className="card flex flex-col gap-2 border-l-4 border-l-[var(--color-maroon)]">
              <div className="w-9 h-9 rounded-lg bg-[var(--color-maroon)]/10 flex items-center justify-center text-[var(--color-maroon)]">
                <ArrowDown size={17} />
              </div>
              <div className="text-2xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">
                {bottomPct !== null ? `${bottomPct.toFixed(1)}%` : "—"}
              </div>
              <div className="text-slate-500 text-xs">Lowest Score</div>
            </div>
          </div>

          {Object.entries(byBatch).map(([key, { batchName, rows }]) => (
            <div key={key} className="card">
              <h2 className="font-bold text-[var(--color-navy)] mb-4 font-[family-name:var(--font-playfair)]">
                {batchName}
                <span className="ml-2 text-xs font-normal text-slate-400">({rows.length} students)</span>
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                      <th className="text-left py-2 pr-4">Student</th>
                      <th className="text-center py-2 px-4">Roll #</th>
                      <th className="text-center py-2 px-4">Exams</th>
                      <th className="text-center py-2 px-4">Avg Marks</th>
                      <th className="text-center py-2 px-4">Best</th>
                      <th className="text-left py-2 pl-4">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, idx) => (
                      <tr key={r.studentId} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                idx === 0 ? "bg-amber-100 text-amber-700" : "bg-[var(--color-navy)]/10 text-[var(--color-navy)]"
                              }`}
                            >
                              {idx === 0 ? "★" : idx + 1}
                            </div>
                            <span className="font-medium text-[var(--color-navy)] truncate max-w-[140px]">{r.studentName ?? "—"}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-slate-500 text-xs">{r.rollNumber}</td>
                        <td className="py-3 px-4 text-center font-medium text-[var(--color-navy)]">
                          {r.examCount ?? <span className="text-slate-300">—</span>}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {r.avgMarks !== undefined && r.avgTotal ? (
                            <span className={`font-semibold ${pctColor(r.pct)}`}>
                              {r.avgMarks.toFixed(1)}/{r.avgTotal.toFixed(0)}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs">No data</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {r.maxMarks !== undefined && r.maxMarks > 0 ? (
                            <span className="font-semibold text-green-600">{r.maxMarks}</span>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="py-3 pl-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden min-w-[60px]">
                              <div
                                className={`h-full rounded-full transition-all ${barColor(r.pct)}`}
                                style={{ width: barWidth(r.pct) }}
                              />
                            </div>
                            <span className={`text-xs font-semibold w-10 text-right ${pctColor(r.pct)}`}>
                              {r.pct !== null && r.pct !== undefined ? `${r.pct.toFixed(0)}%` : "—"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {rows.every((r) => !r.examCount) && (
                <p className="text-slate-400 text-sm text-center py-4">
                  No test results recorded yet for this batch. Results will appear here once exams are entered.
                </p>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { teachers, schedules, batches, students, users, studentTestResults, courses, attendance } from "@workspace/db/schema";
import { eq, and, sql, avg, max, min, count, inArray } from "drizzle-orm";
import { TrendingUp, Users, AlertCircle, BarChart3, Award, ArrowDown, UserCheck } from "lucide-react";

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

  // Test score stats per student
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

  // Attendance stats per student — present & late both count as attended
  const attendanceStats =
    studentIds.length > 0
      ? await db
          .select({
            studentId: attendance.studentId,
            total: count(attendance.id),
            attended: sql<number>`COUNT(*) FILTER (WHERE ${attendance.status} IN ('present', 'late'))`,
          })
          .from(attendance)
          .where(inArray(attendance.studentId, studentIds))
          .groupBy(attendance.studentId)
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

  const attendanceMap: Record<string, { total: number; attended: number; pct: number | null }> = {};
  for (const a of attendanceStats) {
    const total = Number(a.total);
    const attended = Number(a.attended);
    attendanceMap[a.studentId] = {
      total,
      attended,
      pct: total > 0 ? (attended / total) * 100 : null,
    };
  }

  const tableRows = studentRows.map((s) => {
    const st = statsMap[s.studentId];
    const att = attendanceMap[s.studentId];
    const pct = st && st.avgTotal > 0 ? (st.avgMarks / st.avgTotal) * 100 : null;
    return { ...s, ...st, pct, attendancePct: att?.pct ?? null, attendanceTotal: att?.total ?? 0 };
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

  // Compute overall attendance average across all students
  const allAttPcts = tableRows
    .map((r) => r.attendancePct)
    .filter((p): p is number => p !== null && p !== undefined);
  const overallAttAvg =
    allAttPcts.length > 0 ? allAttPcts.reduce((a, b) => a + b, 0) / allAttPcts.length : null;

  function scorePctColor(pct: number | null | undefined) {
    if (pct === null || pct === undefined) return "text-slate-400";
    if (pct >= 75) return "text-green-600";
    if (pct >= 50) return "text-amber-600";
    return "text-[var(--color-maroon)]";
  }

  function attPctColor(pct: number | null | undefined) {
    if (pct === null || pct === undefined) return "text-slate-400";
    if (pct >= 75) return "text-green-600";
    if (pct >= 60) return "text-amber-600";
    return "text-[var(--color-maroon)]";
  }

  function attBadgeBg(pct: number | null | undefined) {
    if (pct === null || pct === undefined) return "bg-slate-100 text-slate-400";
    if (pct >= 75) return "bg-green-50 text-green-700 ring-1 ring-green-200";
    if (pct >= 60) return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
    return "bg-red-50 text-[var(--color-maroon)] ring-1 ring-red-200";
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
          Test scores and attendance rates across your assigned batches
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
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
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
              <div className="text-slate-500 text-xs">Avg Score</div>
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
            <div className="card flex flex-col gap-2 border-l-4 border-l-blue-500">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <UserCheck size={17} />
              </div>
              <div className="text-2xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">
                {overallAttAvg !== null ? `${overallAttAvg.toFixed(1)}%` : "—"}
              </div>
              <div className="text-slate-500 text-xs">Avg Attendance</div>
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
                      <th className="text-center py-2 px-3">Roll #</th>
                      <th className="text-center py-2 px-3">Exams</th>
                      <th className="text-center py-2 px-3">Avg Marks</th>
                      <th className="text-center py-2 px-3">Best</th>
                      <th className="text-left py-2 px-3">Score %</th>
                      <th className="text-center py-2 pl-3">Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, idx) => (
                      <tr key={r.studentId} className={`border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors ${r.attendancePct !== null && r.attendancePct < 75 ? "bg-red-50/30" : ""}`}>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                idx === 0 ? "bg-amber-100 text-amber-700" : "bg-[var(--color-navy)]/10 text-[var(--color-navy)]"
                              }`}
                            >
                              {idx === 0 ? "★" : idx + 1}
                            </div>
                            <span className="font-medium text-[var(--color-navy)] truncate max-w-[120px]">{r.studentName ?? "—"}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center text-slate-500 text-xs">{r.rollNumber}</td>
                        <td className="py-3 px-3 text-center font-medium text-[var(--color-navy)]">
                          {r.examCount ?? <span className="text-slate-300">—</span>}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {r.avgMarks !== undefined && r.avgTotal ? (
                            <span className={`font-semibold ${scorePctColor(r.pct)}`}>
                              {r.avgMarks.toFixed(1)}/{r.avgTotal.toFixed(0)}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs">No data</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {r.maxMarks !== undefined && r.maxMarks > 0 ? (
                            <span className="font-semibold text-green-600">{r.maxMarks}</span>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden min-w-[48px]">
                              <div
                                className={`h-full rounded-full transition-all ${barColor(r.pct)}`}
                                style={{ width: barWidth(r.pct) }}
                              />
                            </div>
                            <span className={`text-xs font-semibold w-9 text-right ${scorePctColor(r.pct)}`}>
                              {r.pct !== null && r.pct !== undefined ? `${r.pct.toFixed(0)}%` : "—"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 pl-3 text-center">
                          {r.attendancePct !== null ? (
                            <div className="flex flex-col items-center gap-0.5">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${attBadgeBg(r.attendancePct)}`}>
                                {r.attendancePct.toFixed(0)}%
                              </span>
                              {r.attendancePct < 75 && (
                                <span className="text-[10px] text-[var(--color-maroon)] font-medium">Low</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {rows.every((r) => !r.examCount) && (
                <p className="text-slate-400 text-sm text-center py-4">
                  No test results recorded yet for this batch.
                </p>
              )}

              {/* Low attendance warning summary */}
              {(() => {
                const lowAtt = rows.filter((r) => r.attendancePct !== null && r.attendancePct < 75);
                if (lowAtt.length === 0) return null;
                return (
                  <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
                    <AlertCircle size={15} className="text-[var(--color-maroon)] flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-[var(--color-maroon)]">
                      <strong>{lowAtt.length} student{lowAtt.length > 1 ? "s" : ""}</strong> in this batch {lowAtt.length > 1 ? "have" : "has"} attendance below 75%:{" "}
                      {lowAtt.map((r) => r.studentName ?? r.rollNumber).join(", ")}.
                    </p>
                  </div>
                );
              })()}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

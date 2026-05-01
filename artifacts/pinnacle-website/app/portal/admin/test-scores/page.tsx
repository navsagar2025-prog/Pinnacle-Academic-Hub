import { db } from "@workspace/db";
import { studentTestResults, students, batches, users, courses } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { ClipboardList, BarChart3 } from "lucide-react";
import { AddTestScoreButton, EditTestScoreButton, DeleteTestScoreButton } from "./TestScoreModal";

export const metadata = { title: "Test Scores — Admin Panel" };

export default async function AdminTestScoresPage() {
  // Load all batches for the form selects
  const allBatches = await db
    .select({
      id: batches.id,
      name: batches.name,
      courseTitle: courses.title,
    })
    .from(batches)
    .leftJoin(courses, eq(batches.courseId, courses.id))
    .orderBy(batches.name);

  // Load recent test results (latest 300)
  const rows = await db
    .select({
      id: studentTestResults.id,
      studentId: studentTestResults.studentId,
      studentName: users.name,
      rollNumber: students.rollNumber,
      batchId: studentTestResults.batchId,
      batchName: batches.name,
      examName: studentTestResults.examName,
      subject: studentTestResults.subject,
      totalMarks: studentTestResults.totalMarks,
      marksObtained: studentTestResults.marksObtained,
      rank: studentTestResults.rank,
      examDate: studentTestResults.examDate,
    })
    .from(studentTestResults)
    .leftJoin(students, eq(studentTestResults.studentId, students.id))
    .leftJoin(users, eq(students.userId, users.id))
    .leftJoin(batches, eq(studentTestResults.batchId, batches.id))
    .leftJoin(courses, eq(batches.courseId, courses.id))
    .orderBy(desc(studentTestResults.examDate), desc(studentTestResults.id))
    .limit(300);

  // Group by exam name + subject + examDate (rounded to date) for display
  type GroupKey = string;
  const groupMap: Record<GroupKey, {
    examName: string;
    subject: string;
    examDate: Date;
    batchName: string | null;
    rows: typeof rows;
  }> = {};

  for (const r of rows) {
    const dateStr = r.examDate ? new Date(r.examDate).toDateString() : "Unknown";
    const key = `${r.examName}__${r.subject}__${dateStr}__${r.batchId ?? ""}`;
    if (!groupMap[key]) {
      groupMap[key] = {
        examName: r.examName,
        subject: r.subject,
        examDate: r.examDate ?? new Date(),
        batchName: r.batchName,
        rows: [],
      };
    }
    groupMap[key].rows.push(r);
  }

  const groups = Object.values(groupMap).sort(
    (a, b) => b.examDate.getTime() - a.examDate.getTime(),
  );

  function pctColor(marks: number, total: number) {
    const p = (marks / total) * 100;
    if (p >= 75) return "text-green-600";
    if (p >= 50) return "text-amber-600";
    return "text-[var(--color-maroon)]";
  }

  function pctBadge(marks: number, total: number) {
    const p = (marks / total) * 100;
    if (p >= 75) return "bg-green-50 text-green-700";
    if (p >= 50) return "bg-amber-50 text-amber-700";
    return "bg-red-50 text-[var(--color-maroon)]";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">
            Test Scores
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Internal exam results — these feed the teacher performance dashboard · {rows.length} entries
          </p>
        </div>
        <AddTestScoreButton batches={allBatches} />
      </div>

      {rows.length === 0 ? (
        <div className="card text-center py-16 text-slate-400">
          <BarChart3 size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No test results yet.</p>
          <p className="text-sm mt-1">Use the buttons above to enter individual or bulk results.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group, gIdx) => {
            const avg = group.rows.reduce((sum, r) => sum + (r.marksObtained / r.totalMarks) * 100, 0) / group.rows.length;
            const passed = group.rows.filter((r) => r.marksObtained / r.totalMarks >= 0.4).length;
            return (
              <div key={gIdx} className="card p-0 overflow-hidden">
                {/* Group header */}
                <div className="px-5 py-3.5 bg-[var(--color-slate-light)] border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <ClipboardList size={15} className="text-[var(--color-teal)] flex-shrink-0" />
                      <span className="font-bold text-[var(--color-navy)] text-sm">{group.examName}</span>
                      <span className="badge bg-[var(--color-teal)]/10 text-[var(--color-teal)] text-xs">{group.subject}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 ml-[23px]">
                      {group.batchName ?? "—"} ·{" "}
                      {group.examDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 ml-[23px] sm:ml-0">
                    <span>{group.rows.length} students</span>
                    <span>Avg: <strong className={pctColor(avg, 100)}>{avg.toFixed(1)}%</strong></span>
                    <span>Passed: <strong className="text-green-600">{passed}</strong></span>
                  </div>
                </div>

                {/* Results table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                        <th className="text-left px-4 py-2.5">Student</th>
                        <th className="text-center px-3 py-2.5">Roll #</th>
                        <th className="text-center px-3 py-2.5">Marks</th>
                        <th className="text-center px-3 py-2.5">Score %</th>
                        <th className="text-center px-3 py-2.5">Rank</th>
                        <th className="text-right px-4 py-2.5">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {group.rows
                        .sort((a, b) => b.marksObtained / b.totalMarks - a.marksObtained / a.totalMarks)
                        .map((r, idx) => {
                          const pct = (r.marksObtained / r.totalMarks) * 100;
                          return (
                            <tr key={r.id} className="hover:bg-[var(--color-slate-light)]/50 transition-colors">
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${idx === 0 ? "bg-amber-100 text-amber-700" : "bg-[var(--color-navy)]/8 text-[var(--color-navy)]"}`}>
                                    {idx === 0 ? "★" : idx + 1}
                                  </div>
                                  <span className="font-medium text-[var(--color-navy)] truncate max-w-[160px]">{r.studentName ?? "—"}</span>
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-center text-slate-400 text-xs">{r.rollNumber ?? "—"}</td>
                              <td className="px-3 py-2.5 text-center">
                                <span className={`font-semibold ${pctColor(r.marksObtained, r.totalMarks)}`}>
                                  {r.marksObtained}
                                </span>
                                <span className="text-slate-400 text-xs">/{r.totalMarks}</span>
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pctBadge(r.marksObtained, r.totalMarks)}`}>
                                  {pct.toFixed(0)}%
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-center text-xs text-slate-500">{r.rank ?? "—"}</td>
                              <td className="px-4 py-2.5 text-right">
                                <div className="flex items-center gap-3 justify-end">
                                  <EditTestScoreButton result={{
                                    ...r,
                                    studentName: r.studentName ?? null,
                                    rollNumber: r.rollNumber ?? "",
                                    batchName: r.batchName ?? null,
                                    examDate: r.examDate?.toISOString() ?? "",
                                  }} />
                                  <DeleteTestScoreButton id={r.id} />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

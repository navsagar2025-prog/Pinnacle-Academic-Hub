import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { students, studentTestResults, batches } from "@workspace/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { TrendingUp, AlertCircle, Award, CheckCircle, XCircle } from "lucide-react";

export const metadata = { title: "Results & Performance — Student Portal" };

const SUBJECT_COLORS: Record<string, string> = {
  Physics: "bg-[var(--color-navy)]/10 text-[var(--color-navy)]",
  Chemistry: "bg-[var(--color-teal)]/10 text-[var(--color-teal)]",
  Mathematics: "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]",
  Biology: "bg-green-100 text-green-700",
};

const DEMO_RESULTS = [
  { id: "d1", examName: "Unit Test 1", subject: "Physics", totalMarks: 100, marksObtained: 72, rank: "5th", examDate: new Date("2026-03-10") },
  { id: "d2", examName: "Unit Test 1", subject: "Chemistry", totalMarks: 100, marksObtained: 65, rank: "8th", examDate: new Date("2026-03-10") },
  { id: "d3", examName: "Unit Test 1", subject: "Mathematics", totalMarks: 100, marksObtained: 85, rank: "2nd", examDate: new Date("2026-03-11") },
  { id: "d4", examName: "Unit Test 2", subject: "Physics", totalMarks: 100, marksObtained: 78, rank: "4th", examDate: new Date("2026-04-05") },
  { id: "d5", examName: "Unit Test 2", subject: "Chemistry", totalMarks: 100, marksObtained: 70, rank: "6th", examDate: new Date("2026-04-05") },
  { id: "d6", examName: "Unit Test 2", subject: "Mathematics", totalMarks: 100, marksObtained: 91, rank: "1st", examDate: new Date("2026-04-06") },
  { id: "d7", examName: "Monthly Test — April", subject: "Physics", totalMarks: 150, marksObtained: 119, rank: "3rd", examDate: new Date("2026-04-20") },
  { id: "d8", examName: "Monthly Test — April", subject: "Chemistry", totalMarks: 150, marksObtained: 105, rank: "7th", examDate: new Date("2026-04-20") },
  { id: "d9", examName: "Monthly Test — April", subject: "Mathematics", totalMarks: 150, marksObtained: 136, rank: "1st", examDate: new Date("2026-04-21") },
];

function PassBadge({ pct }: { pct: number }) {
  const pass = pct >= 33;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${pass ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
      {pass ? <CheckCircle size={10} /> : <XCircle size={10} />}
      {pass ? "Pass" : "Fail"}
    </span>
  );
}

function PerformanceBar({ pct, subject }: { pct: number; subject: string }) {
  const colorMap: Record<string, string> = {
    Physics: "bg-[var(--color-navy)]",
    Chemistry: "bg-[var(--color-teal)]",
    Mathematics: "bg-[var(--color-maroon)]",
    Biology: "bg-green-600",
  };
  const color = colorMap[subject] ?? "bg-slate-500";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-slate-600 w-10 text-right">{pct}%</span>
    </div>
  );
}

export default async function ResultsPage() {
  const dbUser = await requirePortalRole("student");

  const [enrollment] = await db
    .select({ studentId: students.id, batchId: students.batchId })
    .from(students)
    .where(and(eq(students.userId, dbUser.id), eq(students.isActive, true)))
    .limit(1);

  const batchName = enrollment?.batchId
    ? await db.select({ name: batches.name }).from(batches).where(eq(batches.id, enrollment.batchId)).limit(1).then((r) => r[0]?.name ?? null)
    : null;

  const dbResults = enrollment?.studentId
    ? await db
        .select({
          id: studentTestResults.id,
          examName: studentTestResults.examName,
          subject: studentTestResults.subject,
          totalMarks: studentTestResults.totalMarks,
          marksObtained: studentTestResults.marksObtained,
          rank: studentTestResults.rank,
          examDate: studentTestResults.examDate,
        })
        .from(studentTestResults)
        .where(eq(studentTestResults.studentId, enrollment.studentId))
        .orderBy(asc(studentTestResults.examDate))
    : [];

  const isDemo = dbResults.length === 0 && enrollment !== undefined;
  const data = dbResults.length > 0 ? dbResults : (enrollment ? DEMO_RESULTS : []);

  const groupedByExam = data.reduce<Record<string, typeof data>>((acc, r) => {
    acc[r.examName] = acc[r.examName] ?? [];
    acc[r.examName].push(r);
    return acc;
  }, {});

  const examNames = Object.keys(groupedByExam);

  const subjectTrend = data.reduce<Record<string, { exam: string; pct: number }[]>>((acc, r) => {
    acc[r.subject] = acc[r.subject] ?? [];
    acc[r.subject].push({
      exam: r.examName,
      pct: Math.round((r.marksObtained / r.totalMarks) * 100),
    });
    return acc;
  }, {});

  const avgPct = data.length > 0
    ? Math.round(data.reduce((s, r) => s + (r.marksObtained / r.totalMarks) * 100, 0) / data.length)
    : 0;

  const bestResult = data.length > 0
    ? data.reduce((best, r) => (r.marksObtained / r.totalMarks > best.marksObtained / best.totalMarks ? r : best))
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Results & Performance</h1>
        <p className="text-slate-500 text-sm mt-1">
          {enrollment
            ? `${data.length} result${data.length !== 1 ? "s" : ""} across ${examNames.length} exam${examNames.length !== 1 ? "s" : ""} · ${batchName ?? ""}`
            : "Not enrolled in a batch"}
        </p>
      </div>

      {!enrollment && (
        <div className="card bg-amber-50 border border-amber-100 flex items-start gap-3">
          <AlertCircle size={17} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-amber-800 text-sm">Your batch enrollment is pending. Results will appear here once assigned to a batch.</p>
        </div>
      )}

      {isDemo && (
        <div className="card bg-blue-50 border border-blue-100 flex items-start gap-3">
          <AlertCircle size={17} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-blue-800 text-sm">No results posted yet — showing sample data for reference.</p>
        </div>
      )}

      {data.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="card border-l-4 border-l-[var(--color-navy)]">
              <div className="text-3xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">{avgPct}%</div>
              <div className="text-slate-500 text-xs mt-1">Average Score</div>
            </div>
            <div className="card border-l-4 border-l-[var(--color-teal)]">
              <div className="text-3xl font-bold text-[var(--color-teal)] font-[family-name:var(--font-playfair)]">{examNames.length}</div>
              <div className="text-slate-500 text-xs mt-1">Exams Taken</div>
            </div>
            {bestResult && (
              <div className="card border-l-4 border-l-[var(--color-gold)]">
                <div className="text-3xl font-bold text-[var(--color-maroon)] font-[family-name:var(--font-playfair)]">{Math.round((bestResult.marksObtained / bestResult.totalMarks) * 100)}%</div>
                <div className="text-slate-500 text-xs mt-1">Best Score — {bestResult.subject}</div>
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)] mb-4 flex items-center gap-2">
              <TrendingUp size={17} />Performance by Subject
            </h2>
            <div className="space-y-4">
              {Object.entries(subjectTrend).map(([subject, points]) => {
                const latest = points[points.length - 1];
                return (
                  <div key={subject}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`badge text-xs ${SUBJECT_COLORS[subject] ?? "bg-slate-100 text-slate-600"}`}>{subject}</span>
                      <span className="text-xs text-slate-400">{points.length} test{points.length !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex items-end gap-1.5 h-12 mb-2">
                      {points.map((p, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5">
                          <div
                            className={`w-full rounded-t transition-all ${
                              subject === "Physics" ? "bg-[var(--color-navy)]" :
                              subject === "Chemistry" ? "bg-[var(--color-teal)]" :
                              subject === "Mathematics" ? "bg-[var(--color-maroon)]" : "bg-green-600"
                            }`}
                            style={{ height: `${Math.max(p.pct, 4)}%` }}
                            title={`${p.exam}: ${p.pct}%`}
                          />
                        </div>
                      ))}
                    </div>
                    <PerformanceBar pct={latest.pct} subject={subject} />
                    <div className="flex justify-between text-xs text-slate-300 mt-1">
                      {points.map((p, i) => <span key={i}>{p.exam.replace("Unit Test ", "UT").replace("Monthly Test — ", "")}</span>)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {examNames.map((exam) => (
            <div key={exam} className="card">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h2 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">{exam}</h2>
                <span className="text-xs text-slate-400">
                  {groupedByExam[exam][0]?.examDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Subject</th>
                      <th className="text-right py-2 pr-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Marks</th>
                      <th className="text-right py-2 pr-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">%</th>
                      <th className="text-right py-2 pr-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Rank</th>
                      <th className="text-right py-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedByExam[exam].map((r) => {
                      const p = Math.round((r.marksObtained / r.totalMarks) * 100);
                      return (
                        <tr key={r.id} className="border-b border-slate-50 last:border-0">
                          <td className="py-2.5 pr-4">
                            <span className={`badge text-xs ${SUBJECT_COLORS[r.subject] ?? "bg-slate-100 text-slate-600"}`}>{r.subject}</span>
                          </td>
                          <td className="py-2.5 pr-4 text-right font-semibold text-[var(--color-navy)]">
                            {r.marksObtained}/{r.totalMarks}
                          </td>
                          <td className="py-2.5 pr-4 text-right">
                            <span className={`font-semibold ${p >= 75 ? "text-green-600" : p >= 50 ? "text-amber-600" : "text-red-500"}`}>{p}%</span>
                          </td>
                          <td className="py-2.5 pr-4 text-right">
                            {r.rank ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-gold)]">
                                <Award size={11} />{r.rank}
                              </span>
                            ) : "—"}
                          </td>
                          <td className="py-2.5 text-right">
                            <PassBadge pct={p} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </>
      )}

      {enrollment && data.length === 0 && !isDemo && (
        <div className="card text-center py-12">
          <TrendingUp size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No results published yet. Check back after your next test.</p>
        </div>
      )}
    </div>
  );
}

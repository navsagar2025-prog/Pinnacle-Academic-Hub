import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { students, attendance, batches } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { UserCheck, AlertCircle, CheckCircle, XCircle, Clock } from "lucide-react";

export const metadata = { title: "Attendance — Student Portal" };

const SUBJECT_COLORS: Record<string, string> = {
  Physics: "text-[var(--color-navy)]",
  Chemistry: "text-[var(--color-teal)]",
  Mathematics: "text-[var(--color-maroon)]",
  Biology: "text-green-700",
};

const DEMO_ATTENDANCE = [
  { subject: "Physics", records: [
    { date: new Date("2026-04-28"), status: "present" },
    { date: new Date("2026-04-26"), status: "present" },
    { date: new Date("2026-04-24"), status: "absent" },
    { date: new Date("2026-04-22"), status: "present" },
    { date: new Date("2026-04-19"), status: "present" },
    { date: new Date("2026-04-17"), status: "late" },
    { date: new Date("2026-04-15"), status: "present" },
    { date: new Date("2026-04-12"), status: "present" },
  ]},
  { subject: "Chemistry", records: [
    { date: new Date("2026-04-28"), status: "present" },
    { date: new Date("2026-04-26"), status: "absent" },
    { date: new Date("2026-04-24"), status: "present" },
    { date: new Date("2026-04-22"), status: "present" },
    { date: new Date("2026-04-19"), status: "present" },
    { date: new Date("2026-04-17"), status: "present" },
    { date: new Date("2026-04-15"), status: "absent" },
    { date: new Date("2026-04-12"), status: "present" },
  ]},
  { subject: "Mathematics", records: [
    { date: new Date("2026-04-27"), status: "present" },
    { date: new Date("2026-04-25"), status: "present" },
    { date: new Date("2026-04-23"), status: "present" },
    { date: new Date("2026-04-21"), status: "late" },
    { date: new Date("2026-04-18"), status: "present" },
    { date: new Date("2026-04-16"), status: "absent" },
    { date: new Date("2026-04-14"), status: "present" },
    { date: new Date("2026-04-11"), status: "present" },
  ]},
];

function StatusBadge({ status }: { status: string }) {
  if (status === "present") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
        <CheckCircle size={10} />Present
      </span>
    );
  }
  if (status === "absent") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600">
        <XCircle size={10} />Absent
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
      <Clock size={10} />Late
    </span>
  );
}

function pct(records: { status: string }[]) {
  const total = records.length;
  if (total === 0) return 0;
  const present = records.filter((r) => r.status === "present" || r.status === "late").length;
  return Math.round((present / total) * 100);
}

export default async function AttendancePage() {
  const dbUser = await requirePortalRole("student");

  const [enrollment] = await db
    .select({ studentId: students.id, batchId: students.batchId })
    .from(students)
    .where(and(eq(students.userId, dbUser.id), eq(students.isActive, true)))
    .limit(1);

  const batchName = enrollment?.batchId
    ? await db.select({ name: batches.name }).from(batches).where(eq(batches.id, enrollment.batchId)).limit(1).then((r) => r[0]?.name ?? null)
    : null;

  const dbAttendance = enrollment?.studentId
    ? await db
        .select({
          id: attendance.id,
          date: attendance.date,
          subject: attendance.subject,
          status: attendance.status,
        })
        .from(attendance)
        .where(eq(attendance.studentId, enrollment.studentId))
        .orderBy(desc(attendance.date))
    : [];

  const isDemo = dbAttendance.length === 0 && enrollment !== undefined;

  const grouped: { subject: string; records: { date: Date; status: string }[] }[] =
    dbAttendance.length > 0
      ? Object.entries(
          dbAttendance.reduce<Record<string, { date: Date; status: string }[]>>((acc, r) => {
            acc[r.subject] = acc[r.subject] ?? [];
            acc[r.subject].push({ date: r.date, status: r.status });
            return acc;
          }, {})
        ).map(([subject, records]) => ({ subject, records }))
      : enrollment
      ? DEMO_ATTENDANCE
      : [];

  const overallPct = grouped.length === 0
    ? 0
    : Math.round(grouped.reduce((s, g) => s + pct(g.records), 0) / grouped.length);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Attendance</h1>
        <p className="text-slate-500 text-sm mt-1">
          {enrollment
            ? `${batchName ?? ""} · ${grouped.length} subject${grouped.length !== 1 ? "s" : ""}`
            : "Not enrolled in a batch"}
        </p>
      </div>

      {!enrollment && (
        <div className="card bg-amber-50 border border-amber-100 flex items-start gap-3">
          <AlertCircle size={17} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-amber-800 text-sm">Your batch enrollment is pending. Attendance records will appear here once assigned to a batch.</p>
        </div>
      )}

      {isDemo && (
        <div className="card bg-blue-50 border border-blue-100 flex items-start gap-3">
          <AlertCircle size={17} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-blue-800 text-sm">No attendance records yet — showing sample data for reference.</p>
        </div>
      )}

      {grouped.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="card border-l-4 border-l-[var(--color-navy)] col-span-2 sm:col-span-1">
              <div className="text-3xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">{overallPct}%</div>
              <div className="text-slate-500 text-xs mt-1">Overall Attendance</div>
              <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${overallPct >= 75 ? "bg-green-500" : overallPct >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                  style={{ width: `${overallPct}%` }}
                />
              </div>
            </div>
            {grouped.map((g) => {
              const p = pct(g.records);
              return (
                <div key={g.subject} className="card">
                  <div className={`text-2xl font-bold font-[family-name:var(--font-playfair)] ${SUBJECT_COLORS[g.subject] ?? "text-slate-700"}`}>{p}%</div>
                  <div className="text-slate-500 text-xs mt-1">{g.subject}</div>
                  <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${p >= 75 ? "bg-green-500" : p >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                      style={{ width: `${p}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{g.records.filter(r => r.status !== "absent").length}/{g.records.length} classes</div>
                </div>
              );
            })}
          </div>

          {overallPct < 75 && (
            <div className="card bg-amber-50 border border-amber-100 flex items-start gap-3">
              <AlertCircle size={17} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-amber-800 text-sm">Attendance Below Required</div>
                <p className="text-amber-700 text-sm mt-0.5">Your attendance is below the 75% minimum requirement. Please attend classes regularly to maintain eligibility for exams.</p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {grouped.map((g) => (
              <div key={g.subject} className="card">
                <h2 className={`font-bold text-base font-[family-name:var(--font-playfair)] mb-4 ${SUBJECT_COLORS[g.subject] ?? "text-[var(--color-navy)]"}`}>
                  {g.subject}
                  <span className="ml-2 text-sm text-slate-400 font-sans font-normal">{pct(g.records)}% attendance</span>
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Date</th>
                        <th className="text-left py-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.records.map((r, i) => (
                        <tr key={i} className="border-b border-slate-50 last:border-0">
                          <td className="py-2 pr-4 text-slate-600">
                            {r.date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                          </td>
                          <td className="py-2">
                            <StatusBadge status={r.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {enrollment && grouped.length === 0 && !isDemo && (
        <div className="card text-center py-12">
          <UserCheck size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No attendance records yet.</p>
        </div>
      )}
    </div>
  );
}

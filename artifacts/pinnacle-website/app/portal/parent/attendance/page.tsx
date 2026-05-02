import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { parents, students, attendance, batches, users } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { UserCheck, AlertCircle, CheckCircle, XCircle, Clock } from "lucide-react";

export const metadata = { title: "Child Attendance — Parent Portal" };

const SUBJECT_COLORS: Record<string, string> = {
  Physics: "text-[var(--color-navy)]",
  Chemistry: "text-[var(--color-teal)]",
  Mathematics: "text-[var(--color-maroon)]",
  Biology: "text-green-700",
};

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

export default async function ParentAttendancePage() {
  const dbUser = await requirePortalRole("parent");

  const [parentRecord] = await db
    .select({ studentId: parents.studentId })
    .from(parents)
    .where(eq(parents.userId, dbUser.id))
    .limit(1);

  const studentInfo = parentRecord?.studentId
    ? await db
        .select({ id: students.id, batchId: students.batchId, userName: users.name })
        .from(students)
        .leftJoin(users, eq(students.userId, users.id))
        .where(and(eq(students.id, parentRecord.studentId), eq(students.isActive, true)))
        .limit(1)
        .then((r) => r[0] ?? null)
    : null;

  const batchName = studentInfo?.batchId
    ? await db
        .select({ name: batches.name })
        .from(batches)
        .where(eq(batches.id, studentInfo.batchId))
        .limit(1)
        .then((r) => r[0]?.name ?? null)
    : null;

  const dbAttendance = studentInfo?.id
    ? await db
        .select({
          id: attendance.id,
          date: attendance.date,
          subject: attendance.subject,
          status: attendance.status,
        })
        .from(attendance)
        .where(eq(attendance.studentId, studentInfo.id))
        .orderBy(desc(attendance.date))
    : [];

  const isLinked = !!parentRecord?.studentId && !!studentInfo;

  const grouped: { subject: string; records: { date: Date; status: string }[] }[] =
    dbAttendance.length > 0
      ? Object.entries(
          dbAttendance.reduce<Record<string, { date: Date; status: string }[]>>((acc, r) => {
            acc[r.subject] = acc[r.subject] ?? [];
            acc[r.subject].push({ date: r.date, status: r.status });
            return acc;
          }, {})
        ).map(([subject, records]) => ({ subject, records }))
      : [];

  const overallPct =
    grouped.length === 0
      ? 0
      : Math.round(grouped.reduce((s, g) => s + pct(g.records), 0) / grouped.length);

  const childName = studentInfo?.userName ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">
          {childName ? `${childName}'s Attendance` : "Child Attendance"}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {isLinked
            ? `${batchName ?? ""} · ${grouped.length} subject${grouped.length !== 1 ? "s" : ""}`
            : "Not linked to a student account"}
        </p>
      </div>

      {!isLinked && (
        <div className="card bg-amber-50 border border-amber-100 flex items-start gap-3">
          <AlertCircle size={17} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-amber-800 text-sm">
            Your account is not yet linked to a student. Contact the office with your child's roll number.
          </p>
        </div>
      )}

      {grouped.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="card border-l-4 border-l-[var(--color-navy)] col-span-2 sm:col-span-1">
              <div className="text-3xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">
                {overallPct}%
              </div>
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
                  <div className={`text-2xl font-bold font-[family-name:var(--font-playfair)] ${SUBJECT_COLORS[g.subject] ?? "text-slate-700"}`}>
                    {p}%
                  </div>
                  <div className="text-slate-500 text-xs mt-1">{g.subject}</div>
                  <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${p >= 75 ? "bg-green-500" : p >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                      style={{ width: `${p}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {g.records.filter((r) => r.status !== "absent").length}/{g.records.length} classes
                  </div>
                </div>
              );
            })}
          </div>

          {overallPct < 75 && (
            <div className="card bg-amber-50 border border-amber-100 flex items-start gap-3">
              <AlertCircle size={17} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-amber-800 text-sm">Attendance Below Required</div>
                <p className="text-amber-700 text-sm mt-0.5">
                  {childName ? `${childName}'s` : "Your child's"} attendance is below the 75% minimum requirement. Please encourage regular attendance.
                </p>
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

      {isLinked && grouped.length === 0 && (
        <div className="card text-center py-12">
          <UserCheck size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No attendance records yet for your child.</p>
        </div>
      )}
    </div>
  );
}

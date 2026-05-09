import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { parents, students, batches, courses, feeRecords, notices, users } from "@workspace/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { Bell, CreditCard, Calendar, ChevronRight, AlertCircle } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Parent Dashboard" };

export default async function ParentDashboard() {
  const dbUser = await requirePortalRole("parent");

  const [parentRecord] = await db
    .select({ id: parents.id, studentId: parents.studentId })
    .from(parents)
    .where(eq(parents.userId, dbUser.id))
    .limit(1);

  const studentInfo = parentRecord?.studentId
    ? await db
        .select({ id: students.id, batchId: students.batchId, rollNumber: students.rollNumber, userName: users.name })
        .from(students)
        .leftJoin(users, eq(students.userId, users.id))
        .where(and(eq(students.id, parentRecord.studentId), eq(students.isActive, true)))
        .limit(1)
        .then((r) => r[0] ?? null)
    : null;

  const batchInfo = studentInfo?.batchId
    ? await db
        .select({ batchName: batches.name, timingLabel: batches.timingLabel, courseName: courses.title })
        .from(batches)
        .leftJoin(courses, eq(batches.courseId, courses.id))
        .where(eq(batches.id, studentInfo.batchId))
        .limit(1)
        .then((r) => r[0] ?? null)
    : null;

  const dueFees = studentInfo?.id
    ? await db
        .select({ c: sql<number>`count(*)::int`, total: sql<number>`coalesce(sum(amount),0)::int` })
        .from(feeRecords)
        .where(and(eq(feeRecords.studentId, studentInfo.id), sql`status IN ('due','overdue')`))
        .then((r) => r[0] ?? { c: 0, total: 0 })
    : { c: 0, total: 0 };

  const recentNotices = await db
    .select({ id: notices.id, title: notices.title, category: notices.category, publishedAt: notices.publishedAt })
    .from(notices)
    .where(and(eq(notices.isPublic, true), sql`(expires_at IS NULL OR expires_at > now())`))
    .orderBy(desc(notices.publishedAt))
    .limit(3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">
          Welcome, {dbUser.name.split(" ")[0]}
        </h1>
        <p className="text-slate-500 text-sm mt-1">Monitoring your child's progress at Pinnacle</p>
      </div>

      {!parentRecord && (
        <div className="card bg-amber-50 border border-amber-100 flex items-start gap-3">
          <AlertCircle size={17} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-amber-800 text-sm">Account Setup Pending</div>
            <p className="text-amber-700 text-sm mt-0.5">Your parent account is not yet linked to a student. Please contact the admissions office with your child's roll number.</p>
          </div>
        </div>
      )}

      {studentInfo && (
        <div className="card bg-gradient-to-r from-[var(--color-navy)] to-[var(--color-teal)] text-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold font-[family-name:var(--font-playfair)]">
              {(studentInfo.userName ?? dbUser.name).charAt(0)}
            </div>
            <div>
              <div className="font-bold text-lg font-[family-name:var(--font-playfair)]">{studentInfo.userName ?? "—"}</div>
              <div className="text-white/80 text-sm">{batchInfo?.courseName} · {batchInfo?.batchName}</div>
              <div className="text-white/60 text-xs mt-0.5">Roll: {studentInfo.rollNumber} · {batchInfo?.timingLabel}</div>
            </div>
          </div>
        </div>
      )}

      {dueFees.total > 0 && (
        <div className="card bg-[var(--color-maroon)]/5 border-[var(--color-maroon)]/20">
          <div className="flex items-start gap-3">
            <AlertCircle size={17} className="text-[var(--color-maroon)] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-[var(--color-maroon)] text-sm">Fee Due</div>
              <p className="text-slate-600 text-sm mt-1">₹{dueFees.total.toLocaleString("en-IN")} outstanding. Please visit the accounts office.</p>
            </div>
            <Link href="/portal/parent/fees" className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 bg-[var(--color-maroon)] text-white rounded-lg hover:bg-[var(--color-maroon-light)] transition-colors">
              View Fees
            </Link>
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">Recent Notices</h2>
          <Link href="/portal/parent/notices" className="text-[var(--color-teal)] text-sm flex items-center gap-1 hover:underline">View All <ChevronRight size={14} /></Link>
        </div>
        {recentNotices.length === 0 ? (
          <p className="text-slate-400 text-sm">No notices at the moment.</p>
        ) : (
          <div className="space-y-3">
            {recentNotices.map((n) => (
              <div key={n.id} className="flex items-start gap-3 p-3 bg-[var(--color-slate-light)] rounded-xl">
                <Bell size={14} className="text-[var(--color-teal)] flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-[var(--color-navy)]">{n.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {new Date(n.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {n.category}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: "View Timetable", href: "/portal/parent/timetable", icon: <Calendar size={18} />, color: "navy" },
          { label: "Fee History", href: "/portal/parent/fees", icon: <CreditCard size={18} />, color: "teal" },
          { label: "All Notices", href: "/portal/parent/notices", icon: <Bell size={18} />, color: "maroon" },
        ].map((l) => (
          <Link key={l.label} href={l.href} className="card flex items-center gap-3 hover:shadow-elevated transition-all group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${l.color === "navy" ? "bg-[var(--color-navy)]/10 text-[var(--color-navy)] group-hover:bg-[var(--color-navy)] group-hover:text-white" : l.color === "teal" ? "bg-[var(--color-teal)]/10 text-[var(--color-teal)] group-hover:bg-[var(--color-teal)] group-hover:text-white" : "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)] group-hover:bg-[var(--color-maroon)] group-hover:text-white"}`}>
              {l.icon}
            </div>
            <span className="text-sm font-semibold text-[var(--color-navy)]">{l.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import {
  students, liveClasses, classRecordings, studyMaterials,
  practicePapers, feeRecords, batches, courses,
} from "@workspace/db/schema";
import { questionAttempts, mockTestAttempts, mockTests } from "@workspace/db/schema";
import { eq, and, gt, desc, asc, sql, or, gte, isNull } from "drizzle-orm";
import { Video, BookOpen, Clock, CreditCard, Bell, ChevronRight, Play, Calendar, AlertCircle, Flame } from "lucide-react";
import Link from "next/link";
import { WeakTopicsCard } from "@/components/portal/WeakTopicsCard";
import { getWeakTopics } from "@/lib/server/weak-topics";
import { UpcomingScheduledTests } from "./UpcomingScheduledTests";

export const metadata = { title: "Student Dashboard" };

export default async function StudentDashboard() {
  const dbUser = await requirePortalRole("student");

  const [enrollment] = await db
    .select({ studentId: students.id, batchId: students.batchId, rollNumber: students.rollNumber })
    .from(students)
    .where(and(eq(students.userId, dbUser.id), eq(students.isActive, true)))
    .limit(1);

  const batchInfo = enrollment?.batchId
    ? await db
        .select({ batchName: batches.name, timingLabel: batches.timingLabel, courseName: courses.title })
        .from(batches)
        .leftJoin(courses, eq(batches.courseId, courses.id))
        .where(eq(batches.id, enrollment.batchId))
        .limit(1)
        .then((r) => r[0] ?? null)
    : null;

  const upcomingClasses = enrollment?.batchId
    ? await db
        .select({
          id: liveClasses.id,
          subject: liveClasses.subject,
          topic: liveClasses.topic,
          scheduledAt: liveClasses.scheduledAt,
          zoomJoinUrl: liveClasses.zoomJoinUrl,
          status: liveClasses.status,
          durationMinutes: liveClasses.durationMinutes,
        })
        .from(liveClasses)
        .where(and(
          eq(liveClasses.batchId, enrollment.batchId),
          gt(liveClasses.scheduledAt, new Date(Date.now() - 2 * 60 * 60 * 1000))
        ))
        .orderBy(asc(liveClasses.scheduledAt))
        .limit(3)
    : [];

  const recentRecordings = enrollment?.batchId
    ? await db
        .select({ id: classRecordings.id, subject: classRecordings.subject, title: classRecordings.title, teacherName: classRecordings.teacherName, durationMinutes: classRecordings.durationMinutes, createdAt: classRecordings.createdAt })
        .from(classRecordings)
        .where(and(eq(classRecordings.batchId, enrollment.batchId), eq(classRecordings.isVisible, true)))
        .orderBy(desc(classRecordings.createdAt))
        .limit(3)
    : [];

  const [matCount] = enrollment?.batchId
    ? await db.select({ c: sql<number>`count(*)::int` }).from(studyMaterials).where(and(eq(studyMaterials.batchId, enrollment.batchId), eq(studyMaterials.isVisible, true)))
    : [{ c: 0 }];

  const [paperCount] = enrollment?.batchId
    ? await db.select({ c: sql<number>`count(*)::int` }).from(practicePapers).where(and(eq(practicePapers.batchId, enrollment.batchId), eq(practicePapers.isVisible, true)))
    : [{ c: 0 }];

  const pendingFees = enrollment?.studentId
    ? await db
        .select({ c: sql<number>`count(*)::int` })
        .from(feeRecords)
        .where(and(eq(feeRecords.studentId, enrollment.studentId), sql`status IN ('due','overdue')`))
        .then((r) => r[0]?.c ?? 0)
    : 0;

  const weakTopics = enrollment?.studentId ? await getWeakTopics(enrollment.studentId, { limit: 4 }) : [];

  const audienceFilter = enrollment?.batchId
    ? or(eq(mockTests.batchId, enrollment.batchId), isNull(mockTests.batchId))
    : isNull(mockTests.batchId);
  const upcomingScheduledTestsRaw = await db
    .select({
      id: mockTests.id,
      title: mockTests.title,
      subject: mockTests.subject,
      examType: mockTests.examType,
      durationMinutes: mockTests.durationMinutes,
      scheduledStart: mockTests.scheduledStart,
    })
    .from(mockTests)
    .where(and(
      eq(mockTests.isPublished, true),
      audienceFilter,
      gt(mockTests.scheduledStart, new Date()),
    ))
    .orderBy(asc(mockTests.scheduledStart))
    .limit(3);
  const upcomingScheduledTests = upcomingScheduledTestsRaw
    .filter((t) => t.scheduledStart !== null)
    .map((t) => ({
      id: t.id,
      title: t.title,
      subject: t.subject,
      examType: t.examType ?? "Mixed",
      durationMinutes: t.durationMinutes,
      scheduledStart: (t.scheduledStart as Date).toISOString(),
    }));

  // Practice streak: count of consecutive days (ending today, IST) with at
  // least one question-bank attempt OR mock-test attempt.
  let streak = 0;
  if (enrollment?.studentId) {
    const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const [qbDays, mockDays] = await Promise.all([
      db.select({ d: sql<string>`(${questionAttempts.createdAt} at time zone 'Asia/Kolkata')::date::text` })
        .from(questionAttempts)
        .where(and(eq(questionAttempts.studentId, enrollment.studentId), gte(questionAttempts.createdAt, since)))
        .groupBy(sql`(${questionAttempts.createdAt} at time zone 'Asia/Kolkata')::date`),
      db.select({ d: sql<string>`(${mockTestAttempts.startedAt} at time zone 'Asia/Kolkata')::date::text` })
        .from(mockTestAttempts)
        .where(and(eq(mockTestAttempts.studentId, enrollment.studentId), gte(mockTestAttempts.startedAt, since)))
        .groupBy(sql`(${mockTestAttempts.startedAt} at time zone 'Asia/Kolkata')::date`),
    ]);
    const days = new Set<string>();
    for (const r of qbDays) days.add(r.d);
    for (const r of mockDays) days.add(r.d);
    // en-CA gives YYYY-MM-DD which matches Postgres ::date::text output exactly,
    // and respecting timeZone avoids any UTC conversion drift.
    const istKey = (d: Date) =>
      new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
    const todayKey = istKey(new Date());
    for (let i = 0; i < 60; i++) {
      const d = new Date(Date.now() - i * 86400000);
      const key = istKey(d);
      if (days.has(key)) streak++;
      else if (i === 0) continue;  // grace if user hasn't practiced yet today
      else break;
    }
    // If today wasn't practiced AND yesterday wasn't either, the streak is broken.
    if (streak > 0 && !days.has(todayKey)) {
      const yKey = istKey(new Date(Date.now() - 86400000));
      if (!days.has(yKey)) streak = 0;
    }
  }
  // Suppress unused-import warning for `or` (kept for future filters).
  void or;

  const SUBJECT_COLORS: Record<string, string> = {
    Physics: "bg-[var(--color-navy)]/10 text-[var(--color-navy)]",
    Chemistry: "bg-[var(--color-teal)]/10 text-[var(--color-teal)]",
    Mathematics: "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]",
    Biology: "bg-green-100 text-green-700",
  };

  const statCards = [
    { label: "Upcoming Classes", value: upcomingClasses.length.toString(), icon: <Video size={18} />, color: "navy" },
    { label: "Study Materials", value: matCount?.c?.toString() ?? "0", icon: <BookOpen size={18} />, color: "teal" },
    { label: "Practice Papers", value: paperCount?.c?.toString() ?? "0", icon: <Clock size={18} />, color: "maroon" },
    { label: "Fee Status", value: pendingFees > 0 ? `${pendingFees} Due` : "Clear", icon: <CreditCard size={18} />, color: "gold" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">
          Welcome back, {dbUser.name.split(" ")[0]}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {batchInfo ? `${batchInfo.courseName} · ${batchInfo.batchName}` : "Not yet enrolled in a batch"}
        </p>
      </div>

      {!enrollment && (
        <div className="card bg-amber-50 border border-amber-100 flex items-start gap-3">
          <AlertCircle size={17} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-amber-800 text-sm">Enrollment Pending</div>
            <p className="text-amber-700 text-sm mt-0.5">Your batch enrollment is being processed. Contact the office or check back shortly.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className={`card flex flex-col gap-3 border-l-4 ${s.color === "navy" ? "border-l-[var(--color-navy)]" : s.color === "teal" ? "border-l-[var(--color-teal)]" : s.color === "maroon" ? "border-l-[var(--color-maroon)]" : "border-l-[var(--color-gold)]"}`}>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color === "navy" ? "bg-[var(--color-navy)]/10 text-[var(--color-navy)]" : s.color === "teal" ? "bg-[var(--color-teal)]/10 text-[var(--color-teal)]" : s.color === "maroon" ? "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]" : "bg-[var(--color-gold)]/10 text-[var(--color-maroon)]"}`}>{s.icon}</div>
            <div>
              <div className="text-2xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">{s.value}</div>
              <div className="text-slate-500 text-xs">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">Upcoming Live Classes</h2>
            <Link href="/portal/student/timetable" className="text-[var(--color-teal)] text-sm flex items-center gap-1 hover:underline">View All <ChevronRight size={14} /></Link>
          </div>
          {upcomingClasses.length === 0 ? (
            <p className="text-slate-400 text-sm">No upcoming live classes scheduled.</p>
          ) : (
            <div className="space-y-3">
              {upcomingClasses.map((cls) => (
                <div key={cls.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-[var(--color-slate-light)] rounded-xl">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold ${cls.subject === "Physics" ? "bg-[var(--color-navy)]" : cls.subject === "Chemistry" ? "bg-[var(--color-teal)]" : "bg-[var(--color-maroon)]"}`}>
                    {(cls.subject ?? "?").charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-[var(--color-navy)] truncate">{cls.topic}</div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className={`badge text-xs ${SUBJECT_COLORS[cls.subject ?? ""] ?? "bg-slate-100 text-slate-600"}`}>{cls.subject}</span>
                      <span className="text-xs text-slate-400 flex items-center gap-1"><Calendar size={10} />{new Date(cls.scheduledAt).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                  {(() => {
                    const now = new Date();
                    const start = new Date(cls.scheduledAt);
                    const durationMs = ((cls as { durationMinutes?: number }).durationMinutes ?? 90) * 60 * 1000;
                    const liveWindow = 15 * 60 * 1000;
                    const isLive = now >= new Date(start.getTime() - liveWindow) && now <= new Date(start.getTime() + durationMs);
                    if (cls.zoomJoinUrl) {
                      return (
                        <div className="flex-shrink-0 flex items-center gap-2">
                          {isLive && (
                            <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full animate-pulse">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />LIVE
                            </span>
                          )}
                          <a href={cls.zoomJoinUrl} target="_blank" rel="noopener noreferrer" className={`text-xs font-semibold px-4 py-2 rounded-lg transition-colors ${isLive ? "bg-green-600 text-white hover:bg-green-700" : "bg-[var(--color-teal)] text-white hover:bg-[var(--color-teal-light)]"}`}>
                            {isLive ? "Join Now" : "Join"}
                          </a>
                        </div>
                      );
                    }
                    return <span className="flex-shrink-0 text-xs text-slate-300">Link TBA</span>;
                  })()}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">Recent Recordings</h2>
            <Link href="/portal/student/recordings" className="text-[var(--color-teal)] text-sm flex items-center gap-1 hover:underline">View All <ChevronRight size={14} /></Link>
          </div>
          {recentRecordings.length === 0 ? (
            <p className="text-slate-400 text-sm">No recordings available yet.</p>
          ) : (
            <div className="space-y-3">
              {recentRecordings.map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-2 hover:bg-[var(--color-slate-light)] rounded-xl transition-colors cursor-pointer">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${r.subject === "Physics" ? "bg-[var(--color-navy)]" : r.subject === "Chemistry" ? "bg-[var(--color-teal)]" : "bg-[var(--color-maroon)]"}`}>
                    <Play size={14} className="text-white ml-0.5" fill="white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[var(--color-navy)] truncate">{r.title}</div>
                    <div className="text-xs text-slate-400">{r.durationMinutes ? `${Math.floor(r.durationMinutes / 60)}h ${r.durationMinutes % 60}m` : "—"}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <UpcomingScheduledTests tests={upcomingScheduledTests} />

      {streak > 0 && (
        <div className="card flex items-center gap-4 border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50 to-amber-50">
          <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center flex-shrink-0">
            <Flame size={22} fill="currentColor" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-[var(--color-navy)] flex items-center gap-2">
              {streak}-day practice streak
              <span className="text-xs font-normal text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                {streak >= 30 ? "🏆 Legendary" : streak >= 14 ? "🔥 On fire" : streak >= 7 ? "💪 Strong" : "Keep going"}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">Practice today to keep your streak alive — every session counts toward exam readiness.</p>
          </div>
        </div>
      )}

      {weakTopics.length > 0 && <WeakTopicsCard weakTopics={weakTopics} variant="compact" />}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Timetable", href: "/portal/student/timetable", icon: <Calendar size={18} />, color: "navy" },
          { label: "Materials", href: "/portal/student/materials", icon: <BookOpen size={18} />, color: "teal" },
          { label: "Papers", href: "/portal/student/papers", icon: <Bell size={18} />, color: "maroon" },
          { label: "Fee Status", href: "/portal/student/fees", icon: <CreditCard size={18} />, color: "gold" },
        ].map((l) => (
          <Link key={l.label} href={l.href} className="card flex items-center gap-3 hover:shadow-elevated transition-all group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${l.color === "navy" ? "bg-[var(--color-navy)]/10 text-[var(--color-navy)] group-hover:bg-[var(--color-navy)] group-hover:text-white" : l.color === "teal" ? "bg-[var(--color-teal)]/10 text-[var(--color-teal)] group-hover:bg-[var(--color-teal)] group-hover:text-white" : l.color === "maroon" ? "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)] group-hover:bg-[var(--color-maroon)] group-hover:text-white" : "bg-[var(--color-gold)]/10 text-[var(--color-navy)] group-hover:bg-[var(--color-gold)] group-hover:text-white"}`}>{l.icon}</div>
            <span className="text-sm font-semibold text-[var(--color-navy)]">{l.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

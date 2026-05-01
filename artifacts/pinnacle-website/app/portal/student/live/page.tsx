import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { students, liveClasses, batches, teachers, users } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { Video, Calendar, Clock, AlertCircle, ExternalLink, Radio } from "lucide-react";
import { CountdownTimer } from "./CountdownTimer";

export const metadata = { title: "Live Classes — Student Portal" };

const SUBJECT_COLORS: Record<string, string> = {
  Physics: "bg-[var(--color-navy)] text-white",
  Chemistry: "bg-[var(--color-teal)] text-white",
  Mathematics: "bg-[var(--color-maroon)] text-white",
  Biology: "bg-green-600 text-white",
};

function computeStatus(scheduledAt: Date, durationMinutes: number, status: string | null) {
  const now = new Date();
  const start = new Date(scheduledAt);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  const liveWindow = new Date(start.getTime() - 15 * 60 * 1000);
  if (status === "cancelled" || status === null) return "cancelled";
  if (now >= liveWindow && now <= end) return "live";
  if (now > end) return "ended";
  return "upcoming";
}

function isToday(date: Date) {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export default async function LiveClassesPage() {
  const dbUser = await requirePortalRole("student");

  const [enrollment] = await db
    .select({ studentId: students.id, batchId: students.batchId })
    .from(students)
    .where(and(eq(students.userId, dbUser.id), eq(students.isActive, true)))
    .limit(1);

  const batchName = enrollment?.batchId
    ? await db
        .select({ name: batches.name })
        .from(batches)
        .where(eq(batches.id, enrollment.batchId))
        .limit(1)
        .then((r) => r[0]?.name ?? null)
    : null;

  const classes = enrollment?.batchId
    ? await db
        .select({
          id: liveClasses.id,
          topic: liveClasses.topic,
          subject: liveClasses.subject,
          scheduledAt: liveClasses.scheduledAt,
          durationMinutes: liveClasses.durationMinutes,
          zoomJoinUrl: liveClasses.zoomJoinUrl,
          zoomPasscode: liveClasses.zoomPasscode,
          status: liveClasses.status,
          recordingUrl: liveClasses.recordingUrl,
          teacherName: users.name,
        })
        .from(liveClasses)
        .leftJoin(teachers, eq(liveClasses.teacherId, teachers.id))
        .leftJoin(users, eq(teachers.userId, users.id))
        .where(eq(liveClasses.batchId, enrollment.batchId))
        .orderBy(desc(liveClasses.scheduledAt))
    : [];

  const serialized = classes.map((c) => ({
    ...c,
    scheduledAt: c.scheduledAt as Date,
    computed: computeStatus(c.scheduledAt, c.durationMinutes ?? 90, c.status),
    isToday: isToday(c.scheduledAt),
  }));

  const live = serialized.filter((c) => c.computed === "live");
  const todayUpcoming = serialized.filter((c) => c.computed === "upcoming" && c.isToday);
  const futureUpcoming = serialized.filter((c) => c.computed === "upcoming" && !c.isToday);
  const ended = serialized.filter((c) => c.computed === "ended");
  const cancelled = serialized.filter((c) => c.computed === "cancelled");

  function ClassCard({ cls }: { cls: (typeof serialized)[number] }) {
    const { computed } = cls;
    const sc = SUBJECT_COLORS[cls.subject ?? ""] ?? "bg-slate-600 text-white";
    const dateStr = cls.scheduledAt.toLocaleString("en-IN", {
      weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    });
    const dur = cls.durationMinutes
      ? `${Math.floor(cls.durationMinutes / 60)}h ${cls.durationMinutes % 60}m`
      : "—";

    return (
      <div className={`card ${computed === "live" ? "border-2 border-green-400 shadow-elevated" : ""}`}>
        <div className="flex items-start gap-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold ${sc}`}>
            {(cls.subject ?? "?").charAt(0)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {computed === "live" && (
                <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full animate-pulse">
                  <Radio size={10} />LIVE NOW
                </span>
              )}
              {computed === "upcoming" && (
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Upcoming</span>
              )}
              {computed === "ended" && (
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Ended</span>
              )}
              {computed === "cancelled" && (
                <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Cancelled</span>
              )}
              <span className="badge text-xs bg-slate-100 text-slate-600">{cls.subject}</span>
            </div>

            <div className="font-semibold text-[var(--color-navy)]">{cls.topic}</div>
            {cls.teacherName && (
              <div className="text-sm text-slate-500 mt-0.5">by {cls.teacherName}</div>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Calendar size={11} />{dateStr}</span>
              <span className="flex items-center gap-1"><Clock size={11} />{dur}</span>
              {computed === "upcoming" && (
                <CountdownTimer scheduledAt={cls.scheduledAt.toISOString()} />
              )}
            </div>

            {cls.zoomPasscode && (
              <div className="mt-1 text-xs text-slate-400">
                Passcode: <span className="font-mono font-semibold text-slate-600">{cls.zoomPasscode}</span>
              </div>
            )}
          </div>

          <div className="flex-shrink-0 flex flex-col gap-2 items-end">
            {(computed === "live" || computed === "upcoming") && cls.zoomJoinUrl ? (
              <a
                href={cls.zoomJoinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  computed === "live"
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-[var(--color-teal)] text-white hover:bg-[var(--color-teal-light)]"
                }`}
              >
                <ExternalLink size={13} />
                {computed === "live" ? "Join Now" : "Join"}
              </a>
            ) : computed === "upcoming" ? (
              <span className="text-xs text-slate-300 text-right">Link TBA</span>
            ) : computed === "ended" && cls.recordingUrl ? (
              <a
                href={cls.recordingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <Video size={13} />Recording
              </a>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Live Classes</h1>
        <p className="text-slate-500 text-sm mt-1">
          {enrollment
            ? `${classes.length} class${classes.length !== 1 ? "es" : ""} total · ${batchName ?? ""}`
            : "Not enrolled in a batch"}
        </p>
      </div>

      {!enrollment && (
        <div className="card bg-amber-50 border border-amber-100 flex items-start gap-3">
          <AlertCircle size={17} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-amber-800 text-sm">Your batch enrollment is pending. Live classes will appear here once you are assigned to a batch.</p>
        </div>
      )}

      {live.length > 0 && (
        <section>
          <h2 className="font-semibold text-green-700 text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
            <Radio size={14} className="animate-pulse" />Live Now
          </h2>
          <div className="space-y-3">
            {live.map((c) => <ClassCard key={c.id} cls={c} />)}
          </div>
        </section>
      )}

      {(todayUpcoming.length > 0 || live.length > 0) && (
        <section>
          <h2 className="font-semibold text-[var(--color-navy)] text-sm uppercase tracking-widest mb-3">Today&apos;s Schedule</h2>
          {todayUpcoming.length === 0 && live.length === 0 ? (
            <div className="card text-center py-8 text-slate-400 text-sm">No more classes today.</div>
          ) : (
            <div className="space-y-3">
              {todayUpcoming.map((c) => <ClassCard key={c.id} cls={c} />)}
            </div>
          )}
        </section>
      )}

      {enrollment && live.length === 0 && todayUpcoming.length === 0 && (
        <div className="card bg-[var(--color-slate-light)] border border-slate-100 py-6 px-5">
          <div className="font-semibold text-[var(--color-navy)] text-sm mb-1">No classes scheduled for today</div>
          <p className="text-slate-400 text-sm">
            {futureUpcoming.length > 0
              ? `Your next class is on ${futureUpcoming[0].scheduledAt.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}.`
              : "Check back soon — your teacher will schedule the next class here."}
          </p>
        </div>
      )}

      {futureUpcoming.length > 0 && (
        <section>
          <h2 className="font-semibold text-[var(--color-navy)] text-sm uppercase tracking-widest mb-3">Upcoming</h2>
          <div className="space-y-3">
            {futureUpcoming.map((c) => <ClassCard key={c.id} cls={c} />)}
          </div>
        </section>
      )}

      {enrollment && classes.length === 0 && (
        <div className="card text-center py-12">
          <Video size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No live classes scheduled for your batch yet.</p>
          <p className="text-slate-400 text-sm mt-1">Check back soon — your teacher will schedule the next class here.</p>
        </div>
      )}

      {ended.length > 0 && (
        <section>
          <h2 className="font-semibold text-slate-400 text-sm uppercase tracking-widest mb-3">Past Classes</h2>
          <div className="space-y-3">
            {ended.map((c) => <ClassCard key={c.id} cls={c} />)}
          </div>
        </section>
      )}

      {cancelled.length > 0 && (
        <section>
          <h2 className="font-semibold text-slate-400 text-sm uppercase tracking-widest mb-3">Cancelled</h2>
          <div className="space-y-3">
            {cancelled.map((c) => <ClassCard key={c.id} cls={c} />)}
          </div>
        </section>
      )}
    </div>
  );
}

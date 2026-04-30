import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { liveClasses, batches, teachers, users } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { Video, Clock, Users, ExternalLink, AlertCircle } from "lucide-react";
import { AdminCreateClassForm, AdminEditLinkForm } from "./AdminLiveClassForm";

export const metadata = { title: "Live Classes — Admin Panel" };

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-[var(--color-teal)]/10 text-[var(--color-teal)]",
  live: "bg-green-100 text-green-700",
  completed: "bg-slate-100 text-slate-500",
  cancelled: "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]",
};

export default async function AdminLiveClassesPage() {
  await requirePortalRole("admin");

  const allBatches = await db
    .select({ id: batches.id, name: batches.name })
    .from(batches)
    .orderBy(batches.name);

  const allTeachers = await db
    .select({ id: teachers.id, name: users.name })
    .from(teachers)
    .leftJoin(users, eq(teachers.userId, users.id))
    .where(eq(teachers.isActive, true))
    .orderBy(users.name)
    .then((rows) => rows.map((r) => ({ id: r.id, name: r.name ?? "Unknown" })));

  const classes = await db
    .select({
      id: liveClasses.id,
      topic: liveClasses.topic,
      subject: liveClasses.subject,
      scheduledAt: liveClasses.scheduledAt,
      durationMinutes: liveClasses.durationMinutes,
      status: liveClasses.status,
      zoomJoinUrl: liveClasses.zoomJoinUrl,
      zoomHostUrl: liveClasses.zoomHostUrl,
      recordingUrl: liveClasses.recordingUrl,
      batchName: batches.name,
      teacherName: users.name,
    })
    .from(liveClasses)
    .leftJoin(batches, eq(liveClasses.batchId, batches.id))
    .leftJoin(teachers, eq(liveClasses.teacherId, teachers.id))
    .leftJoin(users, eq(teachers.userId, users.id))
    .orderBy(desc(liveClasses.scheduledAt))
    .limit(50);

  const upcoming = classes.filter((c) => new Date(c.scheduledAt) >= new Date(Date.now() - 2 * 60 * 60 * 1000) && (c.status === "scheduled" || c.status === "live"));
  const past = classes.filter((c) => !upcoming.includes(c));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Live Classes</h1>
          <p className="text-slate-500 text-sm mt-1">
            {upcoming.length} upcoming · {past.length} past sessions
          </p>
        </div>
        <AdminCreateClassForm batches={allBatches} teachers={allTeachers} />
      </div>

      <div className="card">
        <h2 className="font-bold text-[var(--color-navy)] mb-4 font-[family-name:var(--font-playfair)]">
          Upcoming & Live ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-slate-400 text-sm">No upcoming classes scheduled.</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((cls) => {
              const now = new Date();
              const start = new Date(cls.scheduledAt);
              const durationMs = (cls.durationMinutes ?? 90) * 60 * 1000;
              const liveWindow = 15 * 60 * 1000;
              const isLive = now >= new Date(start.getTime() - liveWindow) && now <= new Date(start.getTime() + durationMs);

              return (
                <div key={cls.id} className="p-4 bg-[var(--color-slate-light)] rounded-xl">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[var(--color-navy)]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Video size={18} className="text-[var(--color-navy)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-sm text-[var(--color-navy)]">{cls.topic}</span>
                        {isLive && (
                          <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full animate-pulse">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" /> LIVE
                          </span>
                        )}
                        <span className={`badge text-xs ${STATUS_COLORS[cls.status ?? "scheduled"]}`}>
                          {cls.status ?? "scheduled"}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {new Date(cls.scheduledAt).toLocaleString("en-IN", {
                            weekday: "short", day: "numeric", month: "short",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </span>
                        <span className="flex items-center gap-1"><Users size={11} />{cls.batchName ?? "—"}</span>
                        {cls.teacherName && <span>{cls.teacherName}</span>}
                        {cls.durationMinutes && <span>{cls.durationMinutes} min</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {cls.zoomJoinUrl ? (
                          <a href={cls.zoomJoinUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[var(--color-teal)] hover:underline flex items-center gap-1">
                            <ExternalLink size={11} /> Student Link
                          </a>
                        ) : (
                          <span className="text-xs text-slate-300 flex items-center gap-1">
                            <AlertCircle size={11} /> No meeting link
                          </span>
                        )}
                        {cls.zoomHostUrl && cls.zoomHostUrl !== cls.zoomJoinUrl && (
                          <a href={cls.zoomHostUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[var(--color-navy)] hover:underline flex items-center gap-1">
                            <ExternalLink size={11} /> Host Link
                          </a>
                        )}
                      </div>
                    </div>
                    <AdminEditLinkForm
                      classId={cls.id}
                      currentMeetingUrl={cls.zoomJoinUrl}
                      currentRecordingUrl={cls.recordingUrl}
                      topic={cls.topic}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="font-bold text-[var(--color-navy)] mb-4 font-[family-name:var(--font-playfair)]">
          Past Sessions ({past.length})
        </h2>
        {past.length === 0 ? (
          <p className="text-slate-400 text-sm">No past sessions.</p>
        ) : (
          <div className="space-y-2">
            {past.slice(0, 20).map((cls) => (
              <div key={cls.id} className="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-[var(--color-navy)] truncate">{cls.topic}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-3 mt-0.5 flex-wrap">
                    <span>{new Date(cls.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    <span>{cls.batchName ?? "—"}</span>
                    {cls.teacherName && <span>{cls.teacherName}</span>}
                    <span className={`badge text-xs ${STATUS_COLORS[cls.status ?? "completed"]}`}>{cls.status}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {cls.zoomJoinUrl && (
                    <a href={cls.zoomJoinUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--color-teal)] hover:underline flex items-center gap-1">
                      <ExternalLink size={11} /> Link
                    </a>
                  )}
                  {cls.recordingUrl && (
                    <a href={cls.recordingUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--color-navy)] hover:underline flex items-center gap-1">
                      <Video size={11} /> Recording
                    </a>
                  )}
                  <AdminEditLinkForm
                    classId={cls.id}
                    currentMeetingUrl={cls.zoomJoinUrl}
                    currentRecordingUrl={cls.recordingUrl}
                    topic={cls.topic}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { db } from "@workspace/db";
import { liveClasses, batches, teachers, users } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requirePortalRole } from "@/lib/server/portal-auth";
import { Video, Plus, Clock, Users, ExternalLink } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Live Classes — Teacher Portal" };

export default async function TeacherLivePage() {
  const dbUser = await requirePortalRole("teacher");

  const [teacher] = await db
    .select({ id: teachers.id })
    .from(teachers)
    .where(and(eq(teachers.userId, dbUser.id), eq(teachers.isActive, true)))
    .limit(1);

  const myClasses = teacher
    ? await db
        .select({
          id: liveClasses.id,
          topic: liveClasses.topic,
          subject: liveClasses.subject,
          scheduledAt: liveClasses.scheduledAt,
          durationMinutes: liveClasses.durationMinutes,
          status: liveClasses.status,
          zoomJoinUrl: liveClasses.zoomJoinUrl,
          zoomHostUrl: liveClasses.zoomHostUrl,
          zoomPasscode: liveClasses.zoomPasscode,
          recordingUrl: liveClasses.recordingUrl,
          batchName: batches.name,
        })
        .from(liveClasses)
        .leftJoin(batches, eq(liveClasses.batchId, batches.id))
        .where(eq(liveClasses.teacherId, teacher.id))
        .orderBy(desc(liveClasses.scheduledAt))
        .limit(20)
    : [];

  const upcoming = myClasses.filter(
    (c) => c.status === "scheduled" && new Date(c.scheduledAt) >= new Date()
  );
  const past = myClasses.filter(
    (c) => c.status !== "scheduled" || new Date(c.scheduledAt) < new Date()
  );

  const statusColor: Record<string, string> = {
    scheduled: "bg-[var(--color-teal)]/10 text-[var(--color-teal)]",
    live: "bg-green-100 text-green-700",
    completed: "bg-slate-100 text-slate-500",
    cancelled: "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">
            Live Classes
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Your scheduled and past live sessions
          </p>
        </div>
        <Link
          href="/portal/teacher/schedule"
          className="btn-primary py-2.5 px-5 text-sm"
        >
          <Plus size={15} />
          Schedule Class
        </Link>
      </div>

      {!teacher && (
        <div className="card bg-amber-50 border border-amber-100 text-amber-800 text-sm">
          Your teacher profile is not yet fully set up. Contact an admin to complete your onboarding.
        </div>
      )}

      <div className="card">
        <h2 className="font-bold text-[var(--color-navy)] mb-4 font-[family-name:var(--font-playfair)]">
          Upcoming Sessions ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-slate-400 text-sm">No upcoming classes scheduled.</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((cls) => (
              <div key={cls.id} className="flex items-start gap-4 p-4 bg-[var(--color-slate-light)] rounded-xl">
                <div className="w-10 h-10 bg-[var(--color-navy)]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Video size={18} className="text-[var(--color-navy)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-sm text-[var(--color-navy)]">{cls.topic}</span>
                    <span className={`badge text-xs ${statusColor[cls.status ?? "scheduled"]}`}>
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
                    <span className="flex items-center gap-1">
                      <Users size={11} />
                      {cls.batchName ?? "—"}
                    </span>
                    {cls.durationMinutes && <span>{cls.durationMinutes} min</span>}
                  </div>
                  {cls.zoomHostUrl && (
                    <a
                      href={cls.zoomHostUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-[var(--color-teal)] hover:underline"
                    >
                      <ExternalLink size={11} /> Start on Zoom
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="font-bold text-[var(--color-navy)] mb-4 font-[family-name:var(--font-playfair)]">
          Past Sessions ({past.length})
        </h2>
        {past.length === 0 ? (
          <p className="text-slate-400 text-sm">No past sessions yet.</p>
        ) : (
          <div className="space-y-3">
            {past.slice(0, 8).map((cls) => (
              <div key={cls.id} className="flex items-center gap-4 py-2 border-b border-slate-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-[var(--color-navy)] truncate">{cls.topic}</div>
                  <div className="text-xs text-slate-400">
                    {new Date(cls.scheduledAt).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                    })} · {cls.batchName ?? "—"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {cls.recordingUrl ? (
                    <a
                      href={cls.recordingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-[var(--color-teal)] hover:underline flex items-center gap-1"
                    >
                      <Video size={11} /> Recording
                    </a>
                  ) : (
                    <span className="text-xs text-slate-300">No recording</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

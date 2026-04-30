import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { students, classRecordings, batches } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { Play, Clock, Calendar, AlertCircle } from "lucide-react";

export const metadata = { title: "Recorded Classes — Student Portal" };

const SUBJECT_COLORS: Record<string, { bg: string; text: string }> = {
  Physics: { bg: "bg-[var(--color-navy)]", text: "text-white" },
  Chemistry: { bg: "bg-[var(--color-teal)]", text: "text-white" },
  Mathematics: { bg: "bg-[var(--color-maroon)]", text: "text-white" },
  Biology: { bg: "bg-green-600", text: "text-white" },
};

function RecordingThumbnail({
  subject,
  dur,
  sc,
  interactive,
}: {
  subject: string;
  dur: string | null;
  sc: { bg: string; text: string };
  interactive: boolean;
}) {
  return (
    <div className={`${sc.bg} h-36 flex items-center justify-center relative`}>
      <div className={`w-12 h-12 bg-white/20 rounded-full flex items-center justify-center ${interactive ? "group-hover:scale-110 transition-transform" : ""}`}>
        <Play size={20} className="text-white ml-0.5" fill="white" />
      </div>
      <div className="absolute top-3 left-3 bg-black/30 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs text-white font-medium">
        {subject}
      </div>
      {dur && (
        <div className="absolute bottom-3 right-3 bg-black/30 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs text-white flex items-center gap-1">
          <Clock size={10} /> {dur}
        </div>
      )}
    </div>
  );
}

export default async function RecordingsPage() {
  const dbUser = await requirePortalRole("student");

  const [enrollment] = await db
    .select({ batchId: students.batchId })
    .from(students)
    .where(and(eq(students.userId, dbUser.id), eq(students.isActive, true)))
    .limit(1);

  const batchName = enrollment?.batchId
    ? await db.select({ name: batches.name }).from(batches).where(eq(batches.id, enrollment.batchId)).limit(1).then((r) => r[0]?.name ?? null)
    : null;

  const recordings = enrollment?.batchId
    ? await db
        .select({
          id: classRecordings.id,
          title: classRecordings.title,
          subject: classRecordings.subject,
          teacherName: classRecordings.teacherName,
          durationMinutes: classRecordings.durationMinutes,
          recordingUrl: classRecordings.recordingUrl,
          viewCount: classRecordings.viewCount,
          createdAt: classRecordings.createdAt,
        })
        .from(classRecordings)
        .where(and(eq(classRecordings.batchId, enrollment.batchId), eq(classRecordings.isVisible, true)))
        .orderBy(desc(classRecordings.createdAt))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Recorded Classes</h1>
        <p className="text-slate-500 text-sm mt-1">
          {enrollment
            ? `${recordings.length} recording${recordings.length !== 1 ? "s" : ""} available · ${batchName ?? ""}`
            : "Not enrolled in a batch"}
        </p>
      </div>

      {!enrollment && (
        <div className="card bg-amber-50 border border-amber-100 flex items-start gap-3">
          <AlertCircle size={17} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-amber-800 text-sm">Your batch enrollment is pending. Recordings will appear here once you are assigned to a batch.</p>
        </div>
      )}

      {enrollment && recordings.length === 0 && (
        <div className="card text-center py-10">
          <Play size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No recordings available for your batch yet.</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recordings.map((r) => {
          const sc = SUBJECT_COLORS[r.subject] ?? { bg: "bg-slate-700", text: "text-white" };
          const dur = r.durationMinutes ? `${Math.floor(r.durationMinutes / 60)}h ${r.durationMinutes % 60}m` : null;
          const hasLink = Boolean(r.recordingUrl && r.recordingUrl !== "#");

          if (hasLink) {
            return (
              <a
                key={r.id}
                href={r.recordingUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="card group hover:shadow-elevated transition-all p-0 overflow-hidden block"
              >
                <RecordingThumbnail subject={r.subject} dur={dur} sc={sc} interactive />
                <div className="p-4">
                  <div className="font-semibold text-[var(--color-navy)] text-sm line-clamp-2">{r.title}</div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    {r.teacherName && <span>{r.teacherName}</span>}
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />
                      {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <span className="mt-3 text-xs font-semibold text-[var(--color-teal)] flex items-center gap-1">
                    Watch Recording
                  </span>
                </div>
              </a>
            );
          }

          return (
            <div key={r.id} className="card p-0 overflow-hidden opacity-70">
              <RecordingThumbnail subject={r.subject} dur={dur} sc={sc} interactive={false} />
              <div className="p-4">
                <div className="font-semibold text-[var(--color-navy)] text-sm line-clamp-2">{r.title}</div>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                  {r.teacherName && <span>{r.teacherName}</span>}
                  <span className="flex items-center gap-1">
                    <Calendar size={10} />
                    {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </div>
                <span className="mt-3 text-xs text-slate-300 block">Link coming soon</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

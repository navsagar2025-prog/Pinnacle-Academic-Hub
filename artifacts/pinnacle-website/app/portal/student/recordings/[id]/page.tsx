import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Calendar, Clock, User as UserIcon } from "lucide-react";
import { db } from "@workspace/db";
import { classRecordings, students } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requirePortalRole } from "@/lib/server/portal-auth";
import { RecordingPlayer } from "@/components/portal/RecordingPlayer";
import {
  expandVideoTemplate,
  getVideoWatermarkConfig,
} from "@/lib/server/video-watermark";

export const dynamic = "force-dynamic";

export default async function RecordingPlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requirePortalRole("student");

  const [rec] = await db
    .select()
    .from(classRecordings)
    .where(eq(classRecordings.id, id))
    .limit(1);
  if (!rec || rec.archivedAt || !rec.isVisible) notFound();

  // Re-check enrolment server-side so the page itself doesn't render the
  // overlay text for a user who isn't allowed to watch.
  const [enrol] = await db
    .select({ batchId: students.batchId })
    .from(students)
    .where(and(eq(students.userId, user.id), eq(students.isActive, true)))
    .limit(1);
  const sb = enrol?.batchId ?? null;
  const inArr = sb && (rec.batchIds ?? []).includes(sb);
  const legacy = sb && rec.batchId && rec.batchId === sb;
  if (!inArr && !legacy) {
    redirect("/portal/student/recordings");
  }

  const cfg = await getVideoWatermarkConfig();

  // Server-side template expansion using validated DB user data.
  const overlayText = expandVideoTemplate(cfg.textTemplate, {
    userName: user.name ?? "Student",
    userPhone: user.phone ?? "",
    userEmail: user.email ?? "",
  });

  return (
    <div className="space-y-5">
      <Link
        href="/portal/student/recordings"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-[var(--color-navy)]"
      >
        <ChevronLeft size={16} /> All recordings
      </Link>

      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">
          {rec.title}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="px-2 py-0.5 rounded-full bg-[var(--color-navy)]/5 text-[var(--color-navy)] font-medium">
            {rec.subject}
          </span>
          {rec.teacherName && (
            <span className="flex items-center gap-1">
              <UserIcon size={11} /> {rec.teacherName}
            </span>
          )}
          {rec.classDate && (
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {new Date(rec.classDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          )}
          {rec.durationMinutes && (
            <span className="flex items-center gap-1">
              <Clock size={11} /> {rec.durationMinutes} min
            </span>
          )}
        </div>
      </div>

      <RecordingPlayer
        recordingId={rec.id}
        watermarkEnabled={cfg.enabled}
        watermarkText={overlayText}
        watermarkOpacity={cfg.opacity}
        watermarkFontSize={cfg.fontSize}
        watermarkColor={cfg.color}
        cycleSeconds={cfg.cycleSeconds}
        anchors={cfg.anchors}
      />

      <p className="text-[11px] text-slate-400 max-w-2xl">
        Recordings are licensed for personal study only. Your name and phone are watermarked into
        the playback as a deterrent against redistribution; every play start is logged.
      </p>
    </div>
  );
}

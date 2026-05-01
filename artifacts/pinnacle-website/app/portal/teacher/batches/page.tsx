import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { teachers, schedules, batches, students, courses } from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { Users, Clock, BookOpen, ChevronRight, AlertCircle, Layers } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "My Batches — Teacher Portal" };

export default async function TeacherBatchesPage() {
  const dbUser = await requirePortalRole("teacher");

  const [teacher] = await db
    .select({ id: teachers.id, designation: teachers.designation })
    .from(teachers)
    .where(and(eq(teachers.userId, dbUser.id), eq(teachers.isActive, true)))
    .limit(1);

  const assignedBatches = teacher
    ? await db
        .selectDistinct({
          batchId: batches.id,
          batchName: batches.name,
          timingLabel: batches.timingLabel,
          daysLabel: batches.daysLabel,
          room: batches.room,
          status: batches.status,
          maxStudents: batches.maxStudents,
          courseTitle: courses.title,
          studentCount: sql<number>`(SELECT count(*) FROM students WHERE batch_id = ${batches.id} AND is_active = true)::int`,
          sessionCount: sql<number>`(SELECT count(*) FROM schedules WHERE batch_id = ${batches.id} AND teacher_id = ${teacher.id})::int`,
        })
        .from(schedules)
        .leftJoin(batches, eq(schedules.batchId, batches.id))
        .leftJoin(courses, eq(batches.courseId, courses.id))
        .where(eq(schedules.teacherId, teacher.id))
    : [];

  const validBatches = assignedBatches.filter((b): b is typeof b & { batchId: string } => b.batchId !== null);

  const statusColor: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    upcoming: "bg-blue-100 text-blue-700",
    full: "bg-amber-100 text-amber-700",
    completed: "bg-slate-100 text-slate-500",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">
          My Batches
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {validBatches.length} batch{validBatches.length !== 1 ? "es" : ""} assigned to you
        </p>
      </div>

      {!teacher && (
        <div className="card bg-amber-50 border border-amber-100 flex items-start gap-3">
          <AlertCircle size={17} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-amber-800 text-sm">
            Your teacher profile is not yet set up. Contact an admin to complete your onboarding.
          </p>
        </div>
      )}

      {teacher && validBatches.length === 0 && (
        <div className="card text-center py-12">
          <Layers size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No batches assigned yet.</p>
          <p className="text-slate-400 text-sm mt-1">Contact the admin to assign you to a batch schedule.</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {validBatches.map((b) => (
          <Link
            key={b.batchId}
            href={`/portal/teacher/batches/${b.batchId}`}
            className="card hover:shadow-md transition-shadow group cursor-pointer block"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-[var(--color-navy)]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Layers size={20} className="text-[var(--color-navy)]" />
                </div>
                <div>
                  <div className="font-bold text-[var(--color-navy)] text-sm font-[family-name:var(--font-playfair)]">
                    {b.batchName}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{b.courseTitle ?? "—"}</div>
                </div>
              </div>
              <span className={`badge text-xs capitalize px-2 py-1 rounded-full font-medium ${statusColor[b.status ?? "active"] ?? "bg-slate-100 text-slate-500"}`}>
                {b.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-[var(--color-teal)] mb-1">
                  <Users size={14} />
                </div>
                <div className="text-lg font-bold text-[var(--color-navy)]">{b.studentCount ?? 0}</div>
                <div className="text-xs text-slate-400">Students</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-[var(--color-maroon)] mb-1">
                  <Clock size={14} />
                </div>
                <div className="text-lg font-bold text-[var(--color-navy)]">{b.sessionCount ?? 0}</div>
                <div className="text-xs text-slate-400">Sessions/wk</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-[var(--color-gold)] mb-1">
                  <BookOpen size={14} />
                </div>
                <div className="text-lg font-bold text-[var(--color-navy)]">{b.maxStudents ?? 30}</div>
                <div className="text-xs text-slate-400">Capacity</div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>{b.timingLabel} · {b.daysLabel}</span>
              <ChevronRight size={14} className="group-hover:text-[var(--color-teal)] transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

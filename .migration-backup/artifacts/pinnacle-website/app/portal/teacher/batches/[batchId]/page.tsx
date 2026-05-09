import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { teachers, batches, students, users, courses, schedules } from "@workspace/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { Users, ArrowLeft, Phone, User, Hash } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata = { title: "Batch Students — Teacher Portal" };

export default async function BatchDetailPage({ params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  const dbUser = await requirePortalRole("teacher");

  const [teacher] = await db
    .select({ id: teachers.id })
    .from(teachers)
    .where(and(eq(teachers.userId, dbUser.id), eq(teachers.isActive, true)))
    .limit(1);

  if (!teacher) notFound();

  const [scheduleCheck] = await db
    .select({ id: schedules.id })
    .from(schedules)
    .where(and(eq(schedules.teacherId, teacher.id), eq(schedules.batchId, batchId)))
    .limit(1);

  if (!scheduleCheck) notFound();

  const [batch] = await db
    .select({
      id: batches.id,
      name: batches.name,
      timingLabel: batches.timingLabel,
      daysLabel: batches.daysLabel,
      room: batches.room,
      status: batches.status,
      courseTitle: courses.title,
    })
    .from(batches)
    .leftJoin(courses, eq(batches.courseId, courses.id))
    .where(eq(batches.id, batchId))
    .limit(1);

  if (!batch) notFound();

  const studentRows = await db
    .select({
      id: students.id,
      rollNumber: students.rollNumber,
      name: users.name,
      email: users.email,
      phone: users.phone,
      guardianName: students.guardianName,
      guardianPhone: students.guardianPhone,
      enrolledAt: students.enrolledAt,
    })
    .from(students)
    .leftJoin(users, eq(students.userId, users.id))
    .where(and(eq(students.batchId, batchId), eq(students.isActive, true)))
    .orderBy(asc(students.rollNumber));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/portal/teacher/batches"
          className="flex items-center gap-2 text-slate-500 hover:text-[var(--color-teal)] text-sm mb-3 transition-colors"
        >
          <ArrowLeft size={14} /> Back to My Batches
        </Link>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">
          {batch.name}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {batch.courseTitle} · {batch.timingLabel} · {batch.daysLabel}
          {batch.room && ` · ${batch.room}`}
        </p>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">
            Student Roster
          </h2>
          <span className="badge bg-[var(--color-navy)]/10 text-[var(--color-navy)] text-xs flex items-center gap-1">
            <Users size={11} /> {studentRows.length} students
          </span>
        </div>

        {studentRows.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">
            No active students enrolled in this batch yet.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {studentRows.map((s) => (
              <div key={s.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 bg-[var(--color-teal)]/10 rounded-full flex items-center justify-center flex-shrink-0 text-[var(--color-teal)] font-bold text-sm">
                    {(s.name ?? "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-[var(--color-navy)] truncate">{s.name ?? "—"}</div>
                    <div className="flex flex-wrap gap-3 mt-0.5 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Hash size={10} />{s.rollNumber}</span>
                      {s.phone && <span className="flex items-center gap-1"><Phone size={10} />{s.phone}</span>}
                    </div>
                  </div>
                </div>
                {s.guardianName && (
                  <div className="text-xs text-slate-400 sm:text-right">
                    <div className="flex items-center gap-1 justify-start sm:justify-end">
                      <User size={10} /> Guardian: {s.guardianName}
                    </div>
                    {s.guardianPhone && (
                      <div className="flex items-center gap-1 justify-start sm:justify-end mt-0.5">
                        <Phone size={10} /> {s.guardianPhone}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { teachers, schedules, batches, students, courses } from "@workspace/db/schema";
import { eq, and, asc, sql } from "drizzle-orm";
import { Clock, MapPin, Users, AlertCircle } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "My Schedule — Teacher Portal" };

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function fmt(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h % 12 || 12;
  return `${hr}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default async function TeacherSchedulePage() {
  const dbUser = await requirePortalRole("teacher");

  const [teacher] = await db
    .select({ id: teachers.id, designation: teachers.designation, subjects: teachers.subjects })
    .from(teachers)
    .where(and(eq(teachers.userId, dbUser.id), eq(teachers.isActive, true)))
    .limit(1);

  const slots = teacher
    ? await db
        .select({
          id: schedules.id,
          subject: schedules.subject,
          topic: schedules.topic,
          dayOfWeek: schedules.dayOfWeek,
          startTime: schedules.startTime,
          endTime: schedules.endTime,
          room: schedules.room,
          batchId: schedules.batchId,
          batchName: batches.name,
          studentCount: sql<number>`(SELECT count(*) FROM students WHERE batch_id = ${schedules.batchId} AND is_active = true)::int`,
        })
        .from(schedules)
        .leftJoin(batches, eq(schedules.batchId, batches.id))
        .where(eq(schedules.teacherId, teacher.id))
        .orderBy(asc(schedules.dayOfWeek), asc(schedules.startTime))
    : [];

  const grouped = DAYS.map((_, idx) => ({ day: idx, slots: slots.filter((s) => s.dayOfWeek === idx) })).filter((g) => g.slots.length > 0);

  const totalBatches = new Set(slots.map((s) => s.batchId)).size;
  const totalSessions = slots.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">My Schedule</h1>
        <p className="text-slate-500 text-sm mt-1">
          {teacher ? `${teacher.designation} · ${totalSessions} sessions/week across ${totalBatches} batch${totalBatches !== 1 ? "es" : ""}` : "Teacher profile not set up"}
        </p>
      </div>

      {!teacher && (
        <div className="card bg-amber-50 border border-amber-100 flex items-start gap-3">
          <AlertCircle size={17} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-amber-800 text-sm">Your teacher profile is not yet set up. Contact an admin to complete your onboarding.</p>
        </div>
      )}

      {teacher && grouped.length === 0 && (
        <div className="card text-center py-10">
          <Clock size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No schedule assigned yet. Contact admin to set up your teaching schedule.</p>
        </div>
      )}

      <div className="space-y-4">
        {grouped.map(({ day, slots: daySlots }) => (
          <div key={day} className="card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-[var(--color-maroon)] rounded-xl flex items-center justify-center text-white font-bold text-sm">{DAYS[day]}</div>
              <span className="font-semibold text-[var(--color-navy)]">{DAY_NAMES[day]}</span>
            </div>
            <div className="space-y-2">
              {daySlots.map((s) => (
                <div key={s.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-[var(--color-slate-light)] rounded-xl">
                  <div className="flex items-center gap-2 text-xs text-slate-500 w-32 flex-shrink-0">
                    <Clock size={12} />{fmt(s.startTime)} – {fmt(s.endTime)}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-[var(--color-navy)]">{s.topic ?? s.subject}</div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="badge text-xs bg-[var(--color-navy)]/10 text-[var(--color-navy)]">{s.batchName ?? "—"}</span>
                      {s.studentCount > 0 && <span className="text-xs text-slate-400 flex items-center gap-1"><Users size={11} />{s.studentCount} students</span>}
                      {s.room && <span className="text-xs text-slate-400 flex items-center gap-1"><MapPin size={11} />{s.room}</span>}
                    </div>
                  </div>
                  <Link
                    href="/portal/teacher/live"
                    className="text-xs font-semibold px-4 py-2 bg-[var(--color-maroon)] text-white rounded-lg hover:bg-[var(--color-maroon-light)] transition-colors flex-shrink-0"
                  >
                    Schedule Live
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { parents, students, schedules, teachers, batches } from "@workspace/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { Clock, MapPin, User, AlertCircle } from "lucide-react";

export const metadata = { title: "Timetable — Parent Portal" };

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const SUBJECT_COLORS: Record<string, string> = {
  Physics: "bg-[var(--color-navy)]/10 text-[var(--color-navy)]",
  Chemistry: "bg-[var(--color-teal)]/10 text-[var(--color-teal)]",
  Mathematics: "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]",
  Biology: "bg-green-100 text-green-700",
};

function fmt(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h % 12 || 12;
  return `${hr}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default async function ParentTimetablePage() {
  const dbUser = await requirePortalRole("parent");

  const [parentRecord] = await db
    .select({ studentId: parents.studentId })
    .from(parents)
    .where(eq(parents.userId, dbUser.id))
    .limit(1);

  const studentInfo = parentRecord?.studentId
    ? await db
        .select({ batchId: students.batchId, rollNumber: students.rollNumber })
        .from(students)
        .where(and(eq(students.id, parentRecord.studentId), eq(students.isActive, true)))
        .limit(1)
        .then((r) => r[0] ?? null)
    : null;

  const batchInfo = studentInfo?.batchId
    ? await db
        .select({ name: batches.name, timingLabel: batches.timingLabel, daysLabel: batches.daysLabel })
        .from(batches)
        .where(eq(batches.id, studentInfo.batchId))
        .limit(1)
        .then((r) => r[0] ?? null)
    : null;

  const slots = studentInfo?.batchId
    ? await db
        .select({ id: schedules.id, subject: schedules.subject, topic: schedules.topic, dayOfWeek: schedules.dayOfWeek, startTime: schedules.startTime, endTime: schedules.endTime, room: schedules.room, teacherDesig: teachers.designation })
        .from(schedules)
        .leftJoin(teachers, eq(schedules.teacherId, teachers.id))
        .where(eq(schedules.batchId, studentInfo.batchId))
        .orderBy(asc(schedules.dayOfWeek), asc(schedules.startTime))
    : [];

  const grouped = DAYS.map((_, idx) => ({ day: idx, slots: slots.filter((s) => s.dayOfWeek === idx) })).filter((g) => g.slots.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Weekly Timetable</h1>
        <p className="text-slate-500 text-sm mt-1">
          {batchInfo ? `${batchInfo.name} · ${batchInfo.timingLabel} · ${batchInfo.daysLabel}` : "Not linked to a student account"}
        </p>
      </div>

      {!parentRecord && (
        <div className="card bg-amber-50 border border-amber-100 flex items-start gap-3">
          <AlertCircle size={17} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-amber-800 text-sm">Your account is not yet linked to a student. Contact the office with your child's roll number.</p>
        </div>
      )}

      {parentRecord && grouped.length === 0 && (
        <div className="card text-center py-10">
          <Clock size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No timetable available for your child's batch yet.</p>
        </div>
      )}

      <div className="space-y-4">
        {grouped.map(({ day, slots: daySlots }) => (
          <div key={day} className="card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-[var(--color-teal)] rounded-xl flex items-center justify-center text-white font-bold text-sm">{DAYS[day]}</div>
              <span className="font-semibold text-[var(--color-navy)]">{DAY_NAMES[day]}</span>
            </div>
            <div className="space-y-2">
              {daySlots.map((s) => (
                <div key={s.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-[var(--color-slate-light)] rounded-xl">
                  <div className="flex items-center gap-2 text-xs text-slate-500 w-36 flex-shrink-0"><Clock size={12} />{fmt(s.startTime)} – {fmt(s.endTime)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`badge text-xs px-2 py-0.5 ${SUBJECT_COLORS[s.subject] ?? "bg-slate-100 text-slate-600"}`}>{s.subject}</span>
                      {s.topic && <span className="font-semibold text-sm text-[var(--color-navy)]">{s.topic}</span>}
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      {s.teacherDesig && <span className="text-xs text-slate-500 flex items-center gap-1"><User size={11} />{s.teacherDesig}</span>}
                      {s.room && <span className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={11} />{s.room}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

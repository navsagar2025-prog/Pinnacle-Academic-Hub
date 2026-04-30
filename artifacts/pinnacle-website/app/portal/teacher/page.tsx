import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { teachers, schedules, batches, courses, studyMaterials, notices, students } from "@workspace/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { Users, Video, BookOpen, Bell, Clock, ChevronRight, Upload } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Teacher Dashboard" };

const DAY_NUM: Record<string, number> = {
  Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4,
  Friday: 5, Saturday: 6, Sunday: 7,
};

function getTodayLabel(): string {
  return new Date().toLocaleDateString("en-US", { weekday: "long" });
}

export default async function TeacherDashboard() {
  const dbUser = await requirePortalRole("teacher");

  const [teacher] = await db
    .select({ id: teachers.id, designation: teachers.designation, subjects: teachers.subjects })
    .from(teachers)
    .where(and(eq(teachers.userId, dbUser.id), eq(teachers.isActive, true)))
    .limit(1);

  const todayFull = getTodayLabel();

  const todaySchedules = teacher
    ? await db
        .select({
          id: schedules.id,
          subject: schedules.subject,
          startTime: schedules.startTime,
          endTime: schedules.endTime,
          room: schedules.room,
          topic: schedules.topic,
          dayOfWeek: schedules.dayOfWeek,
          batchName: batches.name,
          timingLabel: batches.timingLabel,
          studentCount: sql<number>`(SELECT count(*) FROM students WHERE batch_id = ${batches.id} AND is_active = true)::int`,
        })
        .from(schedules)
        .leftJoin(batches, eq(schedules.batchId, batches.id))
        .where(and(eq(schedules.teacherId, teacher.id), eq(schedules.dayOfWeek, DAY_NUM[todayFull] ?? 1)))
        .orderBy(schedules.startTime)
    : [];

  const recentMaterials = teacher
    ? await db
        .select({
          id: studyMaterials.id,
          title: studyMaterials.title,
          type: studyMaterials.type,
          downloadCount: studyMaterials.downloadCount,
          createdAt: studyMaterials.createdAt,
          batchName: batches.name,
        })
        .from(studyMaterials)
        .leftJoin(batches, eq(studyMaterials.batchId, batches.id))
        .where(eq(studyMaterials.uploadedBy, dbUser.id))
        .orderBy(desc(studyMaterials.createdAt))
        .limit(5)
    : [];

  const [{ studentCount }] = await (teacher
    ? db
        .select({ studentCount: sql<number>`count(*)::int` })
        .from(students)
        .where(
          sql`batch_id IN (SELECT batch_id FROM schedules WHERE teacher_id = ${teacher.id}) AND is_active = true`
        )
    : Promise.resolve([{ studentCount: 0 }]));

  const [{ matCount }] = await db
    .select({ matCount: sql<number>`count(*)::int` })
    .from(studyMaterials)
    .where(eq(studyMaterials.uploadedBy, dbUser.id));

  const [{ noticeCount }] = await db
    .select({ noticeCount: sql<number>`count(*)::int` })
    .from(notices)
    .where(eq(notices.postedBy, dbUser.id));

  const stats = [
    { label: "My Students", value: String(studentCount ?? 0), icon: <Users size={18} />, color: "navy" },
    { label: "Classes Today", value: String(todaySchedules.length), icon: <Video size={18} />, color: "teal" },
    { label: "Materials Uploaded", value: String(matCount ?? 0), icon: <BookOpen size={18} />, color: "maroon" },
    { label: "Notices Posted", value: String(noticeCount ?? 0), icon: <Bell size={18} />, color: "gold" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">
          Good day, {dbUser.name?.split(" ")[0] ?? "Teacher"}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {teacher?.designation ?? "Faculty"} · {teacher?.subjects?.join(", ") ?? ""}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`card flex flex-col gap-3 border-l-4 ${
              s.color === "navy" ? "border-l-[var(--color-navy)]"
              : s.color === "teal" ? "border-l-[var(--color-teal)]"
              : s.color === "maroon" ? "border-l-[var(--color-maroon)]"
              : "border-l-[var(--color-gold)]"
            }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              s.color === "navy" ? "bg-[var(--color-navy)]/10 text-[var(--color-navy)]"
              : s.color === "teal" ? "bg-[var(--color-teal)]/10 text-[var(--color-teal)]"
              : s.color === "maroon" ? "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]"
              : "bg-[var(--color-gold)]/10 text-[var(--color-maroon)]"
            }`}>{s.icon}</div>
            <div>
              <div className="text-2xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">{s.value}</div>
              <div className="text-slate-500 text-xs">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">
              Today's Classes <span className="text-xs font-normal text-slate-400 ml-1">({todayFull})</span>
            </h2>
            <Link href="/portal/teacher/schedule" className="text-[var(--color-teal)] text-sm flex items-center gap-1 hover:underline">
              Full Schedule <ChevronRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {todaySchedules.length === 0 ? (
              <p className="text-slate-400 text-sm py-4 text-center">No classes scheduled for today.</p>
            ) : (
              todaySchedules.map((c) => (
                <div key={c.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-[var(--color-slate-light)] rounded-xl">
                  <div className="flex items-center gap-2 text-xs text-slate-500 w-28 flex-shrink-0">
                    <Clock size={12} />{c.startTime}–{c.endTime}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-[var(--color-navy)]">{c.topic ?? c.subject}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {c.batchName} · {c.studentCount} students · {c.room ?? "TBD"}
                    </div>
                  </div>
                  <Link href="/portal/teacher/live" className="text-xs font-semibold px-4 py-2 bg-[var(--color-teal)] text-white rounded-lg hover:bg-[var(--color-teal-light)] transition-colors flex-shrink-0">
                    Start
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">Recent Uploads</h2>
            <Link href="/portal/teacher/materials" className="text-[var(--color-teal)] text-sm flex items-center gap-1 hover:underline">
              Manage <ChevronRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {recentMaterials.length === 0 ? (
              <p className="text-slate-400 text-sm py-4 text-center">No materials uploaded yet.</p>
            ) : (
              recentMaterials.map((r) => (
                <div key={r.id} className="flex items-start gap-3 p-3 bg-[var(--color-slate-light)] rounded-xl">
                  <div className="w-9 h-9 bg-[var(--color-navy)]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen size={14} className="text-[var(--color-navy)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-[var(--color-navy)] truncate">{r.title}</div>
                    <div className="text-xs text-slate-400">
                      {r.batchName} · {r.downloadCount ?? 0} downloads ·{" "}
                      {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <Link href="/portal/teacher/materials" className="btn-primary w-full justify-center mt-4 py-2.5 text-sm flex items-center gap-2">
            <Upload size={14} />Upload New Material
          </Link>
        </div>
      </div>
    </div>
  );
}

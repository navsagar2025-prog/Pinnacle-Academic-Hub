import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Users, Video, BookOpen, Bell, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Teacher Dashboard" };

const TODAY_CLASSES = [
  { time: "5:00–7:00 PM", subject: "Physics", topic: "Wave Optics — Diffraction", batch: "JEE 2026 — Evening", students: 28, room: "Room 101" },
  { time: "7:15–8:15 PM", subject: "Physics", topic: "Doubt Clearing Session", batch: "JEE 2026 — Morning", students: 25, room: "Room 101" },
];

const RECENT_UPLOADS = [
  { title: "Wave Optics — Complete Notes", subject: "Physics", date: "25 Apr", downloads: 47 },
  { title: "Thermodynamics — Revision Sheet", subject: "Physics", date: "20 Apr", downloads: 62 },
  { title: "Electrostatics — Problem Set", subject: "Physics", date: "15 Apr", downloads: 38 },
];

export default async function TeacherDashboard() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const user = await currentUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">
          Good day, {user?.firstName ?? "Teacher"} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">Physics Faculty · JEE 2026 — Morning & Evening Batches</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "My Students", value: "53", icon: <Users size={18} />, color: "navy" },
          { label: "Classes This Week", value: "6", icon: <Video size={18} />, color: "teal" },
          { label: "Materials Uploaded", value: "24", icon: <BookOpen size={18} />, color: "maroon" },
          { label: "Notices Posted", value: "8", icon: <Bell size={18} />, color: "gold" },
        ].map((s) => (
          <div key={s.label} className={`card flex flex-col gap-3 border-l-4 ${s.color === "navy" ? "border-l-[var(--color-navy)]" : s.color === "teal" ? "border-l-[var(--color-teal)]" : s.color === "maroon" ? "border-l-[var(--color-maroon)]" : "border-l-[var(--color-gold)]"}`}>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color === "navy" ? "bg-[var(--color-navy)]/10 text-[var(--color-navy)]" : s.color === "teal" ? "bg-[var(--color-teal)]/10 text-[var(--color-teal)]" : s.color === "maroon" ? "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]" : "bg-[var(--color-gold)]/10 text-[var(--color-maroon)]"}`}>{s.icon}</div>
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
            <h2 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">Today's Classes</h2>
            <Link href="/portal/teacher/schedule" className="text-[var(--color-teal)] text-sm flex items-center gap-1 hover:underline">Schedule <ChevronRight size={14} /></Link>
          </div>
          <div className="space-y-3">
            {TODAY_CLASSES.map((c, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-[var(--color-slate-light)] rounded-xl">
                <div className="flex items-center gap-2 text-xs text-slate-500 w-28 flex-shrink-0"><Clock size={12} />{c.time}</div>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-[var(--color-navy)]">{c.topic}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{c.batch} · {c.students} students · {c.room}</div>
                </div>
                <button className="text-xs font-semibold px-4 py-2 bg-[var(--color-teal)] text-white rounded-lg hover:bg-[var(--color-teal-light)] transition-colors flex-shrink-0">Start</button>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">Recent Uploads</h2>
            <Link href="/portal/teacher/materials" className="text-[var(--color-teal)] text-sm flex items-center gap-1 hover:underline">Manage <ChevronRight size={14} /></Link>
          </div>
          <div className="space-y-3">
            {RECENT_UPLOADS.map((r, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-[var(--color-slate-light)] rounded-xl">
                <div className="w-9 h-9 bg-[var(--color-navy)]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen size={14} className="text-[var(--color-navy)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-[var(--color-navy)] truncate">{r.title}</div>
                  <div className="text-xs text-slate-400">{r.date} · {r.downloads} downloads</div>
                </div>
              </div>
            ))}
          </div>
          <Link href="/portal/teacher/materials" className="btn-primary w-full justify-center mt-4 py-2.5 text-sm">
            <BookOpen size={14} />Upload New Material
          </Link>
        </div>
      </div>
    </div>
  );
}

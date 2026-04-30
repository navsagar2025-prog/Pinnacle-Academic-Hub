import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Clock, MapPin, Users } from "lucide-react";

export const metadata = { title: "My Schedule — Teacher Portal" };

const SCHEDULE = {
  Mon: [
    { time: "5:00–7:00 PM", topic: "Wave Optics — Diffraction", batch: "JEE 2026 — Evening", students: 28, room: "Room 101" },
    { time: "7:15–8:15 PM", topic: "Doubt Clearing Session", batch: "JEE 2026 — Morning", students: 25, room: "Room 101" },
  ],
  Tue: [
    { time: "5:00–7:00 PM", topic: "Thermodynamics — Carnot Cycle", batch: "JEE 2026 — Evening", students: 28, room: "Room 101" },
  ],
  Wed: [
    { time: "9:00–11:00 AM", topic: "Electrodynamics — Maxwell Eqns", batch: "JEE 2026 — Morning", students: 25, room: "Room 101" },
    { time: "5:00–7:00 PM", topic: "Wave Optics — Polarization", batch: "JEE 2026 — Evening", students: 28, room: "Room 101" },
  ],
  Thu: [
    { time: "5:00–7:00 PM", topic: "Mechanics — Rotation", batch: "JEE 2026 — Evening", students: 28, room: "Room 101" },
    { time: "7:15–8:15 PM", topic: "Chapter Test — Wave Optics", batch: "Both Batches", students: 53, room: "Exam Hall" },
  ],
  Fri: [
    { time: "9:00–11:00 AM", topic: "Doubt Clearing — All Topics", batch: "JEE 2026 — Morning", students: 25, room: "Room 101" },
  ],
  Sat: [
    { time: "10:00 AM–1:00 PM", topic: "Full Mock Test Invigilating", batch: "JEE 2026 — All", students: 53, room: "Exam Hall" },
  ],
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function TeacherSchedulePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">My Schedule</h1>
        <p className="text-slate-500 text-sm mt-1">Physics · JEE 2026 Batches</p>
      </div>
      <div className="space-y-4">
        {DAYS.map((day, idx) => {
          const slots = SCHEDULE[day as keyof typeof SCHEDULE];
          if (!slots || slots.length === 0) return null;
          return (
            <div key={day} className="card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-[var(--color-maroon)] rounded-xl flex items-center justify-center text-white font-bold text-sm">{day}</div>
                <span className="font-semibold text-[var(--color-navy)]">{DAY_NAMES[idx]}</span>
              </div>
              <div className="space-y-2">
                {slots.map((s, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-[var(--color-slate-light)] rounded-xl">
                    <div className="flex items-center gap-2 text-xs text-slate-500 w-32 flex-shrink-0"><Clock size={12} />{s.time}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-[var(--color-navy)]">{s.topic}</div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-slate-400 flex items-center gap-1"><Users size={11} />{s.students} students</span>
                        <span className="text-xs text-slate-400 flex items-center gap-1"><MapPin size={11} />{s.room}</span>
                        <span className="badge text-xs bg-[var(--color-navy)]/10 text-[var(--color-navy)]">{s.batch}</span>
                      </div>
                    </div>
                    <button className="text-xs font-semibold px-4 py-2 bg-[var(--color-maroon)] text-white rounded-lg hover:bg-[var(--color-maroon-light)] transition-colors flex-shrink-0">Start Live</button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

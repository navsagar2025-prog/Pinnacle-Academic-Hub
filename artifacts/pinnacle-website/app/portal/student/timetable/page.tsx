import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Clock, MapPin, User } from "lucide-react";

export const metadata = { title: "Timetable" };

const TIMETABLE = {
  Mon: [
    { time: "5:00–7:00 PM", subject: "Physics", topic: "Wave Optics", teacher: "Dr. Ramesh Kumar", room: "Room 101" },
    { time: "7:15–8:15 PM", subject: "Mathematics", topic: "Integral Calculus", teacher: "Mr. Ajay Tiwari", room: "Room 103" },
  ],
  Tue: [
    { time: "5:00–7:00 PM", subject: "Chemistry", topic: "Organic Chemistry", teacher: "Ms. Priya Sharma", room: "Room 102" },
    { time: "7:15–8:15 PM", subject: "Physics", topic: "Doubt Session", teacher: "Dr. Ramesh Kumar", room: "Room 101" },
  ],
  Wed: [
    { time: "5:00–7:00 PM", subject: "Mathematics", topic: "Differential Equations", teacher: "Mr. Ajay Tiwari", room: "Room 103" },
    { time: "7:15–8:15 PM", subject: "Chemistry", topic: "Physical Chemistry", teacher: "Ms. Priya Sharma", room: "Room 102" },
  ],
  Thu: [
    { time: "5:00–7:00 PM", subject: "Physics", topic: "Electrodynamics", teacher: "Dr. Ramesh Kumar", room: "Room 101" },
    { time: "7:15–8:15 PM", subject: "Mathematics", topic: "Coordinate Geometry", teacher: "Mr. Ajay Tiwari", room: "Room 103" },
  ],
  Fri: [
    { time: "5:00–7:00 PM", subject: "Chemistry", topic: "Inorganic Chemistry", teacher: "Ms. Priya Sharma", room: "Room 102" },
    { time: "7:15–8:15 PM", subject: "All", topic: "Open Doubt Session", teacher: "All Faculty", room: "Main Hall" },
  ],
  Sat: [
    { time: "10:00 AM–1:00 PM", subject: "All", topic: "Full-Length Mock Test", teacher: "Exam Cell", room: "Exam Hall" },
  ],
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const SUBJECT_COLORS: Record<string, string> = {
  Physics: "bg-[var(--color-navy)]/10 text-[var(--color-navy)]",
  Chemistry: "bg-[var(--color-teal)]/10 text-[var(--color-teal)]",
  Mathematics: "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]",
  All: "bg-[var(--color-gold)]/10 text-[var(--color-navy)]",
};

export default async function TimetablePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">
          Weekly Timetable
        </h1>
        <p className="text-slate-500 text-sm mt-1">JEE 2026 — Evening Batch</p>
      </div>

      <div className="space-y-4">
        {DAYS.map((day) => {
          const slots = TIMETABLE[day as keyof typeof TIMETABLE];
          return (
            <div key={day} className="card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-[var(--color-navy)] rounded-xl flex items-center justify-center text-white font-bold text-sm font-[family-name:var(--font-playfair)]">
                  {day}
                </div>
                <span className="font-semibold text-[var(--color-navy)]">{["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][DAYS.indexOf(day)]}</span>
              </div>
              <div className="space-y-2">
                {slots.map((s, i) => (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-[var(--color-slate-light)] rounded-xl"
                  >
                    <div className="flex items-center gap-2 text-xs text-slate-500 w-36 flex-shrink-0">
                      <Clock size={12} />
                      {s.time}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`badge text-xs px-2 py-0.5 ${SUBJECT_COLORS[s.subject] ?? "bg-slate-100 text-slate-600"}`}>
                          {s.subject}
                        </span>
                        <span className="font-semibold text-sm text-[var(--color-navy)]">{s.topic}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <User size={11} />
                          {s.teacher}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin size={11} />
                          {s.room}
                        </span>
                      </div>
                    </div>
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

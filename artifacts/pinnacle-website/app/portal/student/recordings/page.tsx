import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Play, Clock, Calendar } from "lucide-react";

export const metadata = { title: "Recorded Classes" };

const RECORDINGS = [
  { id: 1, subject: "Physics", topic: "Thermodynamics — Laws", teacher: "Dr. Ramesh Kumar", date: "28 Apr 2026", duration: "1h 45m", thumbnail: null },
  { id: 2, subject: "Chemistry", topic: "Coordination Compounds", teacher: "Ms. Priya Sharma", date: "27 Apr 2026", duration: "2h 10m", thumbnail: null },
  { id: 3, subject: "Mathematics", topic: "Differential Equations — Intro", teacher: "Mr. Ajay Tiwari", date: "26 Apr 2026", duration: "1h 55m", thumbnail: null },
  { id: 4, subject: "Physics", topic: "Wave Optics", teacher: "Dr. Ramesh Kumar", date: "24 Apr 2026", duration: "2h 05m", thumbnail: null },
  { id: 5, subject: "Chemistry", topic: "Organic — Named Reactions", teacher: "Ms. Priya Sharma", date: "23 Apr 2026", duration: "1h 40m", thumbnail: null },
  { id: 6, subject: "Mathematics", topic: "Complex Numbers", teacher: "Mr. Ajay Tiwari", date: "22 Apr 2026", duration: "2h 00m", thumbnail: null },
  { id: 7, subject: "Physics", topic: "Electrostatics — Revision", teacher: "Dr. Ramesh Kumar", date: "21 Apr 2026", duration: "1h 30m", thumbnail: null },
  { id: 8, subject: "Chemistry", topic: "Physical Chemistry — Electrochemistry", teacher: "Ms. Priya Sharma", date: "20 Apr 2026", duration: "1h 50m", thumbnail: null },
];

const SUBJECT_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  Physics: { bg: "bg-[var(--color-navy)]", text: "text-white", icon: "⚡" },
  Chemistry: { bg: "bg-[var(--color-teal)]", text: "text-white", icon: "🧪" },
  Mathematics: { bg: "bg-[var(--color-maroon)]", text: "text-white", icon: "📐" },
};

export default async function RecordingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">
          Recorded Classes
        </h1>
        <p className="text-slate-500 text-sm mt-1">Watch your missed or past sessions anytime</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {RECORDINGS.map((r) => {
          const sc = SUBJECT_COLORS[r.subject] ?? { bg: "bg-slate-700", text: "text-white", icon: "📖" };
          return (
            <div
              key={r.id}
              className="card group hover:shadow-elevated transition-all cursor-pointer p-0 overflow-hidden"
            >
              {/* Thumbnail */}
              <div className={`${sc.bg} h-36 flex items-center justify-center relative`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play size={20} className="text-white ml-0.5" fill="white" />
                  </div>
                </div>
                <div className="absolute top-3 left-3 bg-black/30 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs text-white font-medium">
                  {r.subject}
                </div>
                <div className="absolute bottom-3 right-3 bg-black/30 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs text-white flex items-center gap-1">
                  <Clock size={10} />
                  {r.duration}
                </div>
              </div>
              <div className="p-4">
                <div className="font-semibold text-[var(--color-navy)] text-sm line-clamp-2">
                  {r.topic}
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                  <span>{r.teacher}</span>
                  <span className="flex items-center gap-1">
                    <Calendar size={10} />
                    {r.date}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

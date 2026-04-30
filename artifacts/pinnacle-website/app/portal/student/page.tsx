import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  Video,
  BookOpen,
  Clock,
  CreditCard,
  Bell,
  TrendingUp,
  ChevronRight,
  Play,
  Calendar,
} from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Student Dashboard" };

const UPCOMING_CLASSES = [
  {
    id: 1,
    subject: "Physics",
    topic: "Wave Optics — Diffraction",
    time: "5:00 PM",
    date: "Today",
    teacher: "Dr. Ramesh Kumar",
    batch: "JEE 2026 — Evening",
    joinLink: "#",
  },
  {
    id: 2,
    subject: "Chemistry",
    topic: "Organic — Haloalkanes",
    time: "7:00 PM",
    date: "Today",
    teacher: "Ms. Priya Sharma",
    batch: "JEE 2026 — Evening",
    joinLink: "#",
  },
  {
    id: 3,
    subject: "Mathematics",
    topic: "Integral Calculus",
    time: "10:00 AM",
    date: "Tomorrow",
    teacher: "Mr. Ajay Tiwari",
    batch: "JEE 2026 — Evening",
    joinLink: "#",
  },
];

const RECENT_RECORDINGS = [
  {
    id: 1,
    subject: "Physics",
    topic: "Thermodynamics — Laws",
    date: "28 Apr",
    duration: "1h 45m",
    teacher: "Dr. Ramesh Kumar",
  },
  {
    id: 2,
    subject: "Chemistry",
    topic: "Coordination Compounds",
    date: "27 Apr",
    duration: "2h 10m",
    teacher: "Ms. Priya Sharma",
  },
  {
    id: 3,
    subject: "Mathematics",
    topic: "Differential Equations",
    date: "26 Apr",
    duration: "1h 55m",
    teacher: "Mr. Ajay Tiwari",
  },
];

const STAT_CARDS = [
  { label: "Classes This Week", value: "6", icon: <Video size={18} />, color: "navy" },
  { label: "Materials Available", value: "48", icon: <BookOpen size={18} />, color: "teal" },
  { label: "Practice Papers", value: "24", icon: <Clock size={18} />, color: "maroon" },
  { label: "Fee Status", value: "Paid", icon: <CreditCard size={18} />, color: "gold" },
];

export default async function StudentDashboard() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">
          Welcome back, {user?.firstName ?? "Student"} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          JEE 2026 — Evening Batch · Here's what's on for today
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((s) => (
          <div
            key={s.label}
            className={`card flex flex-col gap-3 ${
              s.color === "navy"
                ? "border-l-4 border-l-[var(--color-navy)]"
                : s.color === "teal"
                ? "border-l-4 border-l-[var(--color-teal)]"
                : s.color === "maroon"
                ? "border-l-4 border-l-[var(--color-maroon)]"
                : "border-l-4 border-l-[var(--color-gold)]"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                s.color === "navy"
                  ? "bg-[var(--color-navy)]/10 text-[var(--color-navy)]"
                  : s.color === "teal"
                  ? "bg-[var(--color-teal)]/10 text-[var(--color-teal)]"
                  : s.color === "maroon"
                  ? "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]"
                  : "bg-[var(--color-gold)]/10 text-[var(--color-maroon)]"
              }`}
            >
              {s.icon}
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">
                {s.value}
              </div>
              <div className="text-slate-500 text-xs">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upcoming classes */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">
                Upcoming Live Classes
              </h2>
              <Link href="/portal/student/timetable" className="text-[var(--color-teal)] text-sm flex items-center gap-1 hover:underline">
                View All <ChevronRight size={14} />
              </Link>
            </div>
            <div className="space-y-3">
              {UPCOMING_CLASSES.map((cls) => (
                <div
                  key={cls.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-[var(--color-slate-light)] rounded-xl"
                >
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-[var(--color-navy)]/10 rounded-xl flex items-center justify-center">
                      <Video size={16} className="text-[var(--color-navy)]" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-[var(--color-navy)]">
                      {cls.subject} — {cls.topic}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {cls.teacher} · {cls.date} at {cls.time}
                    </div>
                  </div>
                  <a
                    href={cls.joinLink}
                    className={`flex-shrink-0 text-xs font-semibold px-4 py-2 rounded-lg transition-colors ${
                      cls.date === "Today"
                        ? "bg-[var(--color-teal)] text-white hover:bg-[var(--color-teal-light)]"
                        : "bg-slate-200 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    {cls.date === "Today" ? "Join Class" : "Scheduled"}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Recent recordings */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-[var(--color-navy)] text-sm font-[family-name:var(--font-playfair)]">
                Recent Recordings
              </h2>
              <Link href="/portal/student/recordings" className="text-[var(--color-teal)] text-xs hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {RECENT_RECORDINGS.map((r) => (
                <div key={r.id} className="flex items-start gap-3 group">
                  <div className="w-9 h-9 bg-[var(--color-maroon)]/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--color-maroon)] transition-colors">
                    <Play size={13} className="text-[var(--color-maroon)] group-hover:text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[var(--color-navy)] truncate">
                      {r.subject} — {r.topic}
                    </div>
                    <div className="text-xs text-slate-400">
                      {r.date} · {r.duration}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notice */}
          <div className="card bg-[var(--color-gold)]/5 border-[var(--color-gold)]/30">
            <div className="flex items-center gap-2 mb-2">
              <Bell size={14} className="text-[var(--color-gold)]" />
              <span className="text-xs font-semibold text-[var(--color-navy)]">Latest Notice</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              JEE Advanced Mock Test on <strong>5 May 2026</strong>. Report by 9:00 AM. Admit cards available at front desk.
            </p>
          </div>

          {/* Progress */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-[var(--color-teal)]" />
              <span className="text-xs font-semibold text-[var(--color-navy)]">Test Performance</span>
            </div>
            {[
              { subject: "Physics", score: 72 },
              { subject: "Chemistry", score: 68 },
              { subject: "Mathematics", score: 81 },
            ].map((s) => (
              <div key={s.subject} className="mb-3 last:mb-0">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">{s.subject}</span>
                  <span className="font-semibold text-[var(--color-navy)]">{s.score}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      s.score >= 80
                        ? "bg-[var(--color-teal)]"
                        : s.score >= 65
                        ? "bg-[var(--color-gold)]"
                        : "bg-[var(--color-maroon)]"
                    }`}
                    style={{ width: `${s.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

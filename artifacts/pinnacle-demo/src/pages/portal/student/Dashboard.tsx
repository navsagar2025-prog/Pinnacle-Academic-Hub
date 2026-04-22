import { PortalLayout } from "@/components/layout/PortalLayout";
import { LayoutDashboard, Video, PlayCircle, FileText, PenLine, Calendar, CreditCard } from "lucide-react";
import { Link } from "wouter";

const navItems = [
  { label: "Dashboard", href: "/portal/student", icon: LayoutDashboard },
  { label: "Live Classes", href: "/portal/student/classes", icon: Video },
  { label: "Recorded Classes", href: "/portal/student/recordings", icon: PlayCircle },
  { label: "Study Materials", href: "/portal/student/materials", icon: FileText },
  { label: "Practice Papers", href: "/portal/student/papers", icon: PenLine },
  { label: "Timetable", href: "/portal/student/timetable", icon: Calendar },
  { label: "Fee Status", href: "/portal/student/fees", icon: CreditCard },
];

const upcomingClasses = [
  { subject: "Physics", topic: "Thermodynamics - Laws & Applications", date: "Today", time: "5:00 PM – 7:00 PM", teacher: "Dr. Ramesh Kumar" },
  { subject: "Chemistry", topic: "Organic Chemistry - Reaction Mechanisms", date: "Tomorrow", time: "5:00 PM – 7:00 PM", teacher: "Ms. Priya Sharma" },
  { subject: "Mathematics", topic: "Integral Calculus - Definite Integrals", date: "26 Apr", time: "5:00 PM – 7:00 PM", teacher: "Mr. Ajay Tiwari" },
];

const notices = [
  { date: "20 Apr", title: "Mock Test: JEE Mains Full Syllabus on May 1" },
  { date: "18 Apr", title: "Physics Notes Updated – Thermodynamics Module" },
  { date: "15 Apr", title: "Holiday: April 25 — Institute Closed" },
];

const todayTimetable = [
  { time: "5:00 PM", subject: "Physics", topic: "Thermodynamics" },
  { time: "7:00 PM", subject: "Study Hour", topic: "Self-study / Portal Access" },
];

export default function StudentDashboard() {
  return (
    <PortalLayout role="student" navItems={navItems} userName="Arjun Mehta" userSub="JEE 2026 Batch">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-primary">Welcome back, Arjun</h1>
        <p className="text-muted-foreground text-sm mt-1">JEE 2026 Batch · Roll No: JEE26-047</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Classes This Week", value: "6" },
          { label: "Materials Available", value: "48" },
          { label: "Tests Attempted", value: "12" },
          { label: "Attendance", value: "88%" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="font-bold text-foreground mb-4">Upcoming Live Classes</h2>
            <div className="space-y-3">
              {upcomingClasses.map((cls, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Video className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-foreground">{cls.subject} — {cls.topic}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{cls.teacher} · {cls.date}, {cls.time}</div>
                  </div>
                  <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full font-medium shrink-0">Demo</span>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <Link href="/portal/student/classes" className="text-xs text-primary font-medium hover:underline">View all classes →</Link>
            </div>
          </div>

          <div>
            <h2 className="font-bold text-foreground mb-4">Today's Schedule</h2>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-xs">Time</th>
                    <th className="text-left px-4 py-3 font-semibold text-xs">Subject</th>
                    <th className="text-left px-4 py-3 font-semibold text-xs">Topic</th>
                  </tr>
                </thead>
                <tbody>
                  {todayTimetable.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      <td className="px-4 py-3 font-medium text-primary text-xs">{row.time}</td>
                      <td className="px-4 py-3 font-medium text-sm">{row.subject}</td>
                      <td className="px-4 py-3 text-muted-foreground text-sm">{row.topic}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-bold text-foreground">Recent Notices</h2>
          {notices.map((n, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4">
              <div className="text-xs text-muted-foreground mb-1">{n.date}</div>
              <div className="text-sm font-medium text-foreground">{n.title}</div>
            </div>
          ))}
          <Link href="/notices" className="text-xs text-primary font-medium hover:underline">View all notices →</Link>

          <div className="mt-4">
            <h2 className="font-bold text-foreground mb-4">Quick Links</h2>
            <div className="grid grid-cols-2 gap-3">
              {navItems.slice(1).map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <div className="bg-card border border-border rounded-xl p-3 flex flex-col items-center gap-2 hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer">
                      <Icon className="w-5 h-5 text-primary" />
                      <span className="text-xs font-medium text-foreground text-center">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}

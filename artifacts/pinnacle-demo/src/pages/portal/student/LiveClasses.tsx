import { PortalLayout } from "@/components/layout/PortalLayout";
import { LayoutDashboard, Video, PlayCircle, FileText, PenLine, Calendar, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  { label: "Dashboard", href: "/portal/student", icon: LayoutDashboard },
  { label: "Live Classes", href: "/portal/student/classes", icon: Video },
  { label: "Recorded Classes", href: "/portal/student/recordings", icon: PlayCircle },
  { label: "Study Materials", href: "/portal/student/materials", icon: FileText },
  { label: "Practice Papers", href: "/portal/student/papers", icon: PenLine },
  { label: "Timetable", href: "/portal/student/timetable", icon: Calendar },
  { label: "Fee Status", href: "/portal/student/fees", icon: CreditCard },
];

const classes = [
  { subject: "Physics", topic: "Thermodynamics — First & Second Law", date: "Today, 22 Apr", time: "5:00 PM – 7:00 PM", teacher: "Dr. Ramesh Kumar", status: "upcoming" },
  { subject: "Chemistry", topic: "Organic Chemistry — Reaction Mechanisms (Part 2)", date: "Tomorrow, 23 Apr", time: "5:00 PM – 7:00 PM", teacher: "Ms. Priya Sharma", status: "upcoming" },
  { subject: "Mathematics", topic: "Integral Calculus — Definite Integrals", date: "26 Apr", time: "5:00 PM – 7:00 PM", teacher: "Mr. Ajay Tiwari", status: "upcoming" },
  { subject: "Physics", topic: "Gravitation — Kepler's Laws", date: "28 Apr", time: "5:00 PM – 7:00 PM", teacher: "Dr. Ramesh Kumar", status: "upcoming" },
  { subject: "Chemistry", topic: "Electrochemistry — Cell Reactions", date: "30 Apr", time: "5:00 PM – 7:00 PM", teacher: "Ms. Priya Sharma", status: "upcoming" },
  { subject: "Mathematics", topic: "Differential Equations — Order & Degree", date: "2 May", time: "5:00 PM – 7:00 PM", teacher: "Mr. Ajay Tiwari", status: "upcoming" },
];

const subjectColors: Record<string, string> = {
  Physics: "bg-primary/10 text-primary",
  Chemistry: "bg-secondary/10 text-secondary",
  Mathematics: "bg-accent/10 text-accent-foreground",
};

export default function StudentLiveClasses() {
  return (
    <PortalLayout role="student" navItems={navItems} userName="Arjun Mehta" userSub="JEE 2026 Batch">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-primary">Live Classes</h1>
        <p className="text-muted-foreground text-sm mt-1">Upcoming scheduled live classes for your batch.</p>
      </div>

      <div className="space-y-4">
        {classes.map((cls, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5 flex flex-col md:flex-row md:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Video className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${subjectColors[cls.subject] || "bg-muted"}`}>{cls.subject}</span>
              </div>
              <div className="font-semibold text-foreground">{cls.topic}</div>
              <div className="text-sm text-muted-foreground mt-1">{cls.teacher} · {cls.date} · {cls.time}</div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button disabled size="sm" className="shrink-0">
                    Join Class
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Live class join is disabled in demo mode</p>
              </TooltipContent>
            </Tooltip>
          </div>
        ))}
      </div>
    </PortalLayout>
  );
}

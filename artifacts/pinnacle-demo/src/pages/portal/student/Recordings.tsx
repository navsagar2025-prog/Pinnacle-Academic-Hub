import { PortalLayout } from "@/components/layout/PortalLayout";
import { LayoutDashboard, Video, PlayCircle, FileText, PenLine, Calendar, CreditCard, Play } from "lucide-react";
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

const recordings = [
  { subject: "Physics", topic: "Waves — Superposition & Interference", teacher: "Dr. Ramesh Kumar", date: "20 Apr 2026", duration: "1h 52m" },
  { subject: "Chemistry", topic: "Organic Chemistry — Reaction Mechanisms (Part 1)", teacher: "Ms. Priya Sharma", date: "18 Apr 2026", duration: "2h 05m" },
  { subject: "Mathematics", topic: "Integral Calculus — Area Under Curves", teacher: "Mr. Ajay Tiwari", date: "17 Apr 2026", duration: "1h 48m" },
  { subject: "Physics", topic: "Current Electricity — Kirchhoff's Laws", teacher: "Dr. Ramesh Kumar", date: "15 Apr 2026", duration: "2h 00m" },
  { subject: "Chemistry", topic: "Electrochemistry — Nernst Equation", teacher: "Ms. Priya Sharma", date: "13 Apr 2026", duration: "1h 55m" },
  { subject: "Mathematics", topic: "Differential Equations — Variable Separable", teacher: "Mr. Ajay Tiwari", date: "12 Apr 2026", duration: "1h 40m" },
  { subject: "Physics", topic: "Optics — Refraction & Total Internal Reflection", teacher: "Dr. Ramesh Kumar", date: "10 Apr 2026", duration: "2h 10m" },
  { subject: "Chemistry", topic: "Polymers & Biomolecules", teacher: "Ms. Priya Sharma", date: "8 Apr 2026", duration: "1h 30m" },
];

const subjectColors: Record<string, string> = {
  Physics: "bg-primary/10 text-primary",
  Chemistry: "bg-secondary/10 text-secondary",
  Mathematics: "bg-accent/10 text-accent-foreground",
};

export default function StudentRecordings() {
  return (
    <PortalLayout role="student" navItems={navItems} userName="Arjun Mehta" userSub="JEE 2026 Batch">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-primary">Recorded Classes</h1>
        <p className="text-muted-foreground text-sm mt-1">Replay past sessions anytime. Recordings available for 30 days.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {recordings.map((r, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
            <div className="bg-muted/60 aspect-video flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Play className="w-7 h-7 ml-0.5" />
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <div className="mb-2">
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${subjectColors[r.subject] || "bg-muted"}`}>{r.subject}</span>
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-1 flex-1">{r.topic}</h3>
              <div className="text-xs text-muted-foreground mb-3">{r.teacher} · {r.date} · {r.duration}</div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button disabled size="sm" className="w-full" variant="outline">
                      Watch Replay
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Video playback is disabled in demo mode</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        ))}
      </div>
    </PortalLayout>
  );
}

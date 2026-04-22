import { PortalLayout } from "@/components/layout/PortalLayout";
import { LayoutDashboard, Video, PlayCircle, FileText, PenLine, Calendar, CreditCard, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";

const navItems = [
  { label: "Dashboard", href: "/portal/student", icon: LayoutDashboard },
  { label: "Live Classes", href: "/portal/student/classes", icon: Video },
  { label: "Recorded Classes", href: "/portal/student/recordings", icon: PlayCircle },
  { label: "Study Materials", href: "/portal/student/materials", icon: FileText },
  { label: "Practice Papers", href: "/portal/student/papers", icon: PenLine },
  { label: "Timetable", href: "/portal/student/timetable", icon: Calendar },
  { label: "Fee Status", href: "/portal/student/fees", icon: CreditCard },
];

const materials = [
  { subject: "Physics", title: "Thermodynamics — Complete Notes", type: "PDF", size: "3.4 MB", date: "20 Apr 2026" },
  { subject: "Physics", title: "Waves — Theory & Solved Examples", type: "PDF", size: "2.8 MB", date: "16 Apr 2026" },
  { subject: "Physics", title: "Current Electricity — Formula Sheet", type: "PDF", size: "1.2 MB", date: "14 Apr 2026" },
  { subject: "Chemistry", title: "Organic Reactions — Master Chart", type: "PDF", size: "4.1 MB", date: "18 Apr 2026" },
  { subject: "Chemistry", title: "Electrochemistry — Comprehensive Notes", type: "PDF", size: "2.5 MB", date: "13 Apr 2026" },
  { subject: "Chemistry", title: "Polymers & Biomolecules", type: "PDF", size: "1.9 MB", date: "8 Apr 2026" },
  { subject: "Mathematics", title: "Integral Calculus — Techniques & Practice", type: "PDF", size: "3.7 MB", date: "17 Apr 2026" },
  { subject: "Mathematics", title: "Differential Equations — Method Summary", type: "PDF", size: "2.2 MB", date: "12 Apr 2026" },
  { subject: "Mathematics", title: "3D Geometry — Quick Reference", type: "PDF", size: "1.5 MB", date: "5 Apr 2026" },
];

const subjects = ["All", "Physics", "Chemistry", "Mathematics"];
const subjectColors: Record<string, string> = {
  Physics: "bg-primary/10 text-primary",
  Chemistry: "bg-secondary/10 text-secondary",
  Mathematics: "bg-accent/10 text-accent-foreground",
};

export default function StudentMaterials() {
  const [filter, setFilter] = useState("All");
  const filtered = filter === "All" ? materials : materials.filter((m) => m.subject === filter);

  return (
    <PortalLayout role="student" navItems={navItems} userName="Arjun Mehta" userSub="JEE 2026 Batch">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-primary">Study Materials</h1>
        <p className="text-muted-foreground text-sm mt-1">Chapter notes, formula sheets, and reference material for all subjects.</p>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {subjects.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === s ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((m, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-foreground text-sm">{m.title}</div>
              <div className="flex items-center gap-3 mt-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${subjectColors[m.subject] || "bg-muted"}`}>{m.subject}</span>
                <span className="text-xs text-muted-foreground">{m.type} · {m.size} · {m.date}</span>
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button size="sm" variant="outline" disabled>
                    <Download className="w-4 h-4 mr-1.5" /> Download
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent><p>Download disabled in demo mode</p></TooltipContent>
            </Tooltip>
          </div>
        ))}
      </div>
    </PortalLayout>
  );
}

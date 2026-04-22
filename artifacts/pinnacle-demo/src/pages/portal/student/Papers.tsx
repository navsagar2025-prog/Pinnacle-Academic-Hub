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

const papers = [
  { title: "JEE Mains 2024 — January Attempt", type: "Previous Year", year: "2024", subject: "PCM", pages: "28 pages" },
  { title: "JEE Mains 2024 — April Attempt", type: "Previous Year", year: "2024", subject: "PCM", pages: "28 pages" },
  { title: "JEE Mains 2023 — January Attempt", type: "Previous Year", year: "2023", subject: "PCM", pages: "28 pages" },
  { title: "JEE Advanced 2024 — Paper 1", type: "Previous Year", year: "2024", subject: "PCM", pages: "32 pages" },
  { title: "JEE Advanced 2024 — Paper 2", type: "Previous Year", year: "2024", subject: "PCM", pages: "32 pages" },
  { title: "JEE Advanced 2023 — Paper 1", type: "Previous Year", year: "2023", subject: "PCM", pages: "32 pages" },
  { title: "Pinnacle Mock Test 01 — Full Syllabus", type: "Mock Test", year: "2026", subject: "PCM", pages: "30 pages" },
  { title: "Pinnacle Mock Test 02 — Physics + Chemistry", type: "Mock Test", year: "2026", subject: "PC", pages: "20 pages" },
  { title: "Chapter Test — Thermodynamics", type: "Chapter Test", year: "2026", subject: "Physics", pages: "8 pages" },
];

const types = ["All", "Previous Year", "Mock Test", "Chapter Test"];
const typeColors: Record<string, string> = {
  "Previous Year": "bg-primary/10 text-primary",
  "Mock Test": "bg-secondary/10 text-secondary",
  "Chapter Test": "bg-accent/10 text-accent-foreground",
};

export default function StudentPapers() {
  const [filter, setFilter] = useState("All");
  const filtered = filter === "All" ? papers : papers.filter((p) => p.type === filter);

  return (
    <PortalLayout role="student" navItems={navItems} userName="Arjun Mehta" userSub="JEE 2026 Batch">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-primary">Practice Papers</h1>
        <p className="text-muted-foreground text-sm mt-1">Previous year papers, mock tests, and chapter-wise tests.</p>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === t ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((p, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <PenLine className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-foreground text-sm">{p.title}</div>
              <div className="flex items-center flex-wrap gap-2 mt-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${typeColors[p.type] || "bg-muted"}`}>{p.type}</span>
                <span className="text-xs text-muted-foreground">{p.year} · {p.subject} · {p.pages}</span>
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

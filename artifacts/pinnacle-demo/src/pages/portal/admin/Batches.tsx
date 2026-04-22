import { useState } from "react";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { adminNavItems } from "./Dashboard";
import { Clock, Users, BookOpen, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const batches = [
  { code: "JEE26-EVE",  name: "JEE 2026 — Evening",     course: "JEE",       students: 32, capacity: 35, timing: "5:00–7:00 PM", days: "Mon–Sat", teacher: "Dr. Ramesh Kumar",  room: "A-101", status: "Active" },
  { code: "JEE26-MOR",  name: "JEE 2026 — Morning",     course: "JEE",       students: 28, capacity: 35, timing: "7:00–9:00 AM", days: "Mon–Sat", teacher: "Mr. Ajay Tiwari",  room: "A-102", status: "Active" },
  { code: "NEE26-DAY",  name: "NEET 2026 — Day",        course: "NEET",      students: 30, capacity: 35, timing: "10:00 AM–12 PM", days: "Mon–Sat", teacher: "Ms. Priya Sharma", room: "B-201", status: "Active" },
  { code: "NEE26-EVE",  name: "NEET 2026 — Evening",    course: "NEET",      students: 25, capacity: 35, timing: "3:00–5:00 PM", days: "Mon–Fri",  teacher: "Ms. Nidhi Verma",  room: "B-202", status: "Active" },
  { code: "C12-PCM",    name: "Class 12 — PCM",         course: "Boards",    students: 40, capacity: 40, timing: "5:30–7:30 PM", days: "Mon–Fri",  teacher: "Mr. Ajay Tiwari",  room: "C-301", status: "Full" },
  { code: "C12-PCB",    name: "Class 12 — PCB",         course: "Boards",    students: 36, capacity: 40, timing: "3:00–5:00 PM", days: "Mon–Fri",  teacher: "Ms. Priya Sharma", room: "C-302", status: "Active" },
  { code: "C12-COM",    name: "Class 12 — Commerce",    course: "Boards",    students: 22, capacity: 30, timing: "6:00–7:30 PM", days: "Mon–Fri",  teacher: "Ms. Kavita Joshi", room: "C-303", status: "Active" },
  { code: "FND-11",     name: "Class 11 — Foundation",  course: "Foundation",students: 35, capacity: 40, timing: "4:00–6:00 PM", days: "Mon–Fri",  teacher: "Mr. Ajay Tiwari",  room: "D-401", status: "Active" },
  { code: "FND-10",     name: "Class 10 — Board Prep",  course: "Foundation",students: 38, capacity: 40, timing: "2:00–4:00 PM", days: "Mon–Fri",  teacher: "Dr. Ramesh Kumar", room: "D-402", status: "Active" },
  { code: "FND-89",     name: "Class 8–9 — Foundation", course: "Foundation",students: 20, capacity: 30, timing: "9:00–11:00 AM", days: "Sat–Sun",  teacher: "Ms. Nidhi Verma",  room: "D-403", status: "Active" },
];

const COURSES = ["All", "JEE", "NEET", "Boards", "Foundation"];

function DemoBtn({ label }: { label: string }) {
  return (
    <button disabled title="Demo mode" className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold opacity-50 cursor-not-allowed">
      {label}
    </button>
  );
}

export default function AdminBatches() {
  const [filter, setFilter] = useState("All");
  const filtered = filter === "All" ? batches : batches.filter(b => b.course === filter);

  return (
    <PortalLayout role="admin" navItems={adminNavItems} userName="Admin — Pinnacle" userSub="Full Access">
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-serif font-bold text-primary">Batch Management</h1>
          <p className="text-muted-foreground text-sm mt-1">{batches.length} active batches · {batches.reduce((a, b) => a + b.students, 0)} total students</p>
        </div>
        <button disabled title="Demo mode" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold opacity-50 cursor-not-allowed flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Batch
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {COURSES.map((c) => (
          <button key={c} onClick={() => setFilter(c)}
            className={cn("px-4 py-1.5 rounded-full text-sm font-semibold border transition-all",
              filter === c ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary text-muted-foreground")}>
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((b, i) => {
          const fillPct = Math.round((b.students / b.capacity) * 100);
          return (
            <div key={i} className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-foreground">{b.name}</div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">{b.code}</div>
                </div>
                <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full",
                  b.status === "Full" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                )}>{b.status}</span>
              </div>

              <div className="flex flex-col gap-1.5 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>{b.timing} · {b.days}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                  <span>{b.teacher} · Room {b.room}</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" />{b.students}/{b.capacity} seats</span>
                  <span className={cn("font-semibold", fillPct >= 100 ? "text-destructive" : fillPct >= 80 ? "text-yellow-600" : "text-green-600")}>{fillPct}% full</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", fillPct >= 100 ? "bg-destructive" : fillPct >= 80 ? "bg-yellow-500" : "bg-secondary")}
                    style={{ width: `${fillPct}%` }} />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <DemoBtn label="Edit" />
                <DemoBtn label="Timetable" />
                <DemoBtn label="Students" />
              </div>
            </div>
          );
        })}
      </div>
    </PortalLayout>
  );
}

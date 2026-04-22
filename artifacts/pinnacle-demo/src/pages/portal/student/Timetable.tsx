import { PortalLayout } from "@/components/layout/PortalLayout";
import { LayoutDashboard, Video, PlayCircle, FileText, PenLine, Calendar, CreditCard } from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/portal/student", icon: LayoutDashboard },
  { label: "Live Classes", href: "/portal/student/classes", icon: Video },
  { label: "Recorded Classes", href: "/portal/student/recordings", icon: PlayCircle },
  { label: "Study Materials", href: "/portal/student/materials", icon: FileText },
  { label: "Practice Papers", href: "/portal/student/papers", icon: PenLine },
  { label: "Timetable", href: "/portal/student/timetable", icon: Calendar },
  { label: "Fee Status", href: "/portal/student/fees", icon: CreditCard },
];

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const schedule: Record<string, { time: string; subject: string; teacher: string; type: string }[]> = {
  Monday: [
    { time: "5:00–7:00 PM", subject: "Physics", teacher: "Dr. Ramesh Kumar", type: "Live" },
    { time: "7:00–8:00 PM", subject: "Self Study", teacher: "—", type: "Self" },
  ],
  Tuesday: [
    { time: "5:00–7:00 PM", subject: "Chemistry", teacher: "Ms. Priya Sharma", type: "Live" },
    { time: "7:00–8:00 PM", subject: "Self Study", teacher: "—", type: "Self" },
  ],
  Wednesday: [
    { time: "5:00–7:00 PM", subject: "Mathematics", teacher: "Mr. Ajay Tiwari", type: "Live" },
    { time: "7:00–8:00 PM", subject: "Self Study", teacher: "—", type: "Self" },
  ],
  Thursday: [
    { time: "5:00–7:00 PM", subject: "Physics", teacher: "Dr. Ramesh Kumar", type: "Live" },
  ],
  Friday: [
    { time: "5:00–7:00 PM", subject: "Chemistry", teacher: "Ms. Priya Sharma", type: "Live" },
  ],
  Saturday: [
    { time: "10:00 AM–12:00 PM", subject: "Mathematics", teacher: "Mr. Ajay Tiwari", type: "Live" },
    { time: "12:00–1:00 PM", subject: "Doubt Clearing", teacher: "All Faculty", type: "Doubt" },
    { time: "2:00–4:00 PM", subject: "Test / Revision", teacher: "—", type: "Test" },
  ],
};

const typeColors: Record<string, string> = {
  Live: "bg-primary text-primary-foreground",
  Self: "bg-muted text-muted-foreground",
  Doubt: "bg-secondary/10 text-secondary",
  Test: "bg-[#8B1A1A]/10 text-[#8B1A1A]",
};

export default function StudentTimetable() {
  return (
    <PortalLayout role="student" navItems={navItems} userName="Arjun Mehta" userSub="JEE 2026 Batch">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-primary">Weekly Timetable</h1>
        <p className="text-muted-foreground text-sm mt-1">JEE 2026 Evening Batch — April 2026</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {days.map((day) => (
          <div key={day} className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="bg-primary text-primary-foreground px-5 py-3">
              <div className="font-bold text-sm">{day}</div>
            </div>
            <div className="p-4 space-y-3">
              {(schedule[day] || []).length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">No classes</div>
              ) : (
                (schedule[day] || []).map((slot, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`text-xs font-bold px-2 py-1 rounded-md shrink-0 mt-0.5 ${typeColors[slot.type] || "bg-muted"}`}>{slot.type}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-foreground">{slot.subject}</div>
                      <div className="text-xs text-muted-foreground">{slot.time}</div>
                      {slot.teacher !== "—" && <div className="text-xs text-muted-foreground">{slot.teacher}</div>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </PortalLayout>
  );
}

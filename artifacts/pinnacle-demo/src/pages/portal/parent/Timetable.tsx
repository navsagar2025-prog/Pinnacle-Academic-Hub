import { PortalLayout } from "@/components/layout/PortalLayout";
import { LayoutDashboard, CreditCard, Calendar } from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/portal/parent", icon: LayoutDashboard },
  { label: "Fee & Payments", href: "/portal/parent/fees", icon: CreditCard },
  { label: "Child's Timetable", href: "/portal/parent/timetable", icon: Calendar },
];

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const schedule: Record<string, { time: string; subject: string; type: string }[]> = {
  Monday: [{ time: "5:00–7:00 PM", subject: "Physics", type: "Live" }],
  Tuesday: [{ time: "5:00–7:00 PM", subject: "Chemistry", type: "Live" }],
  Wednesday: [{ time: "5:00–7:00 PM", subject: "Mathematics", type: "Live" }],
  Thursday: [{ time: "5:00–7:00 PM", subject: "Physics", type: "Live" }],
  Friday: [{ time: "5:00–7:00 PM", subject: "Chemistry", type: "Live" }],
  Saturday: [
    { time: "10:00 AM–12:00 PM", subject: "Mathematics", type: "Live" },
    { time: "12:00–1:00 PM", subject: "Doubt Clearing", type: "Doubt" },
    { time: "2:00–4:00 PM", subject: "Test / Revision", type: "Test" },
  ],
};
const typeColors: Record<string, string> = {
  Live: "bg-primary text-primary-foreground",
  Doubt: "bg-secondary/10 text-secondary",
  Test: "bg-[#8B1A1A]/10 text-[#8B1A1A]",
};

export default function ParentTimetable() {
  return (
    <PortalLayout role="parent" navItems={navItems} userName="Mr. Rajesh Mehta" userSub="Parent — Arjun Mehta">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-primary">Child's Timetable</h1>
        <p className="text-muted-foreground text-sm mt-1">Arjun Mehta · JEE 2026 Evening Batch</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {days.map((day) => (
          <div key={day} className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="bg-secondary text-secondary-foreground px-5 py-3">
              <div className="font-bold text-sm">{day}</div>
            </div>
            <div className="p-4 space-y-3">
              {(schedule[day] || []).map((slot, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`text-xs font-bold px-2 py-1 rounded-md shrink-0 mt-0.5 ${typeColors[slot.type] || "bg-muted"}`}>{slot.type}</div>
                  <div>
                    <div className="font-semibold text-sm text-foreground">{slot.subject}</div>
                    <div className="text-xs text-muted-foreground">{slot.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </PortalLayout>
  );
}

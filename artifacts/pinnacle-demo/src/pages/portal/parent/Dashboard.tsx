import { PortalLayout } from "@/components/layout/PortalLayout";
import { LayoutDashboard, CreditCard, Calendar } from "lucide-react";
import { Link } from "wouter";

const navItems = [
  { label: "Dashboard", href: "/portal/parent", icon: LayoutDashboard },
  { label: "Fee & Payments", href: "/portal/parent/fees", icon: CreditCard },
  { label: "Child's Timetable", href: "/portal/parent/timetable", icon: Calendar },
];

const upcoming = [
  { subject: "Physics", date: "Today", time: "5:00–7:00 PM", teacher: "Dr. Ramesh Kumar" },
  { subject: "Chemistry", date: "Tomorrow", time: "5:00–7:00 PM", teacher: "Ms. Priya Sharma" },
  { subject: "Mathematics", date: "26 Apr", time: "5:00–7:00 PM", teacher: "Mr. Ajay Tiwari" },
];

const notices = [
  { date: "20 Apr", title: "Mock Test: JEE Mains Full Syllabus on May 1" },
  { date: "15 Apr", title: "Holiday: April 25 — Institute Closed" },
  { date: "12 Apr", title: "Parent-Teacher Meeting: April 30, 10am" },
];

export default function ParentDashboard() {
  return (
    <PortalLayout role="parent" navItems={navItems} userName="Mr. Rajesh Mehta" userSub="Parent — Arjun Mehta">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-primary">Welcome, Mr. Mehta</h1>
        <p className="text-muted-foreground text-sm mt-1">Monitoring: Arjun Mehta · JEE 2026 Batch · Roll No: JEE26-047</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Attendance", value: "88%" },
          { label: "Tests Given", value: "12" },
          { label: "Avg Score", value: "71%" },
          { label: "Fee Status", value: "Due" },
        ].map((stat, i) => (
          <div key={stat.label} className={`border rounded-xl p-4 text-center ${i === 3 ? "bg-orange-50 border-orange-200" : "bg-card border-border"}`}>
            <div className={`text-2xl font-bold ${i === 3 ? "text-orange-700" : "text-primary"}`}>{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="font-bold text-foreground mb-4">Upcoming Classes</h2>
          <div className="space-y-3">
            {upcoming.map((c, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4">
                <div className="font-semibold text-sm text-foreground">{c.subject}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{c.teacher} · {c.date} · {c.time}</div>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <Link href="/portal/parent/timetable" className="text-xs text-primary font-medium hover:underline">View full timetable →</Link>
          </div>
        </div>

        <div>
          <h2 className="font-bold text-foreground mb-4">Recent Notices</h2>
          <div className="space-y-3">
            {notices.map((n, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4">
                <div className="text-xs text-muted-foreground mb-1">{n.date}</div>
                <div className="text-sm font-medium text-foreground">{n.title}</div>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <Link href="/notices" className="text-xs text-primary font-medium hover:underline">View all notices →</Link>
          </div>

          <div className="mt-6 bg-orange-50 border border-orange-200 rounded-xl p-5">
            <h3 className="font-bold text-orange-700 mb-1 text-sm">Fee Due Alert</h3>
            <p className="text-sm text-orange-600">Installment 3 — ₹40,000 is due by <strong>May 5, 2026</strong>.</p>
            <Link href="/portal/parent/fees" className="text-xs text-orange-700 font-semibold underline mt-2 inline-block">View Fee Details →</Link>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}

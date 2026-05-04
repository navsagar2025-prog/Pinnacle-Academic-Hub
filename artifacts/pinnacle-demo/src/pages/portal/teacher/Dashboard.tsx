import { PortalLayout } from "@/components/layout/PortalLayout";
import { LayoutDashboard, CalendarPlus, Upload, BellRing, Users, Video, ScanLine, Sparkles } from "lucide-react";
import { Link } from "wouter";

export const teacherNavItems = [
  { label: "Dashboard",       href: "/portal/teacher",           icon: LayoutDashboard },
  { label: "Schedule Class",  href: "/portal/teacher/schedule",  icon: CalendarPlus },
  { label: "Upload Material", href: "/portal/teacher/materials", icon: Upload },
  { label: "Post Notice",     href: "/portal/teacher/notices",   icon: BellRing },
  { label: "Batches",         href: "/portal/teacher/batches",   icon: Users },
  { label: "Mock Tests",      href: "/portal/teacher/mock-tests", icon: Sparkles },
  { label: "Scan Document",   href: "/portal/scan",              icon: ScanLine },
];

const todaysClasses = [
  { time: "5:00–7:00 PM", batch: "JEE 2026 — Evening", subject: "Physics", topic: "Thermodynamics — First Law" },
];

const recentActivity = [
  { action: "Uploaded study material", detail: "Waves — Complete Notes", time: "Yesterday" },
  { action: "Scheduled class", detail: "JEE 2026 — Apr 23, Chemistry", time: "2 days ago" },
  { action: "Posted notice", detail: "Mock Test — May 1 Schedule", time: "4 days ago" },
];

export default function TeacherDashboard() {
  return (
    <PortalLayout role="teacher" navItems={teacherNavItems} userName="Dr. Ramesh Kumar" userSub="Physics Faculty">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-primary">Welcome, Dr. Kumar</h1>
        <p className="text-muted-foreground text-sm mt-1">Physics Faculty — JEE 2026 & Class 12 PCM Batches</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "My Batches", value: "3" },
          { label: "Students", value: "72" },
          { label: "Classes This Month", value: "18" },
          { label: "Materials Uploaded", value: "24" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-primary">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="font-bold text-foreground mb-4">Today's Classes</h2>
          {todaysClasses.map((c, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Video className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm text-foreground">{c.subject} — {c.topic}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{c.batch} · {c.time}</div>
              </div>
              <button
                disabled
                title="Demo mode — live class links will open Zoom in production"
                className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-semibold opacity-60 cursor-not-allowed"
              >
                Start Class
              </button>
            </div>
          ))}

          <div className="mt-6">
            <h2 className="font-bold text-foreground mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {teacherNavItems.slice(1).map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer">
                      <Icon className="w-5 h-5 text-primary shrink-0" />
                      <span className="text-sm font-medium text-foreground">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-bold text-foreground mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.map((a, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4">
                <div className="font-medium text-sm text-foreground">{a.action}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{a.detail} · {a.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}

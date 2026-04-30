import { PortalLayout } from "@/components/layout/PortalLayout";
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, IndianRupee,
  BellRing, Trophy, ClipboardList, Settings, TrendingUp, AlertCircle,
  CheckCircle2, Clock, ScanLine
} from "lucide-react";
import { Link } from "wouter";

export const adminNavItems = [
  { label: "Dashboard",    href: "/portal/admin",             icon: LayoutDashboard },
  { label: "Students",     href: "/portal/admin/students",    icon: GraduationCap },
  { label: "Teachers",     href: "/portal/admin/teachers",    icon: Users },
  { label: "Batches",      href: "/portal/admin/batches",     icon: BookOpen },
  { label: "Fee Manager",  href: "/portal/admin/fees",        icon: IndianRupee },
  { label: "Notices",      href: "/portal/admin/notices",     icon: BellRing },
  { label: "Results",      href: "/portal/admin/results",     icon: Trophy },
  { label: "Enquiries",    href: "/portal/admin/enquiries",   icon: ClipboardList },
  { label: "Scan Document",href: "/portal/scan",              icon: ScanLine },
  { label: "Settings",     href: "/portal/admin/settings",    icon: Settings },
];

const stats = [
  { label: "Total Students",        value: "512",       sub: "+18 this month",   icon: GraduationCap, color: "text-primary" },
  { label: "Active Teachers",       value: "12",        sub: "3 subjects each",  icon: Users,          color: "text-secondary" },
  { label: "Active Batches",        value: "24",        sub: "8 streams",        icon: BookOpen,       color: "text-accent" },
  { label: "Fee Collected (Apr)",   value: "₹18.4L",    sub: "82% of target",   icon: IndianRupee,   color: "text-primary" },
  { label: "Pending Fees",          value: "₹4.1L",     sub: "68 students",     icon: AlertCircle,   color: "text-destructive" },
  { label: "Enquiries This Week",   value: "27",        sub: "+12 vs last week", icon: ClipboardList, color: "text-secondary" },
];

const recentEnquiries = [
  { name: "Ananya Singh",   course: "JEE 2026",   phone: "98765-XXXXX", date: "Today, 10:12 AM",  status: "New" },
  { name: "Rohan Gupta",    course: "NEET 2026",  phone: "87654-XXXXX", date: "Today, 9:04 AM",   status: "New" },
  { name: "Priya Sharma",   course: "Class 12 PCM", phone: "76543-XXXXX", date: "Yesterday",       status: "Contacted" },
  { name: "Vaibhav Jain",   course: "Foundation", phone: "65432-XXXXX", date: "Yesterday",        status: "Enrolled" },
];

const upcomingClasses = [
  { time: "5:00 PM", batch: "JEE 2026 — Eve", subject: "Physics", teacher: "Dr. Ramesh Kumar" },
  { time: "5:30 PM", batch: "NEET 2026 — Day", subject: "Biology", teacher: "Ms. Priya Sharma" },
  { time: "6:00 PM", batch: "Cl-12 PCM — Eve", subject: "Maths",   teacher: "Mr. Ajay Tiwari" },
];

const pendingTasks = [
  { task: "Approve 4 new student registrations", urgent: true },
  { task: "Upload April fee receipts to portal", urgent: true },
  { task: "Schedule May mock tests for JEE batches", urgent: false },
  { task: "Update faculty profile — Ms. Nidhi Verma", urgent: false },
];

function DemoBtn({ label }: { label: string }) {
  return (
    <button
      disabled
      title="Demo mode — enabled in production"
      className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold opacity-50 cursor-not-allowed"
    >
      {label}
    </button>
  );
}

export default function AdminDashboard() {
  return (
    <PortalLayout role="admin" navItems={adminNavItems} userName="Admin — Pinnacle" userSub="Full Access">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-serif font-bold text-primary">Admin Control Panel</h1>
          <p className="text-muted-foreground text-sm mt-1">Pinnacle Academic Classes · Gaur City 2, Greater Noida</p>
        </div>
        <div className="flex gap-2">
          <DemoBtn label="+ Add Student" />
          <DemoBtn label="Post Notice" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4">
              <Icon className={`w-5 h-5 mb-2 ${s.color}`} />
              <div className="text-xl font-bold text-foreground">{s.value}</div>
              <div className="text-xs font-medium text-foreground mt-0.5">{s.label}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{s.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Recent Enquiries */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-foreground">Recent Enquiries</h2>
            <Link href="/portal/admin/enquiries" className="text-xs text-secondary font-medium hover:underline">View all →</Link>
          </div>
          <div className="space-y-3">
            {recentEnquiries.map((e, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                  {e.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-foreground">{e.name}</div>
                  <div className="text-xs text-muted-foreground">{e.course} · {e.date}</div>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  e.status === "New" ? "bg-yellow-100 text-yellow-700" :
                  e.status === "Contacted" ? "bg-blue-100 text-blue-700" :
                  "bg-green-100 text-green-700"
                }`}>{e.status}</span>
                <DemoBtn label="Respond" />
              </div>
            ))}
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-bold text-foreground mb-4">Pending Tasks</h2>
          <div className="space-y-3">
            {pendingTasks.map((t, i) => (
              <div key={i} className="flex items-start gap-2">
                {t.urgent
                  ? <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                  : <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />}
                <span className="text-sm text-foreground">{t.task}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Classes */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-foreground">Today's Live Classes</h2>
            <Link href="/portal/admin/batches" className="text-xs text-secondary font-medium hover:underline">Manage →</Link>
          </div>
          <div className="space-y-3">
            {upcomingClasses.map((c, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border">
                <div className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">{c.time}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">{c.subject} — {c.batch}</div>
                  <div className="text-xs text-muted-foreground">{c.teacher}</div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </div>
            ))}
          </div>
        </div>

        {/* Quick Access */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-bold text-foreground mb-4">Quick Access</h2>
          <div className="grid grid-cols-2 gap-3">
            {adminNavItems.slice(1).map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer bg-background">
                    <Icon className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Revenue Trend Placeholder */}
      <div className="mt-6 bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-secondary" />
          <h2 className="font-bold text-foreground">Monthly Fee Collection — FY 2025–26</h2>
        </div>
        <div className="flex items-end gap-2 h-24">
          {[60, 75, 82, 70, 90, 88, 95, 80, 85, 91, 78, 100].map((pct, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-primary/80"
                style={{ height: `${pct * 0.88}px` }}
              />
              <div className="text-[9px] text-muted-foreground">
                {["A","M","J","J","A","S","O","N","D","J","F","M"][i]}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">Live chart integration available in production</p>
      </div>
    </PortalLayout>
  );
}

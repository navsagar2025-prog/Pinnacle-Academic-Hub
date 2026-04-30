import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CheckCircle, Bell, CreditCard, Calendar, ChevronRight, AlertCircle } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Parent Dashboard" };

const CHILD_INFO = {
  name: "Rahul (Sample)",
  batch: "JEE 2026 — Evening",
  roll: "PAC-2026-047",
  enrolled: "July 2025",
};

const RECENT_NOTICES = [
  { title: "JEE Advanced Mock Test — 5 May 2026", date: "28 Apr", category: "Test" },
  { title: "Fee Payment Reminder — April Installment Due", date: "25 Apr", category: "Fee" },
  { title: "Parent-Teacher Meeting — 4 May 2026", date: "18 Apr", category: "Event" },
];

const PERFORMANCE = [
  { subject: "Physics", lastScore: 68, avgScore: 72 },
  { subject: "Chemistry", lastScore: 74, avgScore: 69 },
  { subject: "Mathematics", lastScore: 81, avgScore: 78 },
];

export default async function ParentDashboard() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const user = await currentUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">
          Welcome, {user?.firstName ?? "Parent"} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">Monitoring your child's progress at Pinnacle</p>
      </div>

      {/* Child info */}
      <div className="card bg-gradient-to-r from-[var(--color-navy)] to-[var(--color-teal)] text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
            {CHILD_INFO.name.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-lg font-[family-name:var(--font-playfair)]">{CHILD_INFO.name}</div>
            <div className="text-white/80 text-sm">{CHILD_INFO.batch}</div>
            <div className="text-white/60 text-xs mt-0.5">Roll: {CHILD_INFO.roll} · Enrolled: {CHILD_INFO.enrolled}</div>
          </div>
        </div>
      </div>

      {/* Fee alert */}
      <div className="card bg-[var(--color-maroon)]/5 border-[var(--color-maroon)]/20">
        <div className="flex items-start gap-3">
          <AlertCircle size={17} className="text-[var(--color-maroon)] flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-[var(--color-maroon)] text-sm">Fee Due — April 2026</div>
            <p className="text-slate-600 text-sm mt-1">₹4,000 is due by 30 April 2026. Please pay at the accounts office.</p>
          </div>
          <Link href="/portal/parent/fees" className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 bg-[var(--color-maroon)] text-white rounded-lg hover:bg-[var(--color-maroon-light)] transition-colors">
            View Fees
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Performance */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">Test Performance</h2>
            <span className="text-xs text-slate-400">Last test scores</span>
          </div>
          <div className="space-y-4">
            {PERFORMANCE.map((p) => (
              <div key={p.subject}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-slate-700">{p.subject}</span>
                  <span className="font-bold text-[var(--color-navy)]">{p.lastScore}% <span className="text-xs text-slate-400 font-normal">(avg: {p.avgScore}%)</span></span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${p.lastScore >= 75 ? "bg-[var(--color-teal)]" : p.lastScore >= 60 ? "bg-[var(--color-gold)]" : "bg-[var(--color-maroon)]"}`}
                    style={{ width: `${p.lastScore}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notices */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">Recent Notices</h2>
            <Link href="/portal/parent/notices" className="text-[var(--color-teal)] text-sm flex items-center gap-1 hover:underline">
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {RECENT_NOTICES.map((n, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-[var(--color-slate-light)] rounded-xl">
                <Bell size={14} className="text-[var(--color-teal)] flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-[var(--color-navy)]">{n.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{n.date} · {n.category}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: "View Timetable", href: "/portal/parent/timetable", icon: <Calendar size={18} />, color: "navy" },
          { label: "Fee History", href: "/portal/parent/fees", icon: <CreditCard size={18} />, color: "teal" },
          { label: "All Notices", href: "/portal/parent/notices", icon: <Bell size={18} />, color: "maroon" },
        ].map((l) => (
          <Link key={l.label} href={l.href} className="card flex items-center gap-3 hover:shadow-elevated transition-all group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${l.color === "navy" ? "bg-[var(--color-navy)]/10 text-[var(--color-navy)] group-hover:bg-[var(--color-navy)] group-hover:text-white" : l.color === "teal" ? "bg-[var(--color-teal)]/10 text-[var(--color-teal)] group-hover:bg-[var(--color-teal)] group-hover:text-white" : "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)] group-hover:bg-[var(--color-maroon)] group-hover:text-white"}`}>
              {l.icon}
            </div>
            <span className="text-sm font-semibold text-[var(--color-navy)]">{l.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

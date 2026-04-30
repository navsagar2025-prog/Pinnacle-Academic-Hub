import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Users, BookOpen, CreditCard, Bell, TrendingUp, ChevronRight, UserCheck } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Admin Dashboard" };

const RECENT_STUDENTS = [
  { name: "Rohan Verma", batch: "JEE 2026 — Evening", enrolled: "15 Apr 2026", status: "active" },
  { name: "Meera Singh", batch: "NEET 2026 — Morning", enrolled: "10 Apr 2026", status: "active" },
  { name: "Aryan Gupta", batch: "JEE 2026 — Morning", enrolled: "5 Apr 2026", status: "active" },
  { name: "Priya Kumari", batch: "Class 12 — Evening", enrolled: "1 Apr 2026", status: "pending" },
];

const STATS = [
  { label: "Total Students", value: "187", icon: <Users size={20} />, color: "navy", href: "/portal/admin/students" },
  { label: "Active Batches", value: "8", icon: <BookOpen size={20} />, color: "teal", href: "/portal/admin/batches" },
  { label: "Faculty Members", value: "6", icon: <UserCheck size={20} />, color: "maroon", href: "/portal/admin/teachers" },
  { label: "Fee Due (Apr)", value: "₹32k", icon: <CreditCard size={20} />, color: "gold", href: "/portal/admin/students" },
];

export default async function AdminDashboard() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const user = await currentUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">
          Admin Dashboard
        </h1>
        <p className="text-slate-500 text-sm mt-1">Welcome, {user?.firstName ?? "Admin"} · Pinnacle Academic Classes</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <Link key={s.label} href={s.href} className={`card flex flex-col gap-3 hover:shadow-elevated transition-all border-l-4 ${s.color === "navy" ? "border-l-[var(--color-navy)]" : s.color === "teal" ? "border-l-[var(--color-teal)]" : s.color === "maroon" ? "border-l-[var(--color-maroon)]" : "border-l-[var(--color-gold)]"}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color === "navy" ? "bg-[var(--color-navy)]/10 text-[var(--color-navy)]" : s.color === "teal" ? "bg-[var(--color-teal)]/10 text-[var(--color-teal)]" : s.color === "maroon" ? "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]" : "bg-[var(--color-gold)]/10 text-[var(--color-maroon)]"}`}>{s.icon}</div>
            <div>
              <div className="text-2xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">{s.value}</div>
              <div className="text-slate-500 text-xs">{s.label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">Recent Enrolments</h2>
            <Link href="/portal/admin/students" className="text-[var(--color-teal)] text-sm flex items-center gap-1 hover:underline">All Students <ChevronRight size={14} /></Link>
          </div>
          <div className="divide-y divide-slate-100">
            {RECENT_STUDENTS.map((s, i) => (
              <div key={i} className="flex items-center gap-3 py-3">
                <div className="w-9 h-9 bg-[var(--color-navy)]/10 rounded-full flex items-center justify-center text-[var(--color-navy)] font-bold text-sm flex-shrink-0">{s.name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-[var(--color-navy)] truncate">{s.name}</div>
                  <div className="text-xs text-slate-400">{s.batch} · {s.enrolled}</div>
                </div>
                <span className={`badge text-xs ${s.status === "active" ? "bg-[var(--color-teal)]/10 text-[var(--color-teal)]" : "bg-[var(--color-gold)]/15 text-[var(--color-navy)]"}`}>{s.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Add Student", href: "/portal/admin/students", color: "navy", icon: <Users size={16} /> },
              { label: "Add Teacher", href: "/portal/admin/teachers", color: "maroon", icon: <UserCheck size={16} /> },
              { label: "Create Batch", href: "/portal/admin/batches", color: "teal", icon: <BookOpen size={16} /> },
              { label: "Post Notice", href: "/portal/teacher/notices", color: "gold", icon: <Bell size={16} /> },
            ].map((a) => (
              <Link key={a.label} href={a.href} className={`flex items-center gap-2 p-3 rounded-xl text-sm font-semibold transition-all hover:shadow-md ${a.color === "navy" ? "bg-[var(--color-navy)]/5 text-[var(--color-navy)] hover:bg-[var(--color-navy)] hover:text-white" : a.color === "teal" ? "bg-[var(--color-teal)]/5 text-[var(--color-teal)] hover:bg-[var(--color-teal)] hover:text-white" : a.color === "maroon" ? "bg-[var(--color-maroon)]/5 text-[var(--color-maroon)] hover:bg-[var(--color-maroon)] hover:text-white" : "bg-[var(--color-gold)]/10 text-[var(--color-navy)] hover:bg-[var(--color-gold)] hover:text-[var(--color-navy)]"}`}>
                {a.icon}{a.label}
              </Link>
            ))}
          </div>

          <div className="mt-4 p-4 bg-[var(--color-slate-light)] rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} className="text-[var(--color-teal)]" />
              <span className="text-xs font-semibold text-[var(--color-navy)]">This Month</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-lg font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">12</div>
                <div className="text-xs text-slate-500">New students</div>
              </div>
              <div>
                <div className="text-lg font-bold text-[var(--color-teal)] font-[family-name:var(--font-playfair)]">₹1.8L</div>
                <div className="text-xs text-slate-500">Fees collected</div>
              </div>
              <div>
                <div className="text-lg font-bold text-[var(--color-maroon)] font-[family-name:var(--font-playfair)]">₹32k</div>
                <div className="text-xs text-slate-500">Outstanding</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

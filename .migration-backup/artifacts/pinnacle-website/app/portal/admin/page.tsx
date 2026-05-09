import { db } from "@workspace/db";
import { students, batches, teachers, feeRecords, enquiries, notices } from "@workspace/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { Users, BookOpen, CreditCard, UserCheck, MessageSquare, ChevronRight, TrendingUp, BarChart2, Info } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Admin Dashboard" };

export default async function AdminDashboard() {
  const [
    [{ studentCount }],
    [{ batchCount }],
    [{ teacherCount }],
    [{ enquiryCount }],
    recentEnquiries,
    recentNotices,
  ] = await Promise.all([
    db.select({ studentCount: sql<number>`count(*)::int` }).from(students).where(eq(students.isActive, true)),
    db.select({ batchCount: sql<number>`count(*)::int` }).from(batches).where(eq(batches.status, "active")),
    db.select({ teacherCount: sql<number>`count(*)::int` }).from(teachers).where(eq(teachers.isActive, true)),
    db.select({ enquiryCount: sql<number>`count(*)::int` }).from(enquiries).where(eq(enquiries.isFollowedUp, false)),
    db.select().from(enquiries).orderBy(desc(enquiries.createdAt)).limit(5),
    db.select({ title: notices.title, category: notices.category, publishedAt: notices.publishedAt }).from(notices).orderBy(desc(notices.publishedAt)).limit(5),
  ]);

  const stats = [
    { label: "Total Students", value: studentCount, icon: Users, color: "navy", href: "/portal/admin/students" },
    { label: "Active Batches", value: batchCount, icon: BookOpen, color: "teal", href: "/portal/admin/batches" },
    { label: "Faculty Members", value: teacherCount, icon: UserCheck, color: "maroon", href: "/portal/admin/teachers" },
    { label: "Pending Enquiries", value: enquiryCount, icon: MessageSquare, color: "gold", href: "/portal/admin/enquiries" },
  ];

  const colorMap: Record<string, string> = {
    navy: "border-l-[var(--color-navy)] bg-[var(--color-navy)]/10 text-[var(--color-navy)]",
    teal: "border-l-[var(--color-teal)] bg-[var(--color-teal)]/10 text-[var(--color-teal)]",
    maroon: "border-l-[var(--color-maroon)] bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]",
    gold: "border-l-[var(--color-gold)] bg-[var(--color-gold)]/10 text-[var(--color-maroon)]",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Admin Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Pinnacle Academic Classes · Live overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          const [border, bg, txt] = colorMap[s.color].split(" ");
          return (
            <Link key={s.label} href={s.href} className={`card flex flex-col gap-3 hover:shadow-elevated transition-all border-l-4 ${border}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg} ${txt}`}>
                <Icon size={20} />
              </div>
              <div>
                <div className="text-2xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">{s.value}</div>
                <div className="text-slate-500 text-xs">{s.label}</div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="card bg-gradient-to-r from-[var(--color-navy)]/5 to-[var(--color-teal)]/5 border border-[var(--color-navy)]/10">
        <div className="flex items-center gap-2 mb-3">
          <BarChart2 size={16} className="text-[var(--color-navy)]" />
          <h2 className="font-semibold text-[var(--color-navy)] text-sm">Analytics Dashboards</h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Enrollment Funnel", desc: "Enquiry volume & conversion", href: "/portal/admin/analytics/enrollment", icon: TrendingUp, color: "navy" },
            { label: "Fee Collection", desc: "Collections & overdue dues", href: "/portal/admin/analytics/fees", icon: CreditCard, color: "teal" },
            { label: "Content Engagement", desc: "Downloads, views & notices", href: "/portal/admin/analytics/content", icon: BarChart2, color: "maroon" },
          ].map((a) => {
            const Icon = a.icon;
            const cls = { navy: "text-[var(--color-navy)] bg-[var(--color-navy)]/10", teal: "text-[var(--color-teal)] bg-[var(--color-teal)]/10", maroon: "text-[var(--color-maroon)] bg-[var(--color-maroon)]/10" }[a.color];
            return (
              <Link key={a.href} href={a.href} className="flex items-start gap-2.5 p-3 bg-white rounded-xl hover:shadow-md transition-all group">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cls}`}>
                  <Icon size={15} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[var(--color-navy)]">{a.label}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{a.desc}</div>
                </div>
                <ChevronRight size={13} className="ml-auto text-slate-300 group-hover:text-[var(--color-teal)] transition-colors mt-1 shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex gap-3">
        <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <span className="font-semibold">How to promote a user&apos;s role</span>
          <ol className="mt-1 ml-4 list-decimal space-y-1 text-blue-700">
            <li>Open the <strong>Clerk Dashboard</strong> → <em>Users</em> and find the user.</li>
            <li>Click on the user, then go to <em>Metadata</em> → <em>Public</em>.</li>
            <li>
              Set <code className="bg-blue-100 px-1 rounded text-xs font-mono">publicMetadata.role</code> to one of:{" "}
              <code className="bg-blue-100 px-1 rounded text-xs font-mono">student</code>,{" "}
              <code className="bg-blue-100 px-1 rounded text-xs font-mono">teacher</code>,{" "}
              <code className="bg-blue-100 px-1 rounded text-xs font-mono">admin</code>, or{" "}
              <code className="bg-blue-100 px-1 rounded text-xs font-mono">parent</code>.
            </li>
            <li>Save. The next time that user signs in, their role will sync automatically.</li>
          </ol>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[var(--color-navy)]">Recent Enquiries</h2>
            <Link href="/portal/admin/enquiries" className="text-xs text-[var(--color-teal)] hover:underline flex items-center gap-1">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {recentEnquiries.length === 0 ? (
              <p className="text-slate-400 text-sm">No enquiries yet.</p>
            ) : (
              recentEnquiries.map((e) => (
                <div key={e.id} className="flex items-start justify-between gap-2 py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-slate-800">{e.name}</div>
                    <div className="text-xs text-slate-400">{e.courseInterest ?? "General"} · {e.phone}</div>
                  </div>
                  <span className={`badge-${e.isFollowedUp ? "teal" : "gold"} shrink-0`}>
                    {e.isFollowedUp ? "Followed Up" : "New"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[var(--color-navy)]">Recent Notices</h2>
            <Link href="/notices" className="text-xs text-[var(--color-teal)] hover:underline flex items-center gap-1">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {recentNotices.map((n, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
                <div className={`badge-${n.category === "Fee" ? "gold" : n.category === "Test" ? "maroon" : "teal"} shrink-0`}>
                  <span className="text-[var(--color-maroon)]">{n.category}</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-800">{n.title}</div>
                  <div className="text-xs text-slate-400">{new Date(n.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

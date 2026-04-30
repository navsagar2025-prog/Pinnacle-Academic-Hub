import { db } from "@workspace/db";
import { enquiries, students } from "@workspace/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { TrendingUp, Users, UserCheck, BarChart2 } from "lucide-react";
import BarChartClient from "@/components/charts/BarChartClient";
import DonutChartClient from "@/components/charts/DonutChartClient";
import MarkFollowedUpButton from "./MarkFollowedUpButton";

export const metadata = { title: "Enrollment Funnel — Admin Analytics" };

const COURSE_COLORS = [
  "#0A1F5C", "#0D7377", "#8B1A1A", "#C9A84C",
  "#4f46e5", "#059669", "#dc2626", "#d97706",
];

export default async function EnrollmentFunnelPage() {
  const [
    allEnquiries,
    weeklyRows,
    courseRows,
    [{ studentCount }],
    [{ followedUp }],
    [{ totalEnq }],
  ] = await Promise.all([
    db.select().from(enquiries).orderBy(desc(enquiries.createdAt)).limit(50),
    db.execute(sql`
      SELECT
        to_char(date_trunc('week', created_at), 'Mon DD') AS week,
        count(*)::int AS total
      FROM enquiries
      WHERE created_at >= now() - interval '8 weeks'
      GROUP BY date_trunc('week', created_at)
      ORDER BY date_trunc('week', created_at)
    `),
    db.execute(sql`
      SELECT course_interest, count(*)::int AS total
      FROM enquiries
      WHERE course_interest IS NOT NULL
      GROUP BY course_interest
      ORDER BY total DESC
    `),
    db.select({ studentCount: sql<number>`count(*)::int` }).from(students).where(eq(students.isActive, true)),
    db.select({ followedUp: sql<number>`count(*)::int` }).from(enquiries).where(eq(enquiries.isFollowedUp, true)),
    db.select({ totalEnq: sql<number>`count(*)::int` }).from(enquiries),
  ]);

  const weeklyData = (weeklyRows.rows as { week: string; total: number }[]).map((r) => ({
    week: r.week,
    Enquiries: r.total,
  }));

  const courseData = (courseRows.rows as { course_interest: string; total: number }[]).map((r, i) => ({
    name: r.course_interest,
    value: r.total,
    color: COURSE_COLORS[i % COURSE_COLORS.length],
  }));

  const followedUpPct = totalEnq > 0 ? Math.round((followedUp / totalEnq) * 100) : 0;
  const conversionPct = totalEnq > 0 ? Math.round((studentCount / totalEnq) * 100) : 0;

  const statCards = [
    { label: "Total Enquiries", value: totalEnq, icon: BarChart2, color: "navy" },
    { label: "Followed Up", value: `${followedUpPct}%`, icon: UserCheck, color: "teal" },
    { label: "Active Students", value: studentCount, icon: Users, color: "maroon" },
    { label: "Conversion Rate", value: `${conversionPct}%`, icon: TrendingUp, color: "gold" },
  ];

  const colorBorder: Record<string, string> = {
    navy: "border-l-[var(--color-navy)]",
    teal: "border-l-[var(--color-teal)]",
    maroon: "border-l-[var(--color-maroon)]",
    gold: "border-l-[var(--color-gold)]",
  };
  const colorIcon: Record<string, string> = {
    navy: "bg-[var(--color-navy)]/10 text-[var(--color-navy)]",
    teal: "bg-[var(--color-teal)]/10 text-[var(--color-teal)]",
    maroon: "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]",
    gold: "bg-[var(--color-gold)]/10 text-[var(--color-navy)]",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">
          Enrollment Funnel
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Enquiry volume, course interests, and conversion to enrolled students
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`card flex flex-col gap-3 border-l-4 ${colorBorder[s.color]}`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorIcon[s.color]}`}>
                <Icon size={17} />
              </div>
              <div>
                <div className="text-2xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">
                  {s.value}
                </div>
                <div className="text-slate-500 text-xs">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 card">
          <h2 className="font-semibold text-[var(--color-navy)] mb-4 font-[family-name:var(--font-playfair)]">
            Weekly Enquiry Volume — Last 8 Weeks
          </h2>
          {weeklyData.length === 0 ? (
            <p className="text-slate-400 text-sm py-8 text-center">No data yet for the last 8 weeks.</p>
          ) : (
            <BarChartClient
              data={weeklyData}
              bars={[{ key: "Enquiries", label: "Enquiries", color: "#0A1F5C" }]}
              xKey="week"
              height={240}
            />
          )}
        </div>

        <div className="lg:col-span-2 card">
          <h2 className="font-semibold text-[var(--color-navy)] mb-1 font-[family-name:var(--font-playfair)]">
            Course Interest Breakdown
          </h2>
          {courseData.length === 0 ? (
            <p className="text-slate-400 text-sm py-8 text-center">No course data yet.</p>
          ) : (
            <DonutChartClient data={courseData} height={220} />
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">
            Recent Enquiries
          </h2>
          <span className="text-xs text-slate-400">Showing latest 50</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Phone</th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Course</th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {allEnquiries.map((e) => (
                <tr key={e.id} className="hover:bg-[var(--color-slate-light)]/50 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-[var(--color-navy)]">{e.name}</td>
                  <td className="py-2.5 px-3 text-slate-500">{e.phone}</td>
                  <td className="py-2.5 px-3">
                    <span className="badge text-xs bg-[var(--color-navy)]/8 text-[var(--color-navy)]">
                      {e.courseInterest ?? "General"}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 text-xs whitespace-nowrap">
                    {new Date(e.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="py-2.5 px-3">
                    <MarkFollowedUpButton id={e.id} current={e.isFollowedUp ?? false} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

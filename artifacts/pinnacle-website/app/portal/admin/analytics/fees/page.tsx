import { db } from "@workspace/db";
import { feeRecords, students, batches, users } from "@workspace/db/schema";
import { eq, sql, desc, and } from "drizzle-orm";
import { CreditCard, AlertCircle, TrendingUp, CheckCircle } from "lucide-react";
import BarChartClient from "@/components/charts/BarChartClient";
import LineChartClient from "@/components/charts/LineChartClient";

export const metadata = { title: "Fee Collection — Admin Analytics" };

export default async function FeeCollectionPage() {
  const [
    summaryRows,
    batchFeeRows,
    monthlyRows,
    overdueRows,
  ] = await Promise.all([
    db.execute(sql`
      SELECT
        coalesce(sum(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0)::int AS collected,
        coalesce(sum(CASE WHEN status IN ('due','overdue') THEN amount ELSE 0 END), 0)::int AS outstanding,
        count(CASE WHEN status IN ('due','overdue') THEN 1 END)::int AS overdue_count,
        count(*)::int AS total_records
      FROM fee_records
    `),
    db.execute(sql`
      SELECT
        b.name AS batch_name,
        coalesce(sum(CASE WHEN fr.status = 'paid' THEN fr.amount ELSE 0 END), 0)::int AS collected,
        coalesce(sum(CASE WHEN fr.status IN ('due','overdue') THEN fr.amount ELSE 0 END), 0)::int AS outstanding
      FROM batches b
      LEFT JOIN students s ON s.batch_id = b.id AND s.is_active = true
      LEFT JOIN fee_records fr ON fr.student_id = s.id
      WHERE b.status = 'active'
      GROUP BY b.id, b.name
      ORDER BY (collected + outstanding) DESC
      LIMIT 8
    `),
    db.execute(sql`
      SELECT
        to_char(date_trunc('month', paid_date), 'Mon YY') AS month,
        coalesce(sum(amount), 0)::int AS collected
      FROM fee_records
      WHERE status = 'paid' AND paid_date >= now() - interval '6 months'
      GROUP BY date_trunc('month', paid_date)
      ORDER BY date_trunc('month', paid_date)
    `),
    db.execute(sql`
      SELECT
        u.name AS student_name,
        b.name AS batch_name,
        fr.amount,
        fr.period,
        fr.due_date
      FROM fee_records fr
      JOIN students s ON fr.student_id = s.id
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN batches b ON s.batch_id = b.id
      WHERE fr.status IN ('due', 'overdue')
      ORDER BY fr.due_date ASC
      LIMIT 20
    `),
  ]);

  const summary = (summaryRows.rows as { collected: number; outstanding: number; overdue_count: number; total_records: number }[])[0] ?? { collected: 0, outstanding: 0, overdue_count: 0, total_records: 0 };
  const totalBilled = summary.collected + summary.outstanding;
  const collectionRate = totalBilled > 0 ? Math.round((summary.collected / totalBilled) * 100) : 0;

  const batchData = (batchFeeRows.rows as { batch_name: string; collected: number; outstanding: number }[]).map((r) => ({
    batch: r.batch_name.length > 16 ? r.batch_name.slice(0, 14) + "…" : r.batch_name,
    Collected: Math.round(r.collected / 1000),
    Outstanding: Math.round(r.outstanding / 1000),
  }));

  const monthlyData = (monthlyRows.rows as { month: string; collected: number }[]).map((r) => ({
    month: r.month,
    Collected: Math.round(r.collected / 1000),
  }));

  const overdueStudents = overdueRows.rows as { student_name: string | null; batch_name: string | null; amount: number; period: string; due_date: string }[];

  const statCards = [
    { label: "Total Collected", value: `₹${(summary.collected / 1000).toFixed(1)}K`, icon: CheckCircle, color: "teal" },
    { label: "Outstanding", value: `₹${(summary.outstanding / 1000).toFixed(1)}K`, icon: AlertCircle, color: "gold" },
    { label: "Overdue Records", value: summary.overdue_count, icon: CreditCard, color: "maroon" },
    { label: "Collection Rate", value: `${collectionRate}%`, icon: TrendingUp, color: "navy" },
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
          Fee Collection
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Collection rates, outstanding dues, and monthly trends by batch
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
            Collected vs Outstanding by Batch (₹K)
          </h2>
          {batchData.length === 0 ? (
            <p className="text-slate-400 text-sm py-8 text-center">No fee data available yet.</p>
          ) : (
            <BarChartClient
              data={batchData}
              bars={[
                { key: "Collected", label: "Collected", color: "#0D7377" },
                { key: "Outstanding", label: "Outstanding", color: "#C9A84C" },
              ]}
              xKey="batch"
              height={250}
              unit="₹"
            />
          )}
        </div>

        <div className="lg:col-span-2 card">
          <h2 className="font-semibold text-[var(--color-navy)] mb-4 font-[family-name:var(--font-playfair)]">
            Monthly Collection Trend (₹K)
          </h2>
          {monthlyData.length === 0 ? (
            <p className="text-slate-400 text-sm py-8 text-center">No paid records in the last 6 months.</p>
          ) : (
            <LineChartClient
              data={monthlyData}
              lines={[{ key: "Collected", label: "Collected", color: "#0D7377" }]}
              xKey="month"
              height={220}
            />
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">
            Overdue & Pending Fee Records
          </h2>
          <span className="badge text-xs bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]">
            {summary.overdue_count} records
          </span>
        </div>
        {overdueStudents.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle size={32} className="mx-auto mb-2 text-[var(--color-teal)]" />
            <p className="text-slate-400 text-sm">No overdue fees — all collections are up to date!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Student</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Batch</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Period</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {overdueStudents.map((r, i) => {
                  const daysOverdue = Math.max(0, Math.floor((Date.now() - new Date(r.due_date).getTime()) / 86400000));
                  return (
                    <tr key={i} className="hover:bg-[var(--color-slate-light)]/50 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-[var(--color-navy)]">{r.student_name ?? "Unnamed"}</td>
                      <td className="py-2.5 px-3 text-slate-500 text-xs">{r.batch_name ?? "—"}</td>
                      <td className="py-2.5 px-3 text-slate-500 text-xs">{r.period}</td>
                      <td className="py-2.5 px-3 font-semibold text-[var(--color-maroon)]">₹{r.amount.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-xs">
                        <div className="text-slate-400">{new Date(r.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
                        {daysOverdue > 0 && (
                          <div className="text-[var(--color-maroon)] font-semibold">{daysOverdue}d overdue</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

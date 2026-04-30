import { db } from "@workspace/db";
import { feeRecords, students, users } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import { CreditCard } from "lucide-react";
import { RecordPaymentButton } from "./RecordPaymentModal";

export const metadata = { title: "Fee Management — Admin Panel" };

export default async function AdminFeesPage() {
  const rows = await db
    .select({
      id: feeRecords.id,
      period: feeRecords.period,
      amount: feeRecords.amount,
      paidAmount: feeRecords.paidAmount,
      dueDate: feeRecords.dueDate,
      paidDate: feeRecords.paidDate,
      status: feeRecords.status,
      transactionRef: feeRecords.transactionRef,
      notes: feeRecords.notes,
      rollNumber: students.rollNumber,
      studentName: users.name,
      studentPhone: users.phone,
    })
    .from(feeRecords)
    .leftJoin(students, eq(feeRecords.studentId, students.id))
    .leftJoin(users, eq(students.userId, users.id))
    .orderBy(feeRecords.dueDate);

  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(feeRecords);
  const [{ paid }] = await db.select({ paid: sql<number>`count(*)::int` }).from(feeRecords).where(eq(feeRecords.status, "paid"));
  const [{ partial }] = await db.select({ partial: sql<number>`count(*)::int` }).from(feeRecords).where(eq(feeRecords.status, "partial"));
  const [{ overdue }] = await db.select({ overdue: sql<number>`count(*)::int` }).from(feeRecords).where(eq(feeRecords.status, "overdue"));

  const statusBadge: Record<string, string> = {
    paid: "bg-[var(--color-teal)]/10 text-[var(--color-teal)]",
    partial: "bg-blue-100 text-blue-700",
    due: "bg-[var(--color-gold)]/15 text-[var(--color-navy)]",
    overdue: "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]",
    waived: "bg-slate-100 text-slate-500",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Fee Management</h1>
        <p className="text-slate-500 text-sm mt-1">{total} records · Full fee ledger with partial payment support</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Records", value: total, color: "border-l-[var(--color-navy)]" },
          { label: "Paid in Full", value: paid, color: "border-l-[var(--color-teal)]" },
          { label: "Partial Payment", value: partial, color: "border-l-blue-400" },
          { label: "Overdue", value: overdue, color: "border-l-[var(--color-maroon)]" },
        ].map((s) => (
          <div key={s.label} className={`card border-l-4 ${s.color}`}>
            <div className="text-2xl font-bold font-[family-name:var(--font-playfair)] text-[var(--color-navy)]">{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          <CreditCard size={32} className="mx-auto mb-3 opacity-30" />
          <p>No fee records yet. Records appear when students are enrolled and fees are assigned.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--color-slate-light)] border-b border-slate-100">
                <tr>
                  {["Student", "Period", "Total Due", "Paid", "Balance", "Due Date", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((r) => {
                  const paid = r.paidAmount ?? 0;
                  const balance = r.amount - paid;
                  return (
                    <tr key={r.id} className="hover:bg-[var(--color-slate-light)]/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-sm text-[var(--color-navy)]">{r.studentName ?? "—"}</div>
                        <div className="text-xs text-slate-400 font-mono">{r.rollNumber ?? ""}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{r.period}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-700 whitespace-nowrap">
                        ₹{r.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-[var(--color-teal)] whitespace-nowrap">
                        ₹{paid.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold whitespace-nowrap" style={{ color: balance > 0 ? "var(--color-maroon)" : "var(--color-teal)" }}>
                        {balance > 0 ? `₹${balance.toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(r.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${statusBadge[r.status] ?? "bg-slate-100 text-slate-500"}`}>{r.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <RecordPaymentButton
                          feeId={r.id}
                          amount={r.amount}
                          paidAmount={paid}
                          studentName={r.studentName}
                          period={r.period}
                          status={r.status}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

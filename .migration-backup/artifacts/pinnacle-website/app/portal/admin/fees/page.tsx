import { db } from "@workspace/db";
import { feeRecords, students, users, batches, courses } from "@workspace/db/schema";
import { eq, sql, and, isNotNull } from "drizzle-orm";
import { CreditCard, UserPlus } from "lucide-react";
import { RecordPaymentButton } from "./RecordPaymentModal";
import { SetupFeePlanButton } from "./SetupFeePlanModal";

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
      feePlan: students.feePlan,
    })
    .from(feeRecords)
    .leftJoin(students, eq(feeRecords.studentId, students.id))
    .leftJoin(users, eq(students.userId, users.id))
    .orderBy(feeRecords.dueDate);

  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(feeRecords);
  const [{ paid }] = await db.select({ paid: sql<number>`count(*)::int` }).from(feeRecords).where(eq(feeRecords.status, "paid"));
  const [{ partial }] = await db.select({ partial: sql<number>`count(*)::int` }).from(feeRecords).where(eq(feeRecords.status, "partial"));
  const [{ overdue }] = await db.select({ overdue: sql<number>`count(*)::int` }).from(feeRecords).where(eq(feeRecords.status, "overdue"));

  // Find active students enrolled in a batch but with NO fee records yet
  const studentsWithRecords = await db
    .selectDistinct({ studentId: feeRecords.studentId })
    .from(feeRecords);
  const idsWithRecords = new Set(studentsWithRecords.map((r) => r.studentId).filter(Boolean) as string[]);

  const allEnrolled = await db
    .select({
      id: students.id,
      rollNumber: students.rollNumber,
      name: users.name,
      courseTitle: courses.title,
      annualFee: courses.annualFee,
      admissionFee: courses.admissionFee,
    })
    .from(students)
    .leftJoin(users, eq(students.userId, users.id))
    .leftJoin(batches, eq(students.batchId, batches.id))
    .leftJoin(courses, eq(batches.courseId, courses.id))
    .where(and(eq(students.isActive, true), isNotNull(students.batchId)));

  const studentsWithoutSchedule = allEnrolled
    .filter((s) => !idsWithRecords.has(s.id))
    .map((s) => ({
      id: s.id,
      name: s.name ?? "—",
      rollNumber: s.rollNumber,
      courseTitle: s.courseTitle,
      annualFee: s.annualFee,
      admissionFee: s.admissionFee,
    }));

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
        <p className="text-slate-500 text-sm mt-1">{total} records · Annual & Monthly EMI plans · Partial payment support</p>
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

      {studentsWithoutSchedule.length > 0 && (
        <div className="card border-l-4 border-l-[var(--color-gold)]">
          <div className="flex items-center gap-2 mb-3">
            <UserPlus size={18} className="text-[var(--color-gold)]" />
            <h2 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">
              {studentsWithoutSchedule.length} student{studentsWithoutSchedule.length === 1 ? "" : "s"} need a fee plan
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--color-slate-light)] border-b border-slate-100">
                <tr>
                  {["Student", "Roll No.", "Course", "Annual Fee", "Setup"].map((h) => (
                    <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {studentsWithoutSchedule.map((s) => (
                  <tr key={s.id} className="hover:bg-[var(--color-slate-light)]/50">
                    <td className="px-3 py-2.5 text-sm font-semibold text-[var(--color-navy)]">{s.name}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-400 font-mono">{s.rollNumber}</td>
                    <td className="px-3 py-2.5 text-sm text-slate-600">{s.courseTitle ?? "—"}</td>
                    <td className="px-3 py-2.5 text-sm font-semibold text-slate-700 whitespace-nowrap">
                      {s.annualFee ? `₹${s.annualFee.toLocaleString("en-IN")}` : "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <SetupFeePlanButton student={s} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          <CreditCard size={32} className="mx-auto mb-3 opacity-30" />
          <p>No fee records yet. Use &quot;Setup Plan&quot; above to generate fee schedules for enrolled students.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--color-slate-light)] border-b border-slate-100">
                <tr>
                  {["Student", "Plan", "Period", "Total Due", "Paid", "Balance", "Due Date", "Status", "Actions"].map((h) => (
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
                      <td className="px-4 py-3">
                        <span className={`badge text-[10px] uppercase tracking-wide ${
                          r.feePlan === "monthly" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                        }`}>
                          {r.feePlan === "monthly" ? "EMI" : "Annual"}
                        </span>
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

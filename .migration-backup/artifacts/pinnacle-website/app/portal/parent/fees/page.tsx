import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { parents, students, feeRecords, batches, courses } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";

export const metadata = { title: "Fee Status — Parent Portal" };

export default async function ParentFeesPage() {
  const dbUser = await requirePortalRole("parent");

  const [parentRecord] = await db
    .select({ studentId: parents.studentId })
    .from(parents)
    .where(eq(parents.userId, dbUser.id))
    .limit(1);

  const studentInfo = parentRecord?.studentId
    ? await db
        .select({ id: students.id, batchId: students.batchId, rollNumber: students.rollNumber })
        .from(students)
        .where(and(eq(students.id, parentRecord.studentId), eq(students.isActive, true)))
        .limit(1)
        .then((r) => r[0] ?? null)
    : null;

  const batchInfo = studentInfo?.batchId
    ? await db
        .select({ batchName: batches.name, courseName: courses.title, annualFee: courses.annualFee })
        .from(batches)
        .leftJoin(courses, eq(batches.courseId, courses.id))
        .where(eq(batches.id, studentInfo.batchId))
        .limit(1)
        .then((r) => r[0] ?? null)
    : null;

  const records = studentInfo?.id
    ? await db
        .select({ id: feeRecords.id, period: feeRecords.period, amount: feeRecords.amount, dueDate: feeRecords.dueDate, paidDate: feeRecords.paidDate, status: feeRecords.status, transactionRef: feeRecords.transactionRef })
        .from(feeRecords)
        .where(eq(feeRecords.studentId, studentInfo.id))
        .orderBy(desc(feeRecords.dueDate))
    : [];

  const totalPaid = records.filter((r) => r.status === "paid" || r.status === "waived").reduce((s, r) => s + r.amount, 0);
  const totalDue = records.filter((r) => r.status === "due" || r.status === "overdue").reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Fee Status</h1>
        <p className="text-slate-500 text-sm mt-1">
          {batchInfo ? `${batchInfo.courseName} · ${batchInfo.batchName}` : "Not linked to a student account"}
        </p>
      </div>

      {!parentRecord && (
        <div className="card bg-amber-50 border border-amber-100 flex items-start gap-3">
          <AlertCircle size={17} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-amber-800 text-sm">Your account is not yet linked to a student. Contact the admissions office with your child's roll number.</p>
        </div>
      )}

      {studentInfo && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card border-l-4 border-l-[var(--color-teal)]">
              <div className="text-slate-500 text-xs mb-1">Total Paid</div>
              <div className="text-2xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">₹{totalPaid.toLocaleString("en-IN")}</div>
            </div>
            <div className="card border-l-4 border-l-[var(--color-maroon)]">
              <div className="text-slate-500 text-xs mb-1">Amount Due</div>
              <div className={`text-2xl font-bold font-[family-name:var(--font-playfair)] ${totalDue > 0 ? "text-[var(--color-maroon)]" : "text-[var(--color-teal)]"}`}>
                {totalDue > 0 ? `₹${totalDue.toLocaleString("en-IN")}` : "₹0"}
              </div>
            </div>
            <div className="card border-l-4 border-l-[var(--color-gold)]">
              <div className="text-slate-500 text-xs mb-1">Annual Fee</div>
              <div className="text-2xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">
                {batchInfo?.annualFee ? `₹${batchInfo.annualFee.toLocaleString("en-IN")}` : "—"}
              </div>
            </div>
          </div>

          {totalDue > 0 && (
            <div className="card bg-[var(--color-maroon)]/5 border-[var(--color-maroon)]/20">
              <div className="flex items-start gap-3">
                <AlertCircle size={17} className="text-[var(--color-maroon)] flex-shrink-0 mt-0.5" />
                <p className="text-slate-600 text-sm">₹{totalDue.toLocaleString("en-IN")} outstanding. Pay at accounts office or NEFT: SBI A/c 12345678901 | IFSC: SBIN0001234 | Ref: {studentInfo.rollNumber}</p>
              </div>
            </div>
          )}

          {records.length === 0 ? (
            <div className="card text-center py-10">
              <CheckCircle size={32} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No fee records available yet.</p>
            </div>
          ) : (
            <div className="card">
              <h2 className="font-bold text-[var(--color-navy)] mb-4 font-[family-name:var(--font-playfair)]">Payment History</h2>
              <div className="divide-y divide-slate-100">
                {records.map((r) => (
                  <div key={r.id} className="flex flex-col sm:flex-row sm:items-center gap-2 py-3">
                    <div className="flex-shrink-0">
                      {r.status === "paid" || r.status === "waived" ? <CheckCircle size={16} className="text-[var(--color-teal)]" /> : r.status === "overdue" ? <AlertCircle size={16} className="text-[var(--color-maroon)]" /> : <Clock size={16} className="text-[var(--color-gold)]" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-[var(--color-navy)]">{r.period}</div>
                      <div className="text-xs text-slate-400">Due: {new Date(r.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}{r.paidDate && ` · Paid: ${new Date(r.paidDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[var(--color-navy)]">₹{r.amount.toLocaleString("en-IN")}</span>
                      <span className={`badge text-xs ${r.status === "paid" ? "bg-[var(--color-teal)]/10 text-[var(--color-teal)]" : r.status === "overdue" ? "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]" : r.status === "waived" ? "bg-slate-100 text-slate-500" : "bg-[var(--color-gold)]/10 text-[var(--color-navy)]"}`}>
                        {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

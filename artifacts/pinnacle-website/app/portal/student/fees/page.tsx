import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { students, feeRecords, batches, courses } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";

export const metadata = { title: "Fee Status — Student Portal" };

export default async function FeesPage() {
  const dbUser = await requirePortalRole("student");

  const [enrollment] = await db
    .select({ studentId: students.id, batchId: students.batchId })
    .from(students)
    .where(and(eq(students.userId, dbUser.id), eq(students.isActive, true)))
    .limit(1);

  const batchInfo = enrollment?.batchId
    ? await db
        .select({ batchName: batches.name, courseName: courses.title, annualFee: courses.annualFee })
        .from(batches)
        .leftJoin(courses, eq(batches.courseId, courses.id))
        .where(eq(batches.id, enrollment.batchId))
        .limit(1)
        .then((r) => r[0] ?? null)
    : null;

  const records = enrollment?.studentId
    ? await db
        .select({ id: feeRecords.id, period: feeRecords.period, amount: feeRecords.amount, dueDate: feeRecords.dueDate, paidDate: feeRecords.paidDate, status: feeRecords.status, transactionRef: feeRecords.transactionRef })
        .from(feeRecords)
        .where(eq(feeRecords.studentId, enrollment.studentId))
        .orderBy(desc(feeRecords.dueDate))
    : [];

  const totalPaid = records.filter((r) => r.status === "paid" || r.status === "waived").reduce((s, r) => s + r.amount, 0);
  const totalDue = records.filter((r) => r.status === "due" || r.status === "overdue").reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Fee Status</h1>
        <p className="text-slate-500 text-sm mt-1">
          {batchInfo ? `${batchInfo.courseName} · ${batchInfo.batchName}` : "Not enrolled in a batch"}
        </p>
      </div>

      {!enrollment && (
        <div className="card bg-amber-50 border border-amber-100 flex items-start gap-3">
          <AlertCircle size={17} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-amber-800 text-sm">Your enrollment is pending. Fee records will appear here once you are registered.</p>
        </div>
      )}

      {enrollment && (
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
                <div>
                  <div className="font-semibold text-[var(--color-maroon)] text-sm">Payment Due</div>
                  <p className="text-slate-600 text-sm mt-1">₹{totalDue.toLocaleString("en-IN")} is due. Visit the accounts office or NEFT to: SBI A/c 12345678901 | IFSC: SBIN0001234</p>
                </div>
              </div>
            </div>
          )}

          {records.length === 0 ? (
            <div className="card text-center py-10">
              <CheckCircle size={32} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No fee records found. Contact the accounts office if you believe this is an error.</p>
            </div>
          ) : (
            <div className="card">
              <h2 className="font-bold text-[var(--color-navy)] mb-4 font-[family-name:var(--font-playfair)]">Payment History</h2>
              <div className="divide-y divide-slate-100">
                {records.map((r) => (
                  <div key={r.id} className="flex flex-col sm:flex-row sm:items-center gap-2 py-3">
                    <div className="flex-shrink-0">
                      {r.status === "paid" || r.status === "waived" ? (
                        <CheckCircle size={16} className="text-[var(--color-teal)]" />
                      ) : r.status === "overdue" ? (
                        <AlertCircle size={16} className="text-[var(--color-maroon)]" />
                      ) : (
                        <Clock size={16} className="text-[var(--color-gold)]" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-[var(--color-navy)]">{r.period}</div>
                      <div className="text-xs text-slate-400">
                        Due: {new Date(r.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        {r.paidDate && ` · Paid: ${new Date(r.paidDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
                        {r.transactionRef && ` · Ref: ${r.transactionRef}`}
                      </div>
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

      <div className="card bg-[var(--color-slate-light)] border-slate-200">
        <p className="text-xs text-slate-500 text-center">
          For receipts or queries, contact accounts: <strong>accounts@pinnacleacademic.in</strong> · +91 9999 000 111
        </p>
      </div>
    </div>
  );
}

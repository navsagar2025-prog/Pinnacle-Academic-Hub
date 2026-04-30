import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";

export const metadata = { title: "Fee Status" };

const FEE_RECORDS = [
  { id: 1, period: "April 2026", amount: 4000, dueDate: "2026-04-30", paidDate: null, status: "due" },
  { id: 2, period: "March 2026", amount: 4000, dueDate: "2026-03-31", paidDate: "2026-03-28", status: "paid" },
  { id: 3, period: "February 2026", amount: 4000, dueDate: "2026-02-28", paidDate: "2026-02-25", status: "paid" },
  { id: 4, period: "January 2026", amount: 4000, dueDate: "2026-01-31", paidDate: "2026-01-30", status: "paid" },
  { id: 5, period: "December 2025", amount: 4000, dueDate: "2025-12-31", paidDate: "2025-12-29", status: "paid" },
  { id: 6, period: "Admission Fee (One-time)", amount: 2000, dueDate: "2025-07-01", paidDate: "2025-07-01", status: "paid" },
];

export default async function FeesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const totalPaid = FEE_RECORDS.filter((r) => r.status === "paid").reduce((s, r) => s + r.amount, 0);
  const totalDue = FEE_RECORDS.filter((r) => r.status === "due").reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">
          Fee Status
        </h1>
        <p className="text-slate-500 text-sm mt-1">JEE 2026 — Evening Batch</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card border-l-4 border-l-[var(--color-teal)]">
          <div className="text-slate-500 text-xs mb-1">Total Paid (2025–26)</div>
          <div className="text-2xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">
            ₹{totalPaid.toLocaleString("en-IN")}
          </div>
        </div>
        <div className="card border-l-4 border-l-[var(--color-maroon)]">
          <div className="text-slate-500 text-xs mb-1">Amount Due</div>
          <div className={`text-2xl font-bold font-[family-name:var(--font-playfair)] ${totalDue > 0 ? "text-[var(--color-maroon)]" : "text-[var(--color-teal)]"}`}>
            {totalDue > 0 ? `₹${totalDue.toLocaleString("en-IN")}` : "₹0"}
          </div>
        </div>
        <div className="card border-l-4 border-l-[var(--color-gold)]">
          <div className="text-slate-500 text-xs mb-1">Programme</div>
          <div className="text-lg font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">
            JEE 2026 — Eve
          </div>
          <div className="text-xs text-slate-400">₹48,000/year</div>
        </div>
      </div>

      {totalDue > 0 && (
        <div className="card bg-[var(--color-maroon)]/5 border-[var(--color-maroon)]/20">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-[var(--color-maroon)] flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-[var(--color-maroon)] text-sm">Payment Due</div>
              <p className="text-slate-600 text-sm mt-1">
                ₹{totalDue.toLocaleString("en-IN")} is due. Please visit the accounts office or
                pay via bank transfer. Contact: <strong>+91 98765 43210</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Records */}
      <div className="card">
        <h2 className="font-bold text-[var(--color-navy)] mb-4 font-[family-name:var(--font-playfair)]">
          Payment History
        </h2>
        <div className="divide-y divide-slate-100">
          {FEE_RECORDS.map((r) => (
            <div key={r.id} className="flex flex-col sm:flex-row sm:items-center gap-2 py-3">
              <div className="flex-shrink-0">
                {r.status === "paid" ? (
                  <CheckCircle size={16} className="text-[var(--color-teal)]" />
                ) : (
                  <Clock size={16} className="text-[var(--color-maroon)]" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm text-[var(--color-navy)]">{r.period}</div>
                <div className="text-xs text-slate-400">
                  Due: {new Date(r.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  {r.paidDate && ` · Paid: ${new Date(r.paidDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-[var(--color-navy)]">
                  ₹{r.amount.toLocaleString("en-IN")}
                </span>
                <span
                  className={`badge text-xs ${
                    r.status === "paid"
                      ? "bg-[var(--color-teal)]/10 text-[var(--color-teal)]"
                      : "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]"
                  }`}
                >
                  {r.status === "paid" ? "Paid" : "Due"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card bg-[var(--color-slate-light)] border-slate-200">
        <p className="text-xs text-slate-500 text-center">
          For fee receipts or payment queries, contact the accounts office: <strong>accounts@pinnacleacademic.in</strong> · +91 98765 43210
        </p>
      </div>
    </div>
  );
}

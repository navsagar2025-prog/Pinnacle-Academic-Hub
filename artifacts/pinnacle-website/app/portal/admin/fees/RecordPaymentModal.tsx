"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, CreditCard } from "lucide-react";

type Props = {
  feeId: string;
  amount: number;
  paidAmount: number;
  studentName: string | null;
  period: string;
  status: string;
};

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

export function RecordPaymentButton({ feeId, amount, paidAmount, studentName, period, status }: Props) {
  const [open, setOpen] = useState(false);
  if (status === "paid" || status === "waived") return null;
  return (
    <>
      <button
        className="text-xs font-semibold text-[var(--color-teal)] hover:underline flex items-center gap-1"
        onClick={() => setOpen(true)}
      >
        <CreditCard size={12} /> Record Payment
      </button>
      {open && (
        <RecordPaymentModal
          feeId={feeId}
          amount={amount}
          paidAmount={paidAmount}
          studentName={studentName}
          period={period}
          status={status}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function RecordPaymentModal({ feeId, amount, paidAmount, studentName, period, onClose }: Props & { onClose: () => void }) {
  const router = useRouter();
  const balance = amount - paidAmount;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(balance.toString());
  const [transactionRef, setTransactionRef] = useState("");
  const [notes, setNotes] = useState("");
  const [waive, setWaive] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const body = waive
      ? { waive: true, notes }
      : { paymentAmount: Number(paymentAmount), transactionRef, notes };
    const res = await fetch(`${BASE}/api/v1/fees/${feeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Failed"); return; }
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-[family-name:var(--font-playfair)] font-bold text-[var(--color-navy)] text-lg">Record Payment</h2>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="bg-[var(--color-slate-light)] rounded-xl p-4 space-y-2">
            <div className="font-semibold text-[var(--color-navy)]">{studentName ?? "Student"}</div>
            <div className="text-sm text-slate-600">{period}</div>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="text-center">
                <div className="text-xs text-slate-400">Total Due</div>
                <div className="font-bold text-[var(--color-navy)]">₹{amount.toLocaleString("en-IN")}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-400">Paid So Far</div>
                <div className="font-bold text-[var(--color-teal)]">₹{paidAmount.toLocaleString("en-IN")}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-400">Balance</div>
                <div className="font-bold text-[var(--color-maroon)]">₹{balance.toLocaleString("en-IN")}</div>
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={waive} onChange={(e) => setWaive(e.target.checked)} className="rounded" />
            <span className="text-sm text-slate-600">Waive remaining balance (₹{balance.toLocaleString("en-IN")})</span>
          </label>

          {!waive && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Amount (₹) *</label>
                <input
                  type="number"
                  min="1"
                  max={balance}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]"
                  required
                />
                <p className="text-xs text-slate-400 mt-1">Enter partial or full amount. Max: ₹{balance.toLocaleString("en-IN")}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Transaction Reference</label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="UPI ref / Cheque no. / Cash"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-outline py-2.5 text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary py-2.5 text-sm">
              {loading ? "Saving…" : waive ? "Waive Balance" : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

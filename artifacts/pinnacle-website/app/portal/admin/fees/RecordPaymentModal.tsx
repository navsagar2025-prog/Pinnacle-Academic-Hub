"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, CheckCircle } from "lucide-react";

type Props = { feeId: string; amount: number; studentName: string | null; period: string };

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

export function RecordPaymentButton({ feeId, amount, studentName, period }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="text-xs font-semibold text-[var(--color-teal)] hover:underline flex items-center gap-1" onClick={() => setOpen(true)}>
        <CheckCircle size={12} /> Mark Paid
      </button>
      {open && <RecordPaymentModal feeId={feeId} amount={amount} studentName={studentName} period={period} onClose={() => setOpen(false)} />}
    </>
  );
}

function RecordPaymentModal({ feeId, amount, studentName, period, onClose }: Props & { onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [transactionRef, setTransactionRef] = useState("");
  const [notes, setNotes] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch(`${BASE}/api/v1/fees/${feeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paid", transactionRef, notes }),
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
          <div className="bg-[var(--color-slate-light)] rounded-xl p-4 text-sm">
            <div className="font-semibold text-[var(--color-navy)]">{studentName ?? "Student"}</div>
            <div className="text-slate-500">{period} · <span className="font-semibold text-[var(--color-teal)]">₹{amount.toLocaleString("en-IN")}</span></div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Transaction Reference</label>
            <input type="text" value={transactionRef} onChange={(e) => setTransactionRef(e.target.value)} placeholder="UPI/Cheque/Cash ref" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-outline py-2.5 text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary py-2.5 text-sm">{loading ? "Saving…" : "Confirm Payment"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

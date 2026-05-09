"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, CalendarRange, Wallet } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type Student = {
  id: string;
  name: string;
  rollNumber: string;
  courseTitle: string | null;
  annualFee: number | null;
  admissionFee: number | null;
};

export function SetupFeePlanButton({ student }: { student: Student }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-semibold text-[var(--color-teal)] hover:underline flex items-center gap-1"
      >
        <CalendarRange size={12} /> Setup Plan
      </button>
      {open && <SetupFeePlanModal student={student} onClose={() => setOpen(false)} />}
    </>
  );
}

function SetupFeePlanModal({ student, onClose }: { student: Student; onClose: () => void }) {
  const router = useRouter();
  const [plan, setPlan] = useState<"annual" | "monthly">("annual");
  const now = new Date();
  const [startMonth, setStartMonth] = useState(now.getMonth());
  const [startYear, setStartYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const annualFee = student.annualFee ?? 0;
  const admissionFee = student.admissionFee ?? 0;
  const monthlyAmount = Math.ceil(annualFee / 12);
  const totalAnnual = annualFee + admissionFee;
  const totalMonthly = monthlyAmount * 12 + admissionFee;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch(`${BASE}/api/v1/fees/generate-schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: student.id, plan, startMonth, startYear }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to generate schedule");
      return;
    }
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="font-[family-name:var(--font-playfair)] font-bold text-[var(--color-navy)] text-lg">Setup Fee Plan</h2>
            <p className="text-xs text-slate-500 mt-0.5">{student.name} · {student.rollNumber}</p>
          </div>
          <button onClick={onClose} aria-label="Close"><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-5">
          {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          {!annualFee && (
            <p className="text-amber-700 text-sm bg-amber-50 rounded-lg px-3 py-2">
              This student is not enrolled in a batch with a fee. Assign a batch first.
            </p>
          )}

          <div className="bg-[var(--color-slate-light)] rounded-xl p-4">
            <div className="text-xs text-slate-500 mb-1">Course</div>
            <div className="font-semibold text-[var(--color-navy)]">{student.courseTitle ?? "—"}</div>
            <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
              <div>
                <div className="text-xs text-slate-500">Annual Fee</div>
                <div className="font-semibold">₹{annualFee.toLocaleString("en-IN")}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Admission Fee</div>
                <div className="font-semibold">₹{admissionFee.toLocaleString("en-IN")}</div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--color-navy)] mb-2">Payment Plan</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPlan("annual")}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  plan === "annual"
                    ? "border-[var(--color-teal)] bg-[var(--color-teal)]/5"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <Wallet size={18} className={plan === "annual" ? "text-[var(--color-teal)]" : "text-slate-400"} />
                <div className="font-semibold text-sm mt-2 text-[var(--color-navy)]">Annual (Lump-sum)</div>
                <div className="text-xs text-slate-500 mt-1">1 record · Pay once</div>
                <div className="text-sm font-bold mt-2 text-[var(--color-navy)]">₹{totalAnnual.toLocaleString("en-IN")}</div>
              </button>
              <button
                type="button"
                onClick={() => setPlan("monthly")}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  plan === "monthly"
                    ? "border-[var(--color-teal)] bg-[var(--color-teal)]/5"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <CalendarRange size={18} className={plan === "monthly" ? "text-[var(--color-teal)]" : "text-slate-400"} />
                <div className="font-semibold text-sm mt-2 text-[var(--color-navy)]">Monthly EMI</div>
                <div className="text-xs text-slate-500 mt-1">12 records · Easy EMI</div>
                <div className="text-sm font-bold mt-2 text-[var(--color-navy)]">₹{monthlyAmount.toLocaleString("en-IN")}/mo</div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Start Month</label>
              <select
                value={startMonth}
                onChange={(e) => setStartMonth(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
              >
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Start Year</label>
              <select
                value={startYear}
                onChange={(e) => setStartYear(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
              >
                {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) =>
                  <option key={y} value={y}>{y}</option>
                )}
              </select>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-800">
            {plan === "annual" ? (
              <>One fee record of <b>₹{totalAnnual.toLocaleString("en-IN")}</b> due {MONTHS[startMonth]} 30, {startYear}.</>
            ) : (
              <>12 monthly records of <b>₹{monthlyAmount.toLocaleString("en-IN")}</b> each (first month includes admission fee), due on the 5th of each month starting {MONTHS[startMonth]} {startYear}. Total: <b>₹{totalMonthly.toLocaleString("en-IN")}</b>.</>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !annualFee}
              className="px-4 py-2 rounded-lg bg-[var(--color-teal)] text-white text-sm font-semibold hover:bg-[var(--color-teal-light)] disabled:opacity-50"
            >
              {loading ? "Generating…" : "Generate Schedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

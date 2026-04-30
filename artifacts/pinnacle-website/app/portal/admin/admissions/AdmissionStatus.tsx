"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

const STATUS_OPTIONS = [
  { value: "new", label: "New", color: "bg-slate-100 text-slate-600" },
  { value: "contacted", label: "Contacted", color: "bg-blue-100 text-blue-700" },
  { value: "interested", label: "Interested", color: "bg-[var(--color-gold)]/15 text-[var(--color-navy)]" },
  { value: "converted", label: "Converted", color: "bg-[var(--color-teal)]/10 text-[var(--color-teal)]" },
  { value: "declined", label: "Declined", color: "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]" },
];

export function AdmissionStatusDropdown({ enquiryId, current }: { enquiryId: string; current: string }) {
  const router = useRouter();
  const [value, setValue] = useState(current);
  const [loading, setLoading] = useState(false);

  async function handleChange(newVal: string) {
    setValue(newVal);
    setLoading(true);
    await fetch(`${BASE}/api/v1/enquiries/${enquiryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admissionStatus: newVal }),
    });
    setLoading(false);
    router.refresh();
  }

  const opt = STATUS_OPTIONS.find((o) => o.value === value);

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        disabled={loading}
        className={`badge text-xs cursor-pointer border-0 pr-6 appearance-none focus:outline-none ${opt?.color ?? "bg-slate-100 text-slate-600"}`}
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {loading && <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">…</span>}
    </div>
  );
}

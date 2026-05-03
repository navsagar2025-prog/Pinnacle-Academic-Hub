"use client";
import { useRouter, useSearchParams } from "next/navigation";

export function QuestionBankFilters({ subjects, years }: { subjects: string[]; years: number[] }) {
  const router = useRouter();
  const sp = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value); else params.delete(key);
    router.push(`?${params.toString()}`);
  }

  const cls = "px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white";

  return (
    <div className="card flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Subject</label>
        <select className={cls} value={sp.get("subject") ?? "All"} onChange={(e) => update("subject", e.target.value === "All" ? "" : e.target.value)}>
          <option>All</option>
          {subjects.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Difficulty</label>
        <select className={cls} value={sp.get("difficulty") ?? ""} onChange={(e) => update("difficulty", e.target.value)}>
          <option value="">Any</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>
      <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Type</label>
        <select className={cls} value={sp.get("type") ?? ""} onChange={(e) => update("type", e.target.value)}>
          <option value="">Any</option>
          <option value="mcq">MCQ</option>
          <option value="short">Short Answer</option>
          <option value="long">Long Answer</option>
          <option value="numerical">Numerical</option>
        </select>
      </div>
      <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Year</label>
        <select className={cls} value={sp.get("year") ?? ""} onChange={(e) => update("year", e.target.value)}>
          <option value="">Any</option>
          {years.map((y) => <option key={y}>{y}</option>)}
        </select>
      </div>
      <div className="flex-1 min-w-[160px]">
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Search</label>
        <input className={cls + " w-full"} placeholder="Topic or question text…" defaultValue={sp.get("q") ?? ""}
          onKeyDown={(e) => { if (e.key === "Enter") update("q", (e.target as HTMLInputElement).value); }} />
      </div>
    </div>
  );
}

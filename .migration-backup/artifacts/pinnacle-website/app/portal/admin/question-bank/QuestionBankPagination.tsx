"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export function QuestionBankPagination({ page, totalPages }: { page: number; totalPages: number }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [jump, setJump] = useState("");

  function go(p: number) {
    const next = Math.min(totalPages, Math.max(1, p));
    const params = new URLSearchParams(sp.toString());
    if (next === 1) params.delete("page"); else params.set("page", String(next));
    router.push(`?${params.toString()}`);
  }

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap pt-2">
      <div className="flex items-center gap-1">
        <button
          onClick={() => go(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <ChevronLeft size={14} /> Previous
        </button>
        <button
          onClick={() => go(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); const n = Number(jump); if (n) go(n); setJump(""); }}
        className="flex items-center gap-2 text-xs text-slate-500"
      >
        <label>
          Jump to page
          <input
            type="number"
            min={1}
            max={totalPages}
            value={jump}
            onChange={(e) => setJump(e.target.value)}
            placeholder={String(page)}
            className="ml-2 w-20 px-2 py-1 rounded-lg border border-slate-200 text-xs"
          />
        </label>
        <button type="submit" className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700">Go</button>
      </form>
    </div>
  );
}

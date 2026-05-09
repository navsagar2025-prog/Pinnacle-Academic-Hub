"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, X, Loader2, CheckCircle2 } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

async function postReview(action: "approve" | "reject", body: Record<string, unknown>) {
  const res = await fetch(`${BASE}/api/v1/question-bank/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...body }),
  });
  return res.json().catch(() => ({ error: "Network error" }));
}

function RowActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"" | "approve" | "reject">("");
  const [done, setDone] = useState<"approved" | "rejected" | "">("");

  async function handle(action: "approve" | "reject") {
    setBusy(action);
    const json = await postReview(action, { ids: [id] });
    setBusy("");
    if (json?.success) {
      setDone(action === "approve" ? "approved" : "rejected");
      setTimeout(() => router.refresh(), 600);
    } else {
      alert(json?.error ?? "Action failed");
    }
  }

  if (done) {
    return (
      <span className={`text-xs font-semibold inline-flex items-center gap-1 ${done === "approved" ? "text-green-700" : "text-rose-700"}`}>
        <CheckCircle2 size={14} /> {done === "approved" ? "Approved" : "Rejected"}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handle("reject")}
        disabled={!!busy}
        className="text-xs px-3 py-1.5 rounded border border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold flex items-center gap-1 disabled:opacity-50"
      >
        {busy === "reject" ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />} Reject
      </button>
      <button
        onClick={() => handle("approve")}
        disabled={!!busy}
        className="text-xs px-3 py-1.5 rounded bg-green-600 text-white hover:bg-green-700 font-semibold flex items-center gap-1 disabled:opacity-50"
      >
        {busy === "approve" ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Approve & publish
      </button>
    </div>
  );
}

function SubjectFilter({ subjects, value }: { subjects: string[]; value: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  return (
    <select
      className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
      value={value}
      onChange={(e) => {
        const params = new URLSearchParams(sp.toString());
        const v = e.target.value;
        if (!v || v === "All") params.delete("subject"); else params.set("subject", v);
        params.delete("page");
        router.push(`?${params.toString()}`);
      }}
    >
      <option>All</option>
      {subjects.map((s) => <option key={s}>{s}</option>)}
    </select>
  );
}

function DifficultyFilter({ value }: { value: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  return (
    <select
      className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
      value={value}
      onChange={(e) => {
        const params = new URLSearchParams(sp.toString());
        const v = e.target.value;
        if (!v) params.delete("difficulty"); else params.set("difficulty", v);
        params.delete("page");
        router.push(`?${params.toString()}`);
      }}
    >
      <option value="">Any</option>
      <option value="easy">Easy</option>
      <option value="medium">Medium</option>
      <option value="hard">Hard</option>
    </select>
  );
}

function BulkApproveBar({ subjects, currentSubject }: { subjects: string[]; currentSubject: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState<{ approved: number } | null>(null);

  async function bulkApprove() {
    const subject = currentSubject !== "All" ? currentSubject : null;
    const difficulty = sp.get("difficulty") || null;
    const label = `Approve ALL pending AI questions${subject ? ` in ${subject}` : ""}${difficulty ? ` (${difficulty})` : ""}? This publishes them immediately.`;
    if (!window.confirm(label)) return;
    const json = await postReview("approve", { bulk: true, subject, difficulty });
    if (json?.success) {
      setDone({ approved: json.affected ?? 0 });
      startTransition(() => router.refresh());
    } else {
      alert(json?.error ?? "Bulk approve failed");
    }
  }

  if (done) {
    return (
      <span className="text-xs font-semibold text-green-700 inline-flex items-center gap-1">
        <CheckCircle2 size={14} /> Approved {done.approved} question(s).
      </span>
    );
  }

  return (
    <button
      onClick={bulkApprove}
      disabled={pending || subjects.length === 0}
      className="text-xs px-3 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-1 disabled:opacity-50"
      title="Approve every pending AI question matching the current subject + difficulty filter"
    >
      <Check size={12} /> Bulk approve filtered set
    </button>
  );
}

export const ReviewActions = {
  RowActions,
  SubjectFilter,
  DifficultyFilter,
  BulkApproveBar,
};

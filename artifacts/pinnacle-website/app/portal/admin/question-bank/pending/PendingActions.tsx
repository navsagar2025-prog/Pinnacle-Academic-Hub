"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

export function PendingActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"approve" | "decline" | null>(null);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function approve() {
    if (!confirm("Approve this deletion? The question will move to the recycle bin (recoverable for 7 days).")) return;
    setBusy("approve"); setError(null);
    try {
      const res = await fetch(`${BASE}/api/v1/question-bank/${id}?ackNoTeacherRequest=1`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data?.error ?? "Approve failed");
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally { setBusy(null); }
  }

  async function decline() {
    const reason = window.prompt(
      "Decline this request? The teacher's flag will be cleared and the question stays in the bank.\n\nOptional: a short reason for the audit log.",
      "",
    );
    if (reason === null) return;
    setBusy("decline"); setError(null);
    try {
      const res = await fetch(`${BASE}/api/v1/question-bank/${id}/deletion-request`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data?.error ?? "Decline failed");
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally { setBusy(null); }
  }

  return (
    <div className="flex flex-col gap-1.5 shrink-0">
      <button
        type="button"
        onClick={approve}
        disabled={busy !== null}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--color-maroon)] text-white hover:opacity-90 inline-flex items-center gap-1.5 disabled:opacity-50"
      >
        {busy === "approve" ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
        Approve
      </button>
      <button
        type="button"
        onClick={decline}
        disabled={busy !== null}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 inline-flex items-center gap-1.5 disabled:opacity-50"
      >
        {busy === "decline" ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
        Decline
      </button>
      {error && <span className="text-[10px] text-rose-600">{error}</span>}
    </div>
  );
}

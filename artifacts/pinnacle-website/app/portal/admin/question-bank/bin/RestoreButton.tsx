"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Loader2 } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

export function RestoreButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function restore() {
    setBusy(true); setError(null);
    try {
      const res = await fetch(`${BASE}/api/v1/question-bank/${id}/restore`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data?.error ?? "Restore failed");
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally { setBusy(false); }
  }

  return (
    <div className="flex flex-col items-end gap-1 shrink-0">
      <button
        type="button"
        onClick={restore}
        disabled={busy}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--color-teal)] text-white hover:opacity-90 inline-flex items-center gap-1.5 disabled:opacity-50"
      >
        {busy ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
        Restore
      </button>
      {error && <span className="text-[10px] text-rose-600">{error}</span>}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { apiUrl } from "@/lib/utils";

export default function MarkFollowedUpButton({ id, current }: { id: string; current: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState(current);
  const [error, setError] = useState<string | null>(null);

  if (optimistic && !error) {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-[var(--color-teal)]">
        <CheckCircle size={12} /> Done
      </span>
    );
  }

  if (error) {
    return (
      <button
        onClick={() => setError(null)}
        className="flex items-center gap-1 text-xs font-semibold text-[var(--color-maroon)] hover:underline"
        title={error}
      >
        <AlertCircle size={12} /> Failed — click to retry
      </button>
    );
  }

  return (
    <button
      disabled={pending}
      onClick={() => {
        setError(null);
        setOptimistic(true);
        startTransition(async () => {
          try {
            const res = await fetch(apiUrl(`/api/v1/enquiries/${id}`), {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ isFollowedUp: true }),
            });
            if (!res.ok) {
              const body = await res.json().catch(() => ({}));
              setOptimistic(false);
              setError((body as { error?: string }).error ?? `Server error ${res.status}`);
              return;
            }
            router.refresh();
          } catch {
            setOptimistic(false);
            setError("Network error — please try again");
          }
        });
      }}
      className="text-xs px-3 py-1 rounded-lg bg-[var(--color-teal)]/10 text-[var(--color-teal)] font-semibold hover:bg-[var(--color-teal)]/20 transition-colors disabled:opacity-50 flex items-center gap-1"
    >
      {pending ? <Loader2 size={11} className="animate-spin" /> : null}
      Mark Done
    </button>
  );
}

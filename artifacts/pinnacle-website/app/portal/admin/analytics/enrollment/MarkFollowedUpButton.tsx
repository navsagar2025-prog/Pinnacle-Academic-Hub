"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";

export default function MarkFollowedUpButton({ id, current }: { id: string; current: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState(current);

  if (optimistic) {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-[var(--color-teal)]">
        <CheckCircle size={12} /> Done
      </span>
    );
  }

  return (
    <button
      disabled={pending}
      onClick={() => {
        setOptimistic(true);
        startTransition(async () => {
          await fetch(`/pinnacle-website/api/v1/enquiries/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isFollowedUp: true }),
          });
          router.refresh();
        });
      }}
      className="text-xs px-3 py-1 rounded-lg bg-[var(--color-teal)]/10 text-[var(--color-teal)] font-semibold hover:bg-[var(--color-teal)]/20 transition-colors disabled:opacity-50 flex items-center gap-1"
    >
      {pending ? <Loader2 size={11} className="animate-spin" /> : null}
      Mark Done
    </button>
  );
}

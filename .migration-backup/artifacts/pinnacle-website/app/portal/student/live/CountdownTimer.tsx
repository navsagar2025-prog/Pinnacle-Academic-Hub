"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export function CountdownTimer({ scheduledAt }: { scheduledAt: string }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    function compute() {
      const diff = new Date(scheduledAt).getTime() - Date.now();
      if (diff <= 0) {
        setLabel("");
        return;
      }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      if (h > 0) setLabel(`Starts in ${h}h ${m}m`);
      else if (m > 0) setLabel(`Starts in ${m}m ${s}s`);
      else setLabel(`Starts in ${s}s`);
    }
    compute();
    const id = setInterval(compute, 1_000);
    return () => clearInterval(id);
  }, [scheduledAt]);

  if (!label) return null;
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
      <Clock size={10} />
      {label}
    </span>
  );
}

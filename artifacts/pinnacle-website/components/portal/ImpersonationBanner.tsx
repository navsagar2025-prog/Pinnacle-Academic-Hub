"use client";

import { useEffect, useState } from "react";
import { UserCog } from "lucide-react";

/**
 * Persistent server-rendered banner shown on every page while an admin is
 * impersonating another user. The presence of this banner is driven by the
 * server-resolved impersonation cookie/DB pair — a client cannot suppress it
 * by setting a flag.
 */
export function ImpersonationBanner({
  adminName,
  targetName,
  expiresAt,
}: {
  adminName: string;
  targetName: string;
  expiresAt: string;
}) {
  const [remaining, setRemaining] = useState<string>("");
  const [stopping, setStopping] = useState(false);

  useEffect(() => {
    const end = new Date(expiresAt).getTime();
    const tick = () => {
      const ms = end - Date.now();
      if (ms <= 0) {
        setRemaining("expired");
        return;
      }
      const m = Math.floor(ms / 60_000);
      const s = Math.floor((ms % 60_000) / 1000);
      setRemaining(`${m}m ${String(s).padStart(2, "0")}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  async function stop() {
    setStopping(true);
    try {
      await fetch("/pinnacle-website/api/v1/admin/ops/impersonate/stop", { method: "POST" });
      window.location.reload();
    } finally {
      setStopping(false);
    }
  }

  return (
    <div
      role="alert"
      className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm shadow-sm"
    >
      <UserCog size={18} className="text-amber-700" />
      <div className="flex-1 min-w-[220px]">
        <div className="font-semibold text-amber-900">
          {adminName} is impersonating {targetName}
        </div>
        <div className="text-xs text-amber-800/80">
          Every action is recorded in the audit log. Auto-ends in <span className="font-mono">{remaining}</span>.
        </div>
      </div>
      <button
        onClick={stop}
        disabled={stopping}
        className="rounded-md bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800 disabled:opacity-50"
      >
        {stopping ? "Stopping…" : "Stop impersonation"}
      </button>
    </div>
  );
}

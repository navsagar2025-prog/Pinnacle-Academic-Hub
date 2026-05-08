"use client";
import { useEffect, useState, useCallback } from "react";
import { Radio } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

type State = { activeUsers: number | null; configured: boolean; lastUpdated: Date | null };

export function RealtimeCard() {
  const [state, setState] = useState<State>({ activeUsers: null, configured: false, lastUpdated: null });
  const [loading, setLoading] = useState(true);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/api/v1/admin/analytics/realtime`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json() as { data: State };
        setState({ ...data.data, lastUpdated: new Date() });
      }
    } catch {
      // silent — keep last value
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    poll();
    const id = setInterval(poll, 60_000);
    return () => clearInterval(id);
  }, [poll]);

  if (!state.configured) {
    return (
      <div className="card flex items-center gap-4 border-l-4 border-l-slate-200">
        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Radio size={18} className="text-slate-400" />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-500">Real-time Visitors</div>
          <div className="text-xs text-slate-400 mt-0.5">Configure GA4 credentials in Settings → Analytics to enable real-time tracking.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card flex items-center gap-4 border-l-4 border-l-[var(--color-teal)]">
      <div className="w-10 h-10 bg-[var(--color-teal)]/10 rounded-xl flex items-center justify-center flex-shrink-0">
        <Radio size={18} className="text-[var(--color-teal)] animate-pulse" />
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold font-[family-name:var(--font-playfair)] text-[var(--color-navy)]">
            {loading ? "—" : (state.activeUsers ?? 0)}
          </span>
          <span className="text-sm text-slate-500">active users right now</span>
        </div>
        <div className="text-xs text-slate-400 mt-0.5">
          Via Google Analytics · refreshes every 60 s
          {state.lastUpdated && (
            <> · Last updated {state.lastUpdated.toLocaleTimeString()}</>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[var(--color-teal)] animate-ping inline-block" />
        <span className="text-xs text-[var(--color-teal)] font-medium">LIVE</span>
      </div>
    </div>
  );
}

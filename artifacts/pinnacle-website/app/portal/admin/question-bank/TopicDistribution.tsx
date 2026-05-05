"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function TopicDistribution({
  subject,
  topics,
  selectedTopic,
}: {
  subject: string;
  topics: { topic: string; count: number }[];
  selectedTopic: string | null;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [showAll, setShowAll] = useState(false);

  const max = topics.reduce((m, t) => Math.max(m, t.count), 1);
  const visible = showAll ? topics : topics.slice(0, 10);

  function pickTopic(topic: string | null) {
    const params = new URLSearchParams(sp.toString());
    if (topic) params.set("topic", topic); else params.delete("topic");
    params.delete("page");
    router.push(`?${params.toString()}`);
  }

  return (
    <aside className="card sticky top-4 space-y-2 self-start">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Topics in {subject}</h3>
        {selectedTopic && (
          <button onClick={() => pickTopic(null)} className="text-[10px] text-[var(--color-maroon)] font-semibold hover:underline">
            Clear
          </button>
        )}
      </div>
      <p className="text-[11px] text-slate-400">{topics.length} topics · click to filter</p>
      <ul className="space-y-1 mt-1">
        {visible.map((t) => {
          const active = selectedTopic === t.topic;
          return (
            <li key={t.topic}>
              <button
                onClick={() => pickTopic(active ? null : t.topic)}
                className={`w-full text-left rounded-md px-2 py-1.5 text-xs flex items-center gap-2 transition-colors ${active ? "bg-[var(--color-teal)]/15 text-[var(--color-navy)]" : "hover:bg-slate-50 text-slate-700"}`}
              >
                <span className="flex-1 min-w-0 truncate" title={t.topic}>{t.topic}</span>
                <span className="font-mono text-[10px] text-slate-500 shrink-0">{t.count.toLocaleString()}</span>
                <span className="hidden sm:block w-10 h-1.5 rounded-full bg-slate-100 overflow-hidden shrink-0">
                  <span className="block h-full bg-[var(--color-gold)]" style={{ width: `${(t.count / max) * 100}%` }} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {topics.length > 10 && (
        <button onClick={() => setShowAll((v) => !v)} className="text-[11px] text-[var(--color-teal)] font-semibold hover:underline">
          {showAll ? "Show top 10" : `Show all ${topics.length}`}
        </button>
      )}
    </aside>
  );
}

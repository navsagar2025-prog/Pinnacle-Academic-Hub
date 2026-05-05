import { Target, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import type { WeakTopic } from "@/lib/server/weak-topics";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

function accuracyColor(acc: number) {
  if (acc < 40) return "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]";
  if (acc < 60) return "bg-amber-50 text-amber-700";
  return "bg-amber-100 text-amber-800";
}

export function WeakTopicsCard({
  weakTopics,
  variant = "full",
}: {
  weakTopics: WeakTopic[];
  variant?: "full" | "compact";
}) {
  if (weakTopics.length === 0) return null;

  const compact = variant === "compact";

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
        <div>
          <h3 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)] flex items-center gap-2">
            <Target size={18} className="text-[var(--color-maroon)]" />
            Recommended practice
          </h3>
          {!compact && (
            <p className="text-xs text-slate-500 mt-1">
              Topics where you have the lowest accuracy. Practice these to boost your overall score.
            </p>
          )}
        </div>
        <span className="badge bg-[var(--color-gold)]/15 text-[var(--color-navy)] flex items-center gap-1 text-xs">
          <Sparkles size={11} /> Adaptive
        </span>
      </div>

      <ul className="space-y-2">
        {weakTopics.map((t) => (
          <li key={`${t.subject}::${t.topic}`}>
            <Link
              href={`${BASE}/portal/student/practice`}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--color-slate-light)] transition-colors group"
            >
              <span className={`badge text-xs ${accuracyColor(t.accuracy)} font-bold`}>{t.accuracy}%</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-[var(--color-navy)] truncate">{t.topic}</div>
                <div className="text-[11px] text-slate-500 truncate">
                  {t.subject !== "Mock Test" && <>{t.subject} · </>}
                  {t.correct}/{t.attempted} correct · ask your teacher to assign a set on this topic
                </div>
              </div>
              <ArrowRight size={14} className="text-slate-300 group-hover:text-[var(--color-teal)] flex-shrink-0" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, ChevronRight, FileQuestion } from "lucide-react";
import { formatRemaining } from "./mock-tests/format-remaining";

export type UpcomingScheduledTest = {
  id: string;
  title: string;
  subject: string;
  examType: string;
  durationMinutes: number;
  scheduledStart: string;
};

export function UpcomingScheduledTests({ tests }: { tests: UpcomingScheduledTest[] }) {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (tests.length === 0) return null;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)] flex items-center gap-2">
          <CalendarClock size={16} className="text-[var(--color-gold)]" />
          Upcoming Scheduled Tests
        </h2>
        <Link href="/portal/student/mock-tests" className="text-[var(--color-teal)] text-sm flex items-center gap-1 hover:underline">
          View All <ChevronRight size={14} />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {tests.map((t) => {
          const startMs = new Date(t.scheduledStart).getTime();
          const remaining = startMs - now;
          return (
            <div key={t.id} className="rounded-xl bg-[var(--color-slate-light)]/60 p-3 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-[var(--color-navy)] truncate">{t.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{t.subject} · {t.examType}</div>
                </div>
                <span className="badge text-[10px] uppercase bg-[var(--color-gold)]/10 text-[var(--color-gold)] flex items-center gap-1 flex-shrink-0">
                  <CalendarClock size={10} />Scheduled
                </span>
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <FileQuestion size={11} />
                Opens {new Date(startMs).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
              </div>
              <div className="font-bold text-[var(--color-navy)] text-sm font-mono">
                Starts in {formatRemaining(remaining)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

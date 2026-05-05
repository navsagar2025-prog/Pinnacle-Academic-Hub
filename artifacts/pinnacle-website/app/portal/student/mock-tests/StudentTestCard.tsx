"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, FileQuestion, CheckCircle2, CalendarClock, Lock } from "lucide-react";
import { formatRemaining } from "./format-remaining";

export type StudentTestCardProps = {
  test: {
    id: string;
    title: string;
    subject: string;
    examType: string;
    durationMinutes: number;
    marksPerQuestion: number;
    questionCount: number;
    scheduledStart: string | null;
    scheduledEnd: string | null;
  };
  lastAttempt: { id: string; score: number; maxScore: number; isCompleted: boolean } | null;
};

export function StudentTestCard({ test, lastAttempt }: StudentTestCardProps) {
  const taken = !!lastAttempt?.isCompleted;
  const startMs = test.scheduledStart ? new Date(test.scheduledStart).getTime() : null;
  const endMs = test.scheduledEnd ? new Date(test.scheduledEnd).getTime() : null;
  const isScheduled = startMs !== null || endMs !== null;

  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    if (!isScheduled) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isScheduled]);

  const notYetOpen = startMs !== null && now < startMs;
  const closed = endMs !== null && now > endMs;
  const openNow = isScheduled && !notYetOpen && !closed;

  return (
    <div className="card hover:shadow-elevated transition-all">
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)] line-clamp-2">{test.title}</h3>
          <p className="text-xs text-slate-500 mt-1">{test.subject} · {test.examType}</p>
        </div>
        {taken ? (
          <span className="badge text-[10px] uppercase bg-[var(--color-teal)]/10 text-[var(--color-teal)]">
            <CheckCircle2 size={10} className="inline mr-0.5" />Done
          </span>
        ) : notYetOpen ? (
          <span className="badge text-[10px] uppercase bg-[var(--color-gold)]/10 text-[var(--color-gold)] flex items-center gap-1">
            <CalendarClock size={10} />Scheduled
          </span>
        ) : closed ? (
          <span className="badge text-[10px] uppercase bg-slate-100 text-slate-500 flex items-center gap-1">
            <Lock size={10} />Closed
          </span>
        ) : openNow ? (
          <span className="badge text-[10px] uppercase bg-[var(--color-teal)]/10 text-[var(--color-teal)]">Open Now</span>
        ) : null}
      </div>

      {isScheduled && (
        <div className="rounded-lg bg-[var(--color-slate-light)]/50 px-3 py-2 mb-3 text-xs">
          {notYetOpen && startMs !== null && (
            <div>
              <div className="flex items-center gap-1 text-slate-500">
                <CalendarClock size={12} className="text-[var(--color-gold)]" />
                Opens {new Date(startMs).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
              </div>
              <div className="font-bold text-[var(--color-navy)] mt-1 font-mono">
                Starts in {formatRemaining(startMs - now)}
              </div>
            </div>
          )}
          {openNow && endMs !== null && (
            <div>
              <div className="flex items-center gap-1 text-slate-500">
                <Clock size={12} className="text-[var(--color-teal)]" />
                Closes {new Date(endMs).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
              </div>
              <div className="font-bold text-[var(--color-teal)] mt-1 font-mono">
                Closes in {formatRemaining(endMs - now)}
              </div>
            </div>
          )}
          {closed && endMs !== null && (
            <div className="text-slate-500">
              Closed on {new Date(endMs).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-slate-100 text-xs mb-3">
        <div className="text-center">
          <div className="font-bold text-[var(--color-navy)] flex items-center justify-center gap-1">
            <FileQuestion size={12} />{test.questionCount ?? 0}
          </div>
          <div className="text-slate-400 mt-0.5">Questions</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-[var(--color-navy)] flex items-center justify-center gap-1">
            <Clock size={12} />{test.durationMinutes}m
          </div>
          <div className="text-slate-400 mt-0.5">Duration</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-[var(--color-navy)]">
            {((test.questionCount ?? 0) * test.marksPerQuestion)}
          </div>
          <div className="text-slate-400 mt-0.5">Max Marks</div>
        </div>
      </div>

      {taken && lastAttempt ? (
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm">
            <span className="text-slate-500">Last score: </span>
            <span className="font-bold text-[var(--color-navy)]">{lastAttempt.score}/{lastAttempt.maxScore}</span>
          </div>
          <Link href={`/portal/student/mock-tests/${test.id}/result/${lastAttempt.id}`}
            className="text-xs text-[var(--color-teal)] font-semibold hover:underline">
            View Report →
          </Link>
        </div>
      ) : notYetOpen ? (
        <button disabled className="block w-full text-center bg-slate-100 text-slate-400 py-2 text-sm rounded-lg font-semibold cursor-not-allowed">
          Opens later
        </button>
      ) : closed ? (
        <button disabled className="block w-full text-center bg-slate-100 text-slate-400 py-2 text-sm rounded-lg font-semibold cursor-not-allowed">
          Window closed
        </button>
      ) : (
        <Link href={`/portal/student/mock-tests/${test.id}/take`}
          className="block w-full text-center btn-gold py-2 text-sm">
          Start Test
        </Link>
      )}
    </div>
  );
}

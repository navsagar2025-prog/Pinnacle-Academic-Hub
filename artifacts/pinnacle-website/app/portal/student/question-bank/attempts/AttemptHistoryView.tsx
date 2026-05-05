"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  MinusCircle,
  ChevronRight,
  ListChecks,
  Target,
  Clock,
  Layers,
  Loader2,
} from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

interface Attempt {
  id: string;
  questionId: string;
  submittedAnswer: string | null;
  isCorrect: boolean | null;
  timeSpentSeconds: number | null;
  createdAt: string;
  practiceSetId: string | null;
  subject: string;
  topic: string | null;
  difficulty: string;
  questionText: string;
  isDeleted: boolean;
}

interface ListResponse {
  success: boolean;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  subjects: string[];
  attempts: Attempt[];
}

interface SummaryResponse {
  success: boolean;
  overall: {
    total: number;
    correct: number;
    gradable: number;
    uniqueQuestions: number;
    totalSeconds: number;
  };
  bySubject: Array<{ subject: string; total: number; correct: number; gradable: number }>;
  byDifficulty: Array<{ difficulty: string; total: number; correct: number; gradable: number }>;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function fmtMinutes(seconds: number) {
  if (!seconds) return "0m";
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export function AttemptHistoryView() {
  const [page, setPage] = useState(1);
  const [subject, setSubject] = useState<string>("");
  const [data, setData] = useState<ListResponse | null>(null);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page) });
    if (subject) params.set("subject", subject);
    fetch(`${BASE}/api/v1/question-bank/attempts?${params.toString()}`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Failed to load");
        return r.json() as Promise<ListResponse>;
      })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, subject]);

  useEffect(() => {
    fetch(`${BASE}/api/v1/question-bank/attempts/summary`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setSummary(d))
      .catch(() => {});
  }, []);

  const overall = summary?.overall;
  const accuracy =
    overall && overall.gradable > 0
      ? Math.round((overall.correct / overall.gradable) * 100)
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">
          Attempt History
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Every question you&apos;ve practised, newest first. Tap a row to revisit it.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card border-l-4 border-l-[var(--color-gold)]">
          <ListChecks size={16} className="text-[var(--color-gold)] mb-1" />
          <div className="text-2xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">
            {overall?.total ?? "—"}
          </div>
          <div className="text-xs text-slate-500">Total Attempts</div>
        </div>
        <div className="card border-l-4 border-l-[var(--color-teal)]">
          <Target size={16} className="text-[var(--color-teal)] mb-1" />
          <div className="text-2xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">
            {accuracy === null ? "—" : `${accuracy}%`}
          </div>
          <div className="text-xs text-slate-500">Accuracy</div>
        </div>
        <div className="card border-l-4 border-l-[var(--color-maroon)]">
          <Layers size={16} className="text-[var(--color-maroon)] mb-1" />
          <div className="text-2xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">
            {overall?.uniqueQuestions ?? "—"}
          </div>
          <div className="text-xs text-slate-500">Unique Questions</div>
        </div>
        <div className="card border-l-4 border-l-blue-400">
          <Clock size={16} className="text-blue-500 mb-1" />
          <div className="text-2xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">
            {overall ? fmtMinutes(overall.totalSeconds) : "—"}
          </div>
          <div className="text-xs text-slate-500">Time Practised</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Subject:</span>
        <button
          type="button"
          onClick={() => {
            setSubject("");
            setPage(1);
          }}
          className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
            subject === ""
              ? "bg-[var(--color-navy)] text-white border-[var(--color-navy)]"
              : "bg-white text-slate-600 border-slate-200 hover:border-[var(--color-teal)]"
          }`}
        >
          All
        </button>
        {(data?.subjects ?? []).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setSubject(s);
              setPage(1);
            }}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
              subject === s
                ? "bg-[var(--color-navy)] text-white border-[var(--color-navy)]"
                : "bg-white text-slate-600 border-slate-200 hover:border-[var(--color-teal)]"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {error && (
        <div className="card border-l-4 border-l-[var(--color-maroon)] text-sm text-[var(--color-maroon)]">
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className="card flex items-center justify-center py-10 text-slate-400">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : !data || data.attempts.length === 0 ? (
        <div className="card text-center py-10 text-slate-400">
          <ListChecks size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">
            {subject
              ? `No ${subject} attempts yet.`
              : "You haven't practised any questions yet."}
          </p>
          <Link
            href="/portal/student/practice"
            className="inline-block mt-3 text-[var(--color-teal)] text-sm font-semibold hover:underline"
          >
            Browse practice sets →
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {data.attempts.map((a) => {
              const Icon =
                a.isCorrect === true
                  ? CheckCircle2
                  : a.isCorrect === false
                  ? XCircle
                  : MinusCircle;
              const iconColor =
                a.isCorrect === true
                  ? "text-[var(--color-teal)]"
                  : a.isCorrect === false
                  ? "text-[var(--color-maroon)]"
                  : "text-slate-400";
              const href = a.practiceSetId
                ? `/portal/student/question-bank/${a.questionId}?set=${a.practiceSetId}`
                : `/portal/student/question-bank/${a.questionId}`;
              return (
                <Link
                  key={a.id}
                  href={href}
                  className="card hover:shadow-elevated transition-all flex items-start gap-3 group"
                >
                  <Icon size={20} className={`${iconColor} flex-shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-[var(--color-navy)] line-clamp-2">
                      {a.isDeleted ? (
                        <span className="italic text-slate-400">Question removed</span>
                      ) : (
                        a.questionText
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="font-medium text-slate-500">{a.subject}</span>
                      {a.topic && <span>· {a.topic}</span>}
                      <span className="capitalize">· {a.difficulty}</span>
                      <span>· {fmtDate(a.createdAt)}</span>
                      {a.timeSpentSeconds ? <span>· {a.timeSpentSeconds}s</span> : null}
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-slate-300 group-hover:text-[var(--color-teal)] flex-shrink-0 mt-1"
                  />
                </Link>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
            <div>
              Showing {(data.page - 1) * data.pageSize + 1}–
              {Math.min(data.page * data.pageSize, data.total)} of {data.total}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={data.page <= 1 || loading}
                className="px-3 py-1.5 rounded-md border border-slate-200 bg-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:border-[var(--color-teal)]"
              >
                Previous
              </button>
              <span className="font-semibold text-slate-600">
                Page {data.page} / {data.totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={data.page >= data.totalPages || loading}
                className="px-3 py-1.5 rounded-md border border-slate-200 bg-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:border-[var(--color-teal)]"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

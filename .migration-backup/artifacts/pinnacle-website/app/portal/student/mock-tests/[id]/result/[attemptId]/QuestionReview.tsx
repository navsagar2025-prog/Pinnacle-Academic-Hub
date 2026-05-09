"use client";
import { useMemo, useState } from "react";
import { CheckCircle2, XCircle, MinusCircle, Lightbulb, Filter } from "lucide-react";
import { RichText } from "@/components/rich/RichText";

export type ReviewQuestion = {
  id: string;
  questionNumber: number;
  questionType: string; // 'mcq' | 'multi' | 'numerical'
  topic: string | null;
  questionText: string;
  imageUrl: string | null;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  optionAImageUrl: string | null;
  optionBImageUrl: string | null;
  optionCImageUrl: string | null;
  optionDImageUrl: string | null;
  correctOption: string | null;
  correctOptions: string[] | null;
  numericalAnswer: number | null;
  numericalTolerance: number | null;
  explanation: string | null;
  explanationImageUrl: string | null;
  selectedOption: string | null;
  selectedOptions: string[] | null;
  numericalResponse: number | null;
  isCorrect: boolean | null;
  marksAwarded: number | null;
};

type FilterKey = "all" | "wrong" | "skipped" | "correct";

function wasAttempted(q: ReviewQuestion): boolean {
  if (q.questionType === "multi") return (q.selectedOptions?.length ?? 0) > 0;
  if (q.questionType === "numerical") return q.numericalResponse !== null && q.numericalResponse !== undefined;
  return Boolean(q.selectedOption);
}

function formatNumber(n: number | null): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(6)));
}

export function QuestionReview({ questions }: { questions: ReviewQuestion[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const counts = useMemo(() => {
    let correct = 0, wrong = 0, skipped = 0;
    for (const q of questions) {
      if (!wasAttempted(q)) skipped++;
      else if (q.isCorrect) correct++;
      else wrong++;
    }
    return { all: questions.length, correct, wrong, skipped };
  }, [questions]);

  const filtered = useMemo(() => {
    if (filter === "all") return questions;
    return questions.filter((q) => {
      const attempted = wasAttempted(q);
      if (filter === "skipped") return !attempted;
      if (filter === "correct") return attempted && q.isCorrect;
      return attempted && !q.isCorrect; // wrong
    });
  }, [questions, filter]);

  const chips: { key: FilterKey; label: string; count: number; activeClass: string }[] = [
    { key: "all",     label: "All",      count: counts.all,     activeClass: "bg-[var(--color-navy)] text-white border-[var(--color-navy)]" },
    { key: "wrong",   label: "Wrong",    count: counts.wrong,   activeClass: "bg-[var(--color-maroon)] text-white border-[var(--color-maroon)]" },
    { key: "skipped", label: "Skipped",  count: counts.skipped, activeClass: "bg-slate-500 text-white border-slate-500" },
    { key: "correct", label: "Correct",  count: counts.correct, activeClass: "bg-[var(--color-teal)] text-white border-[var(--color-teal)]" },
  ];

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">
          Question Review &amp; Solutions
        </h2>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter size={14} className="text-slate-400 mr-0.5" />
          {chips.map((c) => {
            const active = filter === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setFilter(c.key)}
                disabled={c.count === 0 && c.key !== "all"}
                aria-pressed={active}
                aria-label={`Show ${c.label.toLowerCase()} questions (${c.count})`}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  active ? c.activeClass : "border-slate-200 text-slate-600 hover:border-slate-300 bg-white"
                }`}
              >
                {c.label}
                <span className={`ml-1.5 font-mono ${active ? "opacity-90" : "text-slate-400"}`}>{c.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-400 py-6 text-center">No questions match this filter.</p>
      ) : (
        <ol className="space-y-4">
          {filtered.map((q) => {
            const attempted = wasAttempted(q);
            const wasSkipped = !attempted;
            const wasCorrect = q.isCorrect === true;
            const accent = wasSkipped ? "border-l-slate-300" : wasCorrect ? "border-l-[var(--color-teal)]" : "border-l-[var(--color-maroon)]";
            const isMcqLike = q.questionType !== "numerical";
            const correctSet = new Set<string>(
              q.questionType === "multi" ? (q.correctOptions ?? []) : (q.correctOption ? [q.correctOption] : [])
            );
            const selectedSet = new Set<string>(
              q.questionType === "multi" ? (q.selectedOptions ?? []) : (q.selectedOption ? [q.selectedOption] : [])
            );

            const typeBadge = q.questionType === "multi"
              ? { label: "Multiple correct", className: "bg-purple-100 text-purple-700" }
              : q.questionType === "numerical"
              ? { label: "Numerical", className: "bg-blue-100 text-blue-700" }
              : null;

            return (
              <li key={q.id} className={`border border-slate-100 border-l-4 ${accent} rounded-xl p-4`}>
                <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-400">
                      Q{q.questionNumber}{q.topic && ` · ${q.topic}`}
                    </span>
                    {typeBadge && (
                      <span className={`px-1.5 py-0.5 rounded font-semibold text-[10px] ${typeBadge.className}`}>{typeBadge.label}</span>
                    )}
                  </div>
                  {wasSkipped ? (
                    <span className="text-xs text-slate-500 inline-flex items-center gap-1 bg-slate-100 rounded-full px-2 py-0.5">
                      <MinusCircle size={12} />Skipped
                    </span>
                  ) : wasCorrect ? (
                    <span className="text-xs text-[var(--color-teal)] inline-flex items-center gap-1 bg-[var(--color-teal)]/10 rounded-full px-2 py-0.5 font-semibold">
                      <CheckCircle2 size={12} />Correct{q.marksAwarded != null && ` · +${q.marksAwarded}`}
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--color-maroon)] inline-flex items-center gap-1 bg-[var(--color-maroon)]/10 rounded-full px-2 py-0.5 font-semibold">
                      <XCircle size={12} />Wrong{q.marksAwarded != null && ` · ${q.marksAwarded}`}
                    </span>
                  )}
                </div>

                <div className="font-medium text-[var(--color-navy)] text-sm mb-2">
                  <RichText>{q.questionText}</RichText>
                </div>
                {q.imageUrl && (
                  <img src={q.imageUrl} alt="Question diagram"
                    className="max-h-56 rounded-lg border border-slate-100 mb-3 mx-auto block" />
                )}

                {isMcqLike ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {(["A", "B", "C", "D"] as const).map((opt) => {
                      const text = { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD }[opt];
                      const optImg = { A: q.optionAImageUrl, B: q.optionBImageUrl, C: q.optionCImageUrl, D: q.optionDImageUrl }[opt];
                      if (text === null && optImg === null) return null;
                      const isCorrectOpt = correctSet.has(opt);
                      const isSelectedOpt = selectedSet.has(opt);
                      return (
                        <div key={opt} className={`text-xs p-2 rounded-lg ${
                          isCorrectOpt ? "bg-[var(--color-teal)]/10 text-[var(--color-teal)] font-semibold"
                          : isSelectedOpt ? "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)] font-semibold"
                          : "text-slate-600"
                        }`}>
                          <span className="font-mono mr-1.5">{opt}.</span>
                          {text && <RichText>{text}</RichText>}
                          {optImg && <img src={optImg} alt={`Option ${opt}`} className="max-h-24 rounded border border-slate-100 mt-1" />}
                          {isCorrectOpt && " ✓"}
                          {isSelectedOpt && !isCorrectOpt && " ← your answer"}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div className={`p-3 rounded-lg ${wasCorrect ? "bg-[var(--color-teal)]/10" : "bg-slate-50"}`}>
                      <div className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-1">Your answer</div>
                      <div className={`font-mono text-base ${wasCorrect ? "text-[var(--color-teal)] font-bold" : wasSkipped ? "text-slate-400 italic" : "text-[var(--color-maroon)] font-bold"}`}>
                        {wasSkipped ? "—" : formatNumber(q.numericalResponse)}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-[var(--color-teal)]/10">
                      <div className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-1">
                        Correct answer{q.numericalTolerance ? ` (±${formatNumber(q.numericalTolerance)})` : ""}
                      </div>
                      <div className="font-mono text-base text-[var(--color-teal)] font-bold">
                        {formatNumber(q.numericalAnswer)}
                      </div>
                    </div>
                  </div>
                )}

                {!wasCorrect && isMcqLike && (
                  <p className="text-xs mt-3">
                    <span className="font-semibold text-[var(--color-navy)]">Correct answer: </span>
                    <span className="font-mono text-[var(--color-teal)] font-bold">
                      {q.questionType === "multi" ? (q.correctOptions ?? []).join(", ") : q.correctOption}
                    </span>
                  </p>
                )}

                {(q.explanation || q.explanationImageUrl) ? (
                  <div className="mt-3 bg-amber-50 border border-amber-100 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 mb-1.5">
                      <Lightbulb size={13} className="text-amber-600" />Solution
                    </div>
                    {q.explanation && (
                      <div className="text-sm text-slate-700 leading-relaxed">
                        <RichText>{q.explanation}</RichText>
                      </div>
                    )}
                    {q.explanationImageUrl && (
                      <img src={q.explanationImageUrl} alt="Solution diagram"
                        className="max-h-56 rounded border border-amber-200 mt-2 mx-auto block bg-white" />
                    )}
                  </div>
                ) : !wasCorrect && (
                  <p className="text-[11px] text-slate-400 italic mt-2">No detailed solution provided for this question.</p>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

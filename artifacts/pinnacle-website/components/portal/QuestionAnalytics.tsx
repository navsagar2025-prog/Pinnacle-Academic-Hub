"use client";
import { useMemo, useState } from "react";
import { ListChecks, Download, ChevronDown, ChevronUp } from "lucide-react";

export type QuestionRow = {
  questionId: string;
  questionNumber: number;
  topic: string | null;
  questionType: string;
  questionPreview: string;
  totalAttempts: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  accuracy: number;
  avgTimeSeconds: number;
  topWrongOption: string | null;
  topWrongCount: number;
};

type SortKey = "number" | "accuracy" | "avgTime" | "attempts";

function difficultyLabel(accuracy: number, attempts: number): { label: string; cls: string } {
  if (attempts === 0) return { label: "—", cls: "bg-slate-100 text-slate-400" };
  if (accuracy >= 70) return { label: "Easy", cls: "bg-[var(--color-teal)]/10 text-[var(--color-teal)]" };
  if (accuracy >= 40) return { label: "Medium", cls: "bg-[var(--color-gold)]/15 text-[var(--color-navy)]" };
  return { label: "Hard", cls: "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]" };
}

function fmtTime(seconds: number): string {
  if (!seconds || seconds <= 0) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

export function QuestionAnalytics({ rows, testTitle }: { rows: QuestionRow[]; testTitle: string }) {
  const [sortKey, setSortKey] = useState<SortKey>("accuracy");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showAll, setShowAll] = useState(false);

  const totalsByQuestion = rows.reduce((acc, r) => acc + r.totalAttempts, 0);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      let av = 0, bv = 0;
      if (sortKey === "number") { av = a.questionNumber; bv = b.questionNumber; }
      else if (sortKey === "accuracy") { av = a.totalAttempts > 0 ? a.accuracy : -1; bv = b.totalAttempts > 0 ? b.accuracy : -1; }
      else if (sortKey === "avgTime") { av = a.avgTimeSeconds; bv = b.avgTimeSeconds; }
      else if (sortKey === "attempts") { av = a.totalAttempts; bv = b.totalAttempts; }
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  const visible = showAll ? sorted : sorted.slice(0, 10);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir(key === "accuracy" || key === "avgTime" ? "asc" : "desc"); }
  }

  function exportCsv() {
    const headers = ["Q#", "Topic", "Type", "Question", "Attempts", "Correct", "Wrong", "Skipped", "Accuracy %", "Avg Time (s)", "Top Wrong Answer", "Top Wrong Count", "Difficulty"];
    const dataRows = sorted.map((r) => [
      r.questionNumber,
      r.topic ?? "",
      r.questionType,
      r.questionPreview,
      r.totalAttempts,
      r.correctCount,
      r.wrongCount,
      r.skippedCount,
      r.totalAttempts > 0 ? r.accuracy : "",
      r.avgTimeSeconds > 0 ? Math.round(r.avgTimeSeconds) : "",
      r.topWrongOption ?? "",
      r.topWrongCount,
      difficultyLabel(r.accuracy, r.totalAttempts).label,
    ]);
    const csvContent = [headers, ...dataRows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${testTitle.replace(/[^a-zA-Z0-9]/g, "_")}_question_analytics.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (rows.length === 0) return null;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)] flex items-center gap-2">
          <ListChecks size={18} className="text-[var(--color-teal)]" />
          Per-Question Analytics
        </h3>
        {totalsByQuestion > 0 && (
          <button onClick={exportCsv} className="text-xs font-semibold text-[var(--color-teal)] hover:underline flex items-center gap-1">
            <Download size={13} /> Export CSV
          </button>
        )}
      </div>
      {totalsByQuestion === 0 ? (
        <p className="text-sm text-slate-400 py-3">No student answers recorded yet.</p>
      ) : (
        <>
          <p className="text-xs text-slate-500 mb-3">
            Sort by accuracy or time to spot questions that consistently trip students up. The &ldquo;top wrong&rdquo; column shows the most-picked incorrect option for MCQ items.
          </p>
          <div className="overflow-x-auto -mx-4 sm:-mx-5">
            <table className="w-full text-sm min-w-[820px]">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <SortableTh active={sortKey === "number"} dir={sortDir} onClick={() => toggleSort("number")} className="pl-4 sm:pl-5">Q#</SortableTh>
                  <th className="pb-2 font-semibold text-slate-500 text-xs">Question</th>
                  <SortableTh active={sortKey === "attempts"} dir={sortDir} onClick={() => toggleSort("attempts")} center>Attempts</SortableTh>
                  <SortableTh active={sortKey === "accuracy"} dir={sortDir} onClick={() => toggleSort("accuracy")} center>Accuracy</SortableTh>
                  <th className="pb-2 font-semibold text-slate-500 text-xs text-center">Skipped</th>
                  <SortableTh active={sortKey === "avgTime"} dir={sortDir} onClick={() => toggleSort("avgTime")} center>Avg Time</SortableTh>
                  <th className="pb-2 font-semibold text-slate-500 text-xs text-center">Top Wrong</th>
                  <th className="pb-2 pr-4 sm:pr-5 font-semibold text-slate-500 text-xs text-center">Difficulty</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => {
                  const diff = difficultyLabel(r.accuracy, r.totalAttempts);
                  const accClass = r.totalAttempts === 0
                    ? "text-slate-400"
                    : r.accuracy >= 70 ? "text-[var(--color-teal)]"
                    : r.accuracy >= 40 ? "text-[var(--color-gold)]"
                    : "text-[var(--color-maroon)]";
                  return (
                    <tr key={r.questionId} className="border-b border-slate-50 hover:bg-slate-50/50 align-top">
                      <td className="py-2.5 pl-4 sm:pl-5 font-mono text-slate-500 text-xs">Q{r.questionNumber}</td>
                      <td className="py-2.5 pr-2">
                        <div className="text-xs text-slate-700 line-clamp-2 max-w-md">{r.questionPreview || "—"}</div>
                        {r.topic && <div className="text-[10px] text-slate-400 mt-0.5">{r.topic}</div>}
                      </td>
                      <td className="py-2.5 text-center text-slate-700">{r.totalAttempts}</td>
                      <td className={`py-2.5 text-center font-semibold ${accClass}`}>
                        {r.totalAttempts === 0 ? "—" : `${r.accuracy}%`}
                        <div className="text-[10px] text-slate-400 font-normal">{r.correctCount}✓ {r.wrongCount}✗</div>
                      </td>
                      <td className="py-2.5 text-center text-slate-500 text-xs">{r.skippedCount}</td>
                      <td className="py-2.5 text-center text-slate-600 text-xs">{fmtTime(r.avgTimeSeconds)}</td>
                      <td className="py-2.5 text-center text-xs">
                        {r.topWrongOption ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--color-maroon)]/10 text-[var(--color-maroon)] font-mono">
                            {r.topWrongOption}
                            <span className="text-slate-400 font-normal">·{r.topWrongCount}</span>
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 sm:pr-5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${diff.cls}`}>{diff.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {sorted.length > 10 && (
            <button
              onClick={() => setShowAll((s) => !s)}
              className="mt-3 text-xs font-semibold text-[var(--color-teal)] hover:underline flex items-center gap-1 mx-auto"
            >
              {showAll ? <><ChevronUp size={13} /> Show top 10 only</> : <><ChevronDown size={13} /> Show all {sorted.length} questions</>}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function SortableTh({ children, active, dir, onClick, center, className }: {
  children: React.ReactNode;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
  center?: boolean;
  className?: string;
}) {
  return (
    <th className={`pb-2 font-semibold text-slate-500 text-xs ${center ? "text-center" : ""} ${className ?? ""}`}>
      <button
        onClick={onClick}
        className={`inline-flex items-center gap-0.5 hover:text-[var(--color-navy)] ${active ? "text-[var(--color-navy)]" : ""}`}
      >
        {children}
        {active && (dir === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
      </button>
    </th>
  );
}

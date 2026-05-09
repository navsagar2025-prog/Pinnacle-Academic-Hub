"use client";
import { useState } from "react";
import { BarChart3, Users, Clock, TrendingUp, Download, ChevronDown, ChevronUp } from "lucide-react";

type AttemptStats = {
  totalAttempts: number;
  completedAttempts: number;
  averageScore: number;
  averagePercentage: number;
  maxScore: number;
  highestScore: number;
  passRate: number;
  averageTimeMinutes: number;
};

type TopicBreakdown = {
  topic: string;
  totalAnswered: number;
  correctCount: number;
  wrongCount: number;
  accuracy: number;
};

type StudentAttempt = {
  id: string;
  studentName: string;
  score: number;
  maxScore: number;
  correctCount: number;
  wrongCount: number;
  attemptedCount: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  submittedAt: string | null;
};

type Props = {
  stats: AttemptStats;
  topicBreakdown: TopicBreakdown[];
  studentAttempts: StudentAttempt[];
  testTitle: string;
};

export function TestAnalytics({ stats, topicBreakdown, studentAttempts, testTitle }: Props) {
  const [showAll, setShowAll] = useState(false);
  const visibleAttempts = showAll ? studentAttempts : studentAttempts.slice(0, 10);

  if (stats.completedAttempts === 0) {
    return (
      <div className="card">
        <h2 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)] flex items-center gap-2 mb-2">
          <BarChart3 size={18} className="text-[var(--color-teal)]" />
          Performance Analytics
        </h2>
        <p className="text-sm text-slate-400 py-3">No completed attempts yet. Analytics will appear once students submit their tests.</p>
      </div>
    );
  }

  function exportCsv() {
    const headers = ["Student Name", "Score", "Max Score", "Percentage", "Correct", "Wrong", "Attempted", "Total Questions", "Time (min)", "Submitted At"];
    const rows = studentAttempts.map((a) => [
      a.studentName,
      a.score,
      a.maxScore,
      a.maxScore > 0 ? ((a.score / a.maxScore) * 100).toFixed(1) : "0",
      a.correctCount,
      a.wrongCount,
      a.attemptedCount,
      a.totalQuestions,
      Math.round(a.timeSpentSeconds / 60),
      a.submittedAt ? new Date(a.submittedAt).toLocaleString() : "—",
    ]);

    const csvContent = [headers, ...rows].map((r) =>
      r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
    ).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${testTitle.replace(/[^a-zA-Z0-9]/g, "_")}_results.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)] flex items-center gap-2">
            <BarChart3 size={18} className="text-[var(--color-teal)]" />
            Performance Analytics
          </h2>
          <button
            onClick={exportCsv}
            className="text-xs font-semibold text-[var(--color-teal)] hover:underline flex items-center gap-1"
          >
            <Download size={13} /> Export CSV
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            icon={<Users size={16} />}
            label="Completed"
            value={`${stats.completedAttempts}`}
            sub={`of ${stats.totalAttempts} started`}
          />
          <StatCard
            icon={<TrendingUp size={16} />}
            label="Average Score"
            value={`${stats.averageScore}/${stats.maxScore}`}
            sub={`${stats.averagePercentage}%`}
          />
          <StatCard
            icon={<BarChart3 size={16} />}
            label="Pass Rate"
            value={`${stats.passRate}%`}
            sub={`≥ 40% to pass`}
          />
          <StatCard
            icon={<Clock size={16} />}
            label="Avg Time"
            value={`${stats.averageTimeMinutes} min`}
            sub={`${stats.highestScore}/${stats.maxScore} best`}
          />
        </div>
      </div>

      {topicBreakdown.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)] mb-3">
            Topic-wise Breakdown
          </h3>
          <div className="space-y-2">
            {topicBreakdown.map((t) => (
              <div key={t.topic} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-[var(--color-navy)] truncate">{t.topic}</span>
                    <span className="text-xs text-slate-500 ml-2 flex-shrink-0">
                      {t.correctCount}/{t.totalAnswered} correct ({t.accuracy}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        t.accuracy >= 70
                          ? "bg-[var(--color-teal)]"
                          : t.accuracy >= 40
                          ? "bg-[var(--color-gold)]"
                          : "bg-[var(--color-maroon)]"
                      }`}
                      style={{ width: `${t.accuracy}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)] mb-3">
          Student Attempts ({stats.completedAttempts})
        </h3>
        <div className="overflow-x-auto -mx-4 sm:-mx-5">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="pb-2 pl-4 sm:pl-5 font-semibold text-slate-500 text-xs">Student</th>
                <th className="pb-2 font-semibold text-slate-500 text-xs text-center">Score</th>
                <th className="pb-2 font-semibold text-slate-500 text-xs text-center">%</th>
                <th className="pb-2 font-semibold text-slate-500 text-xs text-center">Correct</th>
                <th className="pb-2 font-semibold text-slate-500 text-xs text-center">Wrong</th>
                <th className="pb-2 font-semibold text-slate-500 text-xs text-center">Time</th>
                <th className="pb-2 pr-4 sm:pr-5 font-semibold text-slate-500 text-xs">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {visibleAttempts.map((a) => {
                const pct = a.maxScore > 0 ? (a.score / a.maxScore) * 100 : 0;
                return (
                  <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-2.5 pl-4 sm:pl-5 font-medium text-[var(--color-navy)]">{a.studentName}</td>
                    <td className="py-2.5 text-center">{a.score}/{a.maxScore}</td>
                    <td className="py-2.5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                        pct >= 70
                          ? "bg-[var(--color-teal)]/10 text-[var(--color-teal)]"
                          : pct >= 40
                          ? "bg-[var(--color-gold)]/10 text-[var(--color-gold)]"
                          : "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]"
                      }`}>
                        {pct.toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-2.5 text-center text-[var(--color-teal)]">{a.correctCount}</td>
                    <td className="py-2.5 text-center text-[var(--color-maroon)]">{a.wrongCount}</td>
                    <td className="py-2.5 text-center text-slate-600">{Math.round(a.timeSpentSeconds / 60)}m</td>
                    <td className="py-2.5 pr-4 sm:pr-5 text-slate-500 text-xs">
                      {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {studentAttempts.length > 10 && (
          <button
            onClick={() => setShowAll((s) => !s)}
            className="mt-3 text-xs font-semibold text-[var(--color-teal)] hover:underline flex items-center gap-1 mx-auto"
          >
            {showAll ? <><ChevronUp size={13} /> Show less</> : <><ChevronDown size={13} /> Show all {studentAttempts.length} attempts</>}
          </button>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="bg-[var(--color-slate-light)]/40 rounded-xl p-3 border border-slate-100">
      <div className="flex items-center gap-1.5 text-slate-400 mb-1">{icon}<span className="text-xs font-medium">{label}</span></div>
      <div className="text-lg font-bold text-[var(--color-navy)]">{value}</div>
      <div className="text-xs text-slate-500">{sub}</div>
    </div>
  );
}

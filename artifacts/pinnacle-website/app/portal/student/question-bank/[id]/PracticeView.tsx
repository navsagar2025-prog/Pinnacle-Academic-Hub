"use client";
import { useState } from "react";
import { Bookmark, Eye, CheckCircle2, XCircle } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

const DIFF_COLOR: Record<string, string> = {
  easy: "bg-green-50 text-green-700",
  medium: "bg-amber-50 text-amber-700",
  hard: "bg-rose-50 text-rose-700",
};

type Q = {
  id: string;
  subject: string;
  topic: string | null;
  year: number | null;
  difficulty: string;
  questionType: string;
  questionText: string;
  imageUrl: string | null;
  options: Record<string, string> | null;
  correctAnswer: string;
  solution: string | null;
  solutionImageUrl: string | null;
};

export function PracticeView({ question: q, initialBookmarked }: { question: Q; initialBookmarked: boolean }) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [bmLoading, setBmLoading] = useState(false);
  const [selected, setSelected] = useState("");
  const [textAnswer, setTextAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);

  async function toggleBookmark() {
    setBmLoading(true);
    const method = bookmarked ? "DELETE" : "POST";
    const res = await fetch(`${BASE}/api/v1/question-bank/${q.id}/bookmark`, { method });
    if (res.ok) setBookmarked(!bookmarked);
    setBmLoading(false);
  }

  const isMcq = q.questionType === "mcq" && q.options;
  const correct = isMcq && selected === q.correctAnswer;

  return (
    <div className="space-y-5">
      <div className="card space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="badge bg-[var(--color-navy)]/10 text-[var(--color-navy)]">{q.subject}</span>
            {q.topic && <span className="text-slate-500">· {q.topic}</span>}
            {q.year && <span className="text-slate-400">· PYQ {q.year}</span>}
            <span className={`badge ${DIFF_COLOR[q.difficulty]}`}>{q.difficulty}</span>
          </div>
          <button onClick={toggleBookmark} disabled={bmLoading}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border ${bookmarked ? "border-[var(--color-gold)] bg-[var(--color-gold)]/10 text-[var(--color-gold)]" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
            <Bookmark size={13} className={bookmarked ? "fill-[var(--color-gold)]" : ""} />
            {bookmarked ? "Bookmarked" : "Bookmark"}
          </button>
        </div>
        <p className="text-[var(--color-navy)] whitespace-pre-line">{q.questionText}</p>
        {q.imageUrl && <img src={q.imageUrl} alt="Question diagram" className="max-w-full rounded-lg border border-slate-100" />}

        {isMcq ? (
          <div className="space-y-2 pt-2">
            {(["A", "B", "C", "D"] as const).map((opt) => {
              const text = q.options?.[opt];
              if (!text) return null;
              const showCorrect = revealed && opt === q.correctAnswer;
              const showWrong = revealed && selected === opt && opt !== q.correctAnswer;
              return (
                <button key={opt} type="button" onClick={() => !revealed && setSelected(opt)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-all flex items-start gap-3 ${
                    showCorrect ? "border-green-300 bg-green-50 text-green-800" :
                    showWrong ? "border-rose-300 bg-rose-50 text-rose-800" :
                    selected === opt ? "border-[var(--color-teal)] bg-[var(--color-teal)]/5" :
                    "border-slate-200 hover:border-slate-300"
                  }`}>
                  <span className="font-mono font-bold">{opt}.</span>
                  <span className="flex-1">{text}</span>
                  {showCorrect && <CheckCircle2 size={16} className="text-green-600" />}
                  {showWrong && <XCircle size={16} className="text-rose-600" />}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Your answer</label>
            <textarea rows={3} value={textAnswer} onChange={(e) => setTextAnswer(e.target.value)}
              disabled={revealed}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-y" placeholder="Type your answer here…" />
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-2">
          {!revealed ? (
            <button onClick={() => setRevealed(true)}
              disabled={isMcq ? !selected : !textAnswer.trim()}
              className="btn-gold px-4 py-2 text-sm flex items-center gap-1.5 disabled:opacity-50">
              <Eye size={14} /> Reveal Solution
            </button>
          ) : (
            <button onClick={() => { setRevealed(false); setSelected(""); setTextAnswer(""); }}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Try Again
            </button>
          )}
          {revealed && isMcq && (
            <span className={`text-sm font-semibold ${correct ? "text-green-700" : "text-rose-700"}`}>
              {correct ? "Correct! 🎉" : `Correct answer: ${q.correctAnswer}`}
            </span>
          )}
        </div>
      </div>

      {revealed && (
        <div className="card border-l-4 border-l-[var(--color-teal)] bg-[var(--color-teal)]/5">
          <div className="font-bold text-[var(--color-teal)] mb-2 text-sm">Solution</div>
          {!isMcq && <p className="text-sm text-slate-600 mb-2"><span className="font-semibold">Expected:</span> {q.correctAnswer}</p>}
          {q.solution ? (
            <p className="text-sm text-slate-700 whitespace-pre-line">{q.solution}</p>
          ) : (
            <p className="text-sm text-slate-400 italic">No detailed solution provided.</p>
          )}
          {q.solutionImageUrl && <img src={q.solutionImageUrl} alt="Solution" className="mt-3 max-w-full rounded-lg border border-slate-100" />}
        </div>
      )}
    </div>
  );
}

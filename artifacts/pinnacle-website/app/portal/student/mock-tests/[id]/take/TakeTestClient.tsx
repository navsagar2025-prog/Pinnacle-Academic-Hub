"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, ChevronLeft, ChevronRight, Flag, CheckCircle, AlertCircle, Cloud, CloudOff } from "lucide-react";
import { RichText } from "@/components/rich/RichText";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

type SaveState = "idle" | "saving" | "saved" | "error";

type Question = {
  id: string;
  questionNumber: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  topic: string | null;
  imageUrl: string | null;
  optionAImageUrl: string | null;
  optionBImageUrl: string | null;
  optionCImageUrl: string | null;
  optionDImageUrl: string | null;
};

type Test = {
  id: string;
  title: string;
  subject: string;
  examType: string;
  durationMinutes: number;
  marksPerQuestion: number;
  negativeMarkingPercent: number;
  instructions: string | null;
};

type Option = "A" | "B" | "C" | "D";

export function TakeTestClient({
  test, questions, resume,
}: {
  test: Test;
  questions: Question[];
  resume: { attemptId: string; secondsLeft: number; savedAnswers: Record<string, Option>; savedMarks: string[] } | null;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<"ready" | "taking" | "submitting">(resume ? "taking" : "ready");
  const [attemptId, setAttemptId] = useState<string | null>(resume?.attemptId ?? null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Option | null>>(resume?.savedAnswers ?? {});
  const [marked, setMarked] = useState<Set<string>>(new Set(resume?.savedMarks ?? []));
  const [secondsLeft, setSecondsLeft] = useState(resume?.secondsLeft ?? test.durationMinutes * 60);
  const startTimeRef = useRef<number>(resume ? Date.now() - (test.durationMinutes * 60 - resume.secondsLeft) * 1000 : 0);
  const [error, setError] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  // Per-question debounce timers and in-flight controllers so a change on Q2
  // never cancels a pending save on Q1.
  const saveTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const inflightRef = useRef<Map<string, AbortController>>(new Map());

  const saveAnswer = useCallback((questionId: string, selectedOption: Option | null, isMarkedForReview: boolean, immediate = false) => {
    if (!attemptId) return;
    const fire = async () => {
      const prev = inflightRef.current.get(questionId);
      if (prev) prev.abort();
      const ctrl = new AbortController();
      inflightRef.current.set(questionId, ctrl);
      setSaveState("saving");
      try {
        const res = await fetch(`${BASE}/api/v1/mock-tests/attempts/${attemptId}/answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId, selectedOption, isMarkedForReview }),
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(String(res.status));
        setSaveState("saved");
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setSaveState("error");
      } finally {
        if (inflightRef.current.get(questionId) === ctrl) inflightRef.current.delete(questionId);
      }
    };
    const existing = saveTimersRef.current.get(questionId);
    if (existing) clearTimeout(existing);
    if (immediate) {
      saveTimersRef.current.delete(questionId);
      void fire();
      return;
    }
    const t = setTimeout(() => {
      saveTimersRef.current.delete(questionId);
      void fire();
    }, 500);
    saveTimersRef.current.set(questionId, t);
  }, [attemptId]);

  const current = questions[currentIdx];
  const answeredCount = Object.values(answers).filter((a) => a !== null && a !== undefined).length;

  // Timer
  useEffect(() => {
    if (phase !== "taking") return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          submitAttempt();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Prevent accidental navigation
  useEffect(() => {
    if (phase !== "taking") return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [phase]);

  // If we resumed an in-progress attempt, baseline the start ref already
  // computed above. For a fresh start, set startTimeRef when the attempt is
  // created.
  useEffect(() => {
    if (resume) startTimeRef.current = Date.now() - (test.durationMinutes * 60 - resume.secondsLeft) * 1000;
  }, [resume, test.durationMinutes]);

  // If a resumed attempt already had no time remaining, submit immediately
  // instead of waiting for the next 1s timer tick — otherwise the student
  // could briefly answer questions during expired time.
  useEffect(() => {
    if (resume && resume.secondsLeft <= 0 && phase === "taking") {
      void submitAttempt();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startAttempt() {
    setError("");
    const res = await fetch(`${BASE}/api/v1/mock-tests/${test.id}/start`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Could not start test"); return; }
    setAttemptId(data.attemptId);
    startTimeRef.current = Date.now();
    setPhase("taking");
  }

  function selectAnswer(questionId: string, opt: Option | null) {
    setAnswers((a) => ({ ...a, [questionId]: opt }));
    saveAnswer(questionId, opt, marked.has(questionId));
  }

  function toggleMark(questionId: string) {
    setMarked((m) => {
      const n = new Set(m);
      const next = !n.has(questionId);
      if (next) n.add(questionId); else n.delete(questionId);
      saveAnswer(questionId, answers[questionId] ?? null, next, true);
      return n;
    });
  }

  async function submitAttempt() {
    if (!attemptId || phase === "submitting") return;
    setPhase("submitting");
    const timeSpentSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const res = await fetch(`${BASE}/api/v1/mock-tests/attempts/${attemptId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers, timeSpentSeconds }),
    });
    const data = await res.json();
    if (!res.ok && res.status !== 409) {
      setError(data.error ?? "Submission failed");
      setPhase("taking");
      return;
    }
    router.push(`/portal/student/mock-tests/${test.id}/result/${attemptId}`);
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  const palette = useMemo(() => questions.map((q) => {
    const a = answers[q.id];
    const m = marked.has(q.id);
    if (m && a) return "answered-marked";
    if (m) return "marked";
    if (a) return "answered";
    return "unseen";
  }), [questions, answers, marked]);

  if (phase === "ready") {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">{test.title}</h1>
          <p className="text-slate-500 text-sm mt-1">{test.subject} · {test.examType}</p>

          <div className="grid grid-cols-3 gap-3 my-5 py-4 border-y border-slate-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">{questions.length}</div>
              <div className="text-xs text-slate-400 mt-0.5">Questions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">{test.durationMinutes}m</div>
              <div className="text-xs text-slate-400 mt-0.5">Duration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">{questions.length * test.marksPerQuestion}</div>
              <div className="text-xs text-slate-400 mt-0.5">Max Marks</div>
            </div>
          </div>

          <div className="bg-[var(--color-slate-light)] rounded-xl p-4 text-sm text-slate-600 space-y-1.5 mb-5">
            <p className="font-semibold text-[var(--color-navy)]">Instructions</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>+{test.marksPerQuestion} for correct, −{(test.marksPerQuestion * test.negativeMarkingPercent / 100).toFixed(2)} for wrong, 0 for skipped</li>
              <li>You can navigate freely between questions and mark them for review</li>
              <li>The test will auto-submit when the timer hits zero</li>
              <li>Do not refresh or close the tab — your answers will be lost</li>
              {test.instructions && <li>{test.instructions}</li>}
            </ul>
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2 mb-3">{error}</p>}
          <button onClick={startAttempt} className="w-full btn-gold py-3 text-base font-semibold">
            Start Test
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card flex items-center justify-between gap-3 sticky top-0 z-10 backdrop-blur bg-white/95">
        <div className="min-w-0">
          <div className="text-xs text-slate-400">{test.title}</div>
          <div className="font-bold text-sm text-[var(--color-navy)]">Question {currentIdx + 1} of {questions.length}</div>
        </div>
        <div className="flex items-center gap-2">
          <span
            aria-live="polite"
            className={`hidden sm:inline-flex items-center gap-1 text-[11px] ${
              saveState === "error" ? "text-[var(--color-maroon)]"
              : saveState === "saving" ? "text-slate-400"
              : saveState === "saved" ? "text-[var(--color-teal)]"
              : "text-slate-300"
            }`}
            title={saveState === "error" ? "Could not save your last answer — check your connection" : "Your answers are auto-saved"}
          >
            {saveState === "error" ? <CloudOff size={12} /> : <Cloud size={12} />}
            {saveState === "saving" ? "Saving…"
              : saveState === "saved" ? "Saved"
              : saveState === "error" ? "Save failed"
              : "Auto-save"}
          </span>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-bold text-sm ${
            secondsLeft < 60 ? "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)] animate-pulse"
            : secondsLeft < 300 ? "bg-[var(--color-gold)]/15 text-[var(--color-navy)]"
            : "bg-[var(--color-teal)]/10 text-[var(--color-teal)]"
          }`}>
            <Clock size={14} />{mm}:{ss}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-4">
        {/* Question + options */}
        <div className="card">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="text-slate-400">Q{current.questionNumber}{current.topic && ` · ${current.topic}`}</span>
            <button
              onClick={() => toggleMark(current.id)}
              className={`flex items-center gap-1 text-xs font-semibold ${marked.has(current.id) ? "text-[var(--color-gold)]" : "text-slate-400 hover:text-[var(--color-gold)]"}`}
            >
              <Flag size={12} />{marked.has(current.id) ? "Marked" : "Mark for Review"}
            </button>
          </div>
          <div className="text-[var(--color-navy)] font-medium mb-3">
            <RichText>{current.questionText}</RichText>
          </div>
          {current.imageUrl && (
            <img src={current.imageUrl} alt="Question diagram"
              className="max-w-full max-h-72 rounded-lg border border-slate-100 mb-5 mx-auto block" />
          )}
          <div className="space-y-2">
            {(["A", "B", "C", "D"] as const).map((opt) => {
              const text = { A: current.optionA, B: current.optionB, C: current.optionC, D: current.optionD }[opt];
              const optImg = { A: current.optionAImageUrl, B: current.optionBImageUrl, C: current.optionCImageUrl, D: current.optionDImageUrl }[opt];
              const selected = answers[current.id] === opt;
              return (
                <label key={opt} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  selected ? "border-[var(--color-teal)] bg-[var(--color-teal)]/5" : "border-slate-200 hover:border-slate-300"
                }`}>
                  <input type="radio" name={current.id} value={opt} checked={selected}
                    onChange={() => selectAnswer(current.id, opt)}
                    className="mt-1 accent-[var(--color-teal)]" />
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-xs text-slate-400 mr-2">{opt}.</span>
                    {text && <RichText className="text-sm text-slate-700">{text}</RichText>}
                    {optImg && (
                      <img src={optImg} alt={`Option ${opt}`}
                        className="max-h-40 rounded border border-slate-100 mt-1.5" />
                    )}
                  </div>
                </label>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              disabled={currentIdx === 0}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-30 flex items-center gap-1"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <button
              onClick={() => selectAnswer(current.id, null)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Clear answer
            </button>
            {currentIdx < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
                className="px-3 py-2 rounded-lg text-sm font-semibold bg-[var(--color-teal)] text-white hover:bg-[var(--color-teal-light)] flex items-center gap-1"
              >
                Next <ChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={() => { if (confirm(`Submit test? You answered ${answeredCount} of ${questions.length}.`)) submitAttempt(); }}
                className="px-3 py-2 rounded-lg text-sm font-semibold bg-[var(--color-maroon)] text-white hover:opacity-90"
              >
                Submit Test
              </button>
            )}
          </div>
        </div>

        {/* Question palette */}
        <div className="card h-fit lg:sticky lg:top-20">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm text-[var(--color-navy)]">Questions</h3>
            <span className="text-xs text-slate-400">{answeredCount}/{questions.length}</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5 mb-3">
            {questions.map((q, i) => {
              const state = palette[i];
              const isCurrent = i === currentIdx;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(i)}
                  className={`aspect-square rounded-lg text-xs font-bold transition-all ${
                    isCurrent ? "ring-2 ring-[var(--color-navy)]" : ""
                  } ${
                    state === "answered-marked" ? "bg-purple-500 text-white"
                    : state === "marked" ? "bg-[var(--color-gold)] text-white"
                    : state === "answered" ? "bg-[var(--color-teal)] text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="space-y-1 text-[10px] text-slate-500">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[var(--color-teal)]" />Answered</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[var(--color-gold)]" />Marked for review</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-purple-500" />Answered + Marked</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-200" />Not answered</div>
          </div>

          <button
            onClick={() => { if (confirm(`Submit test now? You answered ${answeredCount} of ${questions.length}.`)) submitAttempt(); }}
            disabled={phase === "submitting"}
            className="w-full mt-3 btn-gold py-2 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {phase === "submitting" ? <><AlertCircle size={14} className="animate-spin" />Submitting…</> : <><CheckCircle size={14} />Submit Test</>}
          </button>
          {error && <p className="text-red-600 text-xs mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
}

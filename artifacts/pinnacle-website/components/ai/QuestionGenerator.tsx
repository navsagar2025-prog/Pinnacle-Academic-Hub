"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Loader2,
  Check,
  X,
  Trash2,
  Save,
  ChevronDown,
  AlertCircle,
  Edit3,
  RotateCcw,
} from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

const MODEL_GROUPS = [
  {
    provider: "openai",
    label: "OpenAI",
    color: "#10a37f",
    models: [
      { id: "gpt-4o", label: "GPT-4o" },
      { id: "gpt-4o-mini", label: "GPT-4o Mini" },
    ],
  },
  {
    provider: "gemini",
    label: "Gemini",
    color: "#4285f4",
    models: [
      { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
      { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
    ],
  },
  {
    provider: "anthropic",
    label: "Claude",
    color: "#d97706",
    models: [
      { id: "claude-sonnet-4-5", label: "Claude Sonnet 4.5" },
      { id: "claude-haiku-3-5", label: "Claude Haiku 3.5" },
    ],
  },
  {
    provider: "openrouter",
    label: "OpenRouter",
    color: "#7c3aed",
    models: [
      { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B" },
      { id: "deepseek/deepseek-r1", label: "DeepSeek R1" },
    ],
  },
];

const SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Biology"];
const TOPICS: Record<string, string[]> = {
  Physics: ["Mechanics", "Waves & Oscillations", "Optics", "Electrostatics", "Current Electricity", "Magnetism", "Electromagnetic Induction", "Modern Physics", "Thermodynamics", "Semiconductors", "Nuclear Physics", "Fluid Mechanics", "Gravitation", "Rotational Motion", "Units & Dimensions"],
  Chemistry: ["Atomic Structure", "Chemical Bonding", "Periodic Table", "Thermodynamics", "Equilibrium", "Electrochemistry", "Chemical Kinetics", "Organic Chemistry", "Coordination Compounds", "Solutions", "Solid State", "p-Block Elements", "d-Block Elements", "Biomolecules", "Polymers", "Surface Chemistry"],
  Mathematics: ["Algebra", "Calculus", "Coordinate Geometry", "Trigonometry", "Probability & Statistics", "Vectors & 3D Geometry", "Matrices & Determinants", "Sequences & Series", "Complex Numbers", "Differential Equations", "Permutations & Combinations", "Sets & Relations", "Limits & Continuity", "Linear Programming"],
  Biology: ["Cell Biology", "Genetics & Heredity", "Molecular Biology", "Human Physiology", "Plant Physiology", "Ecology", "Evolution", "Biotechnology", "Human Health & Disease", "Reproduction", "Plant Anatomy", "Animal Kingdom", "Microorganisms", "Biodiversity"],
};

interface GeneratedQuestion {
  questionText: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: string;
  solution: string;
  difficulty: string;
  selected: boolean;
  editing: boolean;
}

export default function QuestionGenerator() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("gpt-4o");
  const [subject, setSubject] = useState("Physics");
  const [topic, setTopic] = useState("Mechanics");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | "mixed">("mixed");
  const [count, setCount] = useState(5);
  const [classGrade, setClassGrade] = useState("11");
  const [examType, setExamType] = useState("JEE Main");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [rawOutput, setRawOutput] = useState("");
  const [error, setError] = useState("");
  const [saveResult, setSaveResult] = useState<{ inserted: number; errors: number } | null>(null);
  const [modelOpen, setModelOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const modelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const sp = localStorage.getItem("ai_provider");
      const sm = localStorage.getItem("ai_model");
      if (sp && sm) { setProvider(sp); setModel(sm); }
    } catch {}
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) setModelOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const topics = TOPICS[subject] ?? [];
    if (topics.length > 0 && !topics.includes(topic)) {
      setTopic(topics[0]);
    }
  }, [subject, topic]);

  const generate = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    setGenerating(true);
    setError("");
    setQuestions([]);
    setRawOutput("");
    setSaveResult(null);

    try {
      const res = await fetch(`${BASE}/api/v1/ai/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          model,
          tool: "question_generator",
          context: { subject, topic, difficulty, count, classGrade, examType },
        }),
        signal: abort.signal,
      });

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "Request failed");
        setError(errText);
        setGenerating(false);
        return;
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const json = JSON.parse(line.slice(6));
            if (json.content) {
              fullText += json.content;
              setRawOutput(fullText);
            }
            if (json.error) {
              setError(json.error);
              setGenerating(false);
              return;
            }
          } catch {}
        }
      }

      const jsonMatch = fullText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        setError("AI did not return valid JSON. Please try again.");
        setGenerating(false);
        return;
      }

      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (!Array.isArray(parsed)) throw new Error("Not an array");
        const qs: GeneratedQuestion[] = parsed
          .filter((q: Record<string, unknown>) => q.questionText && q.options && q.correctAnswer)
          .map((q: Record<string, unknown>) => ({
            questionText: String(q.questionText),
            options: q.options as { A: string; B: string; C: string; D: string },
            correctAnswer: String(q.correctAnswer).toUpperCase(),
            solution: String(q.solution ?? ""),
            difficulty: String(q.difficulty ?? (difficulty === "mixed" ? "medium" : difficulty)),
            selected: true,
            editing: false,
          }));
        setQuestions(qs);
        setRawOutput("");
      } catch {
        setError("Failed to parse AI response as questions. Raw output is shown below.");
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError("Connection error. Please try again.");
      }
    } finally {
      setGenerating(false);
    }
  }, [provider, model, subject, topic, difficulty, count, classGrade, examType]);

  const toggleSelect = (idx: number) => {
    setQuestions((prev) => prev.map((q, i) => i === idx ? { ...q, selected: !q.selected } : q));
  };

  const removeQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleEdit = (idx: number) => {
    setQuestions((prev) => prev.map((q, i) => i === idx ? { ...q, editing: !q.editing } : q));
  };

  const updateQuestion = (idx: number, field: string, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== idx) return q;
        if (field.startsWith("options.")) {
          const key = field.split(".")[1];
          return { ...q, options: { ...q.options, [key]: value } };
        }
        return { ...q, [field]: value };
      })
    );
  };

  const saveToBank = useCallback(async () => {
    const selected = questions.filter((q) => q.selected);
    if (selected.length === 0) return;

    setSaving(true);
    setError("");
    setSaveResult(null);

    try {
      const rows = selected.map((q) => ({
        subject,
        topic,
        classGrade,
        difficulty: q.difficulty,
        type: "mcq",
        question: q.questionText,
        A: q.options.A,
        B: q.options.B,
        C: q.options.C,
        D: q.options.D,
        correct: q.correctAnswer,
        solution: q.solution,
        marks: 4,
      }));

      const res = await fetch(`${BASE}/api/v1/question-bank/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, commit: true }),
      });

      const data = await res.json();
      if (data.success) {
        setSaveResult({ inserted: data.inserted, errors: data.errorCount });
        setQuestions([]);
        router.refresh();
      } else {
        setError(data.error ?? "Failed to save questions");
      }
    } catch {
      setError("Failed to save questions. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [questions, subject, topic, classGrade, router]);

  const selectedCount = questions.filter((q) => q.selected).length;
  const currentGroup = MODEL_GROUPS.find((g) => g.provider === provider);
  const currentModel = currentGroup?.models.find((m) => m.id === model);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-gold text-sm px-4 py-2 flex items-center gap-1.5"
      >
        <Sparkles size={16} /> Generate with AI
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-[var(--color-gold)]" />
            <h2 className="text-lg font-bold text-[var(--color-navy)]">AI Question Generator</h2>
          </div>
          <button onClick={() => { setOpen(false); setQuestions([]); setError(""); setSaveResult(null); }} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {saveResult && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
              <Check size={16} /> Saved {saveResult.inserted} question(s) to the Question Bank!
              {saveResult.errors > 0 && <span className="text-amber-600">({saveResult.errors} skipped)</span>}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Subject</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Topic</label>
              <select value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                {(TOPICS[subject] ?? []).map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as typeof difficulty)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option value="mixed">Mixed</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Count (1-20)</label>
              <input type="number" min={1} max={20} value={count} onChange={(e) => setCount(Math.min(20, Math.max(1, Number(e.target.value))))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Class</label>
              <select value={classGrade} onChange={(e) => setClassGrade(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option value="11">Class 11</option>
                <option value="12">Class 12</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Exam Style</label>
              <select value={examType} onChange={(e) => setExamType(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option>JEE Main</option>
                <option>JEE Advanced</option>
                <option>NEET</option>
                <option>CBSE Board</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative" ref={modelRef}>
              <button
                onClick={() => setModelOpen(!modelOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm hover:border-slate-300"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentGroup?.color }} />
                <span className="text-slate-600">{currentGroup?.label} · {currentModel?.label}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>
              {modelOpen && (
                <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl w-72 overflow-hidden">
                  {MODEL_GROUPS.map((group) => (
                    <div key={group.provider}>
                      <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100">
                        <span className="text-xs font-semibold text-slate-500 uppercase">{group.label}</span>
                      </div>
                      {group.models.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => {
                            setProvider(group.provider);
                            setModel(m.id);
                            setModelOpen(false);
                            try { localStorage.setItem("ai_provider", group.provider); localStorage.setItem("ai_model", m.id); } catch {}
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${provider === group.provider && model === m.id ? "text-[var(--color-navy)] font-medium bg-blue-50" : "text-slate-700"}`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={generate}
              disabled={generating}
              className="flex items-center gap-2 px-5 py-2 bg-[var(--color-navy)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-navy)]/90 disabled:opacity-50 transition-colors"
            >
              {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {generating ? "Generating..." : "Generate Questions"}
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {generating && rawOutput && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-600 max-h-40 overflow-y-auto whitespace-pre-wrap">
              {rawOutput}
              <span className="inline-block w-1 h-3 bg-[var(--color-teal)] animate-pulse ml-0.5" />
            </div>
          )}

          {rawOutput && !generating && questions.length === 0 && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-600 max-h-60 overflow-y-auto whitespace-pre-wrap">
              {rawOutput}
            </div>
          )}

          {questions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700">
                  {questions.length} question(s) generated · {selectedCount} selected
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setQuestions((prev) => prev.map((q) => ({ ...q, selected: true })))}
                    className="text-xs text-[var(--color-teal)] hover:underline"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setQuestions((prev) => prev.map((q) => ({ ...q, selected: false })))}
                    className="text-xs text-slate-500 hover:underline"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {questions.map((q, idx) => (
                <div
                  key={idx}
                  className={`border rounded-xl p-4 transition-colors ${q.selected ? "border-[var(--color-teal)]/30 bg-teal-50/30" : "border-slate-200 bg-white opacity-60"}`}
                >
                  <div className="flex items-start gap-3">
                    <button onClick={() => toggleSelect(idx)} className="mt-1 flex-shrink-0">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${q.selected ? "bg-[var(--color-teal)] border-[var(--color-teal)]" : "border-slate-300"}`}>
                        {q.selected && <Check size={12} className="text-white" />}
                      </div>
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-slate-500">Q{idx + 1}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${q.difficulty === "easy" ? "bg-green-100 text-green-700" : q.difficulty === "hard" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>
                          {q.difficulty}
                        </span>
                        <span className="text-xs text-slate-400">Answer: {q.correctAnswer}</span>
                      </div>

                      {q.editing ? (
                        <div className="space-y-2 mt-2">
                          <textarea
                            value={q.questionText}
                            onChange={(e) => updateQuestion(idx, "questionText", e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                            rows={2}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            {(["A", "B", "C", "D"] as const).map((key) => (
                              <div key={key} className="flex items-center gap-1">
                                <span className={`text-xs font-bold w-5 ${q.correctAnswer === key ? "text-green-600" : "text-slate-500"}`}>{key}.</span>
                                <input
                                  value={q.options[key]}
                                  onChange={(e) => updateQuestion(idx, `options.${key}`, e.target.value)}
                                  className="flex-1 border border-slate-200 rounded px-2 py-1 text-sm"
                                />
                              </div>
                            ))}
                          </div>
                          <select
                            value={q.correctAnswer}
                            onChange={(e) => updateQuestion(idx, "correctAnswer", e.target.value)}
                            className="border border-slate-200 rounded px-2 py-1 text-sm"
                          >
                            {["A", "B", "C", "D"].map((k) => <option key={k}>{k}</option>)}
                          </select>
                          <textarea
                            value={q.solution}
                            onChange={(e) => updateQuestion(idx, "solution", e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                            rows={2}
                            placeholder="Solution..."
                          />
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-[var(--color-navy)]">{q.questionText}</p>
                          <div className="grid grid-cols-2 gap-1 mt-2">
                            {(["A", "B", "C", "D"] as const).map((key) => (
                              <div key={key} className={`text-xs px-2 py-1 rounded ${q.correctAnswer === key ? "bg-green-100 text-green-800 font-medium" : "text-slate-600"}`}>
                                {key}. {q.options[key]}
                              </div>
                            ))}
                          </div>
                          {q.solution && (
                            <p className="text-xs text-slate-500 mt-2 italic">{q.solution}</p>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <button onClick={() => toggleEdit(idx)} className="p-1.5 text-slate-400 hover:text-[var(--color-teal)] rounded hover:bg-slate-100" title="Edit">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => removeQuestion(idx)} className="p-1.5 text-slate-400 hover:text-red-500 rounded hover:bg-slate-100" title="Remove">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {questions.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
            <button
              onClick={generate}
              disabled={generating}
              className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-[var(--color-navy)] transition-colors"
            >
              <RotateCcw size={14} /> Regenerate
            </button>
            <button
              onClick={saveToBank}
              disabled={saving || selectedCount === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-[var(--color-teal)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-teal)]/90 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? "Saving..." : `Save ${selectedCount} Question(s) to Bank`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

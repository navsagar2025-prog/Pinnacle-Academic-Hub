"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Trash2 } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

type Initial = {
  id: string;
  subject: string;
  topic: string | null;
  classGrade: string | null;
  year: number | null;
  difficulty: "easy" | "medium" | "hard";
  questionType: "mcq" | "short" | "long" | "numerical";
  questionText: string;
  options: unknown;
  correctAnswer: string;
  solution: string | null;
  imageUrl: string | null;
  solutionImageUrl: string | null;
  examName: string | null;
  marks: number;
  isPublished: boolean;
};

const SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Biology", "English", "Other"];

export function QuestionEditor({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const initOpts = (initial?.options as Record<string, string> | null) ?? {};
  const [form, setForm] = useState({
    subject: initial?.subject ?? "Physics",
    topic: initial?.topic ?? "",
    classGrade: initial?.classGrade ?? "12",
    year: initial?.year?.toString() ?? "",
    difficulty: initial?.difficulty ?? "medium",
    questionType: initial?.questionType ?? "mcq",
    questionText: initial?.questionText ?? "",
    optionA: initOpts.A ?? "",
    optionB: initOpts.B ?? "",
    optionC: initOpts.C ?? "",
    optionD: initOpts.D ?? "",
    correctAnswer: initial?.correctAnswer ?? "A",
    solution: initial?.solution ?? "",
    imageUrl: initial?.imageUrl ?? "",
    solutionImageUrl: initial?.solutionImageUrl ?? "",
    examName: initial?.examName ?? "",
    marks: initial?.marks?.toString() ?? "4",
    isPublished: initial?.isPublished ?? true,
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    const payload: Record<string, unknown> = {
      subject: form.subject,
      topic: form.topic.trim() || null,
      classGrade: form.classGrade.trim() || null,
      year: form.year ? Number(form.year) : null,
      difficulty: form.difficulty,
      questionType: form.questionType,
      questionText: form.questionText,
      correctAnswer: form.correctAnswer,
      solution: form.solution.trim() || null,
      imageUrl: form.imageUrl.trim() || null,
      solutionImageUrl: form.solutionImageUrl.trim() || null,
      examName: form.examName.trim() || null,
      marks: Number(form.marks) || 4,
      isPublished: form.isPublished,
    };
    if (form.questionType === "mcq") {
      payload.options = { A: form.optionA, B: form.optionB, C: form.optionC, D: form.optionD };
    } else {
      payload.options = null;
    }

    const url = initial ? `${BASE}/api/v1/question-bank/${initial.id}` : `${BASE}/api/v1/question-bank`;
    const method = initial ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Failed to save"); return; }
    router.push("/portal/admin/question-bank");
    router.refresh();
  }

  async function destroy() {
    if (!initial || !confirm("Delete this question? This cannot be undone.")) return;
    const res = await fetch(`${BASE}/api/v1/question-bank/${initial.id}`, { method: "DELETE" });
    if (res.ok) { router.push("/portal/admin/question-bank"); router.refresh(); }
  }

  const cls = "w-full px-3 py-2 rounded-lg border border-slate-200 text-sm";

  return (
    <form onSubmit={save} className="card space-y-4">
      {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Subject</label>
          <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={cls + " bg-white"}>
            {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Topic</label>
          <input className={cls} value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="Kinematics" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Class</label>
          <input className={cls} value={form.classGrade} onChange={(e) => setForm({ ...form, classGrade: e.target.value })} placeholder="12" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Year (PYQ)</label>
          <input className={cls} type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="2024" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Exam name (optional, for previous-year questions)</label>
        <input className={cls} value={form.examName} onChange={(e) => setForm({ ...form, examName: e.target.value })} placeholder="e.g. JEE Main 2024 Shift 1, NEET UG 2023, CBSE Board 2024" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Difficulty</label>
          <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value as never })} className={cls + " bg-white"}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Type</label>
          <select value={form.questionType} onChange={(e) => setForm({ ...form, questionType: e.target.value as never })} className={cls + " bg-white"}>
            <option value="mcq">MCQ</option>
            <option value="short">Short Answer</option>
            <option value="long">Long Answer</option>
            <option value="numerical">Numerical</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Marks</label>
          <input className={cls} type="number" min={1} value={form.marks} onChange={(e) => setForm({ ...form, marks: e.target.value })} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Question</label>
        <textarea required rows={3} className={cls + " resize-y"} value={form.questionText} onChange={(e) => setForm({ ...form, questionText: e.target.value })} placeholder="Type the question text…" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Question image URL (optional)</label>
        <input className={cls} value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://…" />
      </div>

      {form.questionType === "mcq" ? (
        <div className="space-y-2">
          {(["A", "B", "C", "D"] as const).map((k) => (
            <div key={k} className="flex items-center gap-2">
              <span className="font-mono text-sm text-slate-500 w-6 text-center">{k}.</span>
              <input className={cls + " flex-1"} required value={form[`option${k}` as `optionA`]}
                onChange={(e) => setForm({ ...form, [`option${k}`]: e.target.value } as never)} placeholder={`Option ${k}`} />
              <label className="flex items-center gap-1 text-xs text-slate-500">
                <input type="radio" name="correct" checked={form.correctAnswer === k} onChange={() => setForm({ ...form, correctAnswer: k })} />
                Correct
              </label>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Correct answer</label>
          <input className={cls} required value={form.correctAnswer} onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })} placeholder="Expected answer text or value" />
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Solution / Explanation</label>
        <textarea rows={3} className={cls + " resize-y"} value={form.solution} onChange={(e) => setForm({ ...form, solution: e.target.value })} placeholder="Step-by-step working…" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Solution image URL (optional)</label>
        <input className={cls} value={form.solutionImageUrl} onChange={(e) => setForm({ ...form, solutionImageUrl: e.target.value })} placeholder="https://…" />
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
        Published (visible to students)
      </label>

      <div className="flex justify-between gap-2 pt-2">
        {initial ? (
          <button type="button" onClick={destroy} className="text-sm font-semibold text-[var(--color-maroon)] hover:underline flex items-center gap-1">
            <Trash2 size={14} /> Delete
          </button>
        ) : <span />}
        <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-[var(--color-teal)] text-white text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50">
          <Save size={14} />{saving ? "Saving…" : "Save Question"}
        </button>
      </div>
    </form>
  );
}

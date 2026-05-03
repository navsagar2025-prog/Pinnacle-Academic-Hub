"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Eye, EyeOff } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

type Test = { id: string; title: string; isPublished: boolean; isPublic: boolean };

export function ManageTestClient({ test }: { test: Test }) {
  const router = useRouter();
  const [published, setPublished] = useState(test.isPublished);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    questionText: "", optionA: "", optionB: "", optionC: "", optionD: "",
    correctOption: "A", topic: "", explanation: "",
  });

  async function togglePublished() {
    const next = !published;
    setPublished(next);
    await fetch(`${BASE}/api/v1/mock-tests/${test.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: next }),
    });
    router.refresh();
  }

  async function addQuestion(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.questionText || !form.optionA || !form.optionB || !form.optionC || !form.optionD) {
      setError("Please fill in question text and all four options.");
      return;
    }
    const res = await fetch(`${BASE}/api/v1/mock-tests/${test.id}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed"); return; }
    setForm({ questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "A", topic: form.topic, explanation: "" });
    setAdding(true); // keep form open for rapid entry
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-semibold text-sm text-[var(--color-navy)]">Visibility</div>
          <div className="text-xs text-slate-500">
            {published ? "Live — students can take this test" : "Draft — hidden from students"}
          </div>
        </div>
        <button
          onClick={togglePublished}
          className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors ${
            published
              ? "bg-[var(--color-teal)] text-white hover:bg-[var(--color-teal-light)]"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          {published ? <Eye size={14} /> : <EyeOff size={14} />}
          {published ? "Published" : "Publish"}
        </button>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">Add Question</h2>
          <button onClick={() => setAdding((a) => !a)} className="text-xs text-[var(--color-teal)] font-semibold hover:underline">
            {adding ? "Hide" : "Show form"}
          </button>
        </div>
        {adding && (
          <form onSubmit={addQuestion} className="space-y-3">
            {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <textarea required rows={2} placeholder="Question text" value={form.questionText}
              onChange={(e) => setForm({ ...form, questionText: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(["A", "B", "C", "D"] as const).map((opt) => (
                <input key={opt} required placeholder={`Option ${opt}`}
                  value={form[`option${opt}` as const]}
                  onChange={(e) => setForm({ ...form, [`option${opt}`]: e.target.value } as typeof form)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select value={form.correctOption} onChange={(e) => setForm({ ...form, correctOption: e.target.value })}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white">
                {(["A", "B", "C", "D"] as const).map((o) => <option key={o} value={o}>Correct: {o}</option>)}
              </select>
              <input placeholder="Topic (e.g. Kinematics)" value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
            </div>
            <textarea rows={2} placeholder="Explanation (shown after submission, optional)" value={form.explanation}
              onChange={(e) => setForm({ ...form, explanation: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none" />
            <button type="submit" className="btn-gold text-sm px-4 py-2 flex items-center gap-1.5">
              <Plus size={14} /> Add Question
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

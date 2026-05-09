"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

export function AskDoubtForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ subject: "Physics", topic: "", questionText: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch(`${BASE}/api/v1/doubts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Failed to post doubt"); return; }
    setForm({ subject: form.subject, topic: "", questionText: "" });
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card space-y-3">
      {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Subject</label>
          <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white">
            {["Physics", "Chemistry", "Mathematics", "Biology", "English", "Other"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Topic (optional)</label>
          <input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}
            placeholder="e.g. Kinematics" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Your Question</label>
        <textarea required rows={4} value={form.questionText}
          onChange={(e) => setForm({ ...form, questionText: e.target.value })}
          placeholder="Describe your doubt clearly. Include relevant chapter/example numbers if any."
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none" />
      </div>
      <button type="submit" disabled={loading || !form.questionText.trim()}
        className="btn-gold px-4 py-2 text-sm flex items-center gap-1.5 disabled:opacity-50">
        <Send size={14} />{loading ? "Posting…" : "Post Doubt"}
      </button>
    </form>
  );
}

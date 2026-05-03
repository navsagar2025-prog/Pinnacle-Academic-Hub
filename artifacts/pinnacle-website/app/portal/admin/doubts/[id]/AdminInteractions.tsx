"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, CheckCircle2, RotateCcw } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

export function AnswerForm({ doubtId }: { doubtId: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    await fetch(`${BASE}/api/v1/doubts/${doubtId}/answers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answerText: text }),
    });
    setText("");
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card space-y-2 border-l-4 border-l-[var(--color-teal)]">
      <label className="block text-xs font-semibold text-slate-500">Reply as Teacher / Admin</label>
      <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)}
        placeholder="Type your reply. Posting an answer will mark this doubt as answered."
        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none" />
      <button type="submit" disabled={loading || !text.trim()}
        className="btn-gold px-4 py-2 text-sm flex items-center gap-1.5 disabled:opacity-50">
        <Send size={14} />{loading ? "Sending…" : "Post Reply"}
      </button>
    </form>
  );
}

export function ResolveButton({ doubtId, isResolved }: { doubtId: string; isResolved: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function toggle() {
    setLoading(true);
    await fetch(`${BASE}/api/v1/doubts/${doubtId}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isResolved: !isResolved }),
    });
    router.refresh();
  }
  return (
    <button onClick={toggle} disabled={loading}
      className={`w-full px-4 py-2.5 rounded-lg border-2 font-semibold text-sm flex items-center justify-center gap-1.5 transition-colors ${
        isResolved
          ? "border-slate-300 text-slate-600 hover:bg-slate-50"
          : "border-[var(--color-teal)] text-[var(--color-teal)] hover:bg-[var(--color-teal)] hover:text-white"
      }`}>
      {isResolved ? <><RotateCcw size={14} />{loading ? "Reopening…" : "Reopen Doubt"}</> : <><CheckCircle2 size={14} />{loading ? "Marking…" : "Mark as Resolved"}</>}
    </button>
  );
}

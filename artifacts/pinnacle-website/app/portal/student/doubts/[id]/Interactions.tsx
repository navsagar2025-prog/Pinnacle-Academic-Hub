"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, CheckCircle2 } from "lucide-react";

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
    <form onSubmit={submit} className="card space-y-2">
      <label className="block text-xs font-semibold text-slate-500">Add a reply / clarification</label>
      <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)}
        placeholder="Type your reply…" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none" />
      <button type="submit" disabled={loading || !text.trim()}
        className="px-4 py-2 rounded-lg bg-[var(--color-teal)] text-white text-sm font-semibold hover:bg-[var(--color-teal-light)] flex items-center gap-1.5 disabled:opacity-50">
        <Send size={14} />{loading ? "Sending…" : "Reply"}
      </button>
    </form>
  );
}

export function ResolveButton({ doubtId }: { doubtId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function resolve() {
    setLoading(true);
    await fetch(`${BASE}/api/v1/doubts/${doubtId}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isResolved: true }),
    });
    router.refresh();
  }
  return (
    <button onClick={resolve} disabled={loading}
      className="w-full px-4 py-2.5 rounded-lg border-2 border-[var(--color-teal)] text-[var(--color-teal)] font-semibold text-sm hover:bg-[var(--color-teal)] hover:text-white transition-colors flex items-center justify-center gap-1.5">
      <CheckCircle2 size={14} />{loading ? "Marking…" : "Mark as Resolved"}
    </button>
  );
}

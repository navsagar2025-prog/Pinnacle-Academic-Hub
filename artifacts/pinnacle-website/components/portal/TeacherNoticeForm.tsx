"use client";

import { useState } from "react";
import { Bell, Send } from "lucide-react";

const CATEGORIES = ["Academic", "Test", "Fee", "Event", "Admissions", "General"];

export default function TeacherNoticeForm() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("Academic");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/pinnacle-website/api/v1/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, category }),
      });
      setSubmitted(true);
      setTitle(""); setBody(""); setCategory("Academic");
      setTimeout(() => setSubmitted(false), 4000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {submitted && (
        <div className="card bg-[var(--color-teal)]/5 border-[var(--color-teal)]/20">
          <div className="flex items-center gap-2 text-[var(--color-teal)] font-semibold text-sm">
            <Bell size={16} />Notice submitted successfully! It will appear on the notice board.
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="card space-y-4">
        <h2 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">New Notice</h2>
        <div>
          <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field">
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Notice Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="input-field" placeholder="e.g. Chapter Test on 10 May 2026" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Notice Content</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} required rows={4} className="input-field resize-none" placeholder="Provide details about the notice..." />
        </div>
        <button type="submit" disabled={loading} className="btn-secondary py-2.5 px-6 disabled:opacity-60">
          <Send size={15} />{loading ? "Publishing…" : "Publish Notice"}
        </button>
      </form>
    </>
  );
}

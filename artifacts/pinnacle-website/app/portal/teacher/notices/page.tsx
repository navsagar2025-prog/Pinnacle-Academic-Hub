"use client";

import { useState } from "react";
import { Bell, Send } from "lucide-react";
import { NOTICES } from "@/lib/data";

const CATEGORIES = ["Academic", "Test", "Fee", "Event", "Admissions", "General"];

export default function TeacherNoticesPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("Academic");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setTitle(""); setBody(""); setCategory("Academic");
    setTimeout(() => setSubmitted(false), 4000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Post Notice</h1>
        <p className="text-slate-500 text-sm mt-1">Publish announcements visible to students and parents</p>
      </div>

      {submitted && (
        <div className="card bg-[var(--color-teal)]/5 border-[var(--color-teal)]/20">
          <div className="flex items-center gap-2 text-[var(--color-teal)] font-semibold text-sm">
            <Bell size={16} />Notice submitted successfully! Admin will review and publish.
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
        <button type="submit" className="btn-secondary py-2.5 px-6">
          <Send size={15} />Publish Notice
        </button>
      </form>

      <div className="card">
        <h2 className="font-bold text-[var(--color-navy)] mb-4 font-[family-name:var(--font-playfair)]">Published Notices</h2>
        <div className="space-y-3">
          {NOTICES.slice(0, 4).map((n) => (
            <div key={n.id} className="p-3 bg-[var(--color-slate-light)] rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="badge text-xs bg-[var(--color-navy)]/10 text-[var(--color-navy)]">{n.category}</span>
                <span className="text-xs text-slate-400">{new Date(n.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
              </div>
              <div className="font-semibold text-sm text-[var(--color-navy)]">{n.title}</div>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{n.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

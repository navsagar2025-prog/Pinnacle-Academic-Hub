"use client";
import { useRouter, useSearchParams } from "next/navigation";

const EXAM_TARGETS = [
  { value: "JEE_MAIN", label: "JEE Main" },
  { value: "JEE_ADVANCED", label: "JEE Advanced" },
  { value: "NEET", label: "NEET" },
  { value: "CBSE_BOARDS", label: "CBSE Boards" },
  { value: "FOUNDATION", label: "Foundation (9–10)" },
];
const SOURCES = [
  { value: "PYQ", label: "PYQ" },
  { value: "AI", label: "AI" },
  { value: "MANUAL", label: "Manual" },
  { value: "NCERT_EXEMPLAR", label: "NCERT Exemplar" },
  { value: "THIRD_PARTY_FREE", label: "Third-party (free)" },
];

export function QuestionBankFilters({
  subjects,
  topics = [],
  years,
  examNames = [],
  showPyqShortcut = false,
  showAdvanced = false,
}: {
  subjects: string[];
  topics?: string[];
  years: number[];
  examNames?: string[];
  showPyqShortcut?: boolean;
  showAdvanced?: boolean;
}) {
  const router = useRouter();
  const sp = useSearchParams();

  // Generic single-key updater. Always resets `page` so a fresh filter starts
  // at page 1 instead of stranding the user on (say) page 47 of an old result.
  function update(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value); else params.delete(key);
    // Any filter change resets pagination to page 1.
    params.delete("page");
    // Changing subject invalidates the topic selection.
    if (key === "subject") params.delete("topic");
    router.push(`?${params.toString()}`);
  }

  function togglePyq() {
    const params = new URLSearchParams(sp.toString());
    if (params.get("pyq") === "1") params.delete("pyq"); else params.set("pyq", "1");
    params.delete("page");
    router.push(`?${params.toString()}`);
  }

  const cls = "px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white";
  const pyqOn = sp.get("pyq") === "1";
  const subjectVal = sp.get("subject") ?? "All";
  const topicVal = sp.get("topic") ?? "";

  return (
    <div className="card flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Subject</label>
        <select className={cls} value={subjectVal} onChange={(e) => update("subject", e.target.value === "All" ? "" : e.target.value)}>
          <option>All</option>
          {subjects.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Topic</label>
        {subjectVal === "All" && topicVal ? (
          // Deep-link case: a `?topic=...` was applied without a subject. Show
          // the active topic as a removable pill so it isn't stranded.
          <button
            type="button"
            onClick={() => update("topic", "")}
            className="px-3 py-2 rounded-lg bg-[var(--color-maroon)]/10 text-[var(--color-maroon)] text-sm font-semibold flex items-center gap-1.5 hover:bg-[var(--color-maroon)]/20"
            title="Clear topic filter"
          >
            {topicVal}
            <span className="text-xs opacity-60">×</span>
          </button>
        ) : (
          <select
            className={cls}
            value={topicVal}
            onChange={(e) => update("topic", e.target.value)}
            disabled={subjectVal === "All" || topics.length === 0}
            title={subjectVal === "All" ? "Pick a subject first" : ""}
          >
            <option value="">{subjectVal === "All" ? "All topics" : `All ${topics.length} topics`}</option>
            {topics.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
      </div>
      <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Difficulty</label>
        <select className={cls} value={sp.get("difficulty") ?? ""} onChange={(e) => update("difficulty", e.target.value)}>
          <option value="">Any</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>
      <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Type</label>
        <select className={cls} value={sp.get("type") ?? ""} onChange={(e) => update("type", e.target.value)}>
          <option value="">Any</option>
          <option value="mcq">MCQ</option>
          <option value="short">Short Answer</option>
          <option value="long">Long Answer</option>
          <option value="numerical">Numerical</option>
        </select>
      </div>
      <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Year</label>
        <select className={cls} value={sp.get("year") ?? ""} onChange={(e) => update("year", e.target.value)}>
          <option value="">Any</option>
          {years.map((y) => <option key={y}>{y}</option>)}
        </select>
      </div>
      {examNames.length > 0 && (
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Exam</label>
          <select className={cls} value={sp.get("examName") ?? ""} onChange={(e) => update("examName", e.target.value)}>
            <option value="">Any</option>
            {examNames.map((n) => <option key={n}>{n}</option>)}
          </select>
        </div>
      )}
      {showPyqShortcut && (
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Quick</label>
          <button
            type="button"
            onClick={togglePyq}
            className={`px-3 py-2 rounded-lg text-sm font-semibold ${pyqOn ? "bg-[var(--color-gold)] text-[var(--color-navy)]" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            {pyqOn ? "✓ PYQ only" : "Previous Year Qs"}
          </button>
        </div>
      )}
      <div className="flex-1 min-w-[160px]">
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Search</label>
        <input className={cls + " w-full"} placeholder="Topic or question text…" defaultValue={sp.get("q") ?? ""}
          onKeyDown={(e) => { if (e.key === "Enter") update("q", (e.target as HTMLInputElement).value); }} />
      </div>
      {subjectVal === "All" && topicVal && (
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Active topic</label>
          <button
            type="button"
            onClick={() => update("topic", "")}
            className="px-3 py-2 rounded-lg text-sm font-semibold bg-[var(--color-navy)] text-white hover:opacity-90"
            title="Clear topic filter"
          >
            {topicVal} ✕
          </button>
        </div>
      )}
      {showAdvanced && (
        <div className="basis-full flex flex-wrap items-end gap-3 pt-3 mt-2 border-t border-slate-100">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Class</label>
            <select className={cls} value={sp.get("classGrade") ?? ""} onChange={(e) => update("classGrade", e.target.value)}>
              <option value="">Any</option>
              {["9", "10", "11", "12"].map((g) => <option key={g} value={g}>Class {g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Exam target</label>
            <select className={cls} value={sp.get("examTarget") ?? ""} onChange={(e) => update("examTarget", e.target.value)}>
              <option value="">Any</option>
              {EXAM_TARGETS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Source</label>
            <select className={cls} value={sp.get("source") ?? ""} onChange={(e) => update("source", e.target.value)}>
              <option value="">Any</option>
              {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Review</label>
            <select className={cls} value={sp.get("reviewStatus") ?? ""} onChange={(e) => update("reviewStatus", e.target.value)}>
              <option value="">Any</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Figure</label>
            <button
              type="button"
              onClick={() => update("hasFigure", sp.get("hasFigure") === "1" ? "" : "1")}
              className={`px-3 py-2 rounded-lg text-sm font-semibold ${sp.get("hasFigure") === "1" ? "bg-[var(--color-teal)] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {sp.get("hasFigure") === "1" ? "✓ Has figure" : "Has figure"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

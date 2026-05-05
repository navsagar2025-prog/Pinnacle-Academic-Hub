"use client";
import { useRouter, useSearchParams } from "next/navigation";

export function QuestionBankFilters({
  subjects,
  years,
  examNames = [],
  topicsForSubject = [],
  showPyqShortcut = false,
}: {
  subjects: string[];
  years: number[];
  examNames?: string[];
  topicsForSubject?: string[];
  showPyqShortcut?: boolean;
}) {
  const router = useRouter();
  const sp = useSearchParams();

  // Generic single-key updater. Always resets `page` so a fresh filter starts
  // at page 1 instead of stranding the user on (say) page 47 of an old result.
  function update(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value); else params.delete(key);
    params.delete("page");
    router.push(`?${params.toString()}`);
  }

  // Switching subjects also clears the topic filter — a topic from one
  // subject rarely makes sense once you switch to another.
  function updateSubject(value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set("subject", value); else params.delete("subject");
    params.delete("topic");
    params.delete("page");
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
  const currentSubject = sp.get("subject") ?? "All";
  const currentTopic = sp.get("topic") ?? "";

  return (
    <div className="card flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Subject</label>
        <select className={cls} value={currentSubject} onChange={(e) => updateSubject(e.target.value === "All" ? "" : e.target.value)}>
          <option>All</option>
          {subjects.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Topic</label>
        <select
          className={cls + " max-w-[220px]"}
          value={currentTopic}
          onChange={(e) => update("topic", e.target.value)}
          disabled={topicsForSubject.length === 0}
        >
          <option value="">{currentSubject === "All" ? "Pick a subject first" : "All topics"}</option>
          {topicsForSubject.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
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
    </div>
  );
}

export function TopicsSummary({
  subject,
  topics,
  activeTopic,
}: {
  subject: string;
  topics: Array<{ topic: string; count: number }>;
  activeTopic: string | null;
}) {
  const router = useRouter();
  const sp = useSearchParams();

  function pickTopic(t: string) {
    const params = new URLSearchParams(sp.toString());
    if (activeTopic === t) params.delete("topic"); else params.set("topic", t);
    params.delete("page");
    router.push(`?${params.toString()}`);
  }

  if (topics.length === 0) return null;

  return (
    <div className="card">
      <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Topics in {subject}</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
        {topics.map((t) => {
          const active = activeTopic === t.topic;
          return (
            <button
              key={t.topic}
              onClick={() => pickTopic(t.topic)}
              className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-xs text-left transition-colors ${
                active
                  ? "bg-[var(--color-navy)] text-white"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span className="truncate">{t.topic}</span>
              <span className={`shrink-0 font-mono ${active ? "text-white/80" : "text-slate-400"}`}>{t.count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

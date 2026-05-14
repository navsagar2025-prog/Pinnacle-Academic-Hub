import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Filter, Globe, Loader2, Search, Sparkles, Timer } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

type Track = "SSC_CGL" | "SSC_CHSL";
type Lang = "en" | "hi";

type SscQuestion = {
  id: string;
  subject: string;
  topic: string | null;
  difficulty: "easy" | "medium" | "hard";
  questionType: "mcq" | "short" | "long" | "numerical";
  questionText: string;
  options: Record<string, string> | null;
  correctAnswer: string;
  solution: string | null;
  marks: number;
  language: string;
  questionTextHi: string | null;
  optionsHi: Record<string, string> | null;
  solutionHi: string | null;
  examTarget: string[] | null;
};

type ExamTemplate = {
  id: string;
  code: string;
  name: string;
  examFamily: string;
  tier: string | null;
  totalDurationMinutes: number;
  marksPerCorrect: string;
  negativeMarks: string;
  description: string | null;
  totalQuestions: number;
  sections: { id: string; name: string; subject: string; questionCount: number; durationMinutes: number | null }[];
};

const SUBJECTS = ["", "Quantitative Aptitude", "Reasoning", "English", "General Awareness"];
const DIFFICULTIES = ["", "easy", "medium", "hard"];

const diffColor: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-rose-100 text-rose-700",
};

function diff(d: string) { return diffColor[d] ?? "bg-slate-100 text-slate-700"; }

function buildBase() {
  // Same convention as portalUtils: VITE_API_BASE or relative.
  const explicit = import.meta.env.VITE_API_BASE as string | undefined;
  return explicit ? explicit.replace(/\/+$/, "") : "";
}

function localized(q: SscQuestion, lang: Lang): { text: string; opts: Record<string, string> | null; sol: string | null } {
  if (lang === "hi" && q.questionTextHi) {
    return { text: q.questionTextHi, opts: q.optionsHi, sol: q.solutionHi };
  }
  return { text: q.questionText, opts: q.options, sol: q.solution };
}

export default function SscPage() {
  const [track, setTrack] = useState<Track>("SSC_CGL");
  const [subject, setSubject] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [lang, setLang] = useState<Lang>("en");
  const [questions, setQuestions] = useState<SscQuestion[]>([]);
  const [templates, setTemplates] = useState<ExamTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [picked, setPicked] = useState<Record<string, string>>({});

  const base = buildBase();

  // Load templates once on track change
  useEffect(() => {
    let cancelled = false;
    fetch(`${base}/api/v1/public/ssc/exam-templates?family=${track}`)
      .then((r) => r.json())
      .then((j) => { if (!cancelled && j?.ok) setTemplates(j.items ?? []); })
      .catch(() => { /* silent */ });
    return () => { cancelled = true; };
  }, [track, base]);

  // Load questions on filter change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const sp = new URLSearchParams({ track, page: String(page), pageSize: "10" });
    if (subject) sp.set("subject", subject);
    if (difficulty) sp.set("difficulty", difficulty);
    if (search.trim()) sp.set("search", search.trim());
    fetch(`${base}/api/v1/public/ssc/question-bank?${sp.toString()}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        setQuestions(j?.items ?? []);
        setTotal(j?.total ?? 0);
        setRevealed({});
        setPicked({});
      })
      .catch(() => { /* silent */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [track, subject, difficulty, search, page, base]);

  const totalPages = Math.max(1, Math.ceil(total / 10));
  const hasFilters = subject || difficulty || search;

  const ssoLink = useMemo(() => `/sign-in?after_sign_in_url=${encodeURIComponent("/portal/student?tab=question-bank")}`, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[var(--color-navy)] via-[#0f2a72] to-[var(--color-teal)] text-white">
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur rounded-full px-3 py-1 text-xs font-semibold mb-4">
            <Sparkles size={14} className="text-[var(--color-gold)]" /> NEW · SSC CGL & CHSL Question Bank
          </div>
          <h1 className="text-3xl md:text-5xl font-bold font-[family-name:var(--font-playfair)] leading-tight max-w-3xl">
            Crack SSC CGL & CHSL with PYQ-flavoured practice — bilingual.
          </h1>
          <p className="text-white/80 max-w-2xl mt-3 text-sm md:text-base">
            Quantitative Aptitude, Reasoning, English, General Awareness. Switch any question between English & हिंदी with one click.
            Sign in to save bookmarks and track attempts.
          </p>

          <div className="inline-flex bg-white/10 rounded-xl p-1 mt-6">
            {(["SSC_CGL", "SSC_CHSL"] as Track[]).map((t) => (
              <button key={t} onClick={() => { setTrack(t); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${track === t ? "bg-white text-[var(--color-navy)]" : "text-white/80 hover:text-white"}`}>
                {t === "SSC_CGL" ? "SSC CGL" : "SSC CHSL"}
              </button>
            ))}
          </div>
        </div>
      </section>

      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        {/* Mock test templates */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-[var(--color-navy)] mb-1">Mock Test Blueprints</h2>
          <p className="text-sm text-slate-500 mb-4">Official sectional layout, timing & marking — practise to the real paper.</p>
          {templates.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No blueprints published for this track yet.</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {templates.map((t) => (
                <div key={t.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-[var(--color-navy)] text-sm">{t.name}</h3>
                    <span className="text-[10px] font-bold text-[var(--color-teal)] bg-teal-50 rounded-full px-2 py-0.5">{t.tier}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                    <span className="flex items-center gap-1"><Timer size={11} /> {t.totalDurationMinutes} min</span>
                    <span>· {t.totalQuestions} Qs</span>
                    <span>· +{t.marksPerCorrect} / -{t.negativeMarks}</span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-3 mb-3">{t.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {t.sections.map((s) => (
                      <span key={s.id} className="text-[10px] bg-slate-100 text-slate-600 rounded px-2 py-0.5">
                        {s.name} · {s.questionCount}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Filter bar */}
        <section className="bg-white rounded-2xl border border-slate-200 p-4 mb-5">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1"><Filter size={12} /> Subject:</span>
            {SUBJECTS.map((s) => (
              <button key={s || "all"} onClick={() => { setSubject(s); setPage(1); }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${subject === s ? "bg-[var(--color-navy)] text-white border-[var(--color-navy)]" : "border-slate-200 text-slate-600 hover:border-slate-400"}`}>
                {s || "All"}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { setSearch(searchInput); setPage(1); } }}
                placeholder="Search English or हिंदी keywords…"
                className="w-full border border-slate-200 rounded-lg pl-8 pr-24 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]"
              />
              <button onClick={() => { setSearch(searchInput); setPage(1); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-[var(--color-teal)] text-white text-xs font-semibold px-3 py-1 rounded-md">
                Search
              </button>
            </div>
            <select value={difficulty} onChange={(e) => { setDifficulty(e.target.value); setPage(1); }}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
              {DIFFICULTIES.map((d) => <option key={d || "all"} value={d}>{d ? d[0].toUpperCase() + d.slice(1) : "All Difficulties"}</option>)}
            </select>
            <div className="inline-flex bg-slate-100 rounded-lg p-0.5">
              {(["en", "hi"] as Lang[]).map((l) => (
                <button key={l} onClick={() => setLang(l)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 ${lang === l ? "bg-white text-[var(--color-navy)] shadow-sm" : "text-slate-500"}`}>
                  <Globe size={11} /> {l === "en" ? "English" : "हिंदी"}
                </button>
              ))}
            </div>
            {hasFilters && (
              <button onClick={() => { setSubject(""); setDifficulty(""); setSearch(""); setSearchInput(""); setPage(1); }}
                className="text-xs text-slate-500 hover:text-slate-700 underline">
                Clear
              </button>
            )}
          </div>
        </section>

        {/* Question list */}
        <section>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 className="animate-spin mr-2" size={18} /> Loading questions…
            </div>
          ) : questions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <p className="text-slate-500 mb-1">No questions match these filters.</p>
              <p className="text-xs text-slate-400">Try clearing filters or switching the track.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q, idx) => {
                const view = localized(q, lang);
                const isRevealed = !!revealed[q.id];
                const userPick = picked[q.id];
                const isMcq = q.questionType === "mcq" && view.opts;
                return (
                  <article key={q.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-slate-300 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="bg-slate-100 text-slate-700 rounded px-2 py-0.5 font-semibold">Q{(page - 1) * 10 + idx + 1}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-600 font-medium">{q.subject}</span>
                        {q.topic && <><span className="text-slate-400">·</span><span className="text-slate-500">{q.topic}</span></>}
                        <span className={`rounded-full px-2 py-0.5 capitalize text-[10px] font-bold ${diff(q.difficulty)}`}>{q.difficulty}</span>
                        {q.language === "bi" && (
                          <span className="text-[10px] bg-teal-50 text-teal-700 rounded px-2 py-0.5 font-bold">EN+हि</span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap">+{q.marks}</span>
                    </div>

                    <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap mb-3">{view.text}</p>

                    {isMcq && (
                      <div className="grid sm:grid-cols-2 gap-2 mb-3">
                        {(["A", "B", "C", "D"] as const).map((opt) => {
                          const text = view.opts?.[opt];
                          if (!text) return null;
                          const correct = q.correctAnswer === opt;
                          const chosen = userPick === opt;
                          let cls = "border-slate-200 bg-white text-slate-700 hover:border-slate-300";
                          if (isRevealed) {
                            if (correct) cls = "border-emerald-400 bg-emerald-50 text-emerald-800";
                            else if (chosen && !correct) cls = "border-rose-400 bg-rose-50 text-rose-800";
                          } else if (chosen) {
                            cls = "border-[var(--color-teal)] bg-teal-50 text-[var(--color-teal)]";
                          }
                          return (
                            <button key={opt} disabled={isRevealed}
                              onClick={() => setPicked((p) => ({ ...p, [q.id]: opt }))}
                              className={`text-left text-sm px-3 py-2 rounded-lg border transition-colors ${cls}`}>
                              <span className="font-bold mr-2">{opt}.</span> {text}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      {!isRevealed ? (
                        <button onClick={() => setRevealed((r) => ({ ...r, [q.id]: true }))}
                          className="bg-[var(--color-navy)] text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                          Reveal Solution
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500">Correct: <strong className="text-emerald-700">{q.correctAnswer}</strong></span>
                      )}
                      <Link href={ssoLink} className="text-xs text-[var(--color-teal)] hover:underline ml-auto">
                        Sign in to save & track →
                      </Link>
                    </div>

                    {isRevealed && view.sol && (
                      <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                        <p className="text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Solution</p>
                        {view.sol}
                      </div>
                    )}
                  </article>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40">Prev</button>
                  <span className="text-sm text-slate-500">Page {page} of {totalPages} · {total} questions</span>
                  <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
                    className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40">Next</button>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

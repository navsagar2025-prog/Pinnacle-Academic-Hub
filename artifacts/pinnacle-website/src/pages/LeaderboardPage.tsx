import { useEffect, useState } from "react";
import { Link } from "wouter";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import { Trophy, Award, Medal, Sparkles, TrendingUp } from "lucide-react";

type LeaderEntry = {
  studentId: string;
  maskedName: string;
  pct: number;
  score: number;
  maxScore: number;
  testTitle: string;
};

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy size={20} className="text-yellow-500" />;
  if (rank === 2) return <Award size={20} className="text-slate-400" />;
  if (rank === 3) return <Medal size={20} className="text-amber-600" />;
  return <span className="text-slate-400 text-sm font-bold w-5 text-center">{rank}</span>;
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}api/v1/leaderboard`)
      .then((r) => r.json())
      .then((d) => { if (d.ok) setLeaders(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Navbar />
      <main>
        <section className="bg-[var(--color-navy)] py-14">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <span className="badge-gold mb-4 inline-block">This Week</span>
            <h1 className="font-[family-name:var(--font-playfair)] text-white text-4xl md:text-5xl font-bold flex items-center justify-center gap-3">
              <TrendingUp className="text-[var(--color-gold)]" size={40} />
              Weekly Leaderboard
            </h1>
            <p className="text-white/70 text-lg mt-4">
              Top performers from this week's mock tests. Names are anonymised to celebrate hard work — not competition anxiety.
            </p>
          </div>
        </section>

        <section className="py-16 bg-[var(--color-slate-light)]">
          <div className="max-w-2xl mx-auto px-4">
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="card h-16 animate-pulse bg-slate-200" />
                ))}
              </div>
            ) : leaders.length === 0 ? (
              <div className="card text-center py-16">
                <Sparkles size={40} className="mx-auto mb-4 text-[var(--color-gold)] opacity-50" />
                <h2 className="text-[var(--color-navy)] font-bold text-xl mb-2">No results yet this week</h2>
                <p className="text-slate-500 text-sm mb-6">Complete a mock test to appear on the leaderboard!</p>
                <Link href="/admissions" className="btn-primary px-6 py-2.5">Get Started</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {leaders.map((entry, i) => {
                  const rank = i + 1;
                  const pct = entry.pct.toFixed(1);
                  const isTop3 = rank <= 3;
                  return (
                    <div
                      key={entry.studentId}
                      className={`card flex items-center gap-4 ${isTop3 ? "border-[var(--color-gold)] border-2 shadow-md" : ""}`}
                    >
                      <div className="flex items-center justify-center w-8 flex-shrink-0">
                        <RankIcon rank={rank} />
                      </div>

                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${rank === 1 ? "bg-yellow-100 text-yellow-700" : rank === 2 ? "bg-slate-100 text-slate-600" : rank === 3 ? "bg-amber-100 text-amber-700" : "bg-[var(--color-navy)]/10 text-[var(--color-navy)]"}`}>
                        {initialsFor(entry.maskedName)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[var(--color-navy)] truncate">{entry.maskedName}</p>
                        <p className="text-xs text-slate-400 truncate">{entry.testTitle}</p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className={`text-lg font-bold ${isTop3 ? "text-[var(--color-gold)]" : "text-[var(--color-teal)]"}`}>{pct}%</p>
                        <p className="text-xs text-slate-400">{entry.score}/{entry.maxScore}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-10 card text-center bg-[var(--color-navy)] text-white">
              <Sparkles size={28} className="mx-auto mb-3 text-[var(--color-gold)]" />
              <p className="font-semibold text-lg mb-1">Want to make it to the board?</p>
              <p className="text-white/70 text-sm mb-4">Join Pinnacle and take our weekly mock tests — the ranking resets every Monday.</p>
              <Link href="/admissions" className="btn-gold px-6 py-2.5 inline-block">Enrol Now</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}

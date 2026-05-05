import { db } from "@workspace/db";
import { mockTestAttempts, mockTests, students, users } from "@workspace/db/schema";
import { eq, sql, and, gte, desc } from "drizzle-orm";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import { Trophy, Award, Medal, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Weekly Leaderboard — Pinnacle Academic Classes",
  description: "Top performers from this week's mock tests at Pinnacle Academic Classes. Anonymized rankings to celebrate hard work and consistency.",
};

export const revalidate = 3600;

function initialsFor(name: string | null | undefined): string {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

function maskName(name: string | null | undefined): string {
  if (!name) return "Anonymous";
  return name
    .split(/\s+/)
    .map((p, i) => (i === 0 ? `${p[0]?.toUpperCase()}.` : `${p[0]?.toUpperCase() ?? ""}${".".repeat(Math.max(0, p.length - 1))}`))
    .join(" ")
    .trim() || "Anonymous";
}

export default async function PublicLeaderboardPage() {
  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Best attempt per student in the past 7 days, by percentage.
  const rows = await db
    .select({
      studentId: mockTestAttempts.studentId,
      score: mockTestAttempts.score,
      maxScore: mockTestAttempts.maxScore,
      testTitle: mockTests.title,
      completedAt: mockTestAttempts.submittedAt,
      studentName: users.name,
    })
    .from(mockTestAttempts)
    .innerJoin(mockTests, eq(mockTestAttempts.testId, mockTests.id))
    .leftJoin(students, eq(mockTestAttempts.studentId, students.id))
    .leftJoin(users, eq(students.userId, users.id))
    .where(and(
      eq(mockTestAttempts.isCompleted, true),
      gte(mockTestAttempts.submittedAt, weekStart),
      sql`${mockTestAttempts.studentId} is not null`,
    ))
    .orderBy(desc(mockTestAttempts.score));

  type LeaderRow = { studentId: string; name: string | null; pct: number; score: number; maxScore: number; testTitle: string };
  const bestByStudent = new Map<string, LeaderRow>();
  for (const r of rows) {
    if (!r.studentId || !r.maxScore) continue;
    const pct = (r.score ?? 0) / r.maxScore * 100;
    const prev = bestByStudent.get(r.studentId);
    if (!prev || pct > prev.pct) {
      bestByStudent.set(r.studentId, {
        studentId: r.studentId,
        name: r.studentName,
        pct,
        score: r.score ?? 0,
        maxScore: r.maxScore,
        testTitle: r.testTitle,
      });
    }
  }

  const leaders = Array.from(bestByStudent.values())
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 10);

  const [{ totalAttempts }] = await db
    .select({ totalAttempts: sql<number>`count(*)::int` })
    .from(mockTestAttempts)
    .where(and(eq(mockTestAttempts.isCompleted, true), gte(mockTestAttempts.submittedAt, weekStart)));

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--color-slate-light)] py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-gold)]/15 text-[var(--color-navy)] text-xs font-bold mb-4">
              <Sparkles size={12} />
              UPDATED HOURLY
            </div>
            <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl font-bold text-[var(--color-navy)] mb-3">
              Weekly Leaderboard
            </h1>
            <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto">
              Celebrating our top 10 performers from the past 7 days of mock tests. Names are anonymized to protect student privacy — log in to your portal to see your own rank.
            </p>
          </div>

          {leaders.length === 0 ? (
            <div className="card text-center py-16">
              <Trophy size={36} className="mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">No mock tests completed this week yet. Check back soon!</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
                {leaders.slice(0, 3).map((l, idx) => {
                  const isFirst = idx === 0;
                  const podium = [
                    { color: "bg-gradient-to-b from-[var(--color-gold)] to-[#a37e2c]", icon: Trophy, height: "h-32 sm:h-40" },
                    { color: "bg-gradient-to-b from-slate-300 to-slate-500", icon: Medal, height: "h-24 sm:h-32" },
                    { color: "bg-gradient-to-b from-amber-700 to-amber-900", icon: Award, height: "h-20 sm:h-28" },
                  ][idx];
                  const Icon = podium.icon;
                  return (
                    <div key={l.studentId} className="flex flex-col items-center" style={{ order: idx === 0 ? 2 : idx === 1 ? 1 : 3 }}>
                      <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full ${podium.color} text-white flex items-center justify-center font-bold text-lg sm:text-xl mb-2 shadow-lg ring-2 ring-white`}>
                        {initialsFor(l.name)}
                      </div>
                      <div className="text-xs font-bold text-[var(--color-navy)] text-center mb-1">{maskName(l.name)}</div>
                      <div className="text-xs text-slate-500 mb-2">{Math.round(l.pct)}%</div>
                      <div className={`w-full ${podium.height} ${podium.color} rounded-t-xl flex flex-col items-center justify-end pb-2 text-white shadow-lg`}>
                        <Icon size={isFirst ? 24 : 18} />
                        <div className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold">{idx + 1}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {leaders.length > 3 && (
                <div className="card">
                  <div className="space-y-2">
                    {leaders.slice(3).map((l, i) => (
                      <div key={l.studentId} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold text-sm flex items-center justify-center flex-shrink-0">
                          {i + 4}
                        </div>
                        <div className="w-9 h-9 rounded-full bg-[var(--color-navy)]/10 text-[var(--color-navy)] font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {initialsFor(l.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-[var(--color-navy)] truncate">{maskName(l.name)}</div>
                          <div className="text-xs text-slate-400 truncate">{l.testTitle}</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-bold text-[var(--color-teal)]">{Math.round(l.pct)}%</div>
                          <div className="text-[10px] text-slate-400">{l.score}/{l.maxScore}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="card mt-6 bg-gradient-to-r from-[var(--color-navy)] to-[var(--color-teal)] text-white text-center">
                <TrendingUp size={20} className="mx-auto mb-2 opacity-80" />
                <div className="text-xs uppercase tracking-wide opacity-80 mb-1">This week</div>
                <div className="text-3xl font-bold font-[family-name:var(--font-playfair)] mb-1">{totalAttempts}</div>
                <div className="text-sm opacity-90">mock test attempts across our institute</div>
              </div>
            </>
          )}

          <div className="text-center mt-8">
            <Link
              href="/admissions"
              className="inline-block bg-[var(--color-navy)] text-white font-semibold text-sm px-6 py-3 rounded-lg hover:bg-[var(--color-navy)]/90"
            >
              Want to see your name here? Join Pinnacle →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}

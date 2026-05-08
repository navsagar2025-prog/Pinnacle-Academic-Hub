import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import { TOPPERS } from "@/lib/data";
import { Star, Trophy, Award } from "lucide-react";
import type { Metadata } from "next";
import { db } from "@workspace/db";
import { results } from "@workspace/db/schema";
import { desc, asc } from "drizzle-orm";

export const metadata: Metadata = {
  title: "Results & Toppers 2024 — JEE, NEET | Pinnacle Academic Classes",
  description: "Pinnacle Academic Classes 2024 results: 85+ IIT/AIIMS selections, 320+ NIT selections. See our JEE and NEET toppers.",
  openGraph: {
    title: "Results & Toppers 2024 — JEE, NEET | Pinnacle Academic Classes",
    description: "Pinnacle Academic Classes 2024 results: 85+ IIT/AIIMS selections, 320+ NIT selections. See our JEE and NEET toppers.",
    url: "/results",
    siteName: "Pinnacle Academic Classes",
    type: "website",
    images: [{ url: `/api/og?title=${encodeURIComponent("Results & Toppers 2024 — JEE, NEET | Pinnacle Academic Classes")}&description=${encodeURIComponent("Pinnacle Academic Classes 2024 results: 85+ IIT/AIIMS selections, 320+ NIT selections. See our JEE and NEET toppers.")}`, width: 1200, height: 630, alt: "Results — Pinnacle Academic Classes" }],
  },
  twitter: {
    card: "summary_large_image",
    images: [`/api/og?title=${encodeURIComponent("Results & Toppers 2024 — JEE, NEET | Pinnacle Academic Classes")}&description=${encodeURIComponent("Pinnacle Academic Classes 2024 results: 85+ IIT/AIIMS selections, 320+ NIT selections. See our JEE and NEET toppers.")}`],
  },
  alternates: { canonical: "/results" },
};

const YEAR_STATS = [
  { year: "2024", iit: 47, aiims: 38, nit: 120, board90: 210 },
  { year: "2023", iit: 39, aiims: 31, nit: 105, board90: 185 },
  { year: "2022", iit: 32, aiims: 26, nit: 89, board90: 162 },
  { year: "2021", iit: 28, aiims: 22, nit: 74, board90: 143 },
];

export default async function ResultsPage() {
  const allDbResults = await db
    .select()
    .from(results)
    .orderBy(desc(results.academicYear), asc(results.studentName));

  const dbToppers = allDbResults.filter((r) => r.isTopper);
  const dbOthers = allDbResults.filter((r) => !r.isTopper);

  const displayToppers = dbToppers.length > 0
    ? dbToppers.map((t) => ({
        name: t.studentName,
        exam: t.examName,
        subject: t.subject,
        marks: t.marks,
        rank: t.rank,
        college: t.college ?? "",
        batch: t.batch ?? "",
        quote: t.quote ?? "",
        initials: t.initials,
        year: t.academicYear,
      }))
    : TOPPERS.map((t) => ({ ...t, subject: null, marks: null, year: "2024" }));

  return (
    <>
      <Navbar />
      <main>
        <section className="bg-[var(--color-navy)] py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <span className="badge-gold mb-4 inline-block">Hall of Fame</span>
            <h1 className="font-[family-name:var(--font-playfair)] text-white text-4xl md:text-5xl font-bold">
              Our Results Speak
            </h1>
            <p className="text-white/70 text-lg mt-4">
              14 years of consistent results. Our students don't just pass — they top.
            </p>
          </div>
        </section>

        {/* Year-wise stats */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="section-heading">Year-wise Results</h2>
            </div>
            <div className="grid gap-4">
              {YEAR_STATS.map((y) => (
                <div key={y.year} className="card grid grid-cols-2 md:grid-cols-5 gap-6 items-center">
                  <div>
                    <div className="text-3xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">{y.year}</div>
                    <div className="text-slate-500 text-xs">Academic Year</div>
                  </div>
                  {[
                    { label: "IIT Selections", value: y.iit },
                    { label: "AIIMS Selections", value: y.aiims },
                    { label: "NIT Selections", value: `${y.nit}+` },
                    { label: "Board 90%+ Scorers", value: `${y.board90}+` },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <div className="text-2xl font-bold text-[var(--color-teal)] font-[family-name:var(--font-playfair)]">{stat.value}</div>
                      <div className="text-slate-500 text-xs">{stat.label}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Toppers */}
        <section className="py-16 bg-[var(--color-slate-light)]">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-10">
              <span className="badge-gold mb-3 inline-block">Pinnacle Toppers</span>
              <h2 className="section-heading">Our Star Achievers</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayToppers.map((t) => (
                <div key={`${t.name}-${t.exam}`} className="card border-l-4 border-l-[var(--color-gold)] hover:shadow-elevated transition-all">
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => <Star key={i} size={13} className="text-[var(--color-gold)]" fill="currentColor" />)}
                  </div>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-maroon)] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {t.initials}
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">{t.name}</h3>
                      <div className="text-[var(--color-teal)] font-bold text-xl">{t.rank}</div>
                      <div className="text-slate-500 text-xs">{t.exam}</div>
                      {t.subject && <div className="text-xs text-slate-400 mt-0.5">{t.subject}</div>}
                      {t.marks && <div className="text-xs font-semibold text-[var(--color-teal)] mt-0.5">{t.marks}</div>}
                    </div>
                  </div>
                  {t.college && (
                    <div className="bg-[var(--color-navy)] text-white rounded-xl px-3 py-2 text-sm font-medium mb-3">
                      {t.college}
                    </div>
                  )}
                  {t.quote && <p className="text-slate-600 text-sm italic">&ldquo;{t.quote}&rdquo;</p>}
                  <div className="text-xs text-slate-400 mt-2">{t.batch}{t.year ? ` · ${t.year}` : ""}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* All other results */}
        {dbOthers.length > 0 && (
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4">
              <div className="text-center mb-10">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-teal)] bg-[var(--color-teal)]/10 px-3 py-1 rounded-full mb-3">
                  <Award size={14} /> All Results
                </span>
                <h2 className="section-heading">More Proud Achievers</h2>
              </div>
              <div className="card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[var(--color-slate-light)] border-b">
                      <tr>
                        {["Student", "Exam", "Subject", "Marks / Score", "Rank", "College / Destination", "Batch"].map((h) => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {dbOthers.map((r) => (
                        <tr key={r.id} className="hover:bg-[var(--color-slate-light)]/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-teal)] to-[var(--color-navy)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {r.initials}
                              </div>
                              <span className="font-semibold text-sm text-[var(--color-navy)]">{r.studentName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{r.examName}</td>
                          <td className="px-4 py-3 text-sm text-slate-500">{r.subject ?? "—"}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-[var(--color-teal)]">{r.marks ?? "—"}</td>
                          <td className="px-4 py-3 text-sm font-bold text-[var(--color-navy)]">{r.rank}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{r.college ?? "—"}</td>
                          <td className="px-4 py-3 text-xs text-slate-400">{r.batch ?? r.academicYear}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="py-16 bg-gradient-to-r from-[var(--color-teal)] to-[var(--color-navy)]">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <Trophy size={48} className="text-[var(--color-gold)] mx-auto mb-4" />
            <h2 className="font-[family-name:var(--font-playfair)] text-white text-3xl font-bold mb-4">
              Your Name Could Be Here Next Year
            </h2>
            <p className="text-white/70 mb-6">Join Pinnacle today and start building the rank you deserve.</p>
            <Link href="/admissions" className="btn-gold px-10 py-3.5 text-base">Enrol Now</Link>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}

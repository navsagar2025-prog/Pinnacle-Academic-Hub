import { Link } from "wouter";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import { TOPPERS } from "@/lib/data";
import { Star, Trophy } from "lucide-react";

const YEAR_STATS = [
  { year: "2024", iit: 47, aiims: 38, nit: 120, board90: 210 },
  { year: "2023", iit: 39, aiims: 31, nit: 105, board90: 185 },
  { year: "2022", iit: 32, aiims: 26, nit: 89, board90: 162 },
  { year: "2021", iit: 28, aiims: 22, nit: 74, board90: 143 },
];

export default function ResultsPage() {
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

        <section className="py-16 bg-[var(--color-slate-light)]">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-10">
              <span className="badge-gold mb-3 inline-block">Pinnacle Toppers</span>
              <h2 className="section-heading">Our Star Achievers</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {TOPPERS.map((t) => (
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
                    </div>
                  </div>
                  {t.college && (
                    <div className="bg-[var(--color-navy)] text-white rounded-xl px-3 py-2 text-sm font-medium mb-3">
                      {t.college}
                    </div>
                  )}
                  {t.quote && <p className="text-slate-600 text-sm italic">&ldquo;{t.quote}&rdquo;</p>}
                  <div className="text-xs text-slate-400 mt-2">{t.batch} · 2024</div>
                </div>
              ))}
            </div>
          </div>
        </section>

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

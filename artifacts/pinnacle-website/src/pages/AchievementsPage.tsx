import { Link } from "wouter";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import { STATS, TOPPERS } from "@/lib/data";
import { Trophy, Star } from "lucide-react";

export default function AchievementsPage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="bg-[var(--color-navy)] py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <span className="badge-gold mb-4 inline-block">Our Legacy</span>
            <h1 className="font-[family-name:var(--font-playfair)] text-white text-4xl md:text-5xl font-bold">
              Achievements
            </h1>
            <p className="text-white/70 text-lg mt-4">
              14 years of excellence. Thousands of dreams fulfilled. A legacy that speaks for itself.
            </p>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="section-heading">Our Numbers</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {STATS.map((stat) => (
                <div key={stat.label} className="text-center card hover:shadow-elevated transition-all">
                  <div className="text-4xl mb-3">{stat.icon}</div>
                  <div className="text-3xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">{stat.value}</div>
                  <div className="text-slate-500 text-sm mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-[var(--color-slate-light)]">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-10">
              <span className="badge-gold mb-3 inline-block">2024 Highlights</span>
              <h2 className="section-heading">Year in Numbers</h2>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { label: "IIT Selections", value: "47", icon: "🎓", desc: "Students secured seats in IITs across India" },
                { label: "AIIMS Selections", value: "38", icon: "🏥", desc: "Medical students secured MBBS seats at top colleges" },
                { label: "NIT Selections", value: "120+", icon: "⚙️", desc: "Students placed in NITs and state engineering colleges" },
                { label: "Board Toppers (90%+)", value: "210+", icon: "📊", desc: "Students scored 90% or above in board exams" },
              ].map((item) => (
                <div key={item.label} className="card text-center hover:shadow-elevated transition-all">
                  <div className="text-4xl mb-3">{item.icon}</div>
                  <div className="text-4xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)] mb-1">{item.value}</div>
                  <div className="text-[var(--color-gold)] font-semibold text-sm mb-2">{item.label}</div>
                  <div className="text-slate-500 text-xs">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-10">
              <span className="badge-gold mb-3 inline-block">Our Champions</span>
              <h2 className="section-heading">Top Achievers 2024</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {TOPPERS.map((t) => (
                <div key={t.name} className="card border-l-4 border-l-[var(--color-gold)] hover:shadow-elevated transition-all">
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => <Star key={i} size={13} className="text-[var(--color-gold)]" fill="currentColor" />)}
                  </div>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-maroon)] flex items-center justify-center text-white font-bold flex-shrink-0">
                      {t.initials}
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">{t.name}</h3>
                      <div className="text-[var(--color-teal)] font-bold text-lg">{t.rank}</div>
                      <div className="text-slate-500 text-xs">{t.exam}</div>
                    </div>
                  </div>
                  <div className="bg-[var(--color-navy)] text-white rounded-xl px-3 py-2 text-sm font-medium mb-3">{t.college}</div>
                  <p className="text-slate-600 text-sm italic">"{t.quote}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-gradient-to-r from-[var(--color-teal)] to-[var(--color-navy)]">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <Trophy size={48} className="text-[var(--color-gold)] mx-auto mb-4" />
            <h2 className="font-[family-name:var(--font-playfair)] text-white text-3xl font-bold mb-4">
              Be Part of the Next Success Story
            </h2>
            <p className="text-white/70 mb-6">Join Pinnacle and begin your journey towards academic excellence.</p>
            <Link href="/admissions" className="btn-gold px-10 py-3.5 text-base">Enrol Now</Link>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}

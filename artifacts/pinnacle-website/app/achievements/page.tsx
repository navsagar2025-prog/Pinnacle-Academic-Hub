import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";

export const metadata = {
  title: "Toppers & Achievements — Pinnacle Academic Classes",
  description: "JEE and NEET selections, board exam toppers, and student achievements from Pinnacle Academic Classes, Greater Noida.",
  openGraph: {
    title: "Toppers & Achievements — Pinnacle Academic Classes",
    description: "JEE and NEET selections, board exam toppers, and student achievements from Pinnacle Academic Classes, Greater Noida.",
    url: "https://pinnacleacademic.in/achievements",
    siteName: "Pinnacle Academic Classes",
    type: "website",
  },
};

const TOPPERS = [
  { name: "Aryan Gupta", rank: "AIR 847", exam: "JEE Advanced 2025", college: "IIT Bombay — Computer Science", score: "276/360", batch: "JEE Morning Batch", year: 2025 },
  { name: "Priya Verma", rank: "AIR 1204", exam: "JEE Advanced 2025", college: "IIT Delhi — Electrical Engineering", score: "262/360", batch: "JEE Evening Batch", year: 2025 },
  { name: "Rohan Sharma", rank: "AIR 156", exam: "NEET UG 2025", college: "AIIMS New Delhi", score: "710/720", batch: "NEET Morning Batch", year: 2025 },
  { name: "Sneha Jain", rank: "AIR 342", exam: "NEET UG 2025", college: "Maulana Azad Medical College", score: "694/720", batch: "NEET Morning Batch", year: 2025 },
  { name: "Karan Mehta", rank: "AIR 2341", exam: "JEE Advanced 2025", college: "IIT Kanpur — Mechanical", score: "238/360", batch: "JEE Evening Batch", year: 2025 },
  { name: "Ananya Singh", rank: "AIR 521", exam: "NEET UG 2025", college: "Grant Medical College, Mumbai", score: "702/720", batch: "NEET Morning Batch", year: 2025 },
  { name: "Vivek Kumar", rank: "AIR 3847", exam: "JEE Advanced 2024", college: "IIT Roorkee — Civil", score: "218/360", batch: "JEE Morning Batch", year: 2024 },
  { name: "Riya Patel", rank: "AIR 892", exam: "NEET UG 2024", college: "Topiwala National Medical College", score: "698/720", batch: "NEET Morning Batch", year: 2024 },
];

const STATS = [
  { label: "JEE Selections in 2025", value: "62", suffix: "students" },
  { label: "NEET Selections in 2025", value: "47", suffix: "students" },
  { label: "IIT Selections (All Years)", value: "180+", suffix: "total" },
  { label: "AIIMS/Top MBBS Colleges", value: "95+", suffix: "total" },
];

const BOARD_TOPPERS = [
  { name: "Nidhi Rastogi", score: "98.6%", board: "CBSE Class 12", year: 2025 },
  { name: "Sahil Agarwal", score: "97.8%", board: "CBSE Class 12", year: 2025 },
  { name: "Tanvi Singh", score: "99.2%", board: "CBSE Class 10", year: 2025 },
];

export default function AchievementsPage() {
  const year2025 = TOPPERS.filter((t) => t.year === 2025);
  const year2024 = TOPPERS.filter((t) => t.year === 2024);

  return (
    <>
      <Navbar />
      <main>
        <section className="bg-[var(--color-navy)] py-14">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <span className="badge-gold mb-4 inline-block">Hall of Fame</span>
            <h1 className="font-[family-name:var(--font-playfair)] text-white text-4xl md:text-5xl font-bold">Toppers & Achievements</h1>
            <p className="text-white/70 text-lg mt-4 max-w-2xl mx-auto">
              Our students consistently rank among the best in JEE, NEET, and board examinations.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 bg-[var(--color-gold)]/5 border-y border-[var(--color-gold)]/20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {STATS.map((s) => (
                <div key={s.label}>
                  <div className="font-[family-name:var(--font-playfair)] text-4xl font-bold text-[var(--color-navy)]">{s.value}</div>
                  <div className="text-xs text-[var(--color-gold)] font-semibold uppercase tracking-wide mt-1">{s.suffix}</div>
                  <div className="text-sm text-slate-600 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 2025 Toppers */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-[var(--color-navy)] mb-2 text-center">JEE & NEET Selections 2025</h2>
            <p className="text-slate-500 text-center mb-10">109 students selected in top engineering and medical colleges</p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
              {year2025.map((t, i) => (
                <div key={i} className="card hover:shadow-elevated transition-all border-t-4 border-t-[var(--color-gold)]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-navy)] to-[var(--color-teal)] flex items-center justify-center text-white font-bold font-[family-name:var(--font-playfair)] text-lg">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-[var(--color-navy)]">{t.name}</div>
                      <div className="text-xs text-slate-400">{t.batch}</div>
                    </div>
                  </div>
                  <div className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[var(--color-gold)] mb-1">{t.rank}</div>
                  <div className="text-sm font-semibold text-[var(--color-navy)] mb-1">{t.exam}</div>
                  <div className="text-sm text-slate-600">{t.college}</div>
                  <div className="mt-2 text-xs text-[var(--color-teal)] font-semibold">Score: {t.score}</div>
                </div>
              ))}
            </div>

            {/* Board Toppers */}
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)] mb-6 text-center">Board Exam Toppers 2025</h2>
            <div className="grid sm:grid-cols-3 gap-5 mb-12">
              {BOARD_TOPPERS.map((t, i) => (
                <div key={i} className="card text-center border-t-4 border-t-[var(--color-teal)]">
                  <div className="w-14 h-14 rounded-full bg-[var(--color-teal)] text-white flex items-center justify-center text-2xl font-bold mx-auto mb-3">{t.name.charAt(0)}</div>
                  <div className="font-bold text-[var(--color-navy)] mb-1">{t.name}</div>
                  <div className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-teal)]">{t.score}</div>
                  <div className="text-sm text-slate-500">{t.board}</div>
                </div>
              ))}
            </div>

            {year2024.length > 0 && (
              <>
                <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)] mb-6 text-center">Selections 2024</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {year2024.map((t, i) => (
                    <div key={i} className="card hover:shadow-elevated transition-all opacity-80">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-[var(--color-navy)]/80 flex items-center justify-center text-white font-bold">{t.name.charAt(0)}</div>
                        <div>
                          <div className="font-bold text-[var(--color-navy)] text-sm">{t.name}</div>
                          <div className="text-xs text-slate-400">{t.batch}</div>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-[var(--color-gold)]">{t.rank}</div>
                      <div className="text-sm text-slate-600">{t.college}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        <section className="py-12 bg-[var(--color-navy)] text-center">
          <div className="max-w-2xl mx-auto px-4">
            <h2 className="font-[family-name:var(--font-playfair)] text-white text-2xl font-bold mb-3">Write Your Own Success Story</h2>
            <p className="text-white/70 mb-6">Admissions open for 2026–27. Limited seats in all batches.</p>
            <a href="/admissions" className="btn-primary py-3 px-8">Apply Now</a>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}

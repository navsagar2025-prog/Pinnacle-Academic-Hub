import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import { FACULTY } from "@/lib/data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Faculty — Expert Teachers | Pinnacle Academic Classes",
  description: "Meet Pinnacle's expert faculty — IIT/NIT alumni and PhD-qualified teachers with 7–14 years of coaching experience for JEE, NEET, and board exams.",
  openGraph: {
    title: "Our Faculty — Expert Teachers | Pinnacle Academic Classes",
    description: "Meet Pinnacle's expert faculty — IIT/NIT alumni and PhD-qualified teachers with 7–14 years of coaching experience for JEE, NEET, and board exams.",
    url: "https://pinnacleacademic.in/faculty",
    siteName: "Pinnacle Academic Classes",
    type: "website",
  },
};

export default function FacultyPage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="bg-[var(--color-navy)] py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <span className="badge-gold mb-4 inline-block">Our Team</span>
            <h1 className="font-[family-name:var(--font-playfair)] text-white text-4xl md:text-5xl font-bold">
              Expert Faculty
            </h1>
            <p className="text-white/70 text-lg mt-4">
              Learn from educators who have mastered both their subject and the art of teaching.
              Our faculty are alumni of IIT, NIT, and India's top universities.
            </p>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-8">
            {FACULTY.map((f) => (
              <div key={f.name} className="card hover:shadow-elevated transition-all">
                <div className="flex items-start gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-teal)] to-[var(--color-navy)] flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                    {f.initials}
                  </div>
                  <div>
                    <h2 className="font-bold text-[var(--color-navy)] text-xl font-[family-name:var(--font-playfair)]">{f.name}</h2>
                    <div className="text-[var(--color-gold)] font-semibold text-sm mt-0.5">{f.designation}</div>
                    <div className="text-slate-500 text-xs mt-1">{f.experience} teaching experience</div>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Qualifications</div>
                    <div className="text-slate-700 text-sm">{f.qualification}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Teaches</div>
                    <div className="flex flex-wrap gap-1.5">
                      {f.teaches.split(" · ").map((t) => (
                        <span key={t} className="badge-teal text-xs">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-[var(--color-gold)]/5 border border-[var(--color-gold)]/20 rounded-xl p-3">
                    <div className="text-xs font-semibold text-[var(--color-navy)] mb-1">Achievement</div>
                    <div className="text-slate-600 text-sm">{f.achievement}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="py-16 bg-gradient-to-r from-[var(--color-teal)] to-[var(--color-navy)]">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="font-[family-name:var(--font-playfair)] text-white text-3xl font-bold mb-4">
              Experience the Teaching Difference
            </h2>
            <p className="text-white/70 mb-6">Attend a free demo class to experience our faculty's teaching style firsthand.</p>
            <Link href="/admissions" className="btn-gold px-10 py-3.5 text-base">Book Free Demo Class</Link>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}

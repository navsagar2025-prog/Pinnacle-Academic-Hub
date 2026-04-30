import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import { COURSES } from "@/lib/data";
import { CheckCircle, Clock, Users, BookOpen, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Courses — JEE, NEET, Class 10-12 | Pinnacle Academic Classes",
  description: "Explore Pinnacle's courses: JEE Main & Advanced, NEET UG, Class 11-12 Board, Class 9-10, and Foundation. Expert faculty, proven results.",
};

const COLOR_MAP: Record<string, { bg: string; text: string; badge: string }> = {
  navy: { bg: "bg-[var(--color-navy)]", text: "text-[var(--color-navy)]", badge: "bg-[var(--color-navy)]/10 text-[var(--color-navy)]" },
  teal: { bg: "bg-[var(--color-teal)]", text: "text-[var(--color-teal)]", badge: "bg-[var(--color-teal)]/10 text-[var(--color-teal)]" },
  maroon: { bg: "bg-[var(--color-maroon)]", text: "text-[var(--color-maroon)]", badge: "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]" },
  gold: { bg: "bg-[var(--color-gold)]", text: "text-[var(--color-maroon)]", badge: "bg-[var(--color-gold)]/10 text-[var(--color-maroon)]" },
};

export default function CoursesPage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="bg-[var(--color-navy)] py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <span className="badge-gold mb-4 inline-block">All Programmes</span>
            <h1 className="font-[family-name:var(--font-playfair)] text-white text-4xl md:text-5xl font-bold">
              Courses at Pinnacle
            </h1>
            <p className="text-white/70 text-lg mt-4">
              From Grade 6 to competitive exams — structured programmes designed for success at every level.
            </p>
          </div>
        </section>

        <section className="py-16 bg-[var(--color-slate-light)]">
          <div className="max-w-7xl mx-auto px-4 space-y-8">
            {COURSES.map((course) => {
              const c = COLOR_MAP[course.color] ?? COLOR_MAP.navy;
              return (
                <div key={course.id} id={course.id} className="card grid md:grid-cols-3 gap-8">
                  <div className="md:col-span-2">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${c.badge}`}>
                        {course.icon}
                      </div>
                      <div>
                        <h2 className="font-bold text-[var(--color-navy)] text-2xl font-[family-name:var(--font-playfair)]">{course.title}</h2>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-slate-500 flex items-center gap-1"><Clock size={13} />{course.duration}</span>
                          <span className="text-sm text-slate-500 flex items-center gap-1"><Users size={13} />{course.seats} seats/batch</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-slate-600 leading-relaxed mb-4">{course.description}</p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {course.highlights.map((h) => (
                        <div key={h} className="flex items-center gap-2 text-sm text-slate-700">
                          <CheckCircle size={14} className="text-[var(--color-teal)] flex-shrink-0" />
                          {h}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-[var(--color-slate-light)] rounded-xl p-4 space-y-3">
                      <div>
                        <div className="text-xs text-slate-500 mb-0.5">Eligibility</div>
                        <div className="font-semibold text-sm text-[var(--color-navy)]">{course.eligibility}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-0.5">Available Batches</div>
                        <div className="flex gap-2 flex-wrap">
                          {course.batches.map((b) => (
                            <span key={b} className={`badge text-xs ${c.badge}`}>{b} Batch</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-0.5">Annual Fee</div>
                        <div className="text-2xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">
                          ₹{course.fee.toLocaleString("en-IN")}
                        </div>
                        <div className="text-xs text-slate-400">Instalment options available</div>
                      </div>
                    </div>
                    <Link href="/admissions" className="btn-secondary w-full justify-center py-3">
                      <BookOpen size={16} />
                      Enquire / Book Demo
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="py-16 bg-gradient-to-r from-[var(--color-teal)] to-[var(--color-navy)]">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="font-[family-name:var(--font-playfair)] text-white text-3xl font-bold mb-4">
              Not Sure Which Course to Choose?
            </h2>
            <p className="text-white/70 mb-6">Our counsellors will help you find the perfect programme based on your goals, syllabus, and schedule.</p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/admissions" className="btn-gold px-8 py-3">Book Free Counselling</Link>
              <a href="tel:+919876543210" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg border-2 border-white/40 text-white font-semibold hover:bg-white hover:text-[var(--color-navy)] transition-all">Call Now</a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}

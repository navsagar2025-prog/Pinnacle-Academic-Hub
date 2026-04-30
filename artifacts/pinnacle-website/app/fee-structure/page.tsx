import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import { db } from "@workspace/db";
import { courses } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";
import { CheckCircle, Phone, Mail } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Fee Structure 2026–27 — Pinnacle Academic Classes",
  description: "Transparent course fees, instalment options, and scholarship information for all programmes at Pinnacle Academic Classes, Greater Noida.",
  openGraph: {
    title: "Fee Structure 2026–27 — Pinnacle Academic Classes",
    description: "Transparent course fees, instalment options, and scholarship information for all programmes at Pinnacle Academic Classes, Greater Noida.",
    url: "https://pinnacleacademic.in/fee-structure",
    siteName: "Pinnacle Academic Classes",
    type: "website",
  },
};

const PAYMENT_OPTIONS = [
  { label: "Full Payment", description: "Pay full annual fee upfront and receive a 3% early-bird discount.", tag: "Best Value" },
  { label: "2 Instalments", description: "50% at admission, 50% at the start of second term (November).", tag: "Popular" },
  { label: "4 Instalments", description: "Quarterly instalments — admission, June, September, December.", tag: "Flexible" },
];

const SCHOLARSHIPS = [
  { criteria: "JEE/NEET rank holder (Top 10,000)", discount: "30%", note: "On annual fee" },
  { criteria: "Entrance test score 90%+", discount: "20%", note: "On annual fee" },
  { criteria: "Entrance test score 80–90%", discount: "10%", note: "On annual fee" },
  { criteria: "Sibling of existing student", discount: "10%", note: "On annual fee" },
  { criteria: "Merit-cum-need (verified)", discount: "Up to 50%", note: "Committee approval" },
];

export default async function FeeStructurePage() {
  const allCourses = await db
    .select({ id: courses.id, title: courses.title, durationLabel: courses.durationLabel, annualFee: courses.annualFee, admissionFee: courses.admissionFee, eligibility: courses.eligibility, highlights: courses.highlights })
    .from(courses)
    .where(eq(courses.isActive, true))
    .orderBy(asc(courses.annualFee));

  return (
    <>
      <Navbar />
      <main>
        <section className="bg-[var(--color-navy)] py-14">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <span className="badge-gold mb-4 inline-block">Transparent Pricing</span>
            <h1 className="font-[family-name:var(--font-playfair)] text-white text-4xl md:text-5xl font-bold">Fee Structure 2026–27</h1>
            <p className="text-white/70 text-lg mt-4 max-w-2xl mx-auto">
              No hidden charges. One-time admission fee + annual course fee. Flexible instalments available.
            </p>
          </div>
        </section>

        {/* Course fees from DB */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-[var(--color-navy)] text-center mb-10">Course Fees</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {allCourses.map((c) => (
                <div key={c.id} className="card hover:shadow-elevated transition-all flex flex-col">
                  <div className="mb-4">
                    <h3 className="font-[family-name:var(--font-playfair)] font-bold text-[var(--color-navy)] text-lg mb-1">{c.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="badge bg-[var(--color-navy)]/5 text-slate-600">{c.durationLabel}</span>
                      {c.eligibility && <span className="text-slate-400 truncate">{c.eligibility}</span>}
                    </div>
                  </div>

                  <div className="bg-[var(--color-slate-light)] rounded-xl p-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-500">Annual Fee</span>
                      <span className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[var(--color-navy)]">
                        ₹{c.annualFee.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Admission Fee (one-time)</span>
                      <span className="font-semibold text-slate-600">₹{(c.admissionFee ?? 2000).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="border-t border-slate-200 mt-3 pt-3 flex justify-between">
                      <span className="text-sm font-semibold text-[var(--color-navy)]">Total (Year 1)</span>
                      <span className="font-bold text-[var(--color-teal)]">₹{(c.annualFee + (c.admissionFee ?? 2000)).toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  {c.highlights && c.highlights.length > 0 && (
                    <ul className="space-y-1.5 mb-4 flex-1">
                      {c.highlights.slice(0, 4).map((h) => (
                        <li key={h} className="flex items-center gap-2 text-xs text-slate-600">
                          <CheckCircle size={12} className="text-[var(--color-teal)] flex-shrink-0" />{h}
                        </li>
                      ))}
                    </ul>
                  )}

                  <Link href="/admissions" className="btn-primary py-2.5 text-sm text-center mt-auto">
                    Apply Now
                  </Link>
                </div>
              ))}
            </div>

            <p className="text-center text-xs text-slate-400 mt-6">
              * Fees subject to annual revision. GST not applicable (educational institution exemption).
            </p>
          </div>
        </section>

        {/* Payment options */}
        <section className="py-14 bg-[var(--color-slate-light)]">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)] text-center mb-8">Instalment Options</h2>
            <div className="grid md:grid-cols-3 gap-5">
              {PAYMENT_OPTIONS.map((p) => (
                <div key={p.label} className="card text-center hover:shadow-elevated transition-all">
                  <div className="badge bg-[var(--color-gold)]/20 text-[var(--color-navy)] font-semibold text-xs mb-3 inline-block">{p.tag}</div>
                  <h3 className="font-bold text-[var(--color-navy)] mb-2">{p.label}</h3>
                  <p className="text-slate-500 text-sm">{p.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Scholarships */}
        <section className="py-14 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)] text-center mb-2">Scholarships & Fee Concessions</h2>
            <p className="text-slate-500 text-center mb-8">Merit-based discounts applied at time of admission after verification.</p>
            <div className="card overflow-hidden p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-navy)] text-white">
                    <th className="text-left px-5 py-3 font-semibold">Eligibility Criteria</th>
                    <th className="text-center px-5 py-3 font-semibold">Discount</th>
                    <th className="text-left px-5 py-3 font-semibold">Applied On</th>
                  </tr>
                </thead>
                <tbody>
                  {SCHOLARSHIPS.map((s, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[var(--color-slate-light)]"}>
                      <td className="px-5 py-3 font-medium text-[var(--color-navy)]">{s.criteria}</td>
                      <td className="px-5 py-3 text-center font-bold text-[var(--color-teal)]">{s.discount}</td>
                      <td className="px-5 py-3 text-slate-500">{s.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="py-12 bg-[var(--color-navy)] text-center">
          <div className="max-w-2xl mx-auto px-4">
            <h2 className="font-[family-name:var(--font-playfair)] text-white text-2xl font-bold mb-4">Questions about Fees?</h2>
            <div className="flex items-center justify-center gap-6 text-white/80 mb-6 flex-wrap">
              <span className="flex items-center gap-2"><Phone size={15} /> +91 9999 000 111</span>
              <span className="flex items-center gap-2"><Mail size={15} /> accounts@pinnacleacademic.in</span>
            </div>
            <Link href="/admissions" className="btn-primary py-3 px-8">Start Admission Process</Link>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}

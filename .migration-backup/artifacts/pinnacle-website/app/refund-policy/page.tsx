import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy | Pinnacle Academic Classes",
  description: "Pinnacle Academic Classes refund and cancellation policy for course fees, including timelines, eligibility, and process for raising a refund request.",
  openGraph: {
    title: "Refund Policy | Pinnacle Academic Classes",
    description: "Pinnacle Academic Classes refund and cancellation policy for course fees, including timelines, eligibility, and process for raising a refund request.",
    url: "/refund-policy",
    siteName: "Pinnacle Academic Classes",
    type: "website",
    images: [{ url: `/api/og?title=${encodeURIComponent("Refund Policy | Pinnacle Academic Classes")}&description=${encodeURIComponent("Pinnacle Academic Classes refund and cancellation policy for course fees, including timelines, eligibility, and process for raising a refund request.")}`, width: 1200, height: 630, alt: "Refund Policy — Pinnacle Academic Classes" }],
  },
  twitter: {
    card: "summary_large_image",
    images: [`/api/og?title=${encodeURIComponent("Refund Policy | Pinnacle Academic Classes")}&description=${encodeURIComponent("Pinnacle Academic Classes refund and cancellation policy for course fees, including timelines, eligibility, and process for raising a refund request.")}`],
  },
  alternates: { canonical: "/refund-policy" },
};

export default function RefundPolicyPage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="bg-[var(--color-navy)] py-12">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="font-[family-name:var(--font-playfair)] text-white text-3xl font-bold">Refund Policy</h1>
            <p className="text-white/60 mt-2 text-sm">Last updated: 1 January 2026</p>
          </div>
        </section>
        <section className="py-12 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <div className="card bg-[var(--color-gold)]/5 border-[var(--color-gold)]/20 mb-8">
              <p className="text-[var(--color-navy)] font-semibold text-sm">
                Please read this refund policy carefully before making any payment. By paying fees, you agree to the terms below.
              </p>
            </div>
            {[
              { title: "1. Admission Fee", body: "The one-time admission fee of ₹2,000 is non-refundable under any circumstances. This fee covers administrative processing, registration, and initial study kit." },
              { title: "2. Course Fee — Refund Window", body: "A student who withdraws within 7 days of the batch start date is eligible for a refund of 50% of the course fee paid (excluding admission fee). No refund is applicable after 7 days from the batch start date." },
              { title: "3. Refund Process", body: "Refund requests must be submitted in writing to the accounts office or via email to care@paconline.in within the eligible period. Refunds are processed within 15 working days via NEFT/RTGS to the payer's bank account." },
              { title: "4. Study Material", body: "Study material issued to the student is non-returnable and its cost (₹1,500–₹3,000 depending on the programme) will be deducted from any eligible refund." },
              { title: "5. Transfer of Batch", body: "Students may request a one-time batch transfer (e.g., from Morning to Evening) within the first 30 days of admission, subject to seat availability. Batch transfers are not treated as withdrawals and are not eligible for refunds." },
              { title: "6. Course Fee — Special Circumstances", body: "In the event of a student's serious illness (with valid medical documentation) or relocation outside Greater Noida, Pinnacle will review refund requests on a case-by-case basis at the discretion of management." },
              { title: "7. No Refund Situations", body: "No refund will be issued for: disciplinary expulsion, failure to attend classes, dissatisfaction with exam results, or requests made after the refund window has closed." },
              { title: "8. Contact for Refunds", body: "Accounts Office: care@paconline.in · +91 99718 62138 · Office hours: Mon–Sat, 10 AM – 5 PM" },
            ].map((s) => (
              <div key={s.title} className="mb-8">
                <h2 className="font-bold text-[var(--color-navy)] text-lg font-[family-name:var(--font-playfair)] mb-3">{s.title}</h2>
                <p className="text-slate-600 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

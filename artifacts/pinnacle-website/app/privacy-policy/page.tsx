import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Pinnacle Academic Classes",
  description: "How Pinnacle Academic Classes (KCK Corporate Services Pvt. Ltd.) collects, uses, and protects your personal data in compliance with Indian data protection laws.",
  openGraph: {
    title: "Privacy Policy | Pinnacle Academic Classes",
    description: "How Pinnacle Academic Classes (KCK Corporate Services Pvt. Ltd.) collects, uses, and protects your personal data in compliance with Indian data protection laws.",
    url: "/privacy-policy",
    siteName: "Pinnacle Academic Classes",
    type: "website",
    images: [{ url: `/api/og?title=${encodeURIComponent("Privacy Policy | Pinnacle Academic Classes")}&description=${encodeURIComponent("How Pinnacle Academic Classes (KCK Corporate Services Pvt. Ltd.) collects, uses, and protects your personal data in compliance with Indian data protection laws.")}`, width: 1200, height: 630, alt: "Privacy Policy — Pinnacle Academic Classes" }],
  },
  twitter: {
    card: "summary_large_image",
    images: [`/api/og?title=${encodeURIComponent("Privacy Policy | Pinnacle Academic Classes")}&description=${encodeURIComponent("How Pinnacle Academic Classes (KCK Corporate Services Pvt. Ltd.) collects, uses, and protects your personal data in compliance with Indian data protection laws.")}`],
  },
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="bg-[var(--color-navy)] py-12">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="font-[family-name:var(--font-playfair)] text-white text-3xl font-bold">Privacy Policy</h1>
            <p className="text-white/60 mt-2 text-sm">Last updated: 1 January 2026</p>
          </div>
        </section>
        <section className="py-12 bg-white">
          <div className="max-w-4xl mx-auto px-4 prose prose-slate max-w-none">
            {[
              { title: "1. Information We Collect", body: "We collect information you provide directly to us, such as your name, phone number, email address, and educational details when you register for a course or use our website. We also collect usage data and device information automatically when you access our services." },
              { title: "2. How We Use Your Information", body: "We use your information to process enrolments and course registrations, send academic updates, notices, and fee reminders, improve our teaching and services, and communicate about admissions and events. We do not sell or share your personal information with third parties for marketing purposes." },
              { title: "3. Information Security", body: "We implement industry-standard security measures to protect your personal information. Student data is stored securely on encrypted servers. Access is restricted to authorised Pinnacle staff only." },
              { title: "4. Cookies", body: "Our website uses cookies to enhance your browsing experience and enable portal login functionality. You may disable cookies in your browser settings, though some features may not function correctly without them." },
              { title: "5. Data Retention", body: "We retain student records for a minimum of 5 years after the end of your enrolment for academic and legal purposes. You may request deletion of your data by contacting us at care@paconline.in." },
              { title: "6. Children's Privacy", body: "Our services are intended for students aged 11 and above. For students under 18, parental consent is required for enrolment. We do not knowingly collect data from children under 11 without verified parental consent." },
              { title: "7. Your Rights", body: "You have the right to access, update, or delete your personal data. You may also opt out of marketing communications at any time. To exercise these rights, contact us at care@paconline.in or +91 99718 62138." },
              { title: "8. Contact Us", body: "For privacy-related queries, contact: KCK Corporate Services Pvt. Ltd., Shop No. 1 to 5, Shop Mart, Plot No. GH-03, Gaur City 2 Rd, Sec. 16C, Greater Noida, UP 201009 · care@paconline.in · +91 99718 62138" },
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

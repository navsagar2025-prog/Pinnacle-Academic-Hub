import { PublicLayout } from "@/components/layout/PublicLayout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const faqs = [
  {
    category: "Admissions",
    questions: [
      { q: "What is the admission process?", a: "Visit our Admissions page, fill the online enquiry form or call us directly. Our team will schedule a counselling session, assess the student's level, recommend the ideal batch, and guide you through enrollment." },
      { q: "Is there an entrance test for admission?", a: "We conduct an optional placement test to help place students in the right batch level. It is not eliminatory — it is used for assessment only." },
      { q: "What is the last date for admission?", a: "We enroll students throughout the year as long as seats are available. However, we strongly recommend enrolling at the start of an academic session (June–July) for best results." },
    ],
  },
  {
    category: "Classes & Learning",
    questions: [
      { q: "Are classes conducted online or offline?", a: "We offer both offline (in-person) and live online classes. All live online sessions are also recorded and made available in the student portal for 30 days." },
      { q: "What is the batch size?", a: "We maintain a maximum of 25 students per batch to ensure every student gets individual attention. Weekend special batches may have up to 30 students." },
      { q: "Are doubt-clearing sessions available?", a: "Yes. Dedicated doubt-clearing sessions are held every Saturday. Additionally, students can post queries in the student portal and expect responses within 24 hours on weekdays." },
      { q: "What study material is provided?", a: "Comprehensive digital notes, chapter-wise summaries, practice problems, and mock tests are all provided through the student portal. Physical material is available on request." },
    ],
  },
  {
    category: "Fees & Payments",
    questions: [
      { q: "What are the fee structures?", a: "Fees vary by course: JEE / NEET courses: ₹80,000–1,30,000/year. Class 12 Boards: ₹35,000–40,000/year. Foundation (Class 6–11): ₹20,000–60,000/year. Visit our Fee Payment page for the complete schedule." },
      { q: "Is fee payment available in installments?", a: "Yes. We offer payment in 2–3 installments over the academic year. Please speak to our admin team for a customized schedule." },
      { q: "What payment methods are accepted?", a: "We accept UPI (PhonePe, GPay, Paytm), NEFT/IMPS bank transfers, demand drafts, and cash payments at the front desk." },
    ],
  },
  {
    category: "Policies",
    questions: [
      { q: "What is the refund policy?", a: "If a student withdraws within 15 days of enrollment, 70% of the course fee (excluding registration) is refunded. After 15 days, only the deposit amount is refundable. Please see our Refund Policy page for full details." },
      { q: "Is there an attendance policy?", a: "A minimum of 75% attendance is required to be eligible for appearing in internal tests and to receive study materials for the following term." },
    ],
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  return (
    <PublicLayout>
      <div className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
            Everything you need to know about Pinnacle Academic Classes.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="space-y-10">
          {faqs.map((section) => (
            <div key={section.category}>
              <h2 className="text-xl font-serif font-bold text-primary mb-4 pb-2 border-b border-border">{section.category}</h2>
              <div className="space-y-3">
                {section.questions.map((faq, i) => {
                  const id = `${section.category}-${i}`;
                  const isOpen = openIndex === id;
                  return (
                    <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between p-5 text-left font-medium text-foreground text-sm hover:bg-muted/50 transition-colors"
                        onClick={() => setOpenIndex(isOpen ? null : id)}
                      >
                        {faq.q}
                        <span className={`ml-4 shrink-0 transition-transform duration-200 text-muted-foreground ${isOpen ? "rotate-180" : ""}`}>▾</span>
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center">
          <h3 className="font-bold text-primary mb-2">Still have questions?</h3>
          <p className="text-sm text-muted-foreground mb-6">Call us, WhatsApp us, or visit the institute in person. We're happy to help.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="tel:+919876543210">
              <Button>Call +91-98765-43210</Button>
            </a>
            <Link href="/contact">
              <Button variant="outline">Send a Message</Button>
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

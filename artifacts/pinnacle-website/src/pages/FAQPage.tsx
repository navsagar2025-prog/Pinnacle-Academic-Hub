import { useState } from "react";
import { Link } from "wouter";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import { FAQ } from "@/lib/data";
import { ChevronDown } from "lucide-react";

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <Navbar />
      <main>
        <section className="bg-[var(--color-navy)] py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <span className="badge-gold mb-4 inline-block">FAQ</span>
            <h1 className="font-[family-name:var(--font-playfair)] text-white text-4xl md:text-5xl font-bold">
              Frequently Asked Questions
            </h1>
            <p className="text-white/70 text-lg mt-4">
              Everything you need to know before joining Pinnacle Academic Classes.
            </p>
          </div>
        </section>
        <section className="py-16 bg-[var(--color-slate-light)]">
          <div className="max-w-3xl mx-auto px-4 space-y-3">
            {FAQ.map((item, idx) => (
              <div key={idx} className="card cursor-pointer" onClick={() => setOpen(open === idx ? null : idx)}>
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-bold text-[var(--color-navy)] text-sm">{item.q}</h3>
                  <ChevronDown size={18} className={`text-slate-400 flex-shrink-0 transition-transform ${open === idx ? "rotate-180" : ""}`} />
                </div>
                {open === idx && (
                  <p className="text-slate-600 text-sm leading-relaxed mt-3 pt-3 border-t border-slate-100">{item.a}</p>
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <p className="text-slate-600 mb-3">Still have questions?</p>
            <Link href="/contact" className="btn-secondary px-8 py-3">Contact Us</Link>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}

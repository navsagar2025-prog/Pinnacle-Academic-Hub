"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import { COURSES } from "@/lib/data";
import { CheckCircle, Send, Phone, Mail, Download } from "lucide-react";

const ADMISSION_STEPS = [
  { step: "1", title: "Enquire / Call", description: "Fill the form below or call us. Our counsellor will contact you within 24 hours." },
  { step: "2", title: "Attend Demo Class", description: "Attend a free demo class in your chosen subject. No payment required." },
  { step: "3", title: "Select Batch", description: "Choose your programme and batch timing based on your schedule and target exam." },
  { step: "4", title: "Complete Admission", description: "Submit documents and first instalment. Receive your student ID and study material." },
];

export default function AdmissionsPage() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", course: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
    setForm({ name: "", phone: "", email: "", course: "", message: "" });
  }

  return (
    <>
      <Navbar />
      <main>
        <section className="bg-[var(--color-navy)] py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <span className="badge-gold mb-4 inline-block">Admissions 2026–27</span>
            <h1 className="font-[family-name:var(--font-playfair)] text-white text-4xl md:text-5xl font-bold">
              Begin Your Journey at Pinnacle
            </h1>
            <p className="text-white/70 text-lg mt-4">
              Summer batches now open. Limited seats — early registration closes 15 May 2026.
            </p>
          </div>
        </section>

        {/* Steps */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="section-heading">How Admissions Work</h2>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              {ADMISSION_STEPS.map((s) => (
                <div key={s.step} className="text-center">
                  <div className="w-12 h-12 bg-[var(--color-navy)] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 font-[family-name:var(--font-playfair)]">{s.step}</div>
                  <h3 className="font-bold text-[var(--color-navy)] mb-2">{s.title}</h3>
                  <p className="text-slate-600 text-sm">{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-[var(--color-slate-light)]">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Form */}
              <div>
                <h2 className="section-heading mb-6">Book a Free Demo Class</h2>
                {submitted ? (
                  <div className="card bg-[var(--color-teal)]/5 border-[var(--color-teal)]/20 text-center py-10">
                    <CheckCircle size={48} className="text-[var(--color-teal)] mx-auto mb-4" />
                    <h3 className="font-bold text-[var(--color-navy)] text-xl font-[family-name:var(--font-playfair)] mb-2">Enquiry Submitted!</h3>
                    <p className="text-slate-600">Our counsellor will call you within 24 hours to schedule your free demo class.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="card space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Student Name *</label>
                        <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Full name" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Phone Number *</label>
                        <input type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="+91 XXXXX XXXXX" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Email Address</label>
                      <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="student@email.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Course of Interest *</label>
                      <select required value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} className="input-field">
                        <option value="">Select a programme</option>
                        {COURSES.map((c) => <option key={c.id} value={c.title}>{c.title}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Message / Query</label>
                      <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} className="input-field resize-none" placeholder="Any specific questions or requirements..." />
                    </div>
                    <button type="submit" disabled={loading} className="btn-secondary w-full justify-center py-3.5">
                      {loading ? "Submitting..." : <><Send size={16} />Submit Enquiry</>}
                    </button>
                    <p className="text-xs text-slate-400 text-center">No payment required. Our counsellor will contact you within 24 hours.</p>
                  </form>
                )}
              </div>

              {/* Fee table + contact */}
              <div className="space-y-6">
                <div className="card" id="brochure">
                  <h3 className="font-bold text-[var(--color-navy)] mb-4 font-[family-name:var(--font-playfair)]">Fee Structure 2026–27</h3>
                  <div className="divide-y divide-slate-100">
                    {COURSES.map((c) => (
                      <div key={c.id} className="flex items-center justify-between py-3">
                        <div>
                          <div className="font-semibold text-sm text-[var(--color-navy)]">{c.title}</div>
                          <div className="text-xs text-slate-400">{c.duration} · {c.batches.join(", ")} batch</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-[var(--color-navy)]">₹{c.fee.toLocaleString("en-IN")}</div>
                          <div className="text-xs text-slate-400">per year</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-3">* Instalment options available. Admission fee ₹2,000 (one-time, adjustable).</p>
                </div>

                <div className="card">
                  <h3 className="font-bold text-[var(--color-navy)] mb-4 font-[family-name:var(--font-playfair)]">Contact Admissions</h3>
                  <div className="space-y-3">
                    <a href="tel:+919876543210" className="flex items-center gap-3 text-slate-700 hover:text-[var(--color-teal)] transition-colors">
                      <div className="w-9 h-9 bg-[var(--color-teal)]/10 rounded-lg flex items-center justify-center"><Phone size={15} className="text-[var(--color-teal)]" /></div>
                      <span className="text-sm font-semibold">+91 98765 43210</span>
                    </a>
                    <a href="mailto:admissions@pinnacleacademic.in" className="flex items-center gap-3 text-slate-700 hover:text-[var(--color-teal)] transition-colors">
                      <div className="w-9 h-9 bg-[var(--color-teal)]/10 rounded-lg flex items-center justify-center"><Mail size={15} className="text-[var(--color-teal)]" /></div>
                      <span className="text-sm font-semibold">admissions@pinnacleacademic.in</span>
                    </a>
                  </div>
                  <div className="mt-4 p-3 bg-[var(--color-gold)]/5 rounded-xl">
                    <div className="text-xs font-semibold text-[var(--color-navy)] mb-1">Walk-in Hours</div>
                    <div className="text-sm text-slate-600">Mon–Sat: 9:00 AM – 7:00 PM</div>
                  </div>
                  <button className="btn-outline w-full justify-center mt-4 py-2.5 text-sm">
                    <Download size={15} />Download Brochure (PDF)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}

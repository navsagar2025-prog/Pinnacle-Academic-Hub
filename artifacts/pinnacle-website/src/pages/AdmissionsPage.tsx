import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import { COURSES } from "@/lib/data";
import { CONTACT } from "@/lib/contact";
import { CheckCircle, Send, Phone, Mail, Download, AlertCircle } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

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
  const [error, setError] = useState<string | null>(null);
  const [prospectusUrl, setProspectusUrl] = useState<string | null>(null);
  const [prospectusLoading, setProspectusLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/api/v1/settings/prospectus`)
      .then(r => r.json())
      .then((d: { ok?: boolean; data?: { url: string | null } }) => {
        if (d.ok && d.data?.url) setProspectusUrl(d.data.url);
      })
      .catch(() => {})
      .finally(() => setProspectusLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/v1/enquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email || undefined,
          courseInterest: form.course || undefined,
          message: form.message || undefined,
          source: "admissions_page",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Submission failed. Please try again.");
      }
      setSubmitted(true);
      setForm({ name: "", phone: "", email: "", course: "", message: "" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
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

        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-[var(--color-navy)]">Admission Process</h2>
              <p className="text-slate-500 mt-2">Simple and transparent — 4 easy steps</p>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              {ADMISSION_STEPS.map((s) => (
                <div key={s.step} className="text-center">
                  <div className="w-14 h-14 rounded-full bg-[var(--color-navy)] text-white font-bold text-xl flex items-center justify-center mx-auto mb-4 font-[family-name:var(--font-playfair)]">{s.step}</div>
                  <h3 className="font-bold text-[var(--color-navy)] mb-2">{s.title}</h3>
                  <p className="text-slate-500 text-sm">{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-[var(--color-slate-light)]">
          <div className="max-w-4xl mx-auto px-4">
            <div className="grid md:grid-cols-5 gap-8 items-start">
              <div className="md:col-span-3">
                <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)] mb-6">Request a Callback</h2>

                {submitted ? (
                  <div className="card bg-[var(--color-teal)]/5 border-[var(--color-teal)]/20 text-center py-10">
                    <CheckCircle size={40} className="text-[var(--color-teal)] mx-auto mb-4" />
                    <h3 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[var(--color-navy)] mb-2">Enquiry Submitted!</h3>
                    <p className="text-slate-600">Our counsellor will call you within 24 hours. Meanwhile, feel free to WhatsApp us for faster response.</p>
                    <button onClick={() => setSubmitted(false)} className="mt-6 btn-secondary py-2 px-5 text-sm">Submit Another Enquiry</button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="card space-y-4">
                    {error && (
                      <div className="flex items-center gap-2 text-sm text-[var(--color-maroon)] bg-[var(--color-maroon)]/5 border border-[var(--color-maroon)]/20 rounded-lg px-3 py-2">
                        <AlertCircle size={15} className="flex-shrink-0" /> {error}
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Full Name *</label>
                      <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Arjun Mehta" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Phone Number *</label>
                      <input required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. +91 98765 43210" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Email Address</label>
                      <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="optional" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Programme of Interest</label>
                      <select value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} className="input-field">
                        <option value="">Select a programme</option>
                        {COURSES.map((c) => <option key={c.id} value={c.title}>{c.title}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Message / Questions</label>
                      <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} placeholder="Any specific questions or requirements?" className="input-field resize-none" />
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                      {loading ? <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <Send size={16} />}
                      {loading ? "Submitting..." : "Submit Enquiry"}
                    </button>
                  </form>
                )}
              </div>

              <div className="md:col-span-2 space-y-4">
                <div className="card">
                  <h3 className="font-bold text-[var(--color-navy)] mb-3">Contact Admissions Office</h3>
                  <div className="space-y-3 text-sm text-slate-600">
                    <div className="flex items-center gap-2"><Phone size={14} className="text-[var(--color-teal)]" /><a href={CONTACT.telHref} className="hover:text-[var(--color-teal)] transition-colors">{CONTACT.phone}</a></div>
                    <div className="flex items-center gap-2"><Mail size={14} className="text-[var(--color-teal)]" /><a href={CONTACT.emailHref} className="hover:text-[var(--color-teal)] transition-colors">{CONTACT.email}</a></div>
                  </div>
                </div>
                <div className="card">
                  <h3 className="font-bold text-[var(--color-navy)] mb-3">Documents Required</h3>
                  <ul className="space-y-2 text-sm text-slate-600">
                    {["Class 10 Marksheet (photocopy)", "Aadhar Card / School ID", "2 passport-size photographs", "Transfer Certificate (if applicable)"].map((d) => (
                      <li key={d} className="flex items-center gap-2"><CheckCircle size={13} className="text-[var(--color-teal)] flex-shrink-0" />{d}</li>
                    ))}
                  </ul>
                </div>
                {prospectusLoading ? (
                  <div className="card flex items-center gap-3 text-slate-400 animate-pulse">
                    <Download size={18} className="text-slate-300" />
                    Download Prospectus 2026–27
                  </div>
                ) : prospectusUrl ? (
                  <a
                    href={prospectusUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card flex items-center gap-3 text-[var(--color-navy)] font-semibold hover:shadow-elevated transition-all group"
                  >
                    <Download size={18} className="text-[var(--color-gold)] group-hover:scale-110 transition-transform" />
                    Download Prospectus 2026–27
                  </a>
                ) : (
                  <a
                    href="/contact"
                    className="card flex items-center gap-3 text-[var(--color-navy)] font-semibold hover:shadow-elevated transition-all group"
                  >
                    <Download size={18} className="text-[var(--color-gold)] group-hover:scale-110 transition-transform" />
                    <div>
                      <p>Download Prospectus 2026–27</p>
                      <p className="text-xs font-normal text-slate-400 mt-0.5">Request a copy via our contact form</p>
                    </div>
                  </a>
                )}
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

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import { CONTACT } from "@/lib/contact";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle, AlertCircle } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/v1/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Submission failed. Please try again.");
      setSubmitted(true);
      setForm({ name: "", phone: "", email: "", subject: "", message: "" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
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
            <span className="badge-gold mb-4 inline-block">Get in Touch</span>
            <h1 className="font-[family-name:var(--font-playfair)] text-white text-4xl md:text-5xl font-bold">
              Contact Us
            </h1>
            <p className="text-white/70 text-lg mt-4">
              Have questions? We're here to help. Call, email, or visit our campus.
            </p>
          </div>
        </section>

        <section className="py-16 bg-[var(--color-slate-light)]">
          <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-5 gap-10">
            <div className="lg:col-span-2 space-y-4">
              <div className="card">
                <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[var(--color-navy)] mb-4">Contact Information</h2>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-9 h-9 bg-[var(--color-teal)]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin size={16} className="text-[var(--color-teal)]" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Address</div>
                      <p className="text-slate-700 text-sm">{CONTACT.address}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-9 h-9 bg-[var(--color-teal)]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone size={16} className="text-[var(--color-teal)]" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Phone</div>
                      <a href={CONTACT.telHref} className="text-slate-700 text-sm hover:text-[var(--color-teal)] transition-colors">{CONTACT.phone}</a>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-9 h-9 bg-[var(--color-teal)]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail size={16} className="text-[var(--color-teal)]" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email</div>
                      <a href={CONTACT.emailHref} className="text-slate-700 text-sm hover:text-[var(--color-teal)] transition-colors">{CONTACT.email}</a>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-9 h-9 bg-[var(--color-teal)]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock size={16} className="text-[var(--color-teal)]" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Hours</div>
                      <p className="text-slate-700 text-sm">{CONTACT.hours}<br />Sunday: Closed</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card p-0 overflow-hidden rounded-xl">
                <iframe
                  src={CONTACT.mapsEmbed}
                  width="100%"
                  height="220"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  title="Pinnacle Academic Classes location"
                />
              </div>

              <a
                href={CONTACT.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-[#25D366] text-white px-5 py-3 rounded-xl font-semibold hover:bg-[#1db954] transition-colors"
              >
                <span className="text-xl">💬</span>
                Chat on WhatsApp
              </a>
            </div>

            <div className="lg:col-span-3">
              <div className="card">
                <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[var(--color-navy)] mb-6">Send Us a Message</h2>
                {submitted ? (
                  <div className="text-center py-10">
                    <CheckCircle size={40} className="text-[var(--color-teal)] mx-auto mb-4" />
                    <h3 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[var(--color-navy)] mb-2">Message Sent!</h3>
                    <p className="text-slate-600">We'll get back to you within 24 hours.</p>
                    <button onClick={() => setSubmitted(false)} className="mt-6 btn-secondary py-2 px-5 text-sm">Send Another Message</button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="flex items-center gap-2 text-sm text-[var(--color-maroon)] bg-[var(--color-maroon)]/5 border border-[var(--color-maroon)]/20 rounded-lg px-3 py-2">
                        <AlertCircle size={15} className="flex-shrink-0" /> {error}
                      </div>
                    )}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Full Name *</label>
                        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" className="input-field" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Phone Number</label>
                        <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Your phone" className="input-field" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Email Address *</label>
                      <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Your email" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Subject</label>
                      <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="What is this about?" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Message *</label>
                      <textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} placeholder="Your message..." className="input-field resize-none" />
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                      {loading ? <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <Send size={16} />}
                      {loading ? "Sending..." : "Send Message"}
                    </button>
                  </form>
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

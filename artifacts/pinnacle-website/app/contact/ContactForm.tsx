"use client";

import { useState } from "react";
import { Send, CheckCircle, MapPin, Phone, Mail, Clock } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

type ContactInfo = {
  address: string;
  phone: string;
  email: string;
  whatsapp: string;
};

export function ContactDetails({ info }: { info: ContactInfo }) {
  const items = [
    { icon: <MapPin size={20} />, label: "Address", value: info.address, href: null },
    { icon: <Phone size={20} />, label: "Phone", value: info.phone, href: `tel:${info.phone.replace(/\s/g, "")}` },
    { icon: <Mail size={20} />, label: "Email", value: info.email, href: `mailto:${info.email}` },
    { icon: <Clock size={20} />, label: "Hours", value: "Mon–Sat: 9:00 AM – 8:00 PM", href: null },
  ];

  return (
    <div className="lg:col-span-2 space-y-4">
      <h2 className="section-heading text-2xl mb-6">Our Details</h2>
      {items.map((c) => (
        <div key={c.label} className="card flex gap-4">
          <div className="w-10 h-10 bg-[var(--color-teal)]/10 rounded-xl flex items-center justify-center text-[var(--color-teal)] flex-shrink-0">
            {c.icon}
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{c.label}</div>
            {c.href ? (
              <a href={c.href} className="text-slate-700 text-sm font-semibold hover:text-[var(--color-teal)] transition-colors">{c.value}</a>
            ) : (
              <div className="text-slate-700 text-sm">{c.value}</div>
            )}
          </div>
        </div>
      ))}
      <div className="card bg-[var(--color-navy)] text-white">
        <h3 className="font-bold font-[family-name:var(--font-playfair)] mb-2">WhatsApp Us</h3>
        <p className="text-white/70 text-sm mb-3">Quick queries answered on WhatsApp 9 AM – 8 PM.</p>
        <a
          href={`https://wa.me/${info.whatsapp.replace(/\D/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-gold py-2 px-5 text-sm w-full justify-center"
        >
          Open WhatsApp
        </a>
      </div>
    </div>
  );
}

export function ContactForm() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/v1/enquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email || undefined,
          courseInterest: form.subject || undefined,
          message: form.message || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
    } catch {
      alert("Something went wrong. Please call us directly.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="lg:col-span-3">
      <h2 className="section-heading text-2xl mb-6">Send a Message</h2>
      {submitted ? (
        <div className="card text-center py-12">
          <CheckCircle size={48} className="text-[var(--color-teal)] mx-auto mb-4" />
          <h3 className="font-bold text-[var(--color-navy)] text-xl font-[family-name:var(--font-playfair)] mb-2">Message Sent!</h3>
          <p className="text-slate-600">We'll get back to you within 24 hours.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Your Name *</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Full name" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Phone *</label>
              <input type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="+91 XXXXX XXXXX" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="email@example.com" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Subject *</label>
            <input type="text" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="input-field" placeholder="e.g. Enquiry about JEE batch" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[var(--color-navy)] mb-1.5">Message *</label>
            <textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={5} className="input-field resize-none" placeholder="Write your message here..." />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5">
            {loading ? "Sending..." : <><Send size={16} />Send Message</>}
          </button>
        </form>
      )}
    </div>
  );
}

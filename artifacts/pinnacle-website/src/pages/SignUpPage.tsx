import { Link } from "wouter";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { UserPlus, BookOpen, Phone } from "lucide-react";
import { CONTACT } from "@/lib/contact";

export default function SignUpPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--color-slate-light)] py-16">
        <div className="max-w-lg mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-[var(--color-navy)] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <UserPlus size={28} className="text-[var(--color-gold)]" />
          </div>
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-[var(--color-navy)] mb-3">
            Join Pinnacle
          </h1>
          <p className="text-slate-500 mb-8">
            Admissions are handled directly at our campus. Fill in the enquiry form and our team will reach out to you within 24 hours.
          </p>

          <div className="card mb-6 text-left space-y-4">
            <div className="flex items-start gap-3">
              <BookOpen size={20} className="text-[var(--color-teal)] mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-[var(--color-navy)]">Submit an Enquiry</p>
                <p className="text-sm text-slate-500">Fill our online enquiry form and a counsellor will call you back.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone size={20} className="text-[var(--color-teal)] mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-[var(--color-navy)]">Call Us Directly</p>
                <p className="text-sm text-slate-500">
                  <a href={CONTACT.telHref} className="text-[var(--color-teal)] hover:underline">{CONTACT.phone}</a> — Mon–Sat, 8 AM – 7 PM
                </p>
              </div>
            </div>
          </div>

          <Link href="/admissions" className="btn-primary px-8 py-3 inline-block text-base mb-4">
            Fill Enquiry Form
          </Link>
          <p className="text-sm text-slate-500">
            Already a student?{" "}
            <Link href="/sign-in" className="text-[var(--color-teal)] font-semibold hover:underline">Sign In</Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}

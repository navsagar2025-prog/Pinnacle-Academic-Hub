import { Link } from "wouter";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { LogIn, ShieldCheck } from "lucide-react";

const PORTALS = [
  { role: "Student", href: "/portal/student", description: "Access mock tests, assignments, attendance, and study materials.", color: "bg-blue-50 border-blue-200 hover:border-blue-400" },
  { role: "Parent", href: "/portal/parent", description: "Monitor your child's attendance, fee records, and academic progress.", color: "bg-green-50 border-green-200 hover:border-green-400" },
  { role: "Teacher", href: "/portal/teacher", description: "Manage batches, create tests, post assignments, and track performance.", color: "bg-purple-50 border-purple-200 hover:border-purple-400" },
  { role: "Admin", href: "/portal/admin", description: "Full platform management — students, fees, content, and analytics.", color: "bg-amber-50 border-amber-200 hover:border-amber-400" },
];

export default function SignInPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--color-slate-light)] py-16">
        <div className="max-w-lg mx-auto px-4">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-[var(--color-navy)] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LogIn size={28} className="text-[var(--color-gold)]" />
            </div>
            <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-[var(--color-navy)] mb-2">Sign In</h1>
            <p className="text-slate-500">Choose your portal to continue</p>
          </div>

          <div className="space-y-3">
            {PORTALS.map((p) => (
              <Link
                key={p.role}
                href={p.href}
                className={`block card border-2 transition-all ${p.color} cursor-pointer`}
              >
                <div className="flex items-start gap-3">
                  <ShieldCheck size={20} className="text-[var(--color-navy)] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-[var(--color-navy)]">{p.role} Portal</p>
                    <p className="text-sm text-slate-600 mt-0.5">{p.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <p className="text-center text-sm text-slate-500 mt-8">
            New student?{" "}
            <Link href="/admissions" className="text-[var(--color-teal)] font-semibold hover:underline">
              Apply for Admissions
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}

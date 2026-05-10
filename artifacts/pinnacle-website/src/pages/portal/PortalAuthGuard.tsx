import { Link } from "wouter";
import { ShieldCheck } from "lucide-react";

type Role = "student" | "parent" | "teacher" | "admin";

const ROLE_META: Record<Role, { label: string; color: string; description: string }> = {
  student: { label: "Student", color: "text-blue-600 bg-blue-50", description: "Access mock tests, study materials, attendance, and your personal dashboard." },
  parent: { label: "Parent", color: "text-green-600 bg-green-50", description: "Monitor your child's attendance, fee records, and academic progress." },
  teacher: { label: "Teacher", color: "text-purple-600 bg-purple-50", description: "Manage your batches, post assignments, create mock tests, and track student performance." },
  admin: { label: "Admin", color: "text-amber-700 bg-amber-50", description: "Full platform management — students, fees, content, analytics, and system settings." },
};

export default function PortalAuthGuard({ role }: { role: Role }) {
  const meta = ROLE_META[role];
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[var(--color-slate-light)] px-4">
      <div className="max-w-md w-full text-center">
        <div className={`w-16 h-16 rounded-2xl ${meta.color} flex items-center justify-center mx-auto mb-5`}>
          <ShieldCheck size={32} />
        </div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)] mb-2">
          {meta.label} Portal
        </h1>
        <p className="text-slate-500 text-sm mb-6">{meta.description}</p>

        <div className="card text-left mb-6 border border-slate-200">
          <p className="text-[var(--color-navy)] font-semibold text-sm mb-1">Authentication Required</p>
          <p className="text-slate-500 text-sm">
            Secure portal login is being set up. Students, parents, and staff will be able to sign in directly once authentication is live.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/admissions" className="btn-primary px-6 py-2.5">
            Apply / Enquire
          </Link>
          <Link href="/contact" className="btn-outline px-6 py-2.5">
            Contact Us
          </Link>
        </div>

        <p className="mt-6 text-xs text-slate-400">
          Already enrolled and need access? Call{" "}
          <a href="tel:+919971862138" className="text-[var(--color-teal)] hover:underline">+91 99718 62138</a>
        </p>
      </div>
    </div>
  );
}

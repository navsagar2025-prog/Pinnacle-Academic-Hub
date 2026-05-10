import { Link } from "wouter";
import { Show, useUser } from "@clerk/react";
import { ShieldCheck, LogIn, ShieldAlert } from "lucide-react";

type Role = "student" | "parent" | "teacher" | "admin";

const ADMIN_EMAIL = "navendu.sagar@gmail.com";

const ROLE_META: Record<Role, { label: string; color: string; icon: string; description: string }> = {
  student: {
    label: "Student",
    color: "text-blue-600 bg-blue-50",
    icon: "📚",
    description: "Access mock tests, study materials, attendance, and your personal dashboard.",
  },
  parent: {
    label: "Parent",
    color: "text-green-600 bg-green-50",
    icon: "👨‍👩‍👧",
    description: "Monitor your child's attendance, fee records, and academic progress.",
  },
  teacher: {
    label: "Teacher",
    color: "text-purple-600 bg-purple-50",
    icon: "🎓",
    description: "Manage your batches, post assignments, create mock tests, and track student performance.",
  },
  admin: {
    label: "Admin",
    color: "text-amber-700 bg-amber-50",
    icon: "⚙️",
    description: "Full platform management — students, fees, content, analytics, and system settings.",
  },
};

function AdminAccessDenied() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[var(--color-slate-light)] px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl text-red-600 bg-red-50 flex items-center justify-center mx-auto mb-5">
          <ShieldAlert size={32} />
        </div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)] mb-2">
          Access Denied
        </h1>
        <p className="text-slate-500 text-sm mb-6">
          You do not have administrator access to this portal. Contact the system administrator if you believe this is an error.
        </p>
        <Link href="/" className="btn-primary px-6 py-2.5 inline-flex items-center gap-2">
          Go to Home
        </Link>
      </div>
    </div>
  );
}

function AdminPortalContent({ children }: { children?: React.ReactNode }) {
  const { user } = useUser();
  const primaryEmail = user?.primaryEmailAddress?.emailAddress ?? "";
  if (primaryEmail !== ADMIN_EMAIL) return <AdminAccessDenied />;
  return (
    <>
      {children ?? (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[var(--color-slate-light)] px-4">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-2xl text-amber-700 bg-amber-50 flex items-center justify-center mx-auto mb-5">
              <ShieldCheck size={32} />
            </div>
            <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)] mb-2">
              Admin Portal
            </h1>
            <p className="text-slate-500 text-sm mb-6">Full platform management dashboard</p>
            <div className="card border border-slate-200 text-left">
              <p className="text-[var(--color-navy)] font-semibold text-sm mb-1">Coming Soon</p>
              <p className="text-slate-500 text-sm">
                Welcome, {user?.firstName ?? "Administrator"}. The full admin dashboard is being built.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function PortalAuthGuard({ role, children }: { role: Role; children?: React.ReactNode }) {
  const meta = ROLE_META[role];
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <>
      <Show when="signed-in">
        {role === "admin" ? (
          <AdminPortalContent>{children}</AdminPortalContent>
        ) : (
          <>
            {children ?? (
              <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[var(--color-slate-light)] px-4">
                <div className="max-w-md w-full text-center">
                  <div className={`w-16 h-16 rounded-2xl ${meta.color} flex items-center justify-center mx-auto mb-5 text-2xl`}>
                    {meta.icon}
                  </div>
                  <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)] mb-2">
                    {meta.label} Portal
                  </h1>
                  <p className="text-slate-500 text-sm mb-6">{meta.description}</p>
                  <div className="card border border-slate-200 text-left">
                    <p className="text-[var(--color-navy)] font-semibold text-sm mb-1">Coming Soon</p>
                    <p className="text-slate-500 text-sm">
                      You're signed in! The full {meta.label.toLowerCase()} dashboard is being built.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </Show>
      <Show when="signed-out">
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[var(--color-slate-light)] px-4">
          <div className="max-w-md w-full text-center">
            <div className={`w-16 h-16 rounded-2xl ${meta.color} flex items-center justify-center mx-auto mb-5 text-2xl`}>
              {meta.icon}
            </div>
            <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)] mb-2">
              {meta.label} Portal
            </h1>
            <p className="text-slate-500 text-sm mb-6">{meta.description}</p>
            <div className="card text-left mb-6 border border-slate-200">
              <p className="text-[var(--color-navy)] font-semibold text-sm mb-1">Sign in required</p>
              <p className="text-slate-500 text-sm">
                Please sign in with your Pinnacle account to access the {meta.label.toLowerCase()} portal.
              </p>
            </div>
            <Link
              href={`${basePath}/sign-in?portal=${role}`}
              className="btn-primary px-6 py-2.5 inline-flex items-center gap-2"
            >
              <LogIn size={16} />
              Sign In to Continue
            </Link>
            <p className="mt-6 text-xs text-slate-400">
              New to Pinnacle?{" "}
              <a href="tel:+919971862138" className="text-[var(--color-teal)] hover:underline">
                Call +91 99718 62138
              </a>{" "}
              to enquire about admissions.
            </p>
          </div>
        </div>
      </Show>
    </>
  );
}

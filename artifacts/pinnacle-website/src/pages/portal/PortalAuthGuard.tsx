import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Show, useUser, useAuth } from "@clerk/react";
import { ShieldCheck, LogIn, ShieldAlert, Clock, XCircle } from "lucide-react";

type Role = "student" | "parent" | "teacher" | "admin";

const ADMIN_EMAILS = [
  "navendu.sagar@gmail.com",
  "nav.sagar2025@gmail.com",
  "nav.sagar2013@gmail.com",
];

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

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

// ── Approval status screens ───────────────────────────────────────────────────

function ApprovalPendingScreen() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[var(--color-slate-light)] px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl text-amber-600 bg-amber-50 flex items-center justify-center mx-auto mb-5">
          <Clock size={32} />
        </div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)] mb-2">
          Approval Pending
        </h1>
        <p className="text-slate-500 text-sm mb-6">
          Your account has been created and is awaiting approval from an administrator.
          You will be able to access your portal once approved — usually within 1–2 business days.
        </p>
        <div className="card border border-amber-200 bg-amber-50 text-left mb-6">
          <p className="text-amber-800 font-semibold text-sm mb-1">Need faster access?</p>
          <p className="text-amber-700 text-sm">
            Call us at{" "}
            <a href="tel:+919971862138" className="underline font-medium">+91 99718 62138</a>{" "}
            and ask an admin to approve your account.
          </p>
        </div>
        <Link href="/" className="btn-primary px-6 py-2.5 inline-flex items-center gap-2">
          Back to Home
        </Link>
      </div>
    </div>
  );
}

function ApprovalRejectedScreen() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[var(--color-slate-light)] px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl text-red-600 bg-red-50 flex items-center justify-center mx-auto mb-5">
          <XCircle size={32} />
        </div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)] mb-2">
          Account Not Approved
        </h1>
        <p className="text-slate-500 text-sm mb-6">
          Your account registration was not approved. Please contact us if you believe this is an error.
        </p>
        <a href="tel:+919971862138" className="btn-primary px-6 py-2.5 inline-flex items-center gap-2">
          Call +91 99718 62138
        </a>
      </div>
    </div>
  );
}

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

// ── Approval guard (wraps non-admin portals) ──────────────────────────────────

function ApprovalGuard({ children, getToken }: { children?: React.ReactNode; getToken: () => Promise<string | null> }) {
  const [status, setStatus] = useState<"loading" | "pending" | "rejected" | "approved">("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${BASE}/api/v1/portal/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) { if (!cancelled) setStatus("approved"); return; }
        const json = await res.json();
        const approvalStatus: string = json?.data?.user?.approvalStatus ?? "approved";
        if (!cancelled) setStatus(
          approvalStatus === "pending" ? "pending"
          : approvalStatus === "rejected" ? "rejected"
          : "approved"
        );
      } catch {
        if (!cancelled) setStatus("approved"); // fail-open so portal still loads on network errors
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--color-navy)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (status === "pending") return <ApprovalPendingScreen />;
  if (status === "rejected") return <ApprovalRejectedScreen />;
  return <>{children}</>;
}

function AdminPortalContent({ children }: { children?: React.ReactNode }) {
  const { user } = useUser();
  const primaryEmail = user?.primaryEmailAddress?.emailAddress ?? "";
  if (!ADMIN_EMAILS.includes(primaryEmail)) return <AdminAccessDenied />;
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
            <p className="text-slate-500 text-sm">Welcome, {user?.firstName ?? "Administrator"}</p>
          </div>
        </div>
      )}
    </>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function PortalAuthGuard({ role, children }: { role: Role; children?: React.ReactNode }) {
  const meta = ROLE_META[role];
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const { getToken } = useAuth();

  return (
    <>
      <Show when="signed-in">
        {role === "admin" ? (
          <AdminPortalContent>{children}</AdminPortalContent>
        ) : (
          <ApprovalGuard getToken={getToken}>{children}</ApprovalGuard>
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

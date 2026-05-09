/**
 * Sign-in page.
 *
 * Renders Clerk's embedded <SignIn /> alongside an invisible
 * <SignInFailureTracker /> component. The tracker shares the same
 * useSignIn() context as <SignIn />, so it detects credential failures
 * and reports them to POST /api/v1/auth/record-failure — a server route
 * that has the real client IP in its request headers (browser-to-our-server,
 * not Clerk-webhook-to-our-server). This enables accurate IP-based
 * login-failure logging and auto-lockout.
 */
import { SignIn } from "@clerk/nextjs";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import type { Metadata } from "next";
import { SignInFailureTracker } from "./SignInFailureTracker";
import { SignInSuccessTracker } from "./SignInSuccessTracker";

export const metadata: Metadata = { title: "Sign In | Pinnacle Academic Classes" };

export default function SignInPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--color-slate-light)] flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">
              Welcome Back
            </h1>
            <p className="text-slate-500 text-sm mt-1">Sign in to access your Pinnacle portal</p>
          </div>
          <SignIn appearance={{ elements: { rootBox: "w-full", card: "shadow-elevated border border-slate-100 rounded-2xl" } }} />
          {/* Invisible trackers — share useSignIn()/useSession() context with <SignIn /> above */}
          <SignInFailureTracker />
          <SignInSuccessTracker />
        </div>
      </main>
      <Footer />
    </>
  );
}

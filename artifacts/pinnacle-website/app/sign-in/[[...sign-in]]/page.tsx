import { SignIn } from "@clerk/nextjs";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import type { Metadata } from "next";

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
        </div>
      </main>
      <Footer />
    </>
  );
}

import { Show } from "@clerk/react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TeacherDashboard from "./TeacherDashboard";
import { Link } from "wouter";

export default function TeacherPortalPage() {
  return (
    <>
      <Navbar />
      <Show when="signed-in">
        <TeacherDashboard />
      </Show>
      <Show when="signed-out">
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-3xl mb-4">🧑‍🏫</div>
          <h2 className="text-2xl font-bold text-[var(--color-navy)] mb-2 font-[family-name:var(--font-playfair)]">Teacher Portal</h2>
          <p className="text-slate-500 text-sm max-w-sm mb-6">Sign in to view your schedule, batches, and school notices.</p>
          <Link href="/portal/sign-in" className="btn-primary">Sign In to Continue</Link>
        </div>
      </Show>
      <Footer />
    </>
  );
}

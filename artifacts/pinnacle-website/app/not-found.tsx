import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata = { title: "Page Not Found — Pinnacle Academic Classes" };

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="min-h-[70vh] flex items-center justify-center px-4 bg-[var(--color-slate-light)]">
        <div className="text-center max-w-md">
          <p className="font-[family-name:var(--font-playfair)] text-8xl font-bold text-[var(--color-navy)]/10 select-none">
            404
          </p>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)] -mt-4 mb-3">
            Page Not Found
          </h1>
          <p className="text-slate-500 text-sm mb-8">
            The page you are looking for does not exist or has been moved. Check the URL or return to the homepage.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/" className="btn-primary px-6 py-2.5 text-sm">
              Back to Home
            </Link>
            <Link href="/contact" className="btn-outline px-6 py-2.5 text-sm">
              Contact Us
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

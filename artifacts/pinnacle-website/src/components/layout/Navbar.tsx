import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, BookOpen, Phone, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTACT } from "@/lib/contact";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Courses", href: "/courses" },
  { label: "Fee Structure", href: "/fee-structure" },
  { label: "Faculty", href: "/faculty" },
  { label: "Results", href: "/results" },
  { label: "Admissions", href: "/admissions" },
  { label: "Notices", href: "/notices" },
  { label: "Blog", href: "/blog" },
  { label: "Gallery", href: "/gallery" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const MORE_LINKS = [
  { label: "Results & Toppers", href: "/results" },
  { label: "Achievements", href: "/achievements" },
  { label: "Notices", href: "/notices" },
  { label: "Blog", href: "/blog" },
  { label: "Gallery", href: "/gallery" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "About Us", href: "/about" },
  { label: "FAQ", href: "/faq" },
];

const PRIMARY_LINKS = [
  { label: "Home", href: "/" },
  { label: "Courses", href: "/courses" },
  { label: "SSC", href: "/ssc" },
  { label: "Faculty", href: "/faculty" },
  { label: "Admissions", href: "/admissions" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
      <div className="bg-[var(--color-navy)] text-white text-xs">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between py-1.5">
          <div className="flex items-center gap-4">
            <a href={CONTACT.telHref} className="flex items-center gap-1 hover:text-[var(--color-gold)] transition-colors">
              <Phone size={12} />
              <span>{CONTACT.phone}</span>
            </a>
            <span className="hidden md:inline text-white/40">·</span>
            <span className="hidden md:inline text-white/70">Unit of KCK Corporate Services Pvt. Ltd.</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admissions" className="bg-[var(--color-gold)] text-[var(--color-navy)] px-3 py-0.5 rounded text-xs font-bold hover:bg-[var(--color-gold-light)] transition-colors">
              Enrol Now
            </Link>
            <Link href="/sign-in" className="hidden sm:inline text-white/90 hover:text-[var(--color-gold)] transition-colors font-semibold">
              Sign In
            </Link>
          </div>
        </div>
      </div>

      <nav className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <img src="/logo.png" alt="Pinnacle Academic Classes" className="h-11 w-auto object-contain" />
          <div>
            <div className="text-[var(--color-navy)] font-bold text-base font-[family-name:var(--font-playfair)] leading-tight">
              Pinnacle
            </div>
            <div className="text-[var(--color-teal)] text-xs font-semibold leading-tight">
              Academic Classes
            </div>
          </div>
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {PRIMARY_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                location === link.href
                  ? "text-[var(--color-navy)] bg-[var(--color-navy)]/5"
                  : "text-slate-600 hover:text-[var(--color-navy)] hover:bg-[var(--color-navy)]/5"
              )}
            >
              {link.label}
            </Link>
          ))}

          <Link
            href="/results"
            className={cn(
              "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              location === "/results"
                ? "text-[var(--color-navy)] bg-[var(--color-navy)]/5"
                : "text-slate-600 hover:text-[var(--color-navy)] hover:bg-[var(--color-navy)]/5"
            )}
          >
            Results
          </Link>

          <div className="relative">
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              onBlur={() => setTimeout(() => setMoreOpen(false), 150)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-[var(--color-navy)] hover:bg-[var(--color-navy)]/5 transition-colors"
            >
              More
              <ChevronDown size={14} className={`transition-transform ${moreOpen ? "rotate-180" : ""}`} />
            </button>
            {moreOpen && (
              <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-[0_8px_32px_rgba(10,31,92,0.12)] border border-slate-100 z-50">
                <div className="p-2">
                  {MORE_LINKS.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="block px-3 py-2 rounded-lg text-sm text-slate-600 hover:text-[var(--color-navy)] hover:bg-[var(--color-navy)]/5 transition-colors"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link
            href="/contact"
            className={cn(
              "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              location === "/contact"
                ? "text-[var(--color-navy)] bg-[var(--color-navy)]/5"
                : "text-slate-600 hover:text-[var(--color-navy)] hover:bg-[var(--color-navy)]/5"
            )}
          >
            Contact
          </Link>
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <Link href="/sign-in" className="text-sm font-medium text-slate-600 hover:text-[var(--color-navy)] transition-colors px-3 py-2">
            Sign In
          </Link>
          <Link href="/admissions" className="btn-primary text-sm py-2 px-4">
            <BookOpen size={15} />
            Book Demo Class
          </Link>
        </div>

        <button
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white px-4 pb-4 pt-2 space-y-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                location === link.href
                  ? "text-[var(--color-navy)] bg-[var(--color-navy)]/5"
                  : "text-slate-600 hover:text-[var(--color-navy)] hover:bg-slate-50"
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <Link href="/faq" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:text-[var(--color-navy)] hover:bg-slate-50">
              FAQ
            </Link>
            <Link href="/achievements" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:text-[var(--color-navy)] hover:bg-slate-50">
              Achievements
            </Link>
            <Link href="/sign-in" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:text-[var(--color-navy)] hover:bg-slate-50">
              Sign In
            </Link>
            <Link href="/admissions" onClick={() => setMobileOpen(false)} className="btn-primary w-full justify-center py-2.5">
              <BookOpen size={15} />
              Book Demo Class
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

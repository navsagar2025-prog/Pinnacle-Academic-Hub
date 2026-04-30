"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Menu, X, BookOpen, Phone, ChevronDown, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  {
    label: "Courses",
    href: "/courses",
    children: [
      { label: "JEE Main & Advanced", href: "/courses#jee" },
      { label: "NEET UG", href: "/courses#neet" },
      { label: "Class 11 & 12", href: "/courses#class12" },
      { label: "Class 9 & 10", href: "/courses#class10" },
      { label: "Foundation (Gr. 6–8)", href: "/courses#foundation" },
    ],
  },
  { label: "Faculty", href: "/faculty" },
  { label: "Results", href: "/results" },
  { label: "Admissions", href: "/admissions" },
  { label: "Notices", href: "/notices" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [courseOpen, setCourseOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
      {/* Top bar */}
      <div className="bg-[var(--color-navy)] text-white text-xs">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between py-1.5">
          <div className="flex items-center gap-4">
            <a href="tel:+919876543210" className="flex items-center gap-1 hover:text-[var(--color-gold)] transition-colors">
              <Phone size={12} />
              <span>+91 98765 43210</span>
            </a>
            <span className="hidden md:inline text-white/40">·</span>
            <span className="hidden md:inline">Unit of KCK Corporate Services Pvt. Ltd.</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/admissions" className="bg-[var(--color-gold)] text-[var(--color-navy)] px-3 py-0.5 rounded text-xs font-bold hover:bg-[var(--color-gold-light)] transition-colors">
              Enrol Now
            </a>
            <SignedIn>
              <a href="/portal/student" className="text-white/80 hover:text-white transition-colors">My Portal</a>
            </SignedIn>
          </div>
        </div>
      </div>

      {/* Main navbar */}
      <nav className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 bg-[var(--color-navy)] rounded-lg flex items-center justify-center">
            <GraduationCap size={20} className="text-[var(--color-gold)]" />
          </div>
          <div>
            <div className="text-[var(--color-navy)] font-bold text-base font-[family-name:var(--font-playfair)] leading-tight">
              Pinnacle
            </div>
            <div className="text-[var(--color-teal)] text-xs font-semibold leading-tight">
              Academic Classes
            </div>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((link) =>
            link.children ? (
              <div key={link.label} className="relative group">
                <button
                  onClick={() => setCourseOpen(!courseOpen)}
                  className={cn(
                    "flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === link.href
                      ? "text-[var(--color-navy)] bg-[var(--color-navy)]/5"
                      : "text-slate-600 hover:text-[var(--color-navy)] hover:bg-[var(--color-navy)]/5"
                  )}
                >
                  {link.label}
                  <ChevronDown size={14} className="group-hover:rotate-180 transition-transform" />
                </button>
                <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-elevated border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <div className="p-2">
                    {link.children.map((child) => (
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
              </div>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "text-[var(--color-navy)] bg-[var(--color-navy)]/5"
                    : "text-slate-600 hover:text-[var(--color-navy)] hover:bg-[var(--color-navy)]/5"
                )}
              >
                {link.label}
              </Link>
            )
          )}
        </div>

        {/* Right side */}
        <div className="hidden lg:flex items-center gap-3">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-4 py-2 rounded-lg text-sm font-semibold text-[var(--color-navy)] border border-[var(--color-navy)]/20 hover:border-[var(--color-navy)] transition-colors">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <a href="/admissions" className="btn-primary text-sm py-2">
            <BookOpen size={15} />
            Book Demo Class
          </a>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white px-4 pb-4 pt-2 space-y-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                pathname === link.href
                  ? "text-[var(--color-navy)] bg-[var(--color-navy)]/5"
                  : "text-slate-600 hover:text-[var(--color-navy)] hover:bg-slate-50"
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-[var(--color-navy)] border border-[var(--color-navy)]/20 hover:border-[var(--color-navy)]">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <div className="flex items-center gap-3 px-3 py-2">
                <UserButton afterSignOutUrl="/" />
                <span className="text-sm text-slate-600">My Account</span>
              </div>
            </SignedIn>
            <a href="/admissions" className="btn-primary w-full justify-center py-2.5">
              <BookOpen size={15} />
              Book Demo Class
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

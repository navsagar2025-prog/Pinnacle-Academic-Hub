import { Link } from "wouter";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  ExternalLink,
} from "lucide-react";
import { CONTACT } from "@/lib/contact";

const FOOTER_COURSES = [
  { label: "JEE Main & Advanced", href: "/courses#jee" },
  { label: "NEET UG", href: "/courses#neet" },
  { label: "Class 11 & 12 Board", href: "/courses#class12" },
  { label: "Class 9 & 10", href: "/courses#class10" },
  { label: "Foundation (Gr. 6–8)", href: "/courses#foundation" },
];

const QUICK_LINKS = [
  { label: "About Us", href: "/about" },
  { label: "Faculty", href: "/faculty" },
  { label: "Results & Toppers", href: "/results" },
  { label: "Gallery", href: "/gallery" },
  { label: "Admissions", href: "/admissions" },
  { label: "Notices & Events", href: "/notices" },
  { label: "Contact Us", href: "/contact" },
];

const LEGAL = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Refund Policy", href: "/refund-policy" },
];

const SOCIAL = [
  {
    href: "https://www.facebook.com/pinnacleacademicclasses",
    label: "Facebook",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    href: "https://www.youtube.com/@pinnacleacademicclasses",
    label: "YouTube",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58a2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
      </svg>
    ),
  },
  {
    href: "https://www.instagram.com/pinnacleacademicclasses",
    label: "Instagram",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="2"/>
        <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2"/>
        <circle cx="17.5" cy="6.5" r="1.5"/>
      </svg>
    ),
  },
  {
    href: "https://www.justdial.com/Greater-Noida/Pinnacle-Academic-Classes-Opp-Gaur-City-2-Sector-16C/0120PX120-X120-111021134042-E4Y5_BZDET",
    label: "JustDial",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer className="bg-[var(--color-navy)] text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo.svg"
                alt="Pinnacle Academic Classes"
                className="h-12 w-auto"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              Greater Noida's premier coaching institute for JEE, NEET, and board
              examinations. Shaping the future, one student at a time since 2012.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {SOCIAL.map(({ href, label, icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-[var(--color-gold)] hover:text-[var(--color-navy)] transition-colors"
                >
                  {icon}
                </a>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 bg-white/10 rounded-full px-3 py-1 text-xs text-white/70">
                <span className="text-[var(--color-gold)]">★</span> 4.8 on JustDial
              </span>
              <span className="inline-flex items-center gap-1 bg-white/10 rounded-full px-3 py-1 text-xs text-white/70">
                Est. 2012
              </span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-[var(--color-gold)] mb-4 text-sm uppercase tracking-wider">
              Our Courses
            </h3>
            <ul className="space-y-2">
              {FOOTER_COURSES.map((c) => (
                <li key={c.label}>
                  <Link
                    href={c.href}
                    className="text-white/70 hover:text-white text-sm transition-colors"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-[var(--color-gold)] mb-4 text-sm uppercase tracking-wider">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {QUICK_LINKS.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-white/70 hover:text-white text-sm transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-[var(--color-gold)] mb-4 text-sm uppercase tracking-wider">
              Contact Us
            </h3>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <MapPin size={15} className="text-[var(--color-gold)] flex-shrink-0 mt-0.5" />
                <span className="text-white/70 text-sm">{CONTACT.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={15} className="text-[var(--color-gold)] flex-shrink-0" />
                <a href={CONTACT.telHref} className="text-white/70 hover:text-white text-sm transition-colors">
                  {CONTACT.phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={15} className="text-[var(--color-gold)] flex-shrink-0" />
                <a href={CONTACT.emailHref} className="text-white/70 hover:text-white text-sm transition-colors">
                  {CONTACT.email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Clock size={15} className="text-[var(--color-gold)] flex-shrink-0 mt-0.5" />
                <span className="text-white/70 text-sm">
                  Mon–Sat: 9:00 AM – 8:00 PM
                  <br />
                  Sunday: Closed
                </span>
              </li>
            </ul>
            <a
              href={CONTACT.mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 text-xs text-[var(--color-gold)] hover:text-[var(--color-gold-light)] transition-colors"
            >
              <ExternalLink size={12} />
              View on Google Maps
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-white/50 text-xs">
            © {new Date().getFullYear()} KCK Corporate Services Pvt. Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {LEGAL.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-white/50 hover:text-white/80 text-xs transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

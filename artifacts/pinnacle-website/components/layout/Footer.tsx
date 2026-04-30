import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Facebook,
  Youtube,
  Instagram,
  GraduationCap,
  ExternalLink,
} from "lucide-react";
import { getContactSettings } from "@/lib/server/site-settings";

const COURSES = [
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
  { label: "Admissions", href: "/admissions" },
  { label: "Notices & Events", href: "/notices" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact Us", href: "/contact" },
];

const LEGAL = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Refund Policy", href: "/refund-policy" },
];

export default async function Footer() {
  const settings = await getContactSettings();

  const social = [
    { href: settings.facebook_url, Icon: Facebook, label: "Facebook" },
    { href: settings.youtube_url, Icon: Youtube, label: "YouTube" },
    { href: settings.instagram_url, Icon: Instagram, label: "Instagram" },
  ];

  return (
    <footer className="bg-[var(--color-navy)] text-white">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--color-gold)] rounded-lg flex items-center justify-center">
                <GraduationCap size={22} className="text-[var(--color-navy)]" />
              </div>
              <div>
                <div className="font-bold text-lg font-[family-name:var(--font-playfair)]">
                  Pinnacle Academic Classes
                </div>
                <div className="text-white/60 text-xs">
                  A unit of KCK Corporate Services Pvt. Ltd.
                </div>
              </div>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              Greater Noida's premier coaching institute for JEE, NEET, and board
              examinations. Shaping the future, one student at a time.
            </p>
            <div className="flex items-center gap-3">
              {social.map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-[var(--color-gold)] hover:text-[var(--color-navy)] transition-colors"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Courses */}
          <div>
            <h3 className="font-semibold text-[var(--color-gold)] mb-4 text-sm uppercase tracking-wider">
              Our Courses
            </h3>
            <ul className="space-y-2">
              {COURSES.map((c) => (
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

          {/* Quick Links */}
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

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-[var(--color-gold)] mb-4 text-sm uppercase tracking-wider">
              Contact Us
            </h3>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <MapPin size={15} className="text-[var(--color-gold)] flex-shrink-0 mt-0.5" />
                <span className="text-white/70 text-sm">
                  {settings.address_line1}
                  {settings.address_city && (
                    <>, {settings.address_city}</>
                  )}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={15} className="text-[var(--color-gold)] flex-shrink-0" />
                <a
                  href={`tel:${settings.contact_phone.replace(/\s/g, "")}`}
                  className="text-white/70 hover:text-white text-sm transition-colors"
                >
                  {settings.contact_phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={15} className="text-[var(--color-gold)] flex-shrink-0" />
                <a
                  href={`mailto:${settings.contact_email}`}
                  className="text-white/70 hover:text-white text-sm transition-colors"
                >
                  {settings.contact_email}
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
              href={settings.maps_url}
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

      {/* Bottom bar */}
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

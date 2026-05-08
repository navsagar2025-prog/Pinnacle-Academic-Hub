import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { SITE_URL } from "@/lib/seo/page-registry";

if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  throw new Error(
    "[Pinnacle] Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY. " +
    "Add it to your environment secrets before starting the app."
  );
}
if (!process.env.CLERK_SECRET_KEY) {
  throw new Error(
    "[Pinnacle] Missing CLERK_SECRET_KEY. " +
    "Add it to your environment secrets before starting the app."
  );
}

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Pinnacle Academic Classes | JEE · NEET · Class 10-12 | Greater Noida",
    template: "%s | Pinnacle Academic Classes",
  },
  description:
    "Pinnacle Academic Classes — Greater Noida's premier coaching institute for JEE Main, JEE Advanced, NEET UG, and Class 10–12 board exams. Expert faculty, proven results.",
  keywords: [
    "JEE coaching Greater Noida",
    "NEET coaching Greater Noida",
    "Class 12 coaching",
    "Pinnacle Academic Classes",
    "KCK Corporate Services",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    title: "Pinnacle Academic Classes | JEE · NEET · Class 10-12",
    description:
      "Greater Noida's premier coaching institute. Expert faculty, proven results, modern learning.",
    siteName: "Pinnacle Academic Classes",
    url: SITE_URL,
    images: [{ url: "/opengraph.jpg", width: 1200, height: 630, alt: "Pinnacle Academic Classes" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pinnacle Academic Classes | JEE · NEET · Class 10-12",
    description:
      "Greater Noida's premier coaching institute. Expert faculty, proven results, modern learning.",
    images: ["/opengraph.jpg"],
  },
  robots: { index: true, follow: true },
};

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

// Site-wide Organization schema for the Knowledge Graph. Page-level schemas
// (LocalBusiness on Home, Course on /courses) supplement this.
const ORGANIZATION_JSONLD = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "Pinnacle Academic Classes",
  alternateName: "KCK Corporate Services Pvt. Ltd.",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  sameAs: [],
  address: {
    "@type": "PostalAddress",
    streetAddress: "Shop No. 1 to 5, Shop Mart, Plot No. GH-03, Gaur City 2 Rd, Sec. 16C",
    addressLocality: "Greater Noida",
    addressRegion: "UP",
    postalCode: "201009",
    addressCountry: "IN",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read the per-request CSP nonce injected by middleware via the x-nonce
  // request header. Apply it to all inline scripts (JSON-LD, etc.) so they
  // pass the Content-Security-Policy without needing 'unsafe-inline'.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <ClerkProvider
      signInUrl={`${base}/sign-in`}
      signUpUrl={`${base}/sign-up`}
      signInFallbackRedirectUrl={`${base}/portal`}
      signUpFallbackRedirectUrl={`${base}/portal`}
    >
      <html lang="en" className={`${playfair.variable} ${jakarta.variable}`}>
        <body className="font-[family-name:var(--font-jakarta)]">
          {children}
          <script
            nonce={nonce}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSONLD) }}
          />
          {/* Server-side page-view beacon — fires on every public page load.
              Uses sendBeacon so it never blocks navigation or page close.
              Portal routes (/portal/*) are excluded to keep the tracker
              focused on public visitor traffic. */}
          <script
            nonce={nonce}
            dangerouslySetInnerHTML={{
              __html: `(function(){
  try {
    var p = location.pathname;
    // Strip the base-path prefix so the check is always against the logical
    // route, regardless of whether the app is mounted at / or /pinnacle-website.
    var bp = '${base}';
    var rel = (bp && p.indexOf(bp) === 0) ? p.slice(bp.length) || '/' : p;
    // Exclude admin/student/parent/teacher portal — only public traffic.
    if (rel.indexOf('/portal') === 0) return;
    var payload = JSON.stringify({ path: p, referrer: document.referrer || null });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('${base}/api/v1/telemetry/pageview', new Blob([payload], { type: 'application/json' }));
    } else {
      fetch('${base}/api/v1/telemetry/pageview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true });
    }
  } catch(e) {}
})();`,
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}

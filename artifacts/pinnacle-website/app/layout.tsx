import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { headers } from "next/headers";
import { unstable_cache } from "next/cache";
import "./globals.css";
import { SITE_URL } from "@/lib/seo/page-registry";
import { PromoBanner } from "@/components/promo/PromoBanner";
import { db } from "@workspace/db";
import { siteSettings } from "@workspace/db/schema";
import { inArray } from "drizzle-orm";

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
    images: [{ url: `/api/og?title=${encodeURIComponent("Pinnacle Academic Classes | JEE · NEET · Class 10-12")}&description=${encodeURIComponent("Greater Noida's premier coaching institute. Expert faculty, proven results, modern learning.")}`, width: 1200, height: 630, alt: "Pinnacle Academic Classes" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pinnacle Academic Classes | JEE · NEET · Class 10-12",
    description:
      "Greater Noida's premier coaching institute. Expert faculty, proven results, modern learning.",
    images: [`/api/og?title=${encodeURIComponent("Pinnacle Academic Classes | JEE · NEET · Class 10-12")}&description=${encodeURIComponent("Greater Noida's premier coaching institute. Expert faculty, proven results, modern learning.")}`],
  },
  robots: { index: true, follow: true },
};

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

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

// Cached 60 s — avoid a DB round-trip on every page render while still
// picking up changes within a minute of the admin saving new scripts.
const getScriptSettings = unstable_cache(
  async () => {
    const rows = await db
      .select()
      .from(siteSettings)
      .where(inArray(siteSettings.key, ["head_injection", "body_injection"]));
    return {
      headInjection: rows.find((r) => r.key === "head_injection")?.value ?? null,
      bodyInjection: rows.find((r) => r.key === "body_injection")?.value ?? null,
    };
  },
  ["script-injection-settings"],
  { revalidate: 60 },
);

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  // Per-request CSP nonce injected by middleware.
  const nonce = headersList.get("x-nonce") ?? undefined;
  // Pathname injected by middleware — used to skip public-only script injection
  // on portal routes so admin pages stay clean.
  const pathname = headersList.get("x-pathname") ?? "";
  const isPortal = pathname.startsWith("/portal");

  // Only load & inject site scripts on public pages. Portal routes skip this.
  const { headInjection, bodyInjection } = isPortal
    ? { headInjection: null, bodyInjection: null }
    : await getScriptSettings();

  return (
    <ClerkProvider
      signInUrl={`${base}/sign-in`}
      signUpUrl={`${base}/sign-up`}
      signInFallbackRedirectUrl={`${base}/portal`}
      signUpFallbackRedirectUrl={`${base}/portal`}
    >
      <html lang="en" className={`${playfair.variable} ${jakarta.variable}`}>
        {/* Explicit <head> block for admin-controlled head injection.
            head_injection stores raw JavaScript — we wrap it in a <script>
            tag with the per-request CSP nonce.  Arbitrary HTML elements
            (e.g. <meta> verification tags) should use the Metadata API. */}
        {headInjection ? (
          <head>
            <script
              nonce={nonce}
              dangerouslySetInnerHTML={{ __html: headInjection }}
            />
          </head>
        ) : null}
        <body className="font-[family-name:var(--font-jakarta)]">
          <PromoBanner basePath={base} />
          {children}
          <script
            nonce={nonce}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSONLD) }}
          />
          {/* GA4 Measurement Protocol proxy transport override */}
          {process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID && (
            <script
              nonce={nonce}
              dangerouslySetInnerHTML={{
                __html: `(function(){
  try {
    var mid = '${process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID ?? ""}';
    if (!mid) return;
    window.dataLayer = window.dataLayer || [];
    function gtag(){
      var args = Array.prototype.slice.call(arguments);
      if (args[0] === 'event') {
        var eventName = args[1];
        var eventParams = args[2] || {};
        var clientId = (document.cookie.match(/_ga=([^;]+)/) || [])[1] || 'anon.' + Date.now();
        fetch('${base}/api/v1/telemetry/ga4-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: clientId,
            events: [{ name: eventName, params: eventParams }]
          }),
          keepalive: true
        }).catch(function(){});
        return;
      }
      window.dataLayer.push(args);
    }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', mid, { send_page_view: false });
  } catch(e) {}
})();`,
              }}
            />
          )}
          {/* body_injection: arbitrary HTML snippet (may include <script>,
              <noscript>, chat widgets, etc.) placed before the pageview beacon.
              Rendered via dangerouslySetInnerHTML so full tags are preserved and
              the browser executes any inline scripts in the SSR output. */}
          {bodyInjection && (
            <div dangerouslySetInnerHTML={{ __html: bodyInjection }} />
          )}
          {/* Server-side page-view beacon */}
          <script
            nonce={nonce}
            dangerouslySetInnerHTML={{
              __html: `(function(){
  try {
    var p = location.pathname;
    var bp = '${base}';
    var rel = (bp && p.indexOf(bp) === 0) ? p.slice(bp.length) || '/' : p;
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

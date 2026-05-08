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

// ---------------------------------------------------------------------------
// Cached settings fetch — 60 s revalidation so admin changes are reflected
// promptly without a DB round-trip on every server render.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Head-injection loader script
// ---------------------------------------------------------------------------
// Embeds the raw head_injection HTML string as a JSON literal inside a
// nonce-bearing <script> tag placed in <head>.  The loader runs synchronously
// as the browser parses <head>, creates proper DOM nodes for every child
// element in the snippet (preserving exact order), and for <script> children
// uses document.createElement('script') so the browser executes them — this
// is the same technique used by Google Tag Manager itself.  Non-script
// elements (meta, link, style, noscript) are cloned directly into <head>.
// ---------------------------------------------------------------------------
function buildHeadLoaderScript(html: string): string {
  // JSON.stringify escapes the HTML safely for embedding inside a JS string.
  const escaped = JSON.stringify(html);
  return `(function(){
try{
var html=${escaped};
var h=document.head||document.getElementsByTagName('head')[0];
if(!h)return;
var d=document.createElement('div');
d.innerHTML=html;
var nodes=Array.prototype.slice.call(d.childNodes);
for(var i=0;i<nodes.length;i++){
  var n=nodes[i];
  if(n.nodeType!==1)continue;
  if(n.tagName==='SCRIPT'){
    var s=document.createElement('script');
    for(var j=0;j<n.attributes.length;j++){
      s.setAttribute(n.attributes[j].name,n.attributes[j].value);
    }
    s.textContent=n.textContent;
    h.appendChild(s);
  }else{
    h.appendChild(n.cloneNode(true));
  }
}
}catch(e){}
})();`;
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  // Per-request CSP nonce injected by middleware.
  const nonce = headersList.get("x-nonce") ?? undefined;
  // Pathname forwarded by middleware — used to exclude portal routes from
  // public-only script injection.
  const pathname = headersList.get("x-pathname") ?? "";
  const isPortal = pathname.startsWith("/portal");

  // Fetch script injection settings only for public pages.
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
        {/*
          head_injection: arbitrary HTML snippet stored verbatim in site_settings.
          Injected via a nonce-bearing loader <script> in <head> that:
            1. Embeds the raw snippet bytes as a JSON string (no parsing/rewriting)
            2. Runs synchronously while the browser parses <head>
            3. Creates DOM nodes that preserve the original snippet order
            4. Uses document.createElement('script') for <script> children so
               they execute — this is the same pattern used by GTM itself.
            5. Directly clones non-script elements (<meta>, <link>, <style>,
               <noscript>) into <head>.
          External vendor scripts (<script src="…">) are allowed by the CSP
          script-src allowlist in middleware (GTM, GA4, Meta Pixel, Clarity,
          HotJar, Intercom, Crisp are all pre-approved).
          Inline scripts embedded in the snippet run via the trusted-script
          propagation path and do not need a separate nonce.
        */}
        {headInjection ? (
          <head>
            <script
              nonce={nonce}
              dangerouslySetInnerHTML={{ __html: buildHeadLoaderScript(headInjection) }}
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
          {/* GA4 Measurement Protocol proxy */}
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
          {/*
            body_injection: arbitrary HTML snippet stored verbatim in site_settings,
            injected via dangerouslySetInnerHTML so the exact bytes (including
            <script>, <noscript>, <iframe>, chat-widget markup, etc.) are
            preserved in the SSR output in their original order.

            The browser parses and executes inline <script> blocks found in the
            SSR HTML at initial page-load time.  External vendor scripts load
            from the CDN hosts allowlisted in the CSP script-src directive
            (middleware.ts).  Inline scripts that do not originate from an
            external nonce-bearing script may require 'unsafe-inline' in the
            Content-Security-Policy if the site operator enforces strict nonces;
            admins should prefer external-src variants of vendor snippets where
            available.
          */}
          {bodyInjection ? (
            <div dangerouslySetInnerHTML={{ __html: bodyInjection }} />
          ) : null}
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

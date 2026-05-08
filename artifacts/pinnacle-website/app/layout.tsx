import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { headers } from "next/headers";
import { unstable_cache } from "next/cache";
import React from "react";
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

// Fetch head_injection + body_injection from site_settings, cached 60 s.
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
// HEAD INJECTION HELPERS
// Parse a raw HTML snippet into valid <head> React children. Each matched
// element is rendered as its proper React element type so the SSR output
// contains actual <script>, <meta>, <link>, etc. nodes — not a <div> wrapper.
// <script> elements receive the page CSP nonce so they pass strict CSP.
// ---------------------------------------------------------------------------

const ATTR_REMAP: Record<string, string> = {
  class: "className",
  crossorigin: "crossOrigin",
  "http-equiv": "httpEquiv",
  nomodule: "noModule",
  referrerpolicy: "referrerPolicy",
  fetchpriority: "fetchPriority",
  imagesrcset: "imageSrcSet",
  imagesizes: "imageSizes",
};

function parseAttrs(attrStr: string): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  const re = /(\w[\w:-]*)(?:=(?:"([^"]*)"|'([^']*)'|(\S+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(attrStr.trim())) !== null) {
    const name = m[1]!;
    const raw = m[2] ?? m[3] ?? m[4] ?? null;
    const propName = ATTR_REMAP[name] ?? name;
    // Boolean attributes (async, defer, noModule …) — value omitted or equals name
    props[propName] = raw === null || raw === name ? true : raw;
  }
  return props;
}

function buildHeadNode(
  tag: string,
  attrs: Record<string, unknown>,
  content: string | undefined,
  nonce: string | undefined,
  key: number,
): React.ReactNode {
  const props: Record<string, unknown> = { ...attrs, key };
  if (tag === "script") {
    if (nonce) props["nonce"] = nonce;
    if (content !== undefined) props["dangerouslySetInnerHTML"] = { __html: content };
    return React.createElement("script", props);
  }
  if (tag === "style") {
    if (content !== undefined) props["dangerouslySetInnerHTML"] = { __html: content };
    return React.createElement("style", props);
  }
  if (tag === "noscript") {
    if (content !== undefined) props["dangerouslySetInnerHTML"] = { __html: content };
    return React.createElement("noscript", props);
  }
  if (tag === "title") {
    return React.createElement("title", props, content ?? "");
  }
  // meta, link, base — void elements
  return React.createElement(tag, props);
}

function parseHeadSnippet(html: string, nonce: string | undefined): React.ReactNode[] {
  type RawMatch = { pos: number; tag: string; attrStr: string; content?: string };
  const raw: RawMatch[] = [];

  // Pair tags: <script>, <style>, <noscript>, <title>
  const pairRe = /<(script|style|noscript|title)((?:\s[^>]*)?)>([\s\S]*?)<\/\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = pairRe.exec(html)) !== null) {
    raw.push({ pos: m.index, tag: m[1]!.toLowerCase(), attrStr: m[2] ?? "", content: m[3] ?? "" });
  }

  // Void tags: <meta>, <link>, <base>
  const voidRe = /<(meta|link|base)((?:\s[^>]*)?)\s*\/?>/gi;
  while ((m = voidRe.exec(html)) !== null) {
    raw.push({ pos: m.index, tag: m[1]!.toLowerCase(), attrStr: m[2] ?? "" });
  }

  // Sort by source position so injection order matches snippet order
  raw.sort((a, b) => a.pos - b.pos);

  return raw.map((item, i) =>
    buildHeadNode(item.tag, parseAttrs(item.attrStr), item.content, nonce, i),
  );
}

// ---------------------------------------------------------------------------
// BODY INJECTION HELPER
// Stamp the page nonce onto every <script> tag in the snippet so inline
// scripts pass the strict-nonce CSP enforced by middleware. Non-script nodes
// are preserved verbatim (including <noscript>, <iframe>, etc.).
// ---------------------------------------------------------------------------
function stampNonces(html: string, nonce: string | undefined): string {
  if (!nonce) return html;
  return html.replace(/<script(\s[^>]*)?>/gi, (_full, attrs: string | undefined) => {
    if (attrs && /\bnonce\s*=/i.test(attrs)) return _full; // already has nonce
    return `<script${attrs ?? ""} nonce="${nonce}">`;
  });
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") ?? undefined;
  const pathname = headersList.get("x-pathname") ?? "";
  // Strip basePath prefix before checking — Next.js middleware sets pathname
  // from req.nextUrl.pathname which is normally basePath-free, but strip
  // defensively so portal exclusion works correctly in all deployment modes.
  const bp = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
  const normalizedPath = bp && pathname.startsWith(bp) ? pathname.slice(bp.length) : pathname;
  const isPortal = normalizedPath.startsWith("/portal");

  const { headInjection, bodyInjection } = isPortal
    ? { headInjection: null, bodyInjection: null }
    : await getScriptSettings();

  const headNodes = headInjection ? parseHeadSnippet(headInjection, nonce) : [];

  return (
    <ClerkProvider
      signInUrl={`${base}/sign-in`}
      signUpUrl={`${base}/sign-up`}
      signInFallbackRedirectUrl={`${base}/portal`}
      signUpFallbackRedirectUrl={`${base}/portal`}
    >
      <html lang="en" className={`${playfair.variable} ${jakarta.variable}`}>
        {headNodes.length > 0 ? (
          <head>{headNodes}</head>
        ) : null}
        <body className="font-[family-name:var(--font-jakarta)]">
          <PromoBanner basePath={base} />
          {children}
          <script
            nonce={nonce}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSONLD) }}
          />
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
          {/* body_injection: raw bytes preserved verbatim; <script> tags stamped with
              the page nonce so they pass CSP. SSR-visible; browser parser executes
              inline scripts at initial page load. Order is preserved exactly. */}
          {bodyInjection ? (
            <div dangerouslySetInnerHTML={{ __html: stampNonces(bodyInjection, nonce) }} />
          ) : null}
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

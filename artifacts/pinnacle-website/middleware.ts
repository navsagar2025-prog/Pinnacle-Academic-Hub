/**
 * Clerk middleware — route protection for Pinnacle portals.
 *
 * This is one of two permitted @clerk/nextjs/server import points (see
 * lib/server/portal-auth.ts for the complete auth import inventory).
 *
 * Protected routes (require authentication):
 *   /portal/student/**  → student portal
 *   /portal/parent/**   → parent portal
 *   /portal/teacher/**  → teacher portal
 *   /portal/admin/**    → admin portal
 *
 * Public routes (always accessible — never blocked):
 *   /                   → homepage / marketing pages
 *   /about, /courses, /faculty, /results, /contact, /notices, /faq
 *   /portal             → post-login redirect landing page
 *   /sign-in/**         → Clerk sign-in
 *   /sign-up/**         → Clerk sign-up
 *   Static assets (_next/*, images, fonts, etc.) excluded via the matcher.
 *
 * Security layers added here:
 *   1. CSP nonces: a per-request nonce is generated, forwarded to RSC pages
 *      via x-nonce request header, and emitted as Content-Security-Policy.
 *   2. IP lockout: if the requesting IP is in ip_lockouts (active, not expired),
 *      the request is rejected with 429 before Clerk sees it. Falls open on
 *      any DB error so a transient PG hiccup never blocks legitimate users.
 *      Note: runs in Node.js runtime (not Edge) — see config below.
 *
 * MIGRATING AWAY FROM CLERK? Replace clerkMiddleware() with your own
 * middleware and auth.protect() with your provider's equivalent.
 * No other files should require changes.
 */
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/portal/student(.*)",
  "/portal/parent(.*)",
  "/portal/teacher(.*)",
  "/portal/admin(.*)",
]);

// Only block on portal + API routes; skip static assets (matcher handles that)
const isCheckableRoute = createRouteMatcher([
  "/portal/(.*)",
  "/api/(.*)",
]);

const base = process.env.BASE_PATH?.replace(/\/$/, "") ?? "/pinnacle-website";

/** Extract the client IP from standard proxy headers. */
function getClientIp(req: NextRequest): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip");
}

function buildCsp(nonce: string): string {
  const directives = [
    "default-src 'self'",
    // Allow our own scripts + Clerk-hosted UI + inline scripts bearing our nonce.
    // 'unsafe-eval' is needed by Next.js HMR (kept consistent across envs).
    `script-src 'self' 'nonce-${nonce}' 'unsafe-eval' https://*.clerk.accounts.dev https://clerk.paconline.in`,
    // Styles: Clerk and Google Fonts both inject inline styles.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    // Images: allow data URIs, blob, and any HTTPS origin for gallery/media.
    "img-src 'self' data: blob: https:",
    // Connect: Clerk API, our own routes, and object storage.
    "connect-src 'self' https://*.clerk.accounts.dev https://clerk.paconline.in https://*.googleapis.com https://storage.googleapis.com",
    // Clerk embeds iframes for its hosted sign-in UI.
    "frame-src 'self' https://*.clerk.accounts.dev https://clerk.paconline.in",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];
  return directives.join("; ");
}

/** Check the ip_lockouts table via a raw Postgres query (avoids importing the
 *  full Drizzle client which has Edge-incompatible deps). Falls open on error. */
async function isIpLockedOut(ip: string): Promise<boolean> {
  try {
    // Dynamic import so Edge bundler doesn't tree-shake; in Node.js runtime
    // this resolves correctly. On true Edge deployments this would need to be
    // replaced with an external KV lookup.
    const { db } = await import("@workspace/db");
    const { ipLockouts } = await import("@workspace/db/schema");
    const { eq } = await import("drizzle-orm");

    const rows = await db
      .select({
        lockedUntil: ipLockouts.lockedUntil,
        unlockedAt: ipLockouts.unlockedAt,
      })
      .from(ipLockouts)
      .where(eq(ipLockouts.ip, ip))
      .limit(1);

    if (rows.length === 0) return false;
    const row = rows[0]!;
    if (row.unlockedAt) return false; // manually unblocked
    if (!row.lockedUntil) return false;
    return row.lockedUntil > new Date(); // still within lockout window
  } catch {
    return false; // fail open
  }
}

export default clerkMiddleware(async (auth, req) => {
  // --- 1. CSP nonce ---
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  // --- 2. IP lockout check (before Clerk processes auth) ---
  if (isCheckableRoute(req)) {
    const ip = getClientIp(req);
    if (ip) {
      const locked = await isIpLockedOut(ip);
      if (locked) {
        // Log the block (best-effort, fire-and-forget)
        try {
          const { logSecurityEvent } = await import("@/lib/server/security-events");
          logSecurityEvent({
            eventType: "ip_blocked",
            ip,
            route: req.nextUrl.pathname,
            outcome: "blocked",
          }).catch(() => {});
        } catch { /* ignore */ }

        return new NextResponse(
          JSON.stringify({ success: false, error: "Too many requests. Please try again later.", data: null, meta: null }),
          { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "1800" } },
        );
      }
    }
  }

  // --- 3. Clerk route protection ---
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  // --- 4. Build response with CSP + nonce header + impersonation signal ---
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("Content-Security-Policy", buildCsp(nonce));

  const imp = req.cookies.get("pac_imp");
  if (imp?.value) {
    res.headers.set("X-Impersonation-Active", "1");
  }

  return res;
}, { signInUrl: `${base}/sign-in`, signUpUrl: `${base}/sign-up` });

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

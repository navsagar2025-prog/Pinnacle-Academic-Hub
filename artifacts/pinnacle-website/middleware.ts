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
 * Role enforcement (redirect to the user's correct portal) is handled inside
 * each portal layout via requirePortalRole() in lib/server/portal-auth.ts.
 *
 * MIGRATING AWAY FROM CLERK? Replace clerkMiddleware() with your own
 * middleware and auth.protect() with your provider's equivalent.
 * No other files should require changes.
 */
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/portal/student(.*)",
  "/portal/parent(.*)",
  "/portal/teacher(.*)",
  "/portal/admin(.*)",
]);

const base = process.env.BASE_PATH?.replace(/\/$/, "") ?? "/pinnacle-website";

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
  // Lightweight presence signal for ops tooling / devtools. We deliberately
  // do NOT echo any session-token material here: validating the cookie
  // requires a DB lookup which can't run in edge middleware. The
  // authoritative impersonation context (admin id, target id, session id)
  // is set as `X-Impersonated-By: <adminUserId>` by API routes and RSC
  // pages that already resolve `readImpersonationContext()` server-side.
  const imp = req.cookies.get("pac_imp");
  if (imp?.value) {
    const res = NextResponse.next();
    res.headers.set("X-Impersonation-Active", "1");
    return res;
  }
}, { signInUrl: `${base}/sign-in`, signUpUrl: `${base}/sign-up` });

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

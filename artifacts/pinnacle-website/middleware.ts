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
  // Tag every response with X-Impersonated-By when the impersonation cookie
  // is present. The header value is the cookie token prefix (first 8 chars
  // — never the full token, which is sensitive). The actual admin/target
  // identities live in the audit log; this header is the at-a-glance signal
  // for ops tooling and the browser devtools network tab.
  const imp = req.cookies.get("pac_imp");
  if (imp?.value) {
    const res = NextResponse.next();
    res.headers.set("X-Impersonated-By", `session:${imp.value.slice(0, 8)}`);
    return res;
  }
}, { signInUrl: `${base}/sign-in`, signUpUrl: `${base}/sign-up` });

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

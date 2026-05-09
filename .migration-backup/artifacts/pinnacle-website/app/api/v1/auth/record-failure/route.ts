/**
 * POST /api/v1/auth/record-failure
 *
 * Called by the browser-side SignInFailureTracker component when Clerk's
 * embedded <SignIn /> detects a credential failure. Because this is a
 * browser-to-server request (not a Clerk webhook), the real client IP is
 * available in the standard proxy headers.
 *
 * Logs a login_fail security event with the real IP, which then triggers
 * maybeAutoLockIp() — locking the IP after FAIL_THRESHOLD failures in the
 * rolling WINDOW_MINUTES window (configurable via site_settings).
 *
 * This endpoint is unauthenticated by design (the user is not signed in).
 * It is rate-limited by IP to prevent abuse (recording thousands of fake
 * failures to force a lockout on someone else's IP).
 */

import type { NextRequest } from "next/server";
import { logSecurityEvent } from "@/lib/server/security-events";
import { rateLimit, extractIp } from "@/lib/server/rate-limit";

export async function POST(req: NextRequest) {
  const ip = extractIp(req);
  const ua = req.headers.get("user-agent") ?? undefined;

  // Abuse protection: an attacker could flood this endpoint to lock out any IP.
  // Limit to 20 reports per IP per 10 minutes — well above any human typing speed.
  const { allowed } = await rateLimit(
    `ip:${ip}`,
    "api.auth.record-failure",
    20,
    10 * 60_000,
    { ip },
  );
  if (!allowed) {
    return new Response(JSON.stringify({ success: false }), { status: 429 });
  }

  let identifier: string | null = null;
  try {
    const body = await req.json() as { identifier?: string; errorCode?: string };
    identifier = typeof body.identifier === "string" ? body.identifier : null;
  } catch {
    // Body parsing failure is fine — we still log the event
  }

  // Log with real IP — this is the call that drives the auto-lockout mechanism
  await logSecurityEvent({
    eventType: "login_fail",
    actorEmail: identifier,
    ip,
    userAgent: ua,
    route: "/sign-in",
    outcome: "fail",
  });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

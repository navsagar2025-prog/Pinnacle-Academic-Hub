/**
 * Clerk webhook receiver — security event logging.
 *
 * Clerk delivers signed webhook payloads via Svix. This handler:
 *   1. Verifies the signature with CLERK_WEBHOOK_SECRET
 *   2. On session.created  → logs a login_success security event
 *   3. On user.updated     → detects failed_sign_in_attempts increases and
 *                            logs one login_fail event per new failure
 *
 * ⚠️ IP attribution note:
 * Clerk's webhook payloads do not carry the end-user's client IP. The
 * x-forwarded-for / x-real-ip headers on the incoming request are Clerk's
 * sender infrastructure IPs, not the attacker's IP. We log IP as null for
 * all webhook events rather than record an incorrect IP that would corrupt
 * the ip_lockouts auto-lock logic.
 *
 * IP-based lockout still functions correctly: the middleware checks
 * ip_lockouts on every request using the real client IP from the proxy
 * headers on the actual HTTP request, not the webhook call.
 *
 * Setup (one-time):
 *   1. Add CLERK_WEBHOOK_SECRET to Replit Secrets.
 *   2. In Clerk Dashboard → Webhooks → Add endpoint:
 *        URL: https://<your-domain>/pinnacle-website/api/webhooks/clerk
 *        Events: session.created, user.updated
 */

import { Webhook } from "svix";
import { logSecurityEvent } from "@/lib/server/security-events";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[clerk-webhook] CLERK_WEBHOOK_SECRET not set — skipping webhook processing");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  // Read raw body for signature verification (must happen before any JSON parse)
  const rawBody = await req.text();

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  let payload: Record<string, unknown>;
  try {
    const wh = new Webhook(secret);
    payload = wh.verify(rawBody, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as Record<string, unknown>;
  } catch (err) {
    console.error("[clerk-webhook] Signature verification failed:", err);
    return new Response("Invalid signature", { status: 401 });
  }

  const eventType = payload.type as string;
  const data = payload.data as Record<string, unknown>;

  // IP from webhook sender headers is Clerk's infrastructure — do not use it
  // for security events. Real client IPs are captured in middleware per-request.
  const ip = null;

  if (eventType === "session.created") {
    // Successful sign-in: log the actor's email for the audit trail.
    // Clerk session objects do not include the end-user IP in the payload.
    const actorEmail =
      (data.public_user_data as Record<string, unknown> | undefined)
        ?.identifier as string | undefined ?? null;

    await logSecurityEvent({
      eventType: "login_success",
      actorEmail,
      ip,
      userAgent: null,
      route: "/sign-in",
      outcome: "success",
    });

    console.log(`[clerk-webhook] session.created actor=${actorEmail ?? "unknown"}`);

  } else if (eventType === "user.updated") {
    // Detect new failed sign-in attempts using the previous_attributes delta.
    // Clerk includes failed_sign_in_attempts on user objects; previous_attributes
    // carries the value before the update so we can compute the increment.
    const previousAttributes = payload.previous_attributes as Record<string, unknown> | undefined;
    const currentFailed = (data.failed_sign_in_attempts as number) ?? 0;
    const previousFailed = previousAttributes?.failed_sign_in_attempts as number | undefined;

    if (previousFailed !== undefined && currentFailed > previousFailed) {
      const actorEmail =
        (data.email_addresses as Array<{ email_address: string }> | undefined)?.[0]
          ?.email_address ?? null;

      const newFailures = currentFailed - previousFailed;

      // Log each new failure individually so maybeAutoLockIp() threshold
      // counting works correctly.
      const logPromises = Array.from({ length: newFailures }, () =>
        logSecurityEvent({
          eventType: "login_fail",
          actorEmail,
          ip,       // null — see IP attribution note above
          userAgent: null,
          route: "/sign-in",
          outcome: "fail",
        }),
      );
      await Promise.allSettled(logPromises);

      console.log(
        `[clerk-webhook] user.updated — ${newFailures} new login failure(s) for ${actorEmail ?? "unknown"}`,
      );
    }
  }

  return new Response("ok", { status: 200 });
}

/**
 * Clerk webhook receiver — security event logging.
 *
 * Clerk delivers signed webhook payloads via Svix. This handler:
 *   1. Verifies the signature with CLERK_WEBHOOK_SECRET
 *   2. On session.created  → logs a login_success security event (with IP and actor email)
 *   3. On user.updated     → inspects failed_sign_in_attempts for increases and logs login_fail
 *
 * Note on failed sign-in attempts:
 * Clerk does not emit a dedicated "login_failed" webhook event. Instead,
 * user.updated fires (among other reasons) after a failed attempt, and the
 * user object carries a `failed_sign_in_attempts` counter. We detect a new
 * failure by comparing against the previous_attributes snapshot included in
 * the payload. When no IP is available from the Clerk payload, the IP is
 * read from the request's x-forwarded-for / x-real-ip headers.
 *
 * Setup (one-time):
 *   1. Add CLERK_WEBHOOK_SECRET to Replit secrets.
 *   2. In Clerk Dashboard → Webhooks → Add endpoint:
 *      URL: https://<your-domain>/pinnacle-website/api/webhooks/clerk
 *      Events: session.created, user.updated
 */

import { Webhook } from "svix";
import { logSecurityEvent } from "@/lib/server/security-events";
import type { NextRequest } from "next/server";

function getIp(req: NextRequest): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip");
}

export async function POST(req: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[clerk-webhook] CLERK_WEBHOOK_SECRET not set — webhook verification skipped");
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
  const ip = getIp(req);

  if (eventType === "session.created") {
    // Successful sign-in
    const userId = data.user_id as string | undefined;
    // Clerk includes last_active_at and created_at; actor email is resolved
    // via the user object if available in the payload.
    const actorEmail =
      (data.public_user_data as Record<string, unknown> | undefined)
        ?.identifier as string | undefined ?? null;

    logSecurityEvent({
      eventType: "login_success",
      actorEmail,
      ip,
      route: "/sign-in",
      outcome: "success",
    }).catch(() => {});

    console.log(`[clerk-webhook] session.created user=${userId}`);
  } else if (eventType === "user.updated") {
    // Detect failed sign-in attempts by comparing to previous_attributes
    const previousAttributes = payload.previous_attributes as Record<string, unknown> | undefined;
    const currentFailed = (data.failed_sign_in_attempts as number) ?? 0;
    const previousFailed = (previousAttributes?.failed_sign_in_attempts as number) ?? undefined;

    if (previousFailed !== undefined && currentFailed > previousFailed) {
      // One or more new failures since last update
      const actorEmail =
        (data.email_addresses as Array<{ email_address: string }> | undefined)?.[0]
          ?.email_address ?? null;

      const newFailures = currentFailed - previousFailed;
      const logPromises = Array.from({ length: newFailures }, () =>
        logSecurityEvent({
          eventType: "login_fail",
          actorEmail,
          ip,
          route: "/sign-in",
          outcome: "fail",
        }),
      );
      await Promise.allSettled(logPromises);
      console.log(`[clerk-webhook] user.updated — ${newFailures} new failed sign-in(s) for ${actorEmail ?? "unknown"}`);
    }
  }

  return new Response("ok", { status: 200 });
}

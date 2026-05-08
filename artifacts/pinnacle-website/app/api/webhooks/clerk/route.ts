// Clerk webhook receiver — secondary audit log for login events.
// Verifies Svix signatures, then logs session.created (login_success) and
// user.updated (login_fail delta) to security_events.
//
// IP/UA are null here: webhook payloads arrive from Clerk's infrastructure,
// not the end-user's browser. Primary IP-bearing records come from the
// browser-side trackers at /api/v1/auth/record-success and record-failure.
//
// Setup: add CLERK_WEBHOOK_SECRET to Replit Secrets; in Clerk Dashboard →
// Webhooks create an endpoint for session.created + user.updated events.

import { Webhook } from "svix";
import { logSecurityEvent } from "@/lib/server/security-events";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[clerk-webhook] CLERK_WEBHOOK_SECRET not set");
    return new Response("Webhook secret not configured", { status: 500 });
  }

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

  if (eventType === "session.created") {
    const actorEmail =
      (data.public_user_data as Record<string, unknown> | undefined)
        ?.identifier as string | undefined ?? null;
    await logSecurityEvent({
      eventType: "login_success",
      actorEmail,
      ip: null,       // not available in webhook payload — see header comment
      userAgent: null,
      route: "/sign-in",
      outcome: "success",
    });

  } else if (eventType === "user.updated") {
    const previousAttributes = payload.previous_attributes as Record<string, unknown> | undefined;
    const currentFailed = (data.failed_sign_in_attempts as number) ?? 0;
    const previousFailed = previousAttributes?.failed_sign_in_attempts as number | undefined;

    if (previousFailed !== undefined && currentFailed > previousFailed) {
      const actorEmail =
        (data.email_addresses as Array<{ email_address: string }> | undefined)?.[0]
          ?.email_address ?? null;
      const newFailures = currentFailed - previousFailed;
      await Promise.allSettled(
        Array.from({ length: newFailures }, () =>
          logSecurityEvent({
            eventType: "login_fail",
            actorEmail,
            ip: null,   // not available in webhook payload — see header comment
            userAgent: null,
            route: "/sign-in",
            outcome: "fail",
          }),
        ),
      );
    }
  }

  return new Response("ok", { status: 200 });
}

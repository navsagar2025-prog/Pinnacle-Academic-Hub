// Clerk webhook receiver — supplementary audit log for login failures.
// Verifies Svix signatures; on user.updated detects failed_sign_in_attempts
// increases and logs login_fail events as a fallback for non-browser flows
// (API clients, mobile apps, automated scripts).
//
// login_success is NOT logged here — the browser-side SignInSuccessTracker
// calls /api/v1/auth/record-success with the real client IP/UA, which is
// the canonical source of truth for success events.
//
// IP/UA are null in webhook payloads: they arrive from Clerk's infrastructure.
// Browser tracker records carry real client IP; webhook records act as backup.
//
// Setup: add CLERK_WEBHOOK_SECRET to Replit Secrets; in Clerk Dashboard →
// Webhooks create an endpoint for user.updated events.

import { Webhook } from "svix";
import { logSecurityEvent } from "@/lib/server/security-events";
import { rateLimit, extractIp } from "@/lib/server/rate-limit";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  // Rate-limit webhook calls per source IP (covers non-v1 mutating endpoint gap).
  // Svix signatures prevent forged payloads; this limits raw request flooding.
  const ip = extractIp(req);
  const { allowed } = await rateLimit(`ip:${ip}`, "api.webhooks.clerk", 30, 60_000, { ip });
  if (!allowed) {
    return new Response("Too many requests", { status: 429 });
  }

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

  if (eventType === "user.updated") {
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
            ip: null,       // not available in webhook payload
            userAgent: null,
            route: "/sign-in [webhook]", // prefix distinguishes from browser-tracker records
            outcome: "fail",
          }),
        ),
      );
    }
  }

  return new Response("ok", { status: 200 });
}

// POST /api/v1/auth/record-success
// Called by SignInSuccessTracker immediately after a successful Clerk sign-in.
// Browser-to-server request: real client IP, user-agent, and authenticated
// Clerk session are all available — produces a complete login_success event.

import type { NextRequest } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { logSecurityEvent } from "@/lib/server/security-events";
import { extractIp } from "@/lib/server/rate-limit";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ success: false }), { status: 401 });
  }

  const ip = extractIp(req);
  const ua = req.headers.get("user-agent") ?? null;

  // Fetch the full user to get the primary email — completes the event record
  // with actor email + IP + user-agent + timestamp in one canonical row.
  const user = await currentUser();
  const actorEmail = user?.primaryEmailAddress?.emailAddress ?? null;

  await logSecurityEvent({
    eventType: "login_success",
    actorEmail,
    ip,
    userAgent: ua,
    route: "/sign-in",
    outcome: "success",
  });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

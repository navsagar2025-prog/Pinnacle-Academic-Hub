// POST /api/v1/auth/record-success
// Called by SignInSuccessTracker immediately after a successful Clerk sign-in.
// Being a browser-to-server request, the real client IP and user-agent are
// present in request headers — unlike the Clerk webhook where IP is unavailable.

import type { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { logSecurityEvent } from "@/lib/server/security-events";
import { extractIp } from "@/lib/server/rate-limit";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ success: false }), { status: 401 });
  }

  const ip = extractIp(req);
  const ua = req.headers.get("user-agent") ?? null;

  await logSecurityEvent({
    eventType: "login_success",
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

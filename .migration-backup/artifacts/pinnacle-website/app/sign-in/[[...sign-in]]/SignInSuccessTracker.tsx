"use client";

// Tracks successful sign-ins from Clerk's embedded <SignIn /> component.
// Reports to /api/v1/auth/record-success (browser→server) so the event
// carries the real client IP and user-agent — unlike the Clerk webhook,
// which delivers from Clerk's infrastructure (no end-user IP available).

import { useSession } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

export function SignInSuccessTracker() {
  const { session } = useSession();
  const reported = useRef(false);

  useEffect(() => {
    if (reported.current || session?.status !== "active") return;
    reported.current = true;
    fetch(`${BASE}/api/v1/auth/record-success`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }).catch(() => {});
  }, [session?.status]);

  return null;
}

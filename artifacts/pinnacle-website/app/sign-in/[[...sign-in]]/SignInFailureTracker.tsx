"use client";

// Tracks real sign-in failures from Clerk's embedded <SignIn /> component.
// Reports each failure to /api/v1/auth/record-failure (browser→server, so the
// server has the real client IP for lockout logic). Uses status transition
// detection (prev≠failed → current=failed) so every distinct wrong-password
// attempt is counted, not just the first one per session.

import { useSignIn } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

export function SignInFailureTracker() {
  const { signIn } = useSignIn();
  const prevStatus = useRef<string | null>(null);
  const currentStatus = signIn?.firstFactorVerification?.status ?? null;

  useEffect(() => {
    const prev = prevStatus.current;
    prevStatus.current = currentStatus;
    // Fire only on transitions into "failed", not on every render while failed.
    if (currentStatus !== "failed" || prev === "failed") return;
    fetch(`${BASE}/api/v1/auth/record-failure`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: signIn?.identifier ?? null }),
    }).catch(() => {});
  }, [currentStatus, signIn?.identifier]);

  return null;
}

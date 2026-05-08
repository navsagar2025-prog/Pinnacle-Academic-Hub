"use client";

/**
 * Invisible component mounted alongside Clerk's <SignIn /> on the sign-in page.
 *
 * Uses the same useSignIn() context that <SignIn /> writes to internally, so we
 * can observe authentication failures without building a custom form. Clerk's
 * embedded component calls signIn.attemptFirstFactor() / attemptSecondFactor()
 * internally; after each failed attempt, firstFactorVerification.status
 * transitions to "failed". When the user edits their credentials and submits
 * again, the status transitions back to "unverified" or "needs_first_factor"
 * before failing again — this is the signal we use to count each distinct attempt.
 *
 * Counting strategy (avoids the one-report-per-session bug):
 *   - Track the PREVIOUS status in a ref.
 *   - Report only when status TRANSITIONS into "failed" from a non-"failed" state.
 *   - This correctly counts N distinct failed attempts even when error code and
 *     identifier are identical across all of them (e.g. repeated wrong passwords).
 *
 * On each transition, calls POST /api/v1/auth/record-failure.
 * That server route has the real client IP in its request headers (browser →
 * our server, not Clerk webhook → our server), so the IP is reliable for
 * driving the ip_lockouts auto-lockout mechanism.
 */

import { useSignIn } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

export function SignInFailureTracker() {
  const { signIn } = useSignIn();
  // Track the previous verification status so we fire only on TRANSITIONS
  // into "failed", not on every render while status remains "failed".
  const prevVerificationStatus = useRef<string | null>(null);

  const currentStatus = signIn?.firstFactorVerification?.status ?? null;

  useEffect(() => {
    const prev = prevVerificationStatus.current;
    prevVerificationStatus.current = currentStatus;

    // Only report when we TRANSITION into "failed" from a different state.
    // This handles repeated wrong-password attempts correctly:
    //   attempt 1: null → "failed"  → report ✓
    //   user edits field: "failed" → "unverified" → no report ✓
    //   attempt 2: "unverified" → "failed" → report ✓
    //   attempt 3: "unverified" → "failed" → report ✓  (etc.)
    if (currentStatus !== "failed" || prev === "failed") return;

    const identifier = signIn?.identifier ?? null;

    // Fire-and-forget — do not await so we don't delay Clerk's UI feedback
    fetch(`${BASE}/api/v1/auth/record-failure`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier }),
    }).catch(() => {
      // Swallow network errors — this is best-effort telemetry; a network
      // failure here must never affect the user's sign-in experience.
    });
  }, [currentStatus, signIn?.identifier]);

  return null;
}

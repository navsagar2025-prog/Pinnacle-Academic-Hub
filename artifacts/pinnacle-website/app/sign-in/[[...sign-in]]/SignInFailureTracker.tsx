"use client";

/**
 * Invisible component mounted alongside Clerk's <SignIn /> on the sign-in page.
 *
 * Uses the same useSignIn() context that <SignIn /> writes to, so we can
 * observe authentication failures that happen inside Clerk's embedded UI
 * without building a custom form.
 *
 * On each new firstFactor failure, calls POST /api/v1/auth/record-failure.
 * That server route has the real client IP in its request headers (browser →
 * our server, not Clerk webhook → our server), so the IP is reliable.
 */

import { useSignIn } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

export function SignInFailureTracker() {
  const { signIn } = useSignIn();
  // Track the last error code we reported so we don't double-report the same error
  const lastReportedError = useRef<string | null>(null);

  useEffect(() => {
    if (!signIn) return;

    const verification = signIn.firstFactorVerification;
    const status = verification?.status;

    // Clerk sets status = 'failed' when credentials are incorrect
    if (status !== "failed") return;

    const errorCode =
      (verification?.error as { code?: string } | null)?.code ?? "unknown";
    const identifier = signIn.identifier ?? null;

    // Deduplicate: only report once per unique error code per attempt
    const reportKey = `${errorCode}:${identifier}`;
    if (lastReportedError.current === reportKey) return;
    lastReportedError.current = reportKey;

    // Fire-and-forget — do not await so we don't delay any UI feedback
    fetch(`${BASE}/api/v1/auth/record-failure`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, errorCode }),
      // credentials: include is default for same-origin fetches
    }).catch(() => {
      // Swallow network errors — this is best-effort telemetry
    });
  }, [signIn, signIn?.firstFactorVerification?.status, signIn?.firstFactorVerification?.error]);

  return null;
}

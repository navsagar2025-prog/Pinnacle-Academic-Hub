"use client";
import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-slate-light)] px-4">
      <div className="card max-w-md w-full text-center">
        <div className="w-16 h-16 bg-[var(--color-maroon)]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={32} className="text-[var(--color-maroon)]" />
        </div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)] mb-2">
          Something went wrong
        </h1>
        <p className="text-slate-500 text-sm mb-6">
          An unexpected error occurred. Please try again, or contact support if the problem persists.
        </p>
        {error.digest && (
          <p className="text-xs text-slate-400 font-mono mb-4">Error ID: {error.digest}</p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm"
          >
            <RefreshCw size={14} />
            Try Again
          </button>
          <Link href="/" className="btn-outline px-5 py-2.5 text-sm">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}

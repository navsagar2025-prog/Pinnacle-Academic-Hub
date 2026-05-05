"use client";
import { useState } from "react";
import { Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

export function SendDigestButton() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; sent?: number; failed?: number; skipped?: number; total?: number; error?: string } | null>(null);

  async function send() {
    if (!confirm("Send the weekly progress digest to all parents now?")) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch(`${BASE}/api/v1/admin/parent-digest`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) setResult({ ok: false, error: json.error ?? "Request failed" });
      else setResult({ ok: true, sent: json.sent, failed: json.failed, skipped: json.skipped, total: json.totalRecipients });
    } catch (e) {
      setResult({ ok: false, error: e instanceof Error ? e.message : "Network error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card border-l-4 border-l-[var(--color-teal)]">
      <div className="flex items-start gap-3 mb-3">
        <Mail size={20} className="text-[var(--color-teal)] flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="font-bold text-[var(--color-navy)]">Weekly Parent Digest</h3>
          <p className="text-xs text-slate-500 mt-1">
            Emails every linked parent a one-page summary of their child&apos;s last 7 days — attendance, mock-test scores, upcoming classes, and pending fees.
            Trigger manually below (admin session required), or schedule a cron to <code className="text-[10px] bg-slate-100 px-1 py-0.5 rounded">POST /api/v1/cron/parent-digest</code> with <code className="text-[10px] bg-slate-100 px-1 py-0.5 rounded">Authorization: Bearer $CRON_SECRET</code>.
          </p>
        </div>
      </div>
      <button
        onClick={send}
        disabled={busy}
        className="bg-[var(--color-teal)] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[var(--color-teal-light)] disabled:opacity-60 flex items-center gap-2"
      >
        {busy ? <><Loader2 size={14} className="animate-spin" /> Sending…</> : <>Send digest now</>}
      </button>
      {result && (
        <div className={`mt-3 p-3 rounded-lg text-sm flex items-start gap-2 ${result.ok ? "bg-green-50 text-green-800" : "bg-rose-50 text-rose-800"}`}>
          {result.ok ? <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" /> : <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />}
          <div>
            {result.ok ? (
              <>
                <div className="font-semibold">Digest delivered</div>
                <div className="text-xs mt-0.5">{result.sent} sent · {result.skipped} skipped (no email or no student) · {result.failed} failed · {result.total} total recipients</div>
              </>
            ) : (
              <>
                <div className="font-semibold">Failed</div>
                <div className="text-xs mt-0.5">{result.error}</div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

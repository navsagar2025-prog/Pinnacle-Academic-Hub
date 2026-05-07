"use client";

import { useState } from "react";
import { Mail, Check, AlertCircle } from "lucide-react";

export function TestEmailForm({ defaultTo }: { defaultTo: string }) {
  const [to, setTo] = useState(defaultTo);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/pinnacle-website/api/v1/admin/ops/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to }),
      });
      const json = await res.json();
      if (json.success) {
        setResult({ ok: true, message: `Sent to ${json.data.to}. ${json.data.remaining} of 5 sends remain this minute.` });
      } else {
        setResult({ ok: false, message: json.error ?? "Send failed" });
      }
    } catch (e) {
      setResult({ ok: false, message: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card p-5 space-y-4">
      <label className="block text-sm font-semibold text-slate-700">Recipient
        <input
          type="email"
          required
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
          placeholder="you@example.com"
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="btn btn-primary inline-flex items-center gap-2"
      >
        <Mail size={14} /> {busy ? "Sending…" : "Send test email"}
      </button>
      {result && (
        <div
          className={`flex items-start gap-2 rounded-md border p-3 text-sm ${
            result.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {result.ok ? <Check size={16} /> : <AlertCircle size={16} />}
          <span>{result.message}</span>
        </div>
      )}
    </form>
  );
}

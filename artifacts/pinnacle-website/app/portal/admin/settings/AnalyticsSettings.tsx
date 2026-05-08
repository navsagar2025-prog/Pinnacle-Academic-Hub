"use client";
import { useState } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

type Props = {
  settings: Record<string, string>;
  onUpdate: (key: string, value: string) => void;
};

type TestResult = { ok: boolean; message: string } | null;

export function AnalyticsSettings({ settings, onUpdate }: Props) {
  const [propertyId, setPropertyId] = useState(settings["ga4_property_id"] ?? "");
  const [serviceAccountJson, setServiceAccountJson] = useState(settings["ga4_service_account_json"] ?? "");
  const [measurementId, setMeasurementId] = useState(settings["ga4_measurement_id"] ?? "");
  const [apiSecret, setApiSecret] = useState(settings["ga4_api_secret"] ?? "");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult>(null);

  const sync = (key: string, value: string) => {
    onUpdate(key, value);
  };

  async function testConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`${BASE}/api/v1/admin/analytics/ga4-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, serviceAccountJson }),
      });
      const data = await res.json() as { data?: TestResult; error?: string };
      if (res.ok && data.data) {
        setTestResult(data.data);
      } else {
        setTestResult({ ok: false, message: data.error ?? "Request failed" });
      }
    } catch (e) {
      setTestResult({ ok: false, message: String(e) });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="card space-y-5">
      <div>
        <h2 className="font-semibold text-[var(--color-navy)] pb-3 border-b border-slate-100">
          Analytics — Google Analytics 4
        </h2>
        <p className="text-xs text-slate-500 mt-2">
          Connect GA4 to unlock sessions, users, bounce rate, traffic sources, device breakdown, and real-time visitor counts in the{" "}
          <a href="/portal/admin/analytics/traffic" className="underline text-[var(--color-teal)]">Website Traffic</a>{" "}
          dashboard. Leave blank to use the built-in page-view tracker as a fallback.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            GA4 Property ID
          </label>
          <input
            type="text"
            value={propertyId}
            onChange={(e) => { setPropertyId(e.target.value); sync("ga4_property_id", e.target.value); }}
            placeholder="e.g. 123456789"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]"
          />
          <p className="text-[10px] text-slate-400 mt-1">Found in GA4 Admin → Property → Property details.</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            GA4 Measurement ID (for Measurement Protocol proxy)
          </label>
          <input
            type="text"
            value={measurementId}
            onChange={(e) => { setMeasurementId(e.target.value); sync("ga4_measurement_id", e.target.value); }}
            placeholder="e.g. G-XXXXXXXXXX"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]"
          />
          <p className="text-[10px] text-slate-400 mt-1">Used by the GA4 proxy to bypass ad-blockers.</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Measurement Protocol API Secret
          </label>
          <input
            type="password"
            value={apiSecret}
            onChange={(e) => { setApiSecret(e.target.value); sync("ga4_api_secret", e.target.value); }}
            placeholder="API secret from GA4 Admin → Data Streams"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">
          Service Account JSON Key
        </label>
        <textarea
          value={serviceAccountJson}
          onChange={(e) => { setServiceAccountJson(e.target.value); sync("ga4_service_account_json", e.target.value); }}
          placeholder='Paste the contents of your Google service-account JSON key file here…'
          rows={6}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)] resize-y"
        />
        <p className="text-[10px] text-slate-400 mt-1">
          Create a service account in Google Cloud Console, grant it the{" "}
          <strong>Viewer</strong> role on your GA4 property, then download the JSON key. The key is stored encrypted in the database.
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={testConnection}
          disabled={testing || !propertyId || !serviceAccountJson}
          className="border border-[var(--color-teal)] text-[var(--color-teal)] rounded-lg px-4 py-2 text-sm font-medium hover:bg-[var(--color-teal)]/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {testing && <Loader2 size={14} className="animate-spin" />}
          {testing ? "Testing…" : "Test Connection"}
        </button>

        {testResult && (
          <div className={`flex items-center gap-2 text-sm ${testResult.ok ? "text-[var(--color-teal)]" : "text-red-600"}`}>
            {testResult.ok
              ? <CheckCircle size={15} />
              : <XCircle size={15} />}
            <span>{testResult.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}

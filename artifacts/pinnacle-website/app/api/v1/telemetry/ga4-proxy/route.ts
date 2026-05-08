/**
 * POST /api/v1/telemetry/ga4-proxy
 *
 * Measurement Protocol proxy: forwards client events to GA4 so that
 * ad-blockers that block google-analytics.com do not silently drop events.
 *
 * PII fields are stripped before forwarding. The endpoint is unauthenticated
 * because it must be callable from public pages without a session.
 *
 * Required env / settings:
 *   GA4_MEASUREMENT_ID   — e.g. G-XXXXXXXXXX  (can also be set in site_settings)
 *   GA4_API_SECRET       — Measurement Protocol API secret from GA4 admin
 */
import { db } from "@workspace/db";
import { siteSettings } from "@workspace/db/schema";
import { inArray } from "drizzle-orm";
import type { NextRequest } from "next/server";

// True PII fields that must never be forwarded (GDPR / privacy-safe).
// NOTE: `client_id` is intentionally kept — GA4 Measurement Protocol
// requires it to associate events with a browser session. It is a random
// GA-generated ID (e.g. "GA1.1.123456789.1234567890"), not a user identifier.
// `user_id` is stripped because it is a persistent first-party identifier.
// `ip_override` is stripped to prevent spoofing the upstream IP logged by GA.
const PII_STRIP = [
  "user_id", "ip_override",
  "email", "phone", "name", "address",
];

function stripPii(obj: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (PII_STRIP.some((p) => k.toLowerCase().includes(p))) continue;
    clean[k] = v;
  }
  return clean;
}

async function getGa4MpCredentials(): Promise<{ measurementId: string; apiSecret: string } | null> {
  // Prefer env vars so secrets are never stored in DB plaintext.
  const envMeasurementId = process.env.GA4_MEASUREMENT_ID;
  const envApiSecret = process.env.GA4_API_SECRET;
  if (envMeasurementId && envApiSecret) {
    return { measurementId: envMeasurementId, apiSecret: envApiSecret };
  }

  try {
    const rows = await db
      .select({ key: siteSettings.key, value: siteSettings.value })
      .from(siteSettings)
      .where(inArray(siteSettings.key, ["ga4_measurement_id", "ga4_api_secret"]));
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value ?? ""]));
    const measurementId = map["ga4_measurement_id"] ?? "";
    const apiSecret = map["ga4_api_secret"] ?? "";
    if (!measurementId || !apiSecret) return null;
    return { measurementId, apiSecret };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const creds = await getGa4MpCredentials();
    if (!creds) {
      return new Response(JSON.stringify({ error: "GA4 proxy not configured" }), { status: 503 });
    }

    const body = await req.json().catch(() => null) as Record<string, unknown> | null;
    if (!body || typeof body !== "object") {
      return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400 });
    }

    const cleaned = stripPii(body);

    const mpUrl = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(creds.measurementId)}&api_secret=${encodeURIComponent(creds.apiSecret)}`;

    const upstream = await fetch(mpUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cleaned),
    });

    return new Response(null, { status: upstream.ok ? 204 : upstream.status });
  } catch (e) {
    console.error("[ga4-proxy] error:", e);
    return new Response(null, { status: 204 });
  }
}

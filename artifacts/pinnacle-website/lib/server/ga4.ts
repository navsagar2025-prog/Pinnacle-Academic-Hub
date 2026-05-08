/**
 * GA4 Data API client — uses the REST API with service-account JWT auth.
 * No native gRPC packages required; only Node.js built-in `crypto` + fetch.
 *
 * All functions gracefully return null / empty data if credentials are missing
 * so the admin dashboard degrades cleanly to internal page-view counts.
 */
import { db } from "@workspace/db";
import { siteSettings } from "@workspace/db/schema";
import { inArray } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Credential helpers
// ---------------------------------------------------------------------------

export type Ga4Credentials = {
  propertyId: string;
  serviceAccountJson: string;
};

export async function getGa4Credentials(): Promise<Ga4Credentials | null> {
  try {
    const rows = await db
      .select({ key: siteSettings.key, value: siteSettings.value })
      .from(siteSettings)
      .where(inArray(siteSettings.key, ["ga4_property_id", "ga4_service_account_json"]));

    const map = Object.fromEntries(rows.map((r) => [r.key, r.value ?? ""]));
    const propertyId = map["ga4_property_id"] ?? "";
    const serviceAccountJson = map["ga4_service_account_json"] ?? "";
    if (!propertyId || !serviceAccountJson) return null;
    return { propertyId, serviceAccountJson };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// OAuth token (JWT → access token exchange)
// ---------------------------------------------------------------------------

// Cache keyed by client_email so swapping service-account credentials in
// Settings (or running testGa4Connection with different creds) never reuses
// a token issued for a different account until its natural expiry.
const _tokenCache = new Map<string, { token: string; expiresAt: number }>();

async function getAccessToken(serviceAccountJson: string): Promise<string> {
  // Use client_email as the cache key — cheap to extract, uniquely identifies
  // the service account without storing the full key material in the Map.
  let cacheKey = "unknown";
  try {
    cacheKey = (JSON.parse(serviceAccountJson) as { client_email?: string }).client_email ?? "unknown";
  } catch { /* fall through to "unknown" — cache miss is harmless */ }

  const cached = _tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.token;
  }

  const sa = JSON.parse(serviceAccountJson) as {
    client_email: string;
    private_key: string;
  };

  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/analytics.readonly",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    }),
  ).toString("base64url");

  const signingInput = `${header}.${payload}`;
  const { createSign } = await import("crypto");
  const sign = createSign("RSA-SHA256");
  sign.update(signingInput);
  const signature = sign.sign(sa.private_key, "base64url");
  const jwt = `${signingInput}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new Error("GA4 token exchange failed");

  _tokenCache.set(cacheKey, { token: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 });
  return data.access_token;
}

// ---------------------------------------------------------------------------
// GA4 Data API — runReport
// ---------------------------------------------------------------------------

export type Ga4Dimension = { name: string };
export type Ga4Metric = { name: string };
export type Ga4DateRange = { startDate: string; endDate: string };

export type Ga4ReportRow = {
  dimensionValues: { value: string }[];
  metricValues: { value: string }[];
};

export type Ga4ReportResult = {
  rows: Ga4ReportRow[];
  rowCount: number;
};

export async function runReport(
  credentials: Ga4Credentials,
  dateRanges: Ga4DateRange[],
  dimensions: Ga4Dimension[],
  metrics: Ga4Metric[],
  limit = 100,
): Promise<Ga4ReportResult | null> {
  try {
    const token = await getAccessToken(credentials.serviceAccountJson);
    const url = `https://analyticsdata.googleapis.com/v1beta/properties/${credentials.propertyId}:runReport`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ dateRanges, dimensions, metrics, limit }),
    });
    if (!res.ok) {
      console.error("[ga4] runReport error", res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as {
      rows?: Ga4ReportRow[];
      rowCount?: number;
    };
    return { rows: data.rows ?? [], rowCount: data.rowCount ?? 0 };
  } catch (e) {
    console.error("[ga4] runReport exception", e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// GA4 Realtime — active users in last 30 min
// ---------------------------------------------------------------------------

export async function getRealtimeActiveUsers(credentials: Ga4Credentials): Promise<number | null> {
  try {
    const token = await getAccessToken(credentials.serviceAccountJson);
    const url = `https://analyticsdata.googleapis.com/v1beta/properties/${credentials.propertyId}:runRealtimeReport`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        metrics: [{ name: "activeUsers" }],
      }),
    });
    if (!res.ok) {
      console.error("[ga4] realtime error", res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as { rows?: { metricValues: { value: string }[] }[] };
    const val = data.rows?.[0]?.metricValues?.[0]?.value;
    return val != null ? parseInt(val, 10) : 0;
  } catch (e) {
    console.error("[ga4] realtime exception", e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Test connection — verify credentials work
// ---------------------------------------------------------------------------

export async function testGa4Connection(credentials: Ga4Credentials): Promise<{ ok: boolean; message: string }> {
  try {
    const result = await getRealtimeActiveUsers(credentials);
    if (result === null) return { ok: false, message: "Could not reach GA4 API. Check your Property ID and service-account key." };
    return { ok: true, message: `Connection successful. ${result} active user(s) right now.` };
  } catch (e) {
    return { ok: false, message: String(e) };
  }
}

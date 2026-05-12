import { google } from "googleapis";
import { db } from "@workspace/db";
import { siteSettings } from "@workspace/db/schema";
import { inArray } from "drizzle-orm";

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
export const GA4_PROPERTY_ID = process.env.GOOGLE_GA4_PROPERTY_ID;

export type GA4Creds = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  propertyId: string;
  measurementId?: string;
};

export type GA4Source = "env" | "db";
export type GA4Config = GA4Creds & { source: GA4Source };

export type ReportRow = {
  dimensionValues: { value: string }[];
  metricValues: { value: string }[];
};

type Dimension = { name: string };
type Metric = { name: string };
type DateRange = { startDate: string; endDate: string };

export const GA4_DB_KEYS = [
  "ga4_client_id",
  "ga4_client_secret",
  "ga4_refresh_token",
  "ga4_property_id",
  "ga4_measurement_id",
] as const;

export function ga4Available(): boolean {
  return !!(CLIENT_ID && CLIENT_SECRET && REFRESH_TOKEN && GA4_PROPERTY_ID);
}

export async function getDbCreds(): Promise<(GA4Config & { source: "db" }) | null> {
  const rows = await db
    .select()
    .from(siteSettings)
    .where(inArray(siteSettings.key, [...GA4_DB_KEYS, "ga4_oauth_state"]));
  const map = Object.fromEntries(rows.map(r => [r.key, r.value ?? ""]));

  // Client ID and Secret fall back to env vars when not stored in DB
  // (this happens when GOOGLE_OAUTH_CLIENT_ID/SECRET were pre-configured
  // as env vars and used directly during the OAuth flow without DB persistence)
  const clientId = map.ga4_client_id || CLIENT_ID || "";
  const clientSecret = map.ga4_client_secret || CLIENT_SECRET || "";

  if (!clientId || !clientSecret || !map.ga4_refresh_token || !map.ga4_property_id) {
    return null;
  }
  return {
    clientId,
    clientSecret,
    refreshToken: map.ga4_refresh_token,
    propertyId: map.ga4_property_id,
    measurementId: map.ga4_measurement_id || undefined,
    source: "db",
  };
}

export async function getEffectiveCreds(): Promise<GA4Config | null> {
  if (ga4Available()) {
    return {
      clientId: CLIENT_ID!,
      clientSecret: CLIENT_SECRET!,
      refreshToken: REFRESH_TOKEN!,
      propertyId: GA4_PROPERTY_ID!,
      measurementId: process.env.VITE_GA4_MEASUREMENT_ID,
      source: "env",
    };
  }
  return getDbCreds();
}

export function buildAuthFromCreds(
  creds: Pick<GA4Creds, "clientId" | "clientSecret" | "refreshToken">,
) {
  const oauth2 = new google.auth.OAuth2(creds.clientId, creds.clientSecret);
  oauth2.setCredentials({ refresh_token: creds.refreshToken });
  return oauth2;
}

export async function runReportWithCreds(
  creds: GA4Creds,
  dimensions: Dimension[],
  metrics: Metric[],
  dateRanges: DateRange[],
): Promise<ReportRow[]> {
  const auth = buildAuthFromCreds(creds);
  const analyticsdata = google.analyticsdata({ version: "v1beta", auth });
  const res = await analyticsdata.properties.runReport({
    property: `properties/${creds.propertyId}`,
    requestBody: { dimensions, metrics, dateRanges },
  });
  return (res.data.rows ?? []) as ReportRow[];
}

export async function runReport(
  dimensions: Dimension[],
  metrics: Metric[],
  dateRanges: DateRange[],
): Promise<ReportRow[]> {
  return runReportWithCreds(
    {
      clientId: CLIENT_ID!,
      clientSecret: CLIENT_SECRET!,
      refreshToken: REFRESH_TOKEN!,
      propertyId: GA4_PROPERTY_ID!,
    },
    dimensions,
    metrics,
    dateRanges,
  );
}

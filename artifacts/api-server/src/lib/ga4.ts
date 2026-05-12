import { google } from "googleapis";

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
export const GA4_PROPERTY_ID = process.env.GOOGLE_GA4_PROPERTY_ID;

export function ga4Available(): boolean {
  return !!(CLIENT_ID && CLIENT_SECRET && REFRESH_TOKEN && GA4_PROPERTY_ID);
}

function buildAuth() {
  const oauth2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
  oauth2.setCredentials({ refresh_token: REFRESH_TOKEN });
  return oauth2;
}

type Dimension = { name: string };
type Metric = { name: string };
type DateRange = { startDate: string; endDate: string };

export async function runReport(
  dimensions: Dimension[],
  metrics: Metric[],
  dateRanges: DateRange[],
): Promise<{ dimensionValues: { value: string }[]; metricValues: { value: string }[] }[]> {
  const auth = buildAuth();
  const analyticsdata = google.analyticsdata({ version: "v1beta", auth });
  const res = await analyticsdata.properties.runReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    requestBody: { dimensions, metrics, dateRanges },
  });
  return (res.data.rows ?? []) as { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[];
}

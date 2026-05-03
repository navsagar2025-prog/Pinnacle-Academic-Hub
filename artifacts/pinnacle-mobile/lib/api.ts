// Resolve the Pinnacle website API base URL.
// Priority: EXPO_PUBLIC_WEBSITE_URL > derived from EXPO_PUBLIC_DOMAIN > null.
// React Native fetch requires absolute URLs, so we return null (and skip fetches)
// when no absolute URL can be constructed.
function resolveWebsiteBase(): string | null {
  const explicit = process.env.EXPO_PUBLIC_WEBSITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (!domain) return null;
  // In Replit dev, the pinnacle-website is mounted under /pinnacle-website.
  // In production with a custom domain, set EXPO_PUBLIC_WEBSITE_URL explicitly.
  return `https://${domain}/pinnacle-website`;
}

const WEBSITE_BASE = resolveWebsiteBase();

export type Notice = {
  id: string;
  title: string;
  body: string;
  category: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
};

export async function fetchPublicNotices(limit = 5): Promise<Notice[]> {
  if (!WEBSITE_BASE) return [];
  try {
    const res = await fetch(`${WEBSITE_BASE}/api/v1/notices?limit=${limit}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.items) ? data.items : Array.isArray(data?.data) ? data.data : [];
  } catch {
    return [];
  }
}

export function formatNoticeDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

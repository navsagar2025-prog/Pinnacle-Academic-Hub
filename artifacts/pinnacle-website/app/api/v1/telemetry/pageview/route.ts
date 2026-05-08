/**
 * POST /api/v1/telemetry/pageview
 *
 * Lightweight server-side page-view beacon. Called from the public layout
 * via navigator.sendBeacon so it never blocks page render and fires even
 * on tab close. Unauthenticated — any visitor can POST, but each request
 * only records an aggregate count for the given path+date, not PII.
 *
 * Bot UA strings are filtered before insert.
 */
import { db } from "@workspace/db";
import { pageViews } from "@workspace/db/schema";
import { sql } from "drizzle-orm";
import type { NextRequest } from "next/server";

// Common bot / crawler user-agent substrings (lowercase).
const BOT_UA_FRAGMENTS = [
  "googlebot", "bingbot", "slurp", "duckduckbot", "baiduspider",
  "yandexbot", "sogou", "exabot", "facebot", "ia_archiver",
  "semrushbot", "ahrefsbot", "dotbot", "seznambot", "petalbot",
  "applebot", "gptbot", "claudebot", "anthropic-ai", "facebookexternalhit",
  "twitterbot", "linkedinbot", "whatsapp", "telegrambot", "discordbot",
  "curl/", "python-requests", "go-http-client", "wget/", "axios/",
  "postmanruntime", "insomnia",
];

function isBot(ua: string): boolean {
  const lower = ua.toLowerCase();
  return BOT_UA_FRAGMENTS.some((f) => lower.includes(f));
}

function getDeviceType(ua: string): string {
  if (/mobile|android|iphone|ipad|ipod/i.test(ua)) {
    if (/ipad|tablet/i.test(ua)) return "tablet";
    return "mobile";
  }
  return "desktop";
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(req: NextRequest) {
  try {
    const ua = req.headers.get("user-agent") ?? "";
    if (isBot(ua)) return new Response(null, { status: 204 });

    const body = await req.json().catch(() => ({})) as {
      path?: string;
      referrer?: string;
    };

    const rawPath = typeof body.path === "string" ? body.path : "/";
    // Normalise: keep only pathname, strip query + hash
    let path = rawPath.split("?")[0].split("#")[0];
    if (!path.startsWith("/")) path = "/" + path;
    // Truncate to 500 chars to prevent abuse
    path = path.slice(0, 500);

    const referrer = typeof body.referrer === "string" ? body.referrer.slice(0, 500) : null;
    const deviceType = getDeviceType(ua);
    const date = todayIso();

    // Upsert: increment count if the (path, date) row already exists.
    await db.execute(sql`
      INSERT INTO page_views (id, path, referrer, device_type, count, date, created_at, updated_at)
      VALUES (gen_random_uuid(), ${path}, ${referrer}, ${deviceType}, 1, ${date}, now(), now())
      ON CONFLICT (path, date)
      DO UPDATE SET
        count = page_views.count + 1,
        updated_at = now()
    `);

    return new Response(null, { status: 204 });
  } catch (e) {
    console.error("[pageview beacon] error:", e);
    // Never return a 5xx to the browser — the beacon fires and forgets.
    return new Response(null, { status: 204 });
  }
}

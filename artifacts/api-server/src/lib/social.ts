/**
 * Social media platform utilities:
 * - Token encryption/decryption at rest (AES-256-GCM)
 * - Per-account platform publishing
 * - OAuth URL generation and code exchange
 */

import crypto from "crypto";
import { db } from "@workspace/db";
import { socialAccounts } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "./logger.js";

// ── Token Encryption ──────────────────────────────────────────────────────────
// Requires SOCIAL_TOKEN_ENCRYPTION_KEY env var (32-byte hex string, i.e. 64 hex chars).
// Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
// If not set, tokens are stored as-is with a warning logged once.

let _warnedOnce = false;

function getEncryptionKey(): Buffer | null {
  const hex = process.env.SOCIAL_TOKEN_ENCRYPTION_KEY;
  if (!hex) {
    if (!_warnedOnce) {
      logger.warn("SOCIAL_TOKEN_ENCRYPTION_KEY is not set — social tokens stored unencrypted. Set this env var in production.");
      _warnedOnce = true;
    }
    return null;
  }
  if (hex.length !== 64) {
    logger.error("SOCIAL_TOKEN_ENCRYPTION_KEY must be a 64-char hex string (32 bytes). Falling back to unencrypted storage.");
    return null;
  }
  return Buffer.from(hex, "hex");
}

export function encryptToken(plaintext: string): string {
  const key = getEncryptionKey();
  if (!key) return plaintext;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Format: iv(12B):authTag(16B):ciphertext — all base64
  return `enc:${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptToken(stored: string): string {
  if (!stored.startsWith("enc:")) return stored; // unencrypted fallback
  const key = getEncryptionKey();
  if (!key) return stored; // can't decrypt without key; return raw (will fail at platform)
  const [, ivB64, tagB64, dataB64] = stored.split(":");
  if (!ivB64 || !tagB64 || !dataB64) return stored;
  try {
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    return decipher.update(Buffer.from(dataB64, "base64")).toString("utf8") + decipher.final("utf8");
  } catch {
    logger.error("Failed to decrypt social token — token may be corrupted or key changed");
    return "";
  }
}

// ── Platform Publishing ───────────────────────────────────────────────────────

export type PublishResult =
  | { ok: true; url: string | null }
  | { ok: false; error: string };

/**
 * Publish content to a single platform using the stored account credentials.
 * Returns { ok: true, url } on success or { ok: false, error } on failure.
 */
export async function publishToAccount(
  platform: string,
  content: string,
  mediaUrls: string[] = [],
): Promise<PublishResult> {
  const [account] = await db.select().from(socialAccounts)
    .where(eq(socialAccounts.platform, platform)).limit(1);

  if (!account || account.status !== "connected") {
    return { ok: false, error: `No connected ${platform} account` };
  }

  const token = account.accessToken ? decryptToken(account.accessToken) : null;
  if (!token) {
    return { ok: false, error: `No access token for ${platform}` };
  }

  try {
    switch (platform) {
      case "facebook": return await publishFacebook(token, account.pageId ?? undefined, content, mediaUrls);
      case "instagram": return await publishInstagram(token, account.accountId ?? undefined, content, mediaUrls);
      case "twitter": return await publishTwitter(token, content, mediaUrls);
      case "linkedin": return await publishLinkedIn(token, account.accountId ?? undefined, content, mediaUrls);
      default: return { ok: false, error: `Unknown platform: ${platform}` };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn({ platform, err }, "Platform publish failed");
    return { ok: false, error: msg };
  }
}

/**
 * Publish to all target platforms for a post. Returns a summary of results.
 */
export async function publishPostToPlatforms(
  platformTargets: string[],
  content: string,
  mediaUrls: string[] = [],
): Promise<{ publishedUrls: Record<string, string>; errors: Record<string, string>; anySuccess: boolean }> {
  const publishedUrls: Record<string, string> = {};
  const errors: Record<string, string> = {};

  await Promise.all(platformTargets.map(async (platform) => {
    const result = await publishToAccount(platform, content, mediaUrls);
    if (result.ok) {
      if (result.url) publishedUrls[platform] = result.url;
    } else {
      errors[platform] = result.error;
    }
  }));

  const anySuccess = Object.keys(publishedUrls).length > 0 || Object.keys(errors).length < platformTargets.length;
  return { publishedUrls, errors, anySuccess };
}

// ── Platform-specific publish functions ───────────────────────────────────────

async function publishFacebook(
  token: string, pageId: string | undefined, content: string, mediaUrls: string[]
): Promise<PublishResult> {
  if (!pageId) return { ok: false, error: "Facebook page ID not configured" };
  const body: Record<string, unknown> = { message: content, access_token: token };
  // Attach up to one photo URL if present (full video upload requires separate endpoint)
  if (mediaUrls.length > 0) body.link = mediaUrls[0];
  const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { id?: string; error?: { message?: string } };
  if (!res.ok || json.error) {
    return { ok: false, error: json.error?.message ?? "Facebook API error" };
  }
  return { ok: true, url: json.id ? `https://www.facebook.com/${json.id}` : null };
}

async function publishInstagram(
  token: string, igUserId: string | undefined, content: string, mediaUrls: string[]
): Promise<PublishResult> {
  if (!igUserId) return { ok: false, error: "Instagram user ID not configured" };
  const containerBody: Record<string, unknown> = { caption: content, access_token: token };
  if (mediaUrls.length > 0) {
    // Instagram requires a hosted image URL for image posts
    containerBody.image_url = mediaUrls[0];
    containerBody.media_type = "IMAGE";
  }
  const containerRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(containerBody),
  });
  const c = (await containerRes.json()) as { id?: string; error?: { message?: string } };
  if (!containerRes.ok || c.error) {
    return { ok: false, error: c.error?.message ?? "Instagram container creation failed" };
  }
  if (!c.id) return { ok: false, error: "No container ID returned" };

  const pubRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: c.id, access_token: token }),
  });
  const p = (await pubRes.json()) as { id?: string; error?: { message?: string } };
  if (!pubRes.ok || p.error) {
    return { ok: false, error: p.error?.message ?? "Instagram publish failed" };
  }
  return { ok: true, url: p.id ? `https://www.instagram.com/p/${p.id}/` : null };
}

async function publishTwitter(token: string, content: string, _mediaUrls: string[]): Promise<PublishResult> {
  const res = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ text: content }),
  });
  const json = (await res.json()) as { data?: { id?: string }; errors?: Array<{ message?: string }> };
  if (!res.ok || json.errors?.length) {
    return { ok: false, error: json.errors?.[0]?.message ?? "Twitter API error" };
  }
  return { ok: true, url: json.data?.id ? `https://twitter.com/i/web/status/${json.data.id}` : null };
}

async function publishLinkedIn(
  token: string, urn: string | undefined, content: string, _mediaUrls: string[]
): Promise<PublishResult> {
  if (!urn) return { ok: false, error: "LinkedIn person/org URN not configured (set in accountId field)" };
  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: urn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: content },
          shareMediaCategory: "NONE",
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  });
  const json = (await res.json()) as { id?: string; message?: string };
  if (!res.ok) {
    return { ok: false, error: json.message ?? "LinkedIn API error" };
  }
  return { ok: true, url: json.id ? `https://www.linkedin.com/feed/update/${json.id}` : null };
}

// ── OAuth URL generation ──────────────────────────────────────────────────────

export type OAuthConfig = {
  authUrl: string;
  clientId: string;
  scopes: string[];
  extraParams?: Record<string, string>;
};

const CALLBACK_BASE = process.env.SOCIAL_OAUTH_CALLBACK_BASE
  ?? process.env.WEBSITE_BASE_URL
  ?? "https://pinnacle.edu.in";

export const OAUTH_CONFIGS: Record<string, (() => OAuthConfig | null)> = {
  facebook: () => {
    const clientId = process.env.SOCIAL_FACEBOOK_APP_ID;
    if (!clientId) return null;
    return {
      authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
      clientId,
      scopes: ["pages_manage_posts", "pages_read_engagement", "pages_show_list"],
      extraParams: { response_type: "code" },
    };
  },
  instagram: () => {
    const clientId = process.env.SOCIAL_FACEBOOK_APP_ID; // Instagram uses same FB app
    if (!clientId) return null;
    return {
      authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
      clientId,
      scopes: ["instagram_basic", "instagram_content_publish", "pages_show_list"],
      extraParams: { response_type: "code" },
    };
  },
  twitter: () => {
    const clientId = process.env.SOCIAL_TWITTER_CLIENT_ID;
    if (!clientId) return null;
    return {
      authUrl: "https://twitter.com/i/oauth2/authorize",
      clientId,
      scopes: ["tweet.write", "users.read", "offline.access"],
      extraParams: { response_type: "code", code_challenge_method: "plain", code_challenge: "challenge" },
    };
  },
  linkedin: () => {
    const clientId = process.env.SOCIAL_LINKEDIN_CLIENT_ID;
    if (!clientId) return null;
    return {
      authUrl: "https://www.linkedin.com/oauth/v2/authorization",
      clientId,
      scopes: ["w_member_social", "r_liteprofile"],
      extraParams: { response_type: "code" },
    };
  },
};

export function buildOAuthUrl(platform: string, state: string): string | null {
  const configFn = OAUTH_CONFIGS[platform];
  if (!configFn) return null;
  const config = configFn();
  if (!config) return null;

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: `${CALLBACK_BASE}/api/v1/admin/social/oauth/callback`,
    scope: config.scopes.join(","),
    state,
    ...config.extraParams,
  });
  return `${config.authUrl}?${params.toString()}`;
}

/** Exchange OAuth code for access token — platform-specific. Returns token or null. */
export async function exchangeOAuthCode(
  platform: string,
  code: string,
): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date; accountId?: string; accountName?: string } | null> {
  const callbackUri = `${CALLBACK_BASE}/api/v1/admin/social/oauth/callback`;

  if (platform === "facebook" || platform === "instagram") {
    const appId = process.env.SOCIAL_FACEBOOK_APP_ID;
    const appSecret = process.env.SOCIAL_FACEBOOK_APP_SECRET;
    if (!appId || !appSecret) return null;
    const res = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}&redirect_uri=${encodeURIComponent(callbackUri)}`,
    );
    const json = (await res.json()) as { access_token?: string; expires_in?: number; error?: unknown };
    if (!json.access_token) return null;
    const expiresAt = json.expires_in ? new Date(Date.now() + json.expires_in * 1000) : undefined;
    return { accessToken: json.access_token, expiresAt };
  }

  if (platform === "twitter") {
    const clientId = process.env.SOCIAL_TWITTER_CLIENT_ID;
    const clientSecret = process.env.SOCIAL_TWITTER_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;
    const res = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({ code, grant_type: "authorization_code", redirect_uri: callbackUri, code_verifier: "challenge" }),
    });
    const json = (await res.json()) as { access_token?: string; refresh_token?: string; expires_in?: number };
    if (!json.access_token) return null;
    const expiresAt = json.expires_in ? new Date(Date.now() + json.expires_in * 1000) : undefined;
    return { accessToken: json.access_token, refreshToken: json.refresh_token, expiresAt };
  }

  if (platform === "linkedin") {
    const clientId = process.env.SOCIAL_LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.SOCIAL_LINKEDIN_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;
    const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: callbackUri, client_id: clientId, client_secret: clientSecret }),
    });
    const json = (await res.json()) as { access_token?: string; expires_in?: number; refresh_token?: string };
    if (!json.access_token) return null;
    const expiresAt = json.expires_in ? new Date(Date.now() + json.expires_in * 1000) : undefined;
    return { accessToken: json.access_token, refreshToken: json.refresh_token, expiresAt };
  }

  return null;
}

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
//
// Security policy:
//   - In production (NODE_ENV=production): missing or invalid key throws immediately
//     so tokens are never written/read as plaintext in a live environment.
//   - In development: missing key logs a warning and falls back to plaintext storage
//     so local dev works without extra setup.

let _warnedOnce = false;
const IS_PROD = process.env.NODE_ENV === "production";

function getEncryptionKey(): Buffer | null {
  const hex = process.env.SOCIAL_TOKEN_ENCRYPTION_KEY;
  if (!hex) {
    if (IS_PROD) {
      throw new Error(
        "SOCIAL_TOKEN_ENCRYPTION_KEY is required in production. " +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\" " +
        "and set it as an environment variable."
      );
    }
    if (!_warnedOnce) {
      logger.warn("SOCIAL_TOKEN_ENCRYPTION_KEY not set — social tokens stored unencrypted (development only).");
      _warnedOnce = true;
    }
    return null;
  }
  if (hex.length !== 64) {
    const msg = "SOCIAL_TOKEN_ENCRYPTION_KEY must be a 64-char hex string (32 bytes).";
    if (IS_PROD) throw new Error(msg);
    logger.error(msg + " Falling back to unencrypted storage (development only).");
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

async function publishTwitter(token: string, content: string, mediaUrls: string[]): Promise<PublishResult> {
  // OAuth 2 bearer tokens can't use v1.1 media upload (requires OAuth 1.0a);
  // append first media URL as a link instead.
  let tweetText = content;
  if (mediaUrls.length > 0) {
    const suffix = ` ${mediaUrls[0]}`;
    if ((tweetText + suffix).length <= 280) {
      tweetText = tweetText + suffix;
    } else {
      const maxContent = 280 - suffix.length - 1;
      tweetText = tweetText.slice(0, maxContent) + "…" + suffix;
    }
  }
  const res = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ text: tweetText }),
  });
  const json = (await res.json()) as { data?: { id?: string }; errors?: Array<{ message?: string }> };
  if (!res.ok || json.errors?.length) {
    return { ok: false, error: json.errors?.[0]?.message ?? "Twitter API error" };
  }
  return { ok: true, url: json.data?.id ? `https://twitter.com/i/web/status/${json.data.id}` : null };
}

async function publishLinkedIn(
  token: string, urn: string | undefined, content: string, mediaUrls: string[]
): Promise<PublishResult> {
  if (!urn) return { ok: false, error: "LinkedIn person/org URN not configured (set in accountId field)" };
  // Use ARTICLE share when mediaUrls present so LinkedIn renders a link card.
  const hasMedia = mediaUrls.length > 0;
  const shareContent: Record<string, unknown> = {
    shareCommentary: { text: content },
    shareMediaCategory: hasMedia ? "ARTICLE" : "NONE",
  };
  if (hasMedia) {
    shareContent.media = [{
      status: "READY",
      originalUrl: mediaUrls[0],
      title: { text: "Media" },
    }];
  }
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
      specificContent: { "com.linkedin.ugc.ShareContent": shareContent },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  });
  const json = (await res.json()) as { id?: string; message?: string };
  if (!res.ok) {
    return { ok: false, error: json.message ?? "LinkedIn API error" };
  }
  return { ok: true, url: json.id ? `https://www.linkedin.com/feed/update/${json.id}` : null };
}

// ── OAuth State Store (in-memory, 10-minute TTL) ──────────────────────────────

type OAuthStateEntry = {
  platform: string;
  expiresAt: number;
  codeVerifier?: string; // PKCE — only for Twitter
  adminClerkUserId?: string; // Bound to the initiating admin for identity continuity
};

const _oauthStates = new Map<string, OAuthStateEntry>();
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/** Create a random state token, persist it, and return it.
 *  Pass adminClerkUserId to bind the flow to the initiating admin. */
export function createOAuthState(platform: string, codeVerifier?: string, adminClerkUserId?: string): string {
  const now = Date.now();
  // Purge expired entries
  for (const [k, v] of _oauthStates.entries()) {
    if (v.expiresAt < now) _oauthStates.delete(k);
  }
  const state = crypto.randomBytes(32).toString("hex");
  _oauthStates.set(state, { platform, expiresAt: now + OAUTH_STATE_TTL_MS, codeVerifier, adminClerkUserId });
  return state;
}

/**
 * Validate a state token. Returns the stored entry and deletes it (one-time use).
 * Returns null if the state is unknown or has expired.
 */
export function validateOAuthState(state: string): OAuthStateEntry | null {
  const entry = _oauthStates.get(state);
  _oauthStates.delete(state); // Always delete — prevents replay
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) return null; // Expired
  return entry;
}

// ── PKCE helpers ─────────────────────────────────────────────────────────────

/** Generate a PKCE code_verifier (random 32-byte base64url string). */
export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/** Derive the S256 code_challenge from a verifier. */
function deriveCodeChallenge(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

// ── OAuth URL generation ──────────────────────────────────────────────────────

const CALLBACK_BASE = process.env.SOCIAL_OAUTH_CALLBACK_BASE
  ?? process.env.WEBSITE_BASE_URL
  ?? "https://pinnacle.edu.in";

/**
 * Build the OAuth authorization URL for a platform.
 * @param codeVerifier – Required for Twitter (PKCE S256). Pass the same verifier
 *   that was stored via createOAuthState so the callback can use it.
 */
export function buildOAuthUrl(platform: string, state: string, codeVerifier?: string): string | null {
  const redirectUri = `${CALLBACK_BASE}/api/v1/admin/social/oauth/callback`;

  if (platform === "facebook" || platform === "instagram") {
    const clientId = process.env.SOCIAL_FACEBOOK_APP_ID;
    if (!clientId) return null;
    const scopes = platform === "facebook"
      ? ["pages_manage_posts", "pages_read_engagement", "pages_show_list"]
      : ["instagram_basic", "instagram_content_publish", "pages_show_list"];
    const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, scope: scopes.join(","), state, response_type: "code" });
    return `https://www.facebook.com/v19.0/dialog/oauth?${params}`;
  }

  if (platform === "twitter") {
    const clientId = process.env.SOCIAL_TWITTER_CLIENT_ID;
    if (!clientId) return null;
    if (!codeVerifier) {
      logger.warn("buildOAuthUrl: codeVerifier required for Twitter PKCE but not provided");
      return null;
    }
    const challenge = deriveCodeChallenge(codeVerifier);
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "tweet.write users.read offline.access",
      state,
      response_type: "code",
      code_challenge_method: "S256",
      code_challenge: challenge,
    });
    return `https://twitter.com/i/oauth2/authorize?${params}`;
  }

  if (platform === "linkedin") {
    const clientId = process.env.SOCIAL_LINKEDIN_CLIENT_ID;
    if (!clientId) return null;
    const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, scope: "w_member_social r_liteprofile", state, response_type: "code" });
    return `https://www.linkedin.com/oauth/v2/authorization?${params}`;
  }

  return null;
}

type OAuthTokenResult = { accessToken: string; refreshToken?: string; expiresAt?: Date; accountId?: string; accountName?: string };

/**
 * Exchange OAuth code for access token — platform-specific.
 * Also hydrates account metadata (page/user/profile IDs and names) via a secondary
 * platform API call so that publishing works immediately after connection.
 */
export async function exchangeOAuthCode(
  platform: string,
  code: string,
  codeVerifier?: string, // For Twitter PKCE
): Promise<OAuthTokenResult | null> {
  const callbackUri = `${CALLBACK_BASE}/api/v1/admin/social/oauth/callback`;

  if (platform === "facebook") {
    const appId = process.env.SOCIAL_FACEBOOK_APP_ID;
    const appSecret = process.env.SOCIAL_FACEBOOK_APP_SECRET;
    if (!appId || !appSecret) return null;
    // Step 1: Exchange code for short-lived user token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}&redirect_uri=${encodeURIComponent(callbackUri)}`,
    );
    const tokenJson = (await tokenRes.json()) as { access_token?: string; expires_in?: number; error?: unknown };
    if (!tokenJson.access_token) return null;

    // Step 2: Fetch managed pages — use the first page token + id for publishing
    try {
      const pagesRes = await fetch(
        `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token&access_token=${tokenJson.access_token}`,
      );
      const pagesJson = (await pagesRes.json()) as { data?: { id: string; name: string; access_token: string }[] };
      const page = pagesJson.data?.[0];
      if (page) {
        return { accessToken: page.access_token, accountId: page.id, accountName: page.name };
      }
    } catch (e) {
      logger.warn({ e }, "Failed to fetch Facebook pages — storing user token");
    }
    // Fallback: store user token (publishing to pages will still need pageId configured manually)
    const expiresAt = tokenJson.expires_in ? new Date(Date.now() + tokenJson.expires_in * 1000) : undefined;
    return { accessToken: tokenJson.access_token, expiresAt };
  }

  if (platform === "instagram") {
    const appId = process.env.SOCIAL_FACEBOOK_APP_ID;
    const appSecret = process.env.SOCIAL_FACEBOOK_APP_SECRET;
    if (!appId || !appSecret) return null;
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}&redirect_uri=${encodeURIComponent(callbackUri)}`,
    );
    const tokenJson = (await tokenRes.json()) as { access_token?: string; expires_in?: number };
    if (!tokenJson.access_token) return null;

    // Fetch pages with instagram_business_account to get IG user ID
    try {
      const pagesRes = await fetch(
        `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${tokenJson.access_token}`,
      );
      const pagesJson = (await pagesRes.json()) as { data?: { id: string; name: string; access_token: string; instagram_business_account?: { id: string } }[] };
      const page = pagesJson.data?.find(p => p.instagram_business_account);
      if (page?.instagram_business_account) {
        return {
          accessToken: page.access_token, // Use page token for IG Graph API
          accountId: page.instagram_business_account.id,
          accountName: `${page.name} (Instagram)`,
        };
      }
    } catch (e) {
      logger.warn({ e }, "Failed to fetch Instagram business account");
    }
    const expiresAt = tokenJson.expires_in ? new Date(Date.now() + tokenJson.expires_in * 1000) : undefined;
    return { accessToken: tokenJson.access_token, expiresAt };
  }

  if (platform === "twitter") {
    const clientId = process.env.SOCIAL_TWITTER_CLIENT_ID;
    const clientSecret = process.env.SOCIAL_TWITTER_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;
    if (!codeVerifier) {
      logger.error("Twitter PKCE exchange called without code_verifier — cannot complete");
      return null;
    }
    const res = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({ code, grant_type: "authorization_code", redirect_uri: callbackUri, code_verifier: codeVerifier }),
    });
    const json = (await res.json()) as { access_token?: string; refresh_token?: string; expires_in?: number };
    if (!json.access_token) return null;
    const expiresAt = json.expires_in ? new Date(Date.now() + json.expires_in * 1000) : undefined;

    // Fetch Twitter user profile to get accountId and username
    let accountId: string | undefined;
    let accountName: string | undefined;
    try {
      const userRes = await fetch("https://api.twitter.com/2/users/me", {
        headers: { Authorization: `Bearer ${json.access_token}` },
      });
      const userJson = (await userRes.json()) as { data?: { id: string; name: string; username: string } };
      accountId = userJson.data?.id;
      accountName = userJson.data?.username ? `@${userJson.data.username}` : userJson.data?.name;
    } catch (e) {
      logger.warn({ e }, "Failed to fetch Twitter user profile");
    }
    return { accessToken: json.access_token, refreshToken: json.refresh_token, expiresAt, accountId, accountName };
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

    // Fetch LinkedIn profile via OpenID userinfo endpoint to get person URN
    let accountId: string | undefined;
    let accountName: string | undefined;
    try {
      const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${json.access_token}` },
      });
      const profileJson = (await profileRes.json()) as { sub?: string; name?: string; given_name?: string; family_name?: string };
      if (profileJson.sub) {
        accountId = `urn:li:person:${profileJson.sub}`; // URN required for UGC posts API
        accountName = (profileJson.name
          ?? `${profileJson.given_name ?? ""} ${profileJson.family_name ?? ""}`.trim())
          || undefined;
      }
    } catch (e) {
      logger.warn({ e }, "Failed to fetch LinkedIn profile");
    }
    return { accessToken: json.access_token, refreshToken: json.refresh_token, expiresAt, accountId, accountName };
  }

  return null;
}

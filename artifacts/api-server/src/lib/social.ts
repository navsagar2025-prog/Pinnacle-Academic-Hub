/**
 * Social media platform utilities:
 * - Token encryption/decryption at rest (AES-256-GCM)
 * - Per-account platform publishing
 * - OAuth URL generation and code exchange
 */

import crypto from "crypto";
import { db } from "@workspace/db";
import { socialAccounts, socialPostMetrics, blogPosts, notices, users } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "./logger.js";
import { emailAvailable, sendEmail } from "./email.js";

// ── Token Encryption ──────────────────────────────────────────────────────────
// SOCIAL_TOKEN_ENCRYPTION_KEY: 64-char hex (32 bytes). Required in production;
// dev falls back to plaintext with a warning.

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

// ── Token Refresh ─────────────────────────────────────────────────────────────

/**
 * Attempt to refresh an expired OAuth access token for a connected platform account.
 *
 * Supported platforms: twitter, linkedin.
 * Facebook/Instagram page tokens are long-lived (60 days) and do not use refresh_token
 * flows in the same way — their tokens are renewed via re-authorization.
 *
 * On success: stores the new encrypted token + updated expiry in social_accounts
 *             and returns the plaintext new access token.
 * On permanent failure (invalid_grant / 400 / 401): marks the account "expired",
 *             emails all admin users, and returns null.
 * On transient failure (network error / 5xx): logs a warning and returns null
 *             without marking the account expired so the next attempt can retry.
 */

/**
 * Returns true for HTTP status codes that represent a permanent token failure
 * (bad credentials, revoked token, invalid_grant) as opposed to a transient
 * server/network error that should not immediately mark the account expired.
 */
function isPermanentRefreshFailure(status: number, errorCode?: string): boolean {
  // OAuth error codes that definitively indicate the refresh token is no longer valid.
  // These are checked first — if present they override the HTTP status heuristic.
  const permanentOAuthErrors = new Set(["invalid_grant", "invalid_token", "unauthorized_client"]);
  if (errorCode && permanentOAuthErrors.has(errorCode)) return true;

  // 401 Unauthorized = credentials rejected by the platform → permanent.
  if (status === 401) return true;

  // 400 Bad Request WITHOUT a known OAuth error code may be a misconfiguration
  // or malformed request (e.g. wrong Content-Type, missing param) rather than
  // a revoked token — treat as transient to avoid prematurely expiring the account.
  // Only treat 400 as permanent when an explicit OAuth error code confirms it.
  return false;
}

async function attemptTokenRefresh(
  platform: string,
  account: { id: string; refreshToken: string | null; accountName?: string | null },
): Promise<string | null> {
  if (!account.refreshToken) return null;

  const storedRefreshToken = decryptToken(account.refreshToken);
  if (!storedRefreshToken) return null;

  let newAccessToken: string | null = null;
  let newRefreshToken: string | null = null;
  let newExpiresAt: Date | null = null;

  try {
    if (platform === "twitter") {
      const clientId = process.env.SOCIAL_TWITTER_CLIENT_ID;
      const clientSecret = process.env.SOCIAL_TWITTER_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        logger.warn({ platform }, "Cannot refresh token — Twitter client credentials not configured");
        return null;
      }
      const res = await fetch("https://api.twitter.com/2/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        },
        body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: storedRefreshToken }),
      });
      const json = (await res.json()) as { access_token?: string; refresh_token?: string; expires_in?: number; error?: string; error_description?: string };
      if (!res.ok || !json.access_token) {
        logger.warn({ platform, status: res.status, error: json.error, description: json.error_description }, "Twitter token refresh failed");
        if (isPermanentRefreshFailure(res.status, json.error)) {
          await markAccountExpired(account.id, platform, account.accountName);
        }
        return null;
      }
      newAccessToken = json.access_token;
      newRefreshToken = json.refresh_token ?? null;
      newExpiresAt = json.expires_in ? new Date(Date.now() + json.expires_in * 1000) : null;

    } else if (platform === "linkedin") {
      const clientId = process.env.SOCIAL_LINKEDIN_CLIENT_ID;
      const clientSecret = process.env.SOCIAL_LINKEDIN_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        logger.warn({ platform }, "Cannot refresh token — LinkedIn client credentials not configured");
        return null;
      }
      const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: storedRefreshToken, client_id: clientId, client_secret: clientSecret }),
      });
      const json = (await res.json()) as { access_token?: string; refresh_token?: string; expires_in?: number; error?: string; error_description?: string };
      if (!res.ok || !json.access_token) {
        logger.warn({ platform, status: res.status, error: json.error, description: json.error_description }, "LinkedIn token refresh failed");
        if (isPermanentRefreshFailure(res.status, json.error)) {
          await markAccountExpired(account.id, platform, account.accountName);
        }
        return null;
      }
      newAccessToken = json.access_token;
      newRefreshToken = json.refresh_token ?? null;
      newExpiresAt = json.expires_in ? new Date(Date.now() + json.expires_in * 1000) : null;

    } else {
      // Platform doesn't support token refresh (Facebook/Instagram use long-lived page tokens)
      return null;
    }
  } catch (err) {
    // Network / unexpected exception — treat as transient; do NOT mark account expired
    logger.warn({ platform, err }, "Token refresh request threw an exception (transient failure — account not marked expired)");
    return null;
  }

  // Persist the new token (encrypted) and updated expiry
  try {
    await db.update(socialAccounts)
      .set({
        accessToken: encryptToken(newAccessToken),
        refreshToken: newRefreshToken ? encryptToken(newRefreshToken) : account.refreshToken,
        tokenExpiresAt: newExpiresAt,
        status: "connected",
        updatedAt: new Date(),
      })
      .where(eq(socialAccounts.id, account.id));
    logger.info({ platform }, "Social account token refreshed successfully");
  } catch (err) {
    logger.warn({ platform, err }, "Failed to persist refreshed token — will use in-memory for this request");
  }

  return newAccessToken;
}

// ── Admin notification deduplication ─────────────────────────────────────────
// Prevent burst email notifications when the same platform fails repeatedly.
// Tracks the last time an admin notification was sent per platform (in-memory,
// resets on server restart which is acceptable — admins want to know on restart too).
const _lastAdminNotifyMs = new Map<string, number>();
const ADMIN_NOTIFY_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour per platform

/**
 * Mark a social account as permanently expired and notify all admin users by email.
 * Called only on permanent failures (invalid_grant / 401), not transient ones.
 */
async function markAccountExpired(accountId: string, platform: string, accountName?: string | null): Promise<void> {
  try {
    await db.update(socialAccounts)
      .set({ status: "expired", updatedAt: new Date() })
      .where(eq(socialAccounts.id, accountId));
  } catch (err) {
    logger.warn({ platform, err }, "Failed to mark social account as expired");
  }

  logger.warn(
    { platform, accountName },
    `[Social] Token refresh failed permanently for ${platform}${accountName ? ` (${accountName})` : ""}. ` +
    "Account marked 'expired'. An admin must reconnect via Admin → Social Media.",
  );

  // Send notification email to all admin users (best-effort, non-blocking, rate-limited)
  void notifyAdminsOfTokenRefreshFailure(platform, accountName);
}

/**
 * Fetch all admin users and email each one to alert them that a social account
 * needs to be reconnected. Silently skips if no email provider is configured.
 * Rate-limited to once per platform per hour to prevent burst notifications.
 */
async function notifyAdminsOfTokenRefreshFailure(platform: string, accountName?: string | null): Promise<void> {
  // Deduplicate: skip if we already notified about this platform recently
  const lastNotify = _lastAdminNotifyMs.get(platform) ?? 0;
  if (Date.now() - lastNotify < ADMIN_NOTIFY_COOLDOWN_MS) {
    logger.debug({ platform }, "Admin token-refresh-failure notification suppressed (within cooldown window)");
    return;
  }
  _lastAdminNotifyMs.set(platform, Date.now());

  if (!emailAvailable()) {
    logger.debug({ platform }, "Email not configured — skipping admin token-refresh-failure notification");
    return;
  }
  try {
    const adminUsers = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.role, "admin"));

    if (adminUsers.length === 0) {
      logger.warn({ platform }, "No admin users found to notify about token refresh failure");
      return;
    }

    const platformLabel = platform.charAt(0).toUpperCase() + platform.slice(1);
    const safeAccountName = accountName ? accountName.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;") : null;
    const accountLabel = safeAccountName ? ` (<strong>${safeAccountName}</strong>)` : "";
    const subject = `Action required: ${platformLabel} social account disconnected — Pinnacle Academic Classes`;
    const html = `
      <p>Hello,</p>
      <p>The <strong>${platformLabel}</strong>${accountLabel} social media account connected to Pinnacle Academic Classes has been disconnected because its access token expired and could not be refreshed automatically.</p>
      <p><strong>Impact:</strong> Social media posts scheduled for ${platformLabel} will fail until the account is reconnected.</p>
      <p><strong>Action required:</strong> Please log in to the admin panel and go to <strong>Social Media → Connected Accounts</strong> to reconnect the ${platformLabel} account.</p>
      <p>If you have any questions, contact your technical team.</p>
      <p>— Pinnacle Academic Classes Platform</p>
    `;

    await Promise.all(
      adminUsers.map(admin =>
        sendEmail({ to: admin.email, subject, html }).catch(err => {
          logger.warn({ platform, adminEmail: admin.email, err }, "Failed to send token-refresh-failure email to admin");
        })
      )
    );
    logger.info({ platform, accountName, count: adminUsers.length }, "Admin notification emails sent for token refresh failure");
  } catch (err) {
    logger.warn({ platform, err }, "Failed to send admin token-refresh-failure notifications");
  }
}

// ── Platform Publishing ───────────────────────────────────────────────────────

export type PublishResult =
  | { ok: true; url: string | null }
  | { ok: false; error: string };

/**
 * Returns env-var credentials for a platform as a fallback when no OAuth
 * account is connected in the DB. Set these for simple single-account
 * deployments that don't use the OAuth connection UI.
 *
 * Each platform accepts two env-var naming conventions — both are equivalent:
 *
 * Facebook:
 *   FACEBOOK_ACCESS_TOKEN  (short alias per task spec)   + FACEBOOK_PAGE_ID
 *   FACEBOOK_PAGE_ACCESS_TOKEN  (descriptive)            + FACEBOOK_PAGE_ID
 *
 * Instagram:
 *   INSTAGRAM_PAGE_ACCESS_TOKEN + INSTAGRAM_USER_ID
 *
 * Twitter/X:
 *   TWITTER_BEARER_TOKEN  — MUST be an OAuth 2.0 USER-CONTEXT access token
 *   (obtained with tweet.write scope). App-only bearer tokens cannot post tweets.
 *
 * LinkedIn:
 *   LINKEDIN_ACCESS_TOKEN + LINKEDIN_PERSON_URN  (e.g. urn:li:person:XXXX)
 */
function getEnvCredentials(platform: string): { token: string; pageId?: string; accountId?: string } | null {
  if (platform === "facebook") {
    // Accept both short alias (FACEBOOK_ACCESS_TOKEN) and descriptive name
    const token = process.env.FACEBOOK_ACCESS_TOKEN ?? process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    const pageId = process.env.FACEBOOK_PAGE_ID;
    if (token && pageId) return { token, pageId };
  }
  if (platform === "instagram") {
    const token = process.env.INSTAGRAM_PAGE_ACCESS_TOKEN;
    const accountId = process.env.INSTAGRAM_USER_ID;
    if (token && accountId) return { token, accountId };
  }
  if (platform === "twitter") {
    const token = process.env.TWITTER_BEARER_TOKEN;
    if (token) return { token };
  }
  if (platform === "linkedin") {
    const token = process.env.LINKEDIN_ACCESS_TOKEN;
    const accountId = process.env.LINKEDIN_PERSON_URN;
    if (token && accountId) return { token, accountId };
  }
  return null;
}

/**
 * Emits startup warnings for common social media env-var misconfigurations.
 * Call once from the server startup sequence (after logger is ready).
 *
 * Checks for:
 *   - FACEBOOK_ACCESS_TOKEN set but FACEBOOK_PAGE_ID missing (required pair)
 *   - INSTAGRAM_PAGE_ACCESS_TOKEN set but INSTAGRAM_USER_ID missing
 *   - LINKEDIN_ACCESS_TOKEN set but LINKEDIN_PERSON_URN missing
 *   - TWITTER_BEARER_TOKEN set (reminds operator it must be user-context token)
 */
export function warnSocialEnvMisconfig(): void {
  const fbToken = process.env.FACEBOOK_ACCESS_TOKEN ?? process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (fbToken && !process.env.FACEBOOK_PAGE_ID) {
    logger.warn(
      "FACEBOOK_ACCESS_TOKEN is set but FACEBOOK_PAGE_ID is missing. " +
      "Facebook publishing will fail until FACEBOOK_PAGE_ID is configured."
    );
  }
  if (process.env.INSTAGRAM_PAGE_ACCESS_TOKEN && !process.env.INSTAGRAM_USER_ID) {
    logger.warn(
      "INSTAGRAM_PAGE_ACCESS_TOKEN is set but INSTAGRAM_USER_ID is missing. " +
      "Instagram publishing will fail until INSTAGRAM_USER_ID is configured."
    );
  }
  if (process.env.LINKEDIN_ACCESS_TOKEN && !process.env.LINKEDIN_PERSON_URN) {
    logger.warn(
      "LINKEDIN_ACCESS_TOKEN is set but LINKEDIN_PERSON_URN is missing. " +
      "LinkedIn publishing will fail until LINKEDIN_PERSON_URN (urn:li:person:XXXX) is configured."
    );
  }
  if (process.env.TWITTER_BEARER_TOKEN) {
    logger.debug(
      "TWITTER_BEARER_TOKEN is set. Ensure this is an OAuth 2.0 user-context access token " +
      "(tweet.write scope), NOT an app-only bearer token — app-only tokens cannot post tweets."
    );
  }
}

export async function publishToAccount(
  platform: string,
  content: string,
  mediaUrls: string[] = [],
): Promise<PublishResult> {
  // 1. Try DB-stored OAuth account first (connected via admin OAuth flow)
  const [account] = await db.select().from(socialAccounts)
    .where(eq(socialAccounts.platform, platform)).limit(1);

  let token: string | null = null;
  let pageId: string | undefined;
  let accountId: string | undefined;

  if (account?.status === "connected" && account.accessToken) {
    const now = Date.now();
    // "near expiry" = expires within 60 seconds (handles clock skew / slow requests)
    const nearExpiry = account.tokenExpiresAt != null && account.tokenExpiresAt.getTime() <= now + 60_000;
    // "truly expired" = the token has already passed its expiry time
    const trulyExpired = account.tokenExpiresAt != null && account.tokenExpiresAt.getTime() <= now;

    if (nearExpiry && account.refreshToken) {
      // Token is at or near expiry — attempt automatic refresh
      logger.info({ platform }, "Social account token is expired — attempting automatic refresh");
      const refreshed = await attemptTokenRefresh(platform, account);
      if (refreshed) {
        token = refreshed;
      } else if (trulyExpired) {
        // Token is definitively expired and refresh failed permanently
        return {
          ok: false,
          error: `${platform} access token expired and could not be refreshed automatically. ` +
            "Please reconnect the account via Admin → Social Media.",
        };
      } else {
        // Token is only near expiry (within 60s buffer) and refresh had a transient failure.
        // The current token may still be valid — attempt publish and let the platform decide.
        logger.warn({ platform }, "Transient refresh failure for near-expiry token — attempting publish with current token");
        token = decryptToken(account.accessToken);
      }
    } else if (trulyExpired && !account.refreshToken) {
      // Token has expired and no refresh token is available — admin must reconnect manually
      logger.warn({ platform }, "Social account token expired with no refresh token — admin reconnect required");
      return {
        ok: false,
        error: `${platform} access token has expired and no refresh token is available. ` +
          "Please reconnect the account via Admin → Social Media.",
      };
    } else {
      token = decryptToken(account.accessToken);
    }

    pageId = account.pageId ?? undefined;
    accountId = account.accountId ?? undefined;
  } else {
    // 2. Fall back to env-var credentials (simpler single-account deployments)
    const env = getEnvCredentials(platform);
    if (env) {
      token = env.token;
      pageId = env.pageId;
      accountId = env.accountId;
      logger.debug({ platform }, "Using env-var credentials for platform publish (no DB OAuth account)");
    }
  }

  if (!token) {
    return { ok: false, error: `No credentials for ${platform}. Connect via Admin → Social Media or set env vars (e.g. FACEBOOK_PAGE_ACCESS_TOKEN).` };
  }

  try {
    switch (platform) {
      case "facebook": return await publishFacebook(token, pageId, content, mediaUrls);
      case "instagram": return await publishInstagram(token, accountId, content, mediaUrls);
      case "twitter": return await publishTwitter(token, content, mediaUrls);
      case "linkedin": return await publishLinkedIn(token, accountId, content, mediaUrls);
      default: return { ok: false, error: `Unknown platform: ${platform}` };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn({ platform, err }, "Platform publish failed");
    return { ok: false, error: msg };
  }
}

const WEBSITE_BASE_URL = process.env.WEBSITE_BASE_URL ?? "";

export async function resolveLinkedContentUrl(
  linkedBlogId: string | null | undefined,
  linkedNoticeId: string | null | undefined,
): Promise<string | null> {
  if (linkedBlogId) {
    const [post] = await db.select({ slug: blogPosts.slug }).from(blogPosts).where(eq(blogPosts.id, linkedBlogId)).limit(1);
    if (post?.slug) return `${WEBSITE_BASE_URL}/blog/${post.slug}`;
  }
  if (linkedNoticeId) {
    const [notice] = await db.select({ id: notices.id }).from(notices).where(eq(notices.id, linkedNoticeId)).limit(1);
    if (notice) return `${WEBSITE_BASE_URL}/notices`;
  }
  return null;
}

export async function publishPostToPlatforms(
  platformTargets: string[],
  content: string,
  mediaUrls: string[] = [],
): Promise<{ publishedUrls: Record<string, string>; errors: Record<string, string>; anySuccess: boolean }> {
  const publishedUrls: Record<string, string> = {};
  const errors: Record<string, string> = {};
  const successes = new Set<string>();

  await Promise.all(platformTargets.map(async (platform) => {
    const result = await publishToAccount(platform, content, mediaUrls);
    if (result.ok) {
      successes.add(platform);
      if (result.url) publishedUrls[platform] = result.url;
    } else {
      errors[platform] = result.error;
    }
  }));

  return { publishedUrls, errors, anySuccess: successes.size > 0 };
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
  // Instagram Business API requires at least one media item (image or video).
  // Text-only posts are not supported — return a clear error rather than letting
  // the Meta API return a cryptic "media type not supported" message.
  if (mediaUrls.length === 0) {
    return {
      ok: false,
      error: "Instagram does not support text-only posts. Please attach at least one image or video.",
    };
  }
  const containerBody: Record<string, unknown> = {
    caption: content,
    access_token: token,
    image_url: mediaUrls[0],
    media_type: "IMAGE",
  };
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
  ?? "https://paconline.in";

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
    const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, scope: "openid profile w_member_social", state, response_type: "code" });
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

// ── Post Engagement Metrics ───────────────────────────────────────────────────

export type PlatformMetrics = {
  platform: string;
  likes: number | null;
  shares: number | null;
  comments: number | null;
  reach: number | null;
  impressions: number | null;
  fetchError?: string;
  fetchedAt: string;
};

async function fetchFacebookMetrics(token: string, postUrl: string): Promise<Omit<PlatformMetrics, "fetchedAt">> {
  const base = { platform: "facebook", likes: null, shares: null, comments: null, reach: null, impressions: null };
  const match = postUrl.match(/facebook\.com\/(\d+(?:_\d+)?)/);
  if (!match) return { ...base, fetchError: "Could not extract post ID from URL" };
  const postId = match[1];
  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${postId}?fields=likes.summary(true),comments.summary(true),shares&access_token=${token}`,
    );
    const json = (await res.json()) as {
      likes?: { summary?: { total_count?: number } };
      comments?: { summary?: { total_count?: number } };
      shares?: { count?: number };
      error?: { message?: string };
    };
    if (json.error) return { ...base, fetchError: json.error.message ?? "Facebook API error" };

    let reach: number | null = null;
    let impressions: number | null = null;
    try {
      const ir = await fetch(
        `https://graph.facebook.com/v19.0/${postId}/insights?metric=post_impressions,post_reach&access_token=${token}`,
      );
      const ij = (await ir.json()) as { data?: { name: string; values: { value: number }[] }[] };
      for (const item of ij.data ?? []) {
        const val = item.values?.[0]?.value ?? null;
        if (item.name === "post_impressions") impressions = val;
        if (item.name === "post_reach") reach = val;
      }
    } catch { /* insights may not be available for all post types */ }

    return {
      ...base,
      likes: json.likes?.summary?.total_count ?? null,
      comments: json.comments?.summary?.total_count ?? null,
      shares: json.shares?.count ?? null,
      reach,
      impressions,
    };
  } catch (e) {
    return { ...base, fetchError: e instanceof Error ? e.message : "Fetch failed" };
  }
}

async function fetchInstagramMetrics(token: string, postUrl: string): Promise<Omit<PlatformMetrics, "fetchedAt">> {
  const base = { platform: "instagram", likes: null, shares: null, comments: null, reach: null, impressions: null };
  const match = postUrl.match(/instagram\.com\/p\/([^/?]+)/);
  if (!match) return { ...base, fetchError: "Could not extract media ID from URL" };
  const mediaId = match[1];
  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${mediaId}/insights?metric=likes,comments,shares,reach,impressions&access_token=${token}`,
    );
    const json = (await res.json()) as {
      data?: { name: string; values: { value: number }[] }[];
      error?: { message?: string };
    };
    if (json.error) return { ...base, fetchError: json.error.message ?? "Instagram API error" };
    const metrics: Record<string, number> = {};
    for (const item of json.data ?? []) {
      metrics[item.name] = item.values?.[0]?.value ?? 0;
    }
    return {
      ...base,
      likes: metrics["likes"] ?? null,
      comments: metrics["comments"] ?? null,
      shares: metrics["shares"] ?? null,
      reach: metrics["reach"] ?? null,
      impressions: metrics["impressions"] ?? null,
    };
  } catch (e) {
    return { ...base, fetchError: e instanceof Error ? e.message : "Fetch failed" };
  }
}

async function fetchTwitterMetrics(token: string, postUrl: string): Promise<Omit<PlatformMetrics, "fetchedAt">> {
  const base = { platform: "twitter", likes: null, shares: null, comments: null, reach: null, impressions: null };
  const match = postUrl.match(/(?:status|statuses)\/(\d+)/);
  if (!match) return { ...base, fetchError: "Could not extract tweet ID from URL" };
  const tweetId = match[1];
  try {
    const res = await fetch(
      `https://api.twitter.com/2/tweets/${tweetId}?tweet.fields=public_metrics`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const json = (await res.json()) as {
      data?: { public_metrics?: { like_count?: number; retweet_count?: number; reply_count?: number; impression_count?: number } };
      errors?: { message?: string }[];
    };
    if (json.errors?.length) return { ...base, fetchError: json.errors[0]?.message ?? "Twitter API error" };
    const m = json.data?.public_metrics;
    return {
      ...base,
      likes: m?.like_count ?? null,
      shares: m?.retweet_count ?? null,
      comments: m?.reply_count ?? null,
      impressions: m?.impression_count ?? null,
      reach: null,
    };
  } catch (e) {
    return { ...base, fetchError: e instanceof Error ? e.message : "Fetch failed" };
  }
}

async function fetchLinkedInMetrics(token: string, postUrl: string, accountId: string | null): Promise<Omit<PlatformMetrics, "fetchedAt">> {
  const base = { platform: "linkedin", likes: null, shares: null, comments: null, reach: null, impressions: null };
  const match = postUrl.match(/feed\/update\/(urn:[^?#]+)/);
  if (!match) return { ...base, fetchError: "Could not extract post URN from URL" };
  const shareUrn = decodeURIComponent(match[1]);
  if (!accountId) return { ...base, fetchError: "No LinkedIn account URN configured" };
  try {
    const params = new URLSearchParams({
      q: "organizationalEntity",
      organizationalEntity: accountId,
      shares: shareUrn,
    });
    const res = await fetch(
      `https://api.linkedin.com/v2/organizationalEntityShareStatistics?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Restli-Protocol-Version": "2.0.0",
        },
      },
    );
    const json = (await res.json()) as {
      elements?: {
        totalShareStatistics?: {
          likeCount?: number;
          shareCount?: number;
          commentCount?: number;
          impressionCount?: number;
          uniqueImpressionsCount?: number;
        };
      }[];
      message?: string;
    };
    if (!res.ok) return { ...base, fetchError: json.message ?? "LinkedIn API error" };
    const s = json.elements?.[0]?.totalShareStatistics;
    return {
      ...base,
      likes: s?.likeCount ?? null,
      shares: s?.shareCount ?? null,
      comments: s?.commentCount ?? null,
      impressions: s?.impressionCount ?? null,
      reach: s?.uniqueImpressionsCount ?? null,
    };
  } catch (e) {
    return { ...base, fetchError: e instanceof Error ? e.message : "Fetch failed" };
  }
}

/**
 * Fetch live engagement metrics for a post, only for platforms with a stored
 * published URL (i.e. platforms that actually succeeded at publish time).
 *
 * Cache behaviour:
 * - On SUCCESS: upsert all metric columns + clear fetchError.
 * - On FAILURE: only update fetchError + fetchedAt; metric columns are left
 *   intact so previously-good values are preserved even after token expiry.
 */
export async function fetchAndCachePostMetrics(
  postId: string,
  publishedUrls: Record<string, string>,
): Promise<PlatformMetrics[]> {
  const now = new Date();
  const results: PlatformMetrics[] = [];

  // Only process platforms that actually published — avoids noisy error rows
  // for targets that silently failed at publish time.
  const publishedPlatforms = Object.keys(publishedUrls);

  await Promise.all(publishedPlatforms.map(async (platform) => {
    const url = publishedUrls[platform];
    const [account] = await db.select().from(socialAccounts)
      .where(eq(socialAccounts.platform, platform)).limit(1);

    let partial: Omit<PlatformMetrics, "fetchedAt">;

    if (!account?.accessToken) {
      partial = { platform, likes: null, shares: null, comments: null, reach: null, impressions: null, fetchError: "Platform account disconnected — reconnect to fetch stats" };
    } else {
      const token = decryptToken(account.accessToken);
      switch (platform) {
        case "facebook": partial = await fetchFacebookMetrics(token, url); break;
        case "instagram": partial = await fetchInstagramMetrics(token, url); break;
        case "twitter": partial = await fetchTwitterMetrics(token, url); break;
        case "linkedin": partial = await fetchLinkedInMetrics(token, url, account.accountId); break;
        default: partial = { platform, likes: null, shares: null, comments: null, reach: null, impressions: null, fetchError: "Unknown platform" };
      }
    }

    try {
      if (partial.fetchError) {
        // Failure path: preserve existing metric values — only update error metadata.
        await db.insert(socialPostMetrics).values({
          postId,
          platform,
          fetchError: partial.fetchError,
          fetchedAt: now,
        }).onConflictDoUpdate({
          target: [socialPostMetrics.postId, socialPostMetrics.platform],
          set: {
            fetchError: partial.fetchError,
            fetchedAt: now,
            // Metric columns intentionally omitted — prior good values stay intact.
          },
        });
      } else {
        // Success path: update all metric columns and clear any prior error.
        await db.insert(socialPostMetrics).values({
          postId,
          platform,
          likes: partial.likes,
          shares: partial.shares,
          comments: partial.comments,
          reach: partial.reach,
          impressions: partial.impressions,
          fetchError: null,
          fetchedAt: now,
        }).onConflictDoUpdate({
          target: [socialPostMetrics.postId, socialPostMetrics.platform],
          set: {
            likes: partial.likes,
            shares: partial.shares,
            comments: partial.comments,
            reach: partial.reach,
            impressions: partial.impressions,
            fetchError: null,
            fetchedAt: now,
          },
        });
      }
    } catch (e) {
      logger.warn({ postId, platform, e }, "Failed to cache post metrics");
    }

    results.push({ ...partial, fetchedAt: now.toISOString() });
  }));

  return results;
}

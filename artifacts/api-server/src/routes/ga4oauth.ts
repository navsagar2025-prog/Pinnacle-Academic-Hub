import { Router, type Request, type Response, type NextFunction } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import { google } from "googleapis";
import crypto from "crypto";
import { db } from "@workspace/db";
import { siteSettings, users } from "@workspace/db/schema";
import { eq, inArray } from "drizzle-orm";
import { GA4_DB_KEYS } from "../lib/ga4.js";

const router = Router();

const GA4_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

async function requireAdminRole(req: Request, res: Response, next: NextFunction) {
  const { userId: clerkUserId } = getAuth(req);
  if (!clerkUserId) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const [user] = await db.select({ role: users.role }).from(users).where(eq(users.clerkId, clerkUserId)).limit(1);
    if (!user || user.role !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }
    next();
  } catch { res.status(500).json({ error: "Auth check failed" }); }
}

async function upsertSetting(key: string, value: string | null, label?: string) {
  await db.insert(siteSettings)
    .values({ key, value, label: label ?? null })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: new Date() } });
}

async function getDbSettings() {
  const rows = await db
    .select()
    .from(siteSettings)
    .where(inArray(siteSettings.key, [...GA4_DB_KEYS, "ga4_oauth_state", "ga4_oauth_redirect_uri"]));
  return Object.fromEntries(rows.map(r => [r.key, r.value ?? ""]));
}

function buildCallbackUri(req: Request): string {
  const proto = req.get("x-forwarded-proto") || req.protocol || "https";
  const host = req.get("x-forwarded-host") || req.get("host") || "localhost";
  return `${proto}://${host}${req.baseUrl}/admin/ga4/oauth/callback`;
}

function buildFrontendBase(req: Request): string {
  const proto = req.get("x-forwarded-proto") || req.protocol || "https";
  const host = req.get("x-forwarded-host") || req.get("host") || "localhost";
  return `${proto}://${host}`;
}

router.get("/admin/ga4/status", requireAuth(), requireAdminRole, async (_req, res) => {
  const envConnected = !!(
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
    process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
    process.env.GOOGLE_OAUTH_REFRESH_TOKEN &&
    process.env.GOOGLE_GA4_PROPERTY_ID
  );
  if (envConnected) {
    res.json({
      ok: true,
      data: {
        connected: true,
        source: "env",
        propertyId: process.env.GOOGLE_GA4_PROPERTY_ID ?? null,
        measurementId: process.env.VITE_GA4_MEASUREMENT_ID ?? null,
      },
    });
    return;
  }
  try {
    const settings = await getDbSettings();
    const dbConnected = !!(
      settings.ga4_client_id &&
      settings.ga4_client_secret &&
      settings.ga4_refresh_token &&
      settings.ga4_property_id
    );
    res.json({
      ok: true,
      data: {
        connected: dbConnected,
        source: dbConnected ? "db" : null,
        propertyId: settings.ga4_property_id || null,
        measurementId: settings.ga4_measurement_id || null,
      },
    });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch GA4 status" });
  }
});

router.post("/admin/ga4/oauth/start", requireAuth(), requireAdminRole, async (req, res) => {
  const { clientId, clientSecret, propertyId, measurementId } = req.body as {
    clientId: string;
    clientSecret: string;
    propertyId: string;
    measurementId?: string;
  };

  if (!clientId?.trim() || !clientSecret?.trim() || !propertyId?.trim()) {
    res.status(400).json({ error: "clientId, clientSecret, and propertyId are required" });
    return;
  }

  try {
    const state = crypto.randomBytes(24).toString("hex");
    const redirectUri = buildCallbackUri(req);

    await Promise.all([
      upsertSetting("ga4_client_id", clientId.trim(), "GA4 OAuth Client ID"),
      upsertSetting("ga4_client_secret", clientSecret.trim(), "GA4 OAuth Client Secret"),
      upsertSetting("ga4_property_id", propertyId.trim(), "GA4 Property ID"),
      upsertSetting("ga4_oauth_state", state),
      upsertSetting("ga4_oauth_redirect_uri", redirectUri),
      measurementId?.trim()
        ? upsertSetting("ga4_measurement_id", measurementId.trim(), "GA4 Measurement ID")
        : Promise.resolve(),
    ]);

    const oauth2Client = new google.auth.OAuth2(clientId.trim(), clientSecret.trim(), redirectUri);
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: GA4_SCOPE,
      state,
      prompt: "consent",
    });

    res.json({ ok: true, authUrl });
  } catch (e) {
    console.error("GA4 oauth/start error:", e);
    res.status(500).json({ error: "Failed to initiate GA4 OAuth flow" });
  }
});

router.get("/admin/ga4/oauth/callback", async (req, res) => {
  const { code, state, error: oauthError } = req.query as Record<string, string>;
  const frontendBase = buildFrontendBase(req);
  const failRedirect = `${frontendBase}/portal/admin?section=ga4-setup&ga4=error`;

  if (oauthError || !code || !state) {
    res.redirect(`${failRedirect}&reason=${encodeURIComponent(oauthError ?? "missing_code")}`);
    return;
  }

  try {
    const settings = await getDbSettings();

    if (!settings.ga4_oauth_state || settings.ga4_oauth_state !== state) {
      res.redirect(`${failRedirect}&reason=invalid_state`);
      return;
    }

    const { ga4_client_id, ga4_client_secret, ga4_oauth_redirect_uri } = settings;
    if (!ga4_client_id || !ga4_client_secret) {
      res.redirect(`${failRedirect}&reason=missing_credentials`);
      return;
    }

    const redirectUri = ga4_oauth_redirect_uri || buildCallbackUri(req);
    const oauth2Client = new google.auth.OAuth2(ga4_client_id, ga4_client_secret, redirectUri);
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      res.redirect(`${failRedirect}&reason=no_refresh_token&hint=revoke_and_retry`);
      return;
    }

    await Promise.all([
      upsertSetting("ga4_refresh_token", tokens.refresh_token, "GA4 OAuth Refresh Token"),
      upsertSetting("ga4_oauth_state", null),
      upsertSetting("ga4_oauth_redirect_uri", null),
    ]);

    res.redirect(`${frontendBase}/portal/admin?section=ga4-setup&ga4=connected`);
  } catch (e) {
    console.error("GA4 OAuth callback error:", e);
    res.redirect(`${failRedirect}&reason=server_error`);
  }
});

router.delete("/admin/ga4/oauth", requireAuth(), requireAdminRole, async (_req, res) => {
  try {
    await Promise.all(
      [...GA4_DB_KEYS, "ga4_oauth_state", "ga4_oauth_redirect_uri"].map(key =>
        db.delete(siteSettings).where(eq(siteSettings.key, key)),
      ),
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to disconnect GA4" });
  }
});

export default router;

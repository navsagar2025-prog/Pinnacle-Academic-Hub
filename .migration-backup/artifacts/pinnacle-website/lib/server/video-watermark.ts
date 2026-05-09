// Video watermarking — overlay config + signed-stream-token helpers.
// Shares the same `watermark_settings` table as the PDF watermark
// (docType="video"), but uses a separate config shape because video has
// extra knobs (cycleSeconds, anchors) and a different default opacity range
// than print.
import { db } from "@workspace/db";
import { watermarkSettings } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";

export const VIDEO_DOC_TYPE = "video";

// 4–6 named anchor positions the overlay cycles through. The CSS positions
// are resolved client-side; only names are persisted.
export const VIDEO_ANCHORS = ["tl", "tr", "bl", "br", "center", "tm"] as const;
export type VideoAnchor = (typeof VIDEO_ANCHORS)[number];

export const ANCHOR_LABELS: Record<VideoAnchor, string> = {
  tl: "Top-left",
  tr: "Top-right",
  bl: "Bottom-left",
  br: "Bottom-right",
  center: "Center",
  tm: "Top-middle",
};

export interface VideoWatermarkConfig {
  enabled: boolean;
  textTemplate: string;
  opacity: number; // 5..60 typical
  fontSize: number; // px
  color: string; // hex
  cycleSeconds: number; // 3..30
  anchors: VideoAnchor[];
}

export const DEFAULT_VIDEO_CONFIG: VideoWatermarkConfig = {
  enabled: true,
  textTemplate: "Pinnacle • {{userName}} • {{userPhone}}",
  opacity: 35,
  fontSize: 18,
  color: "#ffffff",
  cycleSeconds: 8,
  anchors: ["tl", "tr", "bl", "br", "center"],
};

// We persist the video-only knobs (cycleSeconds, anchors) inside the
// `text_template` field as a JSON suffix — the watermark_settings schema
// has no `extra` column and we don't want to break the PDF migration just
// for two scalars. Format: "<template>\n#video:{json}".
const VIDEO_META_PREFIX = "#video:";

function packTemplate(textTemplate: string, meta: { cycleSeconds: number; anchors: VideoAnchor[] }): string {
  const stripped = textTemplate.split(/\n#video:/)[0];
  return `${stripped}\n${VIDEO_META_PREFIX}${JSON.stringify(meta)}`;
}

function unpackTemplate(stored: string): {
  text: string;
  cycleSeconds?: number;
  anchors?: VideoAnchor[];
} {
  const idx = stored.indexOf(`\n${VIDEO_META_PREFIX}`);
  if (idx === -1) return { text: stored };
  const text = stored.slice(0, idx);
  const tail = stored.slice(idx + 1 + VIDEO_META_PREFIX.length);
  try {
    const meta = JSON.parse(tail) as { cycleSeconds?: number; anchors?: VideoAnchor[] };
    const anchors = Array.isArray(meta.anchors)
      ? meta.anchors.filter((a): a is VideoAnchor => (VIDEO_ANCHORS as readonly string[]).includes(a))
      : undefined;
    return {
      text,
      cycleSeconds: typeof meta.cycleSeconds === "number" ? meta.cycleSeconds : undefined,
      anchors: anchors && anchors.length > 0 ? anchors : undefined,
    };
  } catch {
    return { text };
  }
}

export async function getVideoWatermarkConfig(): Promise<VideoWatermarkConfig> {
  const [row] = await db
    .select()
    .from(watermarkSettings)
    .where(eq(watermarkSettings.docType, VIDEO_DOC_TYPE))
    .limit(1);
  if (!row) return DEFAULT_VIDEO_CONFIG;
  const { text, cycleSeconds, anchors } = unpackTemplate(row.textTemplate);
  return {
    enabled: row.enabled,
    textTemplate: text || DEFAULT_VIDEO_CONFIG.textTemplate,
    opacity: row.opacity ?? DEFAULT_VIDEO_CONFIG.opacity,
    fontSize: row.fontSize ?? DEFAULT_VIDEO_CONFIG.fontSize,
    color: row.color ?? DEFAULT_VIDEO_CONFIG.color,
    cycleSeconds: cycleSeconds ?? DEFAULT_VIDEO_CONFIG.cycleSeconds,
    anchors: anchors ?? DEFAULT_VIDEO_CONFIG.anchors,
  };
}

export async function upsertVideoWatermarkConfig(patch: Partial<VideoWatermarkConfig>, updatedBy: string) {
  const existing = await getVideoWatermarkConfig();
  const next: VideoWatermarkConfig = { ...existing, ...patch };
  next.opacity = Math.max(0, Math.min(100, Math.round(next.opacity)));
  next.fontSize = Math.max(8, Math.min(120, Math.round(next.fontSize)));
  next.cycleSeconds = Math.max(3, Math.min(60, Math.round(next.cycleSeconds)));
  if (next.anchors.length === 0) next.anchors = DEFAULT_VIDEO_CONFIG.anchors;

  const packedTemplate = packTemplate(next.textTemplate, {
    cycleSeconds: next.cycleSeconds,
    anchors: next.anchors,
  });

  const values = {
    docType: VIDEO_DOC_TYPE,
    enabled: next.enabled,
    textTemplate: packedTemplate,
    position: "tile",
    opacity: next.opacity,
    rotation: 0,
    fontSize: next.fontSize,
    color: next.color,
    logoObjectPath: null as string | null,
    useGlobal: false,
    updatedBy,
    updatedAt: new Date(),
  };

  const [existingRow] = await db
    .select()
    .from(watermarkSettings)
    .where(eq(watermarkSettings.docType, VIDEO_DOC_TYPE))
    .limit(1);
  if (existingRow) {
    await db.update(watermarkSettings).set(values).where(eq(watermarkSettings.docType, VIDEO_DOC_TYPE));
  } else {
    await db.insert(watermarkSettings).values(values);
  }
  return next;
}

// --------------------------------------------------------------------------
// Template expansion (server-side only)
// --------------------------------------------------------------------------
export interface VideoWatermarkContext {
  userName: string;
  userPhone: string;
  userEmail?: string;
  date?: string;
}

const TPL_RX = /\{\{\s*([a-zA-Z_]+)\s*\}\}/g;

export function expandVideoTemplate(template: string, ctx: VideoWatermarkContext): string {
  return template.replace(TPL_RX, (_m, key: string) => {
    switch (key) {
      case "userName":
        return ctx.userName ?? "";
      case "userPhone":
        return ctx.userPhone ?? "";
      case "userEmail":
        return ctx.userEmail ?? "";
      case "date":
        return ctx.date ?? new Date().toLocaleDateString("en-IN");
      default:
        return "";
    }
  });
}

// --------------------------------------------------------------------------
// Stream token helpers — opaque random tokens stored in DB. Single-use via
// `consumedAt`, expires in TOKEN_TTL_SECONDS, IP-bound when possible.
// --------------------------------------------------------------------------
export const TOKEN_TTL_SECONDS = 5 * 60;

export function generateStreamToken(): string {
  return randomBytes(24).toString("base64url");
}

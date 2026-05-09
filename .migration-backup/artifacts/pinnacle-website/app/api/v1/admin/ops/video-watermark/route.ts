import { NextRequest } from "next/server";
import { getRealAdminUser } from "@/lib/server/portal-auth";
import { ok, err } from "@/lib/server/api-response";
import { logAudit } from "@/lib/server/audit";
import {
  ANCHOR_LABELS,
  DEFAULT_VIDEO_CONFIG,
  VIDEO_ANCHORS,
  getVideoWatermarkConfig,
  upsertVideoWatermarkConfig,
  type VideoAnchor,
} from "@/lib/server/video-watermark";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await getRealAdminUser();
  if (!actor || actor.role !== "admin") return err("Forbidden", 403);
  const cfg = await getVideoWatermarkConfig();
  return ok({
    config: cfg,
    defaults: DEFAULT_VIDEO_CONFIG,
    anchors: VIDEO_ANCHORS.map((a) => ({ key: a, label: ANCHOR_LABELS[a] })),
  });
}

export async function PUT(req: NextRequest) {
  const actor = await getRealAdminUser();
  if (!actor || actor.role !== "admin") return err("Forbidden", 403);
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON", 400);
  }
  const patch: Parameters<typeof upsertVideoWatermarkConfig>[0] = {};
  if (typeof body.enabled === "boolean") patch.enabled = body.enabled;
  if (typeof body.textTemplate === "string") {
    if (body.textTemplate.length > 500) return err("textTemplate too long", 400);
    patch.textTemplate = body.textTemplate;
  }
  if (typeof body.opacity === "number") patch.opacity = body.opacity;
  if (typeof body.fontSize === "number") patch.fontSize = body.fontSize;
  if (typeof body.color === "string") {
    if (!/^#?[0-9a-fA-F]{6}$/.test(body.color)) return err("color must be hex like #ffffff", 400);
    patch.color = body.color.startsWith("#") ? body.color : `#${body.color}`;
  }
  if (typeof body.cycleSeconds === "number") patch.cycleSeconds = body.cycleSeconds;
  if (Array.isArray(body.anchors)) {
    const filtered = body.anchors.filter((a): a is VideoAnchor =>
      typeof a === "string" && (VIDEO_ANCHORS as readonly string[]).includes(a),
    );
    if (filtered.length === 0) return err("At least one anchor required", 400);
    patch.anchors = filtered;
  }
  const next = await upsertVideoWatermarkConfig(patch, actor.id);
  await logAudit(actor.id, actor.name, "ops.video_watermark.update", "watermark_settings", "video", {
    enabled: next.enabled,
    opacity: next.opacity,
    cycleSeconds: next.cycleSeconds,
    anchors: next.anchors,
  });
  return ok({ config: next });
}

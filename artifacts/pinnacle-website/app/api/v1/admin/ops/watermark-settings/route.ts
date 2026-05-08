import { NextRequest } from "next/server";
import { getRealAdminUser } from "@/lib/server/portal-auth";
import { ok, err } from "@/lib/server/api-response";
import { logAudit } from "@/lib/server/audit";
import {
  ALL_PLACEHOLDERS,
  PLACEHOLDER_DESCRIPTIONS,
  WATERMARK_DOC_TYPES,
  WATERMARK_DOC_TYPE_LABELS,
  getAllWatermarkSettings,
  isAllowedLogoPath,
  upsertWatermarkSetting,
  type WatermarkScopeKey,
} from "@/lib/server/watermark";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_POSITIONS = ["tile", "center", "footer"] as const;

function isScopeKey(s: string): s is WatermarkScopeKey {
  return s === "global" || (WATERMARK_DOC_TYPES as readonly string[]).includes(s);
}

export async function GET() {
  const actor = await getRealAdminUser();
  if (!actor || actor.role !== "admin") return err("Forbidden", 403);

  const { global, overrides } = await getAllWatermarkSettings();
  return ok({
    global,
    overrides,
    docTypes: WATERMARK_DOC_TYPES.map((k) => ({ key: k, label: WATERMARK_DOC_TYPE_LABELS[k] })),
    placeholders: ALL_PLACEHOLDERS.map((k) => ({ key: k, description: PLACEHOLDER_DESCRIPTIONS[k] })),
  });
}

export async function PUT(req: NextRequest) {
  const actor = await getRealAdminUser();
  if (!actor || actor.role !== "admin") return err("Forbidden", 403);

  let body: {
    docType?: string;
    enabled?: boolean;
    textTemplate?: string;
    position?: string;
    opacity?: number;
    rotation?: number;
    fontSize?: number;
    color?: string;
    logoObjectPath?: string | null;
    useGlobal?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON", 400);
  }

  const docType = body.docType ?? "";
  if (!isScopeKey(docType)) return err("Invalid docType", 400);
  if (body.position !== undefined && !VALID_POSITIONS.includes(body.position as (typeof VALID_POSITIONS)[number])) {
    return err("Invalid position", 400);
  }
  if (body.opacity !== undefined && (body.opacity < 0 || body.opacity > 100)) return err("opacity must be 0-100", 400);
  if (body.rotation !== undefined && (body.rotation < -180 || body.rotation > 180)) return err("rotation must be -180..180", 400);
  if (body.fontSize !== undefined && (body.fontSize < 6 || body.fontSize > 200)) return err("fontSize must be 6-200", 400);
  if (body.textTemplate !== undefined && body.textTemplate.length > 500) return err("textTemplate too long", 400);
  if (body.color !== undefined && !/^#?[0-9a-fA-F]{6}$/.test(body.color)) return err("color must be hex like #888888", 400);
  if (
    body.logoObjectPath !== undefined &&
    body.logoObjectPath !== null &&
    body.logoObjectPath !== "" &&
    !isAllowedLogoPath(body.logoObjectPath)
  ) {
    return err("logoObjectPath must be a /objects/public/... path", 400);
  }

  const row = await upsertWatermarkSetting(
    docType,
    {
      enabled: body.enabled,
      textTemplate: body.textTemplate,
      position: body.position as "tile" | "center" | "footer" | undefined,
      opacity: body.opacity,
      rotation: body.rotation,
      fontSize: body.fontSize,
      color: body.color?.startsWith("#") ? body.color : body.color ? `#${body.color}` : undefined,
      logoObjectPath: body.logoObjectPath ?? undefined,
      useGlobal: body.useGlobal,
    },
    actor.id,
  );

  await logAudit(actor.id, actor.name, "ops.watermark.update", "watermark_settings", docType, {
    docType,
    enabled: row.enabled,
    position: row.position,
    opacity: row.opacity,
  });
  return ok({ row });
}

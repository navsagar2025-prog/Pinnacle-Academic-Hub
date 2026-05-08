/**
 * Renders a single-page sample PDF stamped with the supplied (draft) watermark
 * config. Used by the admin Watermark Settings page for the live preview pane.
 */
import { NextRequest } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getRealAdminUser } from "@/lib/server/portal-auth";
import { err } from "@/lib/server/api-response";
import { getContactSettings } from "@/lib/server/site-settings";
import {
  buildWatermarkContext,
  stampWithConfig,
  type WatermarkConfig,
} from "@/lib/server/watermark";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_POSITIONS = ["tile", "center", "footer"] as const;

async function buildSamplePdf(title: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  page.drawText(title, { x: 48, y: 780, font: bold, size: 24, color: rgb(0.05, 0.18, 0.35) });
  page.drawText("Sample document — preview only", {
    x: 48,
    y: 754,
    font: helv,
    size: 11,
    color: rgb(0.4, 0.45, 0.55),
  });
  for (let i = 0; i < 28; i++) {
    page.drawText(
      "The quick brown fox jumps over the lazy dog. 1234567890. Pinnacle Academic Classes preview.",
      { x: 48, y: 700 - i * 22, font: helv, size: 10, color: rgb(0.2, 0.25, 0.35) },
    );
  }
  return await pdf.save();
}

export async function POST(req: NextRequest) {
  const actor = await getRealAdminUser();
  if (!actor || actor.role !== "admin") return err("Forbidden", 403);

  let body: { config?: Partial<WatermarkConfig>; title?: string };
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON", 400);
  }
  const cfg: WatermarkConfig = {
    enabled: true,
    textTemplate: body.config?.textTemplate ?? "{{centreName}} • {{userName}} • {{date}}",
    position: VALID_POSITIONS.includes(body.config?.position as (typeof VALID_POSITIONS)[number])
      ? (body.config!.position as WatermarkConfig["position"])
      : "tile",
    opacity: clamp(body.config?.opacity ?? 12, 0, 100),
    rotation: clamp(body.config?.rotation ?? 45, 0, 90),
    fontSize: clamp(body.config?.fontSize ?? 36, 6, 200),
    color: /^#?[0-9a-fA-F]{6}$/.test(body.config?.color ?? "")
      ? (body.config!.color!.startsWith("#") ? body.config!.color! : `#${body.config!.color!}`)
      : "#888888",
    logoObjectPath: body.config?.logoObjectPath ?? null,
  };

  const contact = await getContactSettings();
  const ctx = buildWatermarkContext({
    userName: actor.name,
    userPhone: actor.phone,
    userEmail: actor.email,
    ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1",
    centreName: "Pinnacle Academic Classes",
    centreEmail: contact.contact_email,
  } as Parameters<typeof buildWatermarkContext>[0]);

  const sample = await buildSamplePdf(body.title ?? "Watermark Preview");
  const { bytes } = await stampWithConfig(sample, ctx, cfg);

  return new Response(bytes as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "no-store",
      "Content-Disposition": "inline; filename=\"watermark-preview.pdf\"",
    },
  });
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

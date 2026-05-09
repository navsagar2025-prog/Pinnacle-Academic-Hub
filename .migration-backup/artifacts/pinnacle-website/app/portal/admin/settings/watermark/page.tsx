import { requirePortalRole } from "@/lib/server/portal-auth";
import {
  ALL_PLACEHOLDERS,
  PLACEHOLDER_DESCRIPTIONS,
  WATERMARK_DOC_TYPES,
  WATERMARK_DOC_TYPE_LABELS,
  getAllWatermarkSettings,
} from "@/lib/server/watermark";
import { getVideoWatermarkConfig } from "@/lib/server/video-watermark";
import { Stamp } from "lucide-react";
import { WatermarkSettingsForm } from "./WatermarkSettingsForm";
import { VideoWatermarkSection } from "./VideoWatermarkSection";

export const dynamic = "force-dynamic";
export const metadata = { title: "Watermark — Admin Settings" };

export default async function WatermarkSettingsPage() {
  const admin = await requirePortalRole("admin");
  const [{ global, overrides }, videoCfg] = await Promise.all([
    getAllWatermarkSettings(),
    getVideoWatermarkConfig(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[var(--color-navy)]/10 rounded-xl flex items-center justify-center">
          <Stamp size={20} className="text-[var(--color-navy)]" />
        </div>
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">
            PDF Watermark
          </h1>
          <p className="text-slate-500 text-sm">
            Stamp every downloaded PDF (receipts, materials, assignments, exports) with the
            configured text and optional logo. Per-document-type overrides are applied on top
            of the global defaults.
          </p>
        </div>
      </div>

      <WatermarkSettingsForm
        initialGlobal={global}
        initialOverrides={overrides}
        docTypes={WATERMARK_DOC_TYPES.map((k) => ({ key: k, label: WATERMARK_DOC_TYPE_LABELS[k] }))}
        placeholders={ALL_PLACEHOLDERS.map((k) => ({ key: k, description: PLACEHOLDER_DESCRIPTIONS[k] }))}
      />

      <VideoWatermarkSection
        initialConfig={videoCfg}
        previewName={admin.name ?? "Student"}
        previewPhone={admin.phone ?? "+91 9XXXX XXXXX"}
      />
    </div>
  );
}

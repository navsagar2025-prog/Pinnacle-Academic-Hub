import { requirePortalRole } from "@/lib/server/portal-auth";
import { getAllFeatureModels, AI_FEATURE_KEYS, AI_FEATURE_LABELS, isProviderConfigured } from "@/lib/server/ai-models";
import { AiProvidersForm } from "./AiProvidersForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "AI Providers — Operations" };

const PROVIDERS = ["openai", "gemini", "anthropic", "openrouter"] as const;

export default async function AiProvidersPage() {
  await requirePortalRole("admin");
  const settings = await getAllFeatureModels();
  const features = AI_FEATURE_KEYS.map((k) => ({
    key: k,
    label: AI_FEATURE_LABELS[k],
    provider: settings[k].provider,
    model: settings[k].model,
  }));
  const providers = PROVIDERS.map((p) => ({ key: p, configured: isProviderConfigured(p) }));
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">AI Providers</h1>
        <p className="text-slate-500 text-sm">
          Pick which provider and model handles each AI feature. Changes take effect on the next request.
        </p>
      </div>
      <AiProvidersForm initialFeatures={features} providers={providers} />
    </div>
  );
}

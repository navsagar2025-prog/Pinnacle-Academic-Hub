import { getRealAdminUser } from "@/lib/server/portal-auth";
import { ok, err } from "@/lib/server/api-response";
import {
  AI_FEATURE_KEYS,
  AI_FEATURE_LABELS,
  type AiFeatureKey,
  type AiProvider,
  getAllFeatureModels,
  setModelForFeature,
  isProviderConfigured,
} from "@/lib/server/ai-models";
import { logAudit } from "@/lib/server/audit";

export const runtime = "nodejs";

const VALID_PROVIDERS: AiProvider[] = ["openai", "gemini", "anthropic", "openrouter"];

export async function GET() {
  const actor = await getRealAdminUser();
  if (!actor) return err("Unauthorized", 401);
  if (actor.role !== "admin") return err("Forbidden", 403);

  const settings = await getAllFeatureModels();
  return ok({
    features: AI_FEATURE_KEYS.map((k) => ({
      key: k,
      label: AI_FEATURE_LABELS[k],
      provider: settings[k].provider,
      model: settings[k].model,
    })),
    providers: VALID_PROVIDERS.map((p) => ({
      key: p,
      configured: isProviderConfigured(p),
    })),
  });
}

export async function PUT(request: Request) {
  const actor = await getRealAdminUser();
  if (!actor) return err("Unauthorized", 401);
  if (actor.role !== "admin") return err("Forbidden", 403);

  let body: { featureKey?: string; provider?: string; model?: string };
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON body", 400);
  }

  const featureKey = body.featureKey as AiFeatureKey;
  const provider = body.provider as AiProvider;
  const model = (body.model ?? "").trim();

  if (!AI_FEATURE_KEYS.includes(featureKey)) return err("Invalid featureKey", 400);
  if (!VALID_PROVIDERS.includes(provider)) return err("Invalid provider", 400);
  if (!model) return err("Model is required", 400);
  if (model.length > 200) return err("Model name too long", 400);

  await setModelForFeature(featureKey, provider, model, actor.id);
  await logAudit(actor.id, actor.name, "ops.ai_model.update", "ai_feature_model", featureKey, {
    provider,
    model,
  });
  return ok({ featureKey, provider, model });
}

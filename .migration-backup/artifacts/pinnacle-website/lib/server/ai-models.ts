/**
 * AI feature -> (provider, model) resolver.
 *
 * The Operations Console "AI Providers" tab lets an admin pick which
 * provider+model handles each AI feature. Settings live in the
 * `ai_feature_models` table. Route handlers read this table at request time
 * via `getModelForFeature()`; an in-process cache keeps the lookup cheap and
 * is invalidated on every PUT.
 *
 * If no row exists for a feature, the hard-coded default below is used so
 * existing behaviour is preserved on a fresh install.
 */
import { db } from "@workspace/db";
import { aiFeatureModels } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

export type AiFeatureKey =
  | "ai_assistant"
  | "question_generation"
  | "solution_writer"
  | "classifier";

export type AiProvider = "openai" | "gemini" | "anthropic" | "openrouter";

export interface FeatureModel {
  provider: AiProvider;
  model: string;
}

export const AI_FEATURE_KEYS: AiFeatureKey[] = [
  "ai_assistant",
  "question_generation",
  "solution_writer",
  "classifier",
];

export const AI_FEATURE_LABELS: Record<AiFeatureKey, string> = {
  ai_assistant: "Admin / Teacher AI Assistant (chat, streaming)",
  question_generation: "AI Question Generator (question bank)",
  solution_writer: "AI Solution Writer (per question explanation)",
  classifier: "Topic / difficulty classifier",
};

const DEFAULTS: Record<AiFeatureKey, FeatureModel> = {
  ai_assistant: { provider: "openai", model: "gpt-4o-mini" },
  question_generation: { provider: "openai", model: "gpt-4o" },
  solution_writer: { provider: "openai", model: "gpt-4o-mini" },
  classifier: { provider: "openai", model: "gpt-4o-mini" },
};

const cache = new Map<AiFeatureKey, FeatureModel>();
let cacheLoaded = false;

async function loadCache() {
  const rows = await db.select().from(aiFeatureModels);
  cache.clear();
  for (const r of rows) {
    cache.set(r.featureKey as AiFeatureKey, { provider: r.provider as AiProvider, model: r.model });
  }
  cacheLoaded = true;
}

export function invalidateModelCache() {
  cacheLoaded = false;
  cache.clear();
}

export async function getModelForFeature(featureKey: AiFeatureKey): Promise<FeatureModel> {
  if (!cacheLoaded) await loadCache();
  return cache.get(featureKey) ?? DEFAULTS[featureKey];
}

export async function getAllFeatureModels(): Promise<Record<AiFeatureKey, FeatureModel>> {
  if (!cacheLoaded) await loadCache();
  const out: Record<AiFeatureKey, FeatureModel> = { ...DEFAULTS };
  for (const k of AI_FEATURE_KEYS) {
    const row = cache.get(k);
    if (row) out[k] = row;
  }
  return out;
}

export async function setModelForFeature(
  featureKey: AiFeatureKey,
  provider: AiProvider,
  model: string,
  updatedBy: string,
) {
  // Upsert and invalidate. Cheap because the table has at most ~feature-keys rows.
  await db
    .insert(aiFeatureModels)
    .values({ featureKey, provider, model, updatedBy, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: aiFeatureModels.featureKey,
      set: { provider, model, updatedBy, updatedAt: new Date() },
    });
  invalidateModelCache();
}

export function isProviderConfigured(provider: AiProvider): boolean {
  switch (provider) {
    case "openai":
      return !!process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
    case "gemini":
      return !!process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
    case "anthropic":
      return !!process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
    case "openrouter":
      return !!process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY;
  }
}

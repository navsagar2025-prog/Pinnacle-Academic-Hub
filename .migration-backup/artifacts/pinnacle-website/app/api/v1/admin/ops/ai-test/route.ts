import { getRealAdminUser } from "@/lib/server/portal-auth";
import { ok, err } from "@/lib/server/api-response";
import { logAudit } from "@/lib/server/audit";
import {
  getModelForFeature,
  isProviderConfigured,
  type AiProvider,
  type AiFeatureKey,
} from "@/lib/server/ai-models";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 30;

const TEST_PROMPT = "Reply with the single word: OK";

async function probeOpenAILike(provider: "openai" | "openrouter", model: string) {
  const baseURL =
    provider === "openai"
      ? process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
      : process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL;
  const apiKey =
    provider === "openai"
      ? process.env.AI_INTEGRATIONS_OPENAI_API_KEY
      : process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY;
  const client = new OpenAI({ baseURL, apiKey: apiKey ?? "dummy" });
  const r = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: TEST_PROMPT }],
    max_completion_tokens: 16,
  });
  return r.choices[0]?.message?.content ?? "";
}

async function probeGemini(model: string) {
  const client = new GoogleGenAI({
    apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY ?? "dummy",
    httpOptions: {
      apiVersion: "",
      baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
    },
  });
  const r = await client.models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: TEST_PROMPT }] }],
    config: { maxOutputTokens: 16 },
  });
  return r.text ?? "";
}

async function probeAnthropic(model: string) {
  const client = new Anthropic({
    baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
    apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY ?? "dummy",
  });
  const r = await client.messages.create({
    model,
    max_tokens: 16,
    messages: [{ role: "user", content: TEST_PROMPT }],
  });
  const block = r.content[0];
  return block && block.type === "text" ? block.text : "";
}

async function probe(provider: AiProvider, model: string): Promise<string> {
  if (provider === "openai" || provider === "openrouter") return probeOpenAILike(provider, model);
  if (provider === "gemini") return probeGemini(model);
  if (provider === "anthropic") return probeAnthropic(model);
  throw new Error(`Unknown provider: ${provider}`);
}

export async function POST(request: Request) {
  const actor = await getRealAdminUser();
  if (!actor) return err("Unauthorized", 401);
  if (actor.role !== "admin") return err("Forbidden", 403);

  let body: { provider?: AiProvider; model?: string; featureKey?: AiFeatureKey };
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON body", 400);
  }

  let provider: AiProvider | undefined = body.provider;
  let model: string | undefined = body.model;

  if (!provider || !model) {
    if (body.featureKey) {
      const fm = await getModelForFeature(body.featureKey);
      provider = provider ?? fm.provider;
      model = model ?? fm.model;
    } else {
      return err("provider+model or featureKey is required", 400);
    }
  }

  if (!isProviderConfigured(provider)) {
    await logAudit(actor.id, actor.name, "ops.ai_test", "ai_provider", provider, {
      ok: false,
      error: "Provider credentials not configured.",
      model,
    });
    return ok({
      provider,
      model,
      ok: false,
      latencyMs: 0,
      error: "Provider credentials not configured. Re-run AI Integration setup.",
    });
  }

  const t0 = Date.now();
  try {
    const reply = await probe(provider, model);
    const latencyMs = Date.now() - t0;
    await logAudit(actor.id, actor.name, "ops.ai_test", "ai_provider", provider, {
      ok: true,
      model,
      latencyMs,
      replyPreview: reply.slice(0, 80),
    });
    return ok({ provider, model, ok: true, latencyMs, reply: reply.slice(0, 200) });
  } catch (e) {
    const latencyMs = Date.now() - t0;
    const message = e instanceof Error ? e.message : "Unknown error";
    await logAudit(actor.id, actor.name, "ops.ai_test", "ai_provider", provider, {
      ok: false,
      model,
      latencyMs,
      error: message,
    });
    return ok({ provider, model, ok: false, latencyMs, error: message });
  }
}

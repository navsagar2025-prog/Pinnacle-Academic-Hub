import { getDbUser } from "@/lib/server/portal-auth";
import { buildPrompt, type AiTool, type AiContext } from "@/lib/ai/prompts";
import { getModelForFeature, type AiFeatureKey } from "@/lib/server/ai-models";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import { rateLimit, extractIp } from "@/lib/server/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

function openaiClient() {
  return new OpenAI({
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? "dummy",
  });
}

function geminiClient() {
  return new GoogleGenAI({
    apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY ?? "dummy",
    httpOptions: {
      apiVersion: "",
      baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
    },
  });
}

function anthropicClient() {
  return new Anthropic({
    baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
    apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY ?? "dummy",
  });
}

function openrouterClient() {
  return new OpenAI({
    baseURL: process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL,
    apiKey: process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY ?? "dummy",
  });
}

type Provider = "openai" | "gemini" | "anthropic" | "openrouter";

const PROVIDER_ENV_VARS: Record<Provider, string[]> = {
  openai: ["AI_INTEGRATIONS_OPENAI_BASE_URL", "AI_INTEGRATIONS_OPENAI_API_KEY"],
  gemini: ["AI_INTEGRATIONS_GEMINI_BASE_URL", "AI_INTEGRATIONS_GEMINI_API_KEY"],
  anthropic: ["AI_INTEGRATIONS_ANTHROPIC_BASE_URL", "AI_INTEGRATIONS_ANTHROPIC_API_KEY"],
  openrouter: ["AI_INTEGRATIONS_OPENROUTER_BASE_URL", "AI_INTEGRATIONS_OPENROUTER_API_KEY"],
};

function checkCredentials(provider: Provider): string | null {
  for (const key of PROVIDER_ENV_VARS[provider]) {
    if (!process.env[key]) {
      return `Missing environment variable: ${key}. Re-run the AI Integration setup for provider "${provider}".`;
    }
  }
  return null;
}

async function* generateTokens(
  provider: Provider,
  model: string,
  systemPrompt: string,
  userPrompt: string
): AsyncGenerator<string> {
  if (provider === "openai") {
    const client = openaiClient();
    const stream = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: true,
      max_completion_tokens: 8192,
    });
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) yield content;
    }
    return;
  }

  if (provider === "openrouter") {
    const client = openrouterClient();
    const stream = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: true,
      max_completion_tokens: 8192,
    });
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) yield content;
    }
    return;
  }

  if (provider === "gemini") {
    const client = geminiClient();
    const stream = await client.models.generateContentStream({
      model,
      contents: [
        { role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
      ],
      config: { maxOutputTokens: 8192 },
    });
    for await (const chunk of stream) {
      if (chunk.text) yield chunk.text;
    }
    return;
  }

  if (provider === "anthropic") {
    const client = anthropicClient();
    const stream = client.messages.stream({
      model,
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });
    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield event.delta.text;
      }
    }
    return;
  }

  throw new Error(`Unknown provider: ${provider}`);
}

export async function POST(request: Request) {
  const dbUser = await getDbUser();
  if (!dbUser) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  if (dbUser.role !== "admin" && dbUser.role !== "teacher") {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }

  // Rate-limit: 20 AI generation requests per user per hour (tunable via
  // site_settings "security_rate_limits" → "api.ai.generate"). AI calls are
  // expensive; this prevents run-away usage from a single account.
  const ip = extractIp(request);
  const ua = request.headers.get("user-agent");
  const { allowed } = await rateLimit(
    `user:${dbUser.id}`,
    "api.ai.generate",
    20,
    60 * 60_000,
    { ip, actorEmail: dbUser.email, userAgent: ua },
  );
  if (!allowed) {
    return new Response(
      JSON.stringify({ success: false, error: "AI generation rate limit exceeded. Please wait before trying again.", data: null }),
      { status: 429, headers: { "Content-Type": "application/json" } },
    );
  }

  let body: {
    provider?: Provider;
    model?: string;
    featureKey?: AiFeatureKey;
    tool: AiTool;
    context: AiContext;
  };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
  }

  const { tool, context } = body;
  if (!tool || !context) {
    return new Response(
      JSON.stringify({ error: "tool and context are required" }),
      { status: 400 }
    );
  }

  // Resolve provider+model. Precedence:
  //   1. Explicit body.provider + body.model (legacy/back-compat path)
  //   2. Admin-configured picker for body.featureKey
  //   3. Admin-configured picker for the inferred feature key (tool → key)
  let provider: Provider | undefined = body.provider;
  let model: string | undefined = body.model;
  if (!provider || !model) {
    const inferred: AiFeatureKey =
      body.featureKey ??
      (tool === "question_generator" ? "question_generation" : "ai_assistant");
    const fm = await getModelForFeature(inferred);
    provider = provider ?? fm.provider;
    model = model ?? fm.model;
  }

  const credError = checkCredentials(provider);
  if (credError) {
    return new Response(
      JSON.stringify({ success: false, error: credError, data: null }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  const { systemPrompt, userPrompt } = buildPrompt(tool, context);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const token of generateTokens(provider, model, systemPrompt, userPrompt)) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ content: token })}\n\n`)
          );
        }
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
        );
      } catch (err) {
        console.error("AI generate error:", err);
        const msg = err instanceof Error ? err.message : "AI generation failed";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

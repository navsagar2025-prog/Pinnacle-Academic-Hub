import { getRealAdminUser } from "@/lib/server/portal-auth";
import { getModelForFeature } from "@/lib/server/ai-models";
import { ok, err } from "@/lib/server/api-response";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 30;

type Provider = "openai" | "gemini" | "anthropic" | "openrouter";

const SYSTEM_PROMPT = `You are an SEO specialist for Pinnacle Academic Classes — a premier JEE, NEET, and Class 10-12 coaching institute in Greater Noida, India (Gaur City 2, Sec. 16C). You generate concise, keyword-rich metadata that helps the institute rank for competitive exam coaching searches in Greater Noida and NCR.

Return ONLY valid JSON with exactly three fields:
{
  "title": "string (50–60 chars ideally, include page-specific keyword + brand suffix)",
  "description": "string (140–165 chars, compelling, include location + course keywords)",
  "focusKeyword": "string (3–5 words, primary search intent for this page)"
}

No markdown, no explanation, no code fences. Raw JSON only.`;

function buildUserPrompt(route: string, label: string, existingTitle: string, existingDescription: string): string {
  return `Generate SEO metadata for the page: "${label}" (route: ${route})

Current title (may be suboptimal): ${existingTitle || "none"}
Current description (may be suboptimal): ${existingDescription || "none"}

Optimise for search intent. Include "Pinnacle Academic Classes" or "Pinnacle" in the title. Include "Greater Noida" in the description. Keep title 50-60 chars, description 140-165 chars.`;
}

async function callAi(
  provider: Provider,
  model: string,
  userPrompt: string
): Promise<string> {
  if (provider === "openai" || provider === "openrouter") {
    const client = new OpenAI({
      baseURL:
        provider === "openai"
          ? process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
          : process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL,
      apiKey:
        (provider === "openai"
          ? process.env.AI_INTEGRATIONS_OPENAI_API_KEY
          : process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY) ?? "dummy",
    });
    const res = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      max_completion_tokens: 512,
    });
    return res.choices[0]?.message?.content ?? "";
  }

  if (provider === "gemini") {
    const client = new GoogleGenAI({
      apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY ?? "dummy",
      httpOptions: {
        apiVersion: "",
        baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
      },
    });
    const res = await client.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [{ text: `${SYSTEM_PROMPT}\n\n${userPrompt}` }],
        },
      ],
      config: { maxOutputTokens: 512 },
    });
    return res.text ?? "";
  }

  if (provider === "anthropic") {
    const client = new Anthropic({
      baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
      apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY ?? "dummy",
    });
    const res = await client.messages.create({
      model,
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });
    const block = res.content[0];
    return block?.type === "text" ? block.text : "";
  }

  throw new Error(`Unknown provider: ${provider}`);
}

function parseJson(raw: string): { title: string; description: string; focusKeyword: string } | null {
  try {
    const cleaned = raw
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();
    const json = JSON.parse(cleaned);
    if (
      typeof json.title === "string" &&
      typeof json.description === "string" &&
      typeof json.focusKeyword === "string"
    ) {
      return {
        title: json.title.slice(0, 70),
        description: json.description.slice(0, 170),
        focusKeyword: json.focusKeyword.slice(0, 80),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const admin = await getRealAdminUser();
  if (!admin) return err("Unauthorized", 401);
  if (admin.role !== "admin") return err("Forbidden", 403);

  let body: {
    route?: string;
    label?: string;
    existingTitle?: string;
    existingDescription?: string;
  };
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON", 400);
  }

  const { route, label, existingTitle = "", existingDescription = "" } = body;
  if (!route || !label) return err("route and label are required", 400);

  const { provider, model } = await getModelForFeature("ai_assistant");

  const credKey =
    provider === "openai"
      ? "AI_INTEGRATIONS_OPENAI_API_KEY"
      : provider === "gemini"
      ? "AI_INTEGRATIONS_GEMINI_API_KEY"
      : provider === "anthropic"
      ? "AI_INTEGRATIONS_ANTHROPIC_API_KEY"
      : "AI_INTEGRATIONS_OPENROUTER_API_KEY";

  if (!process.env[credKey]) {
    return err(
      `AI provider "${provider}" is not configured. Set up an AI integration in admin settings first.`,
      503
    );
  }

  const userPrompt = buildUserPrompt(route, label, existingTitle, existingDescription);

  try {
    const raw = await callAi(provider as Provider, model, userPrompt);
    const parsed = parseJson(raw);
    if (!parsed) {
      return err("AI returned invalid JSON. Try again.", 502);
    }
    return ok(parsed);
  } catch (e) {
    console.error("[seo/ai-fill] AI call failed:", e);
    const msg = e instanceof Error ? e.message : "AI generation failed";
    return err(msg, 502);
  }
}

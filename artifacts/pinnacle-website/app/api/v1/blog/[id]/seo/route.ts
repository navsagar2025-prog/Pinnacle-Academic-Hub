/**
 * POST /api/v1/blog/[id]/seo
 *
 * Generate SEO metadata (title, meta description, focus keyword) for a blog
 * post using AI. Returns the generated values as JSON and persists them to the
 * blog_posts row.
 */
import { db } from "@workspace/db";
import { blogPosts } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { ok, err } from "@/lib/server/api-response";
import { getDbUser } from "@/lib/server/portal-auth";
import { getModelForFeature } from "@/lib/server/ai-models";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";
export const maxDuration = 60;

const INSTITUTE = "Pinnacle Academic Classes (JEE/NEET/Foundation coaching, Greater Noida)";

async function generateSeoJson(provider: string, model: string, title: string, category: string, content: string, excerpt: string): Promise<string> {
  const systemPrompt = `You are an SEO specialist for ${INSTITUTE}. Generate SEO metadata for blog posts targeting Indian students preparing for JEE/NEET. Output ONLY a valid JSON object — no markdown fences, no extra text.`;

  const userPrompt = `Generate SEO metadata for this blog post:

Title: ${title}
Category: ${category}
${excerpt ? `Excerpt: ${excerpt}\n` : ""}
Content (first 600 chars): ${(content ?? "").slice(0, 600)}

Return a JSON object with exactly these keys:
{
  "seoTitle": "55–65 char title optimised for Google; include primary keyword + institute name if it fits",
  "metaDescription": "140–160 char description that makes a student click — include keyword, benefit, urgency",
  "focusKeyword": "2–4 word primary keyword phrase (e.g. 'JEE mains preparation tips')"
}`;

  let fullText = "";

  if (provider === "openai" || provider === "openrouter") {
    const client = new OpenAI({
      baseURL: provider === "openrouter" ? process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL : process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      apiKey: provider === "openrouter" ? (process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY ?? "dummy") : (process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? "dummy"),
    });
    const res = await client.chat.completions.create({
      model, max_completion_tokens: 512,
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
    });
    fullText = res.choices[0]?.message?.content ?? "{}";
  } else if (provider === "anthropic") {
    const client = new Anthropic({ baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL, apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY ?? "dummy" });
    const res = await client.messages.create({ model, max_tokens: 512, system: systemPrompt, messages: [{ role: "user", content: userPrompt }] });
    fullText = res.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("");
  } else if (provider === "gemini") {
    const client = new GoogleGenAI({ apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY ?? "dummy", httpOptions: { apiVersion: "", baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL } });
    const res = await client.models.generateContent({ model, config: { maxOutputTokens: 512 }, contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }] });
    fullText = res.text ?? "{}";
  }

  return fullText;
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getDbUser();
  if (!actor) return err("Unauthorized", 401);
  if (actor.role !== "admin" && actor.role !== "teacher") return err("Forbidden", 403);

  const { id } = await params;
  const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
  if (!post) return err("Blog post not found", 404);

  const fm = await getModelForFeature("ai_assistant");

  try {
    const rawJson = await generateSeoJson(fm.provider, fm.model, post.title, post.category, post.content ?? "", post.excerpt ?? "");

    const jsonStr = rawJson.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const seo = JSON.parse(jsonStr) as { seoTitle?: string; metaDescription?: string; focusKeyword?: string };

    const { seoTitle = "", metaDescription = "", focusKeyword = "" } = seo;

    await db.update(blogPosts).set({ seoTitle, metaDescription, focusKeyword, updatedAt: new Date() }).where(eq(blogPosts.id, id));

    return ok({ seoTitle, metaDescription, focusKeyword });
  } catch (e) {
    console.error("[blog seo] AI call failed:", e);
    return err("AI SEO generation failed — check provider credentials", 500);
  }
}

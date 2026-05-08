/**
 * POST /api/v1/admin/ops/blog-enhance
 *
 * Batch-enhance up to 10 draft blog posts that have never been AI-enhanced
 * (aiEnhancedAt IS NULL). Processes them sequentially to avoid hammering the
 * AI API. Returns a summary of what was processed.
 *
 * Designed to be called by the admin "Enhance All Drafts" button and can also
 * be invoked by a cron endpoint.
 */
import { db } from "@workspace/db";
import { blogPosts } from "@workspace/db/schema";
import { eq, isNull, and } from "drizzle-orm";
import { ok, err } from "@/lib/server/api-response";
import { getDbUser } from "@/lib/server/portal-auth";
import { getModelForFeature } from "@/lib/server/ai-models";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";
export const maxDuration = 120;

const INSTITUTE = "Pinnacle Academic Classes (JEE/NEET/Foundation coaching, Greater Noida)";

function estimateReadMinutes(text: string): number {
  return Math.max(1, Math.round(text.trim().split(/\s+/).length / 200));
}

async function enhanceOne(provider: string, model: string, title: string, category: string, content: string, excerpt: string): Promise<string> {
  const systemPrompt = `You are an expert academic content writer for ${INSTITUTE}. Enhance blog posts by improving clarity, structure, and depth while preserving factual content. Use markdown (## headings, bullet lists, **bold**). Write for JEE/NEET aspirants. End with a "Key Takeaways" section.`;

  const userPrompt = `Enhance this blog post:

Title: ${title}
Category: ${category}
${excerpt ? `Current excerpt: ${excerpt}\n` : ""}
Content: ${content || "(No content — write a complete 600–1000 word article from the title.)"}

Return ONLY the enhanced body (no title, no frontmatter). Use markdown formatting.`;

  if (provider === "openai" || provider === "openrouter") {
    const client = new OpenAI({
      baseURL: provider === "openrouter" ? process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL : process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      apiKey: provider === "openrouter" ? (process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY ?? "dummy") : (process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? "dummy"),
    });
    const res = await client.chat.completions.create({ model, max_completion_tokens: 3000, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }] });
    return res.choices[0]?.message?.content ?? "";
  }

  if (provider === "anthropic") {
    const client = new Anthropic({ baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL, apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY ?? "dummy" });
    const res = await client.messages.create({ model, max_tokens: 3000, system: systemPrompt, messages: [{ role: "user", content: userPrompt }] });
    return res.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("");
  }

  if (provider === "gemini") {
    const client = new GoogleGenAI({ apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY ?? "dummy", httpOptions: { apiVersion: "", baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL } });
    const res = await client.models.generateContent({ model, config: { maxOutputTokens: 3000 }, contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }] });
    return res.text ?? "";
  }

  throw new Error(`Unknown provider: ${provider}`);
}

export async function POST(_req: Request) {
  const actor = await getDbUser();
  if (!actor) return err("Unauthorized", 401);
  if (actor.role !== "admin") return err("Forbidden — admin only", 403);

  const pending = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.status, "draft"), isNull(blogPosts.aiEnhancedAt)))
    .limit(10);

  if (pending.length === 0) {
    return ok({ processed: 0, message: "No draft posts without AI enhancement found." });
  }

  const fm = await getModelForFeature("ai_assistant");
  const results: { id: string; title: string; ok: boolean; error?: string }[] = [];

  for (const post of pending) {
    try {
      const enhanced = await enhanceOne(fm.provider, fm.model, post.title, post.category, post.content ?? "", post.excerpt ?? "");
      if (!enhanced) { results.push({ id: post.id, title: post.title, ok: false, error: "Empty response from AI" }); continue; }

      const readMinutes = estimateReadMinutes(enhanced);
      const newExcerpt = enhanced.replace(/#{1,6} .+\n?/g, "").replace(/\*\*/g, "").split(/\n+/).find((l) => l.trim().length > 40)?.trim()?.slice(0, 200) ?? post.excerpt;

      await db.update(blogPosts).set({ content: enhanced, excerpt: newExcerpt ?? post.excerpt, readMinutes, aiEnhancedAt: new Date(), updatedAt: new Date() }).where(eq(blogPosts.id, post.id));

      results.push({ id: post.id, title: post.title, ok: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      results.push({ id: post.id, title: post.title, ok: false, error: msg });
    }
  }

  const succeeded = results.filter((r) => r.ok).length;
  return ok({ processed: results.length, succeeded, failed: results.length - succeeded, results });
}

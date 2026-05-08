/**
 * POST /api/v1/blog/[id]/enhance
 *
 * AI-enhance a blog post's content and excerpt. Streams enhanced text back as
 * SSE so the editor can show live progress. On completion, persists the result
 * to the blog_posts row (content, excerpt, readMinutes, aiEnhancedAt).
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
export const maxDuration = 120;

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";
const INSTITUTE = "Pinnacle Academic Classes (JEE/NEET/Foundation coaching institute in Greater Noida).";

function estimateReadMinutes(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

async function* streamEnhanced(provider: string, model: string, title: string, category: string, content: string, excerpt: string): AsyncGenerator<string> {
  const systemPrompt = `You are an expert academic content writer for ${INSTITUTE}. Your task is to enhance blog posts written by faculty members. Preserve the author's factual claims and core ideas while improving clarity, structure, engagement, and depth. Write in a professional yet student-friendly tone suitable for JEE/NEET aspirants. Use markdown formatting (## headings, **bold**, bullet lists).`;

  const userPrompt = `Please enhance the following blog post for Pinnacle Academic Classes.

Title: ${title}
Category: ${category}
${excerpt ? `Current excerpt: ${excerpt}\n` : ""}
Current content:
${content || "(No content yet — write a complete, high-quality article from the title and category.)"}

Instructions:
1. Return ONLY the enhanced article body (no title, no frontmatter).
2. Structure with ## subheadings, bullet lists, and bold key terms.
3. Keep all correct factual information from the original.
4. Aim for 600–1200 words — thorough but readable.
5. End with a motivating "Key Takeaways" section.`;

  if (provider === "openai" || provider === "openrouter") {
    const client = new OpenAI({
      baseURL: provider === "openrouter"
        ? process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL
        : process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      apiKey: provider === "openrouter"
        ? (process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY ?? "dummy")
        : (process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? "dummy"),
    });
    const stream = await client.chat.completions.create({
      model, stream: true, max_completion_tokens: 4096,
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
    });
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) yield text;
    }
    return;
  }

  if (provider === "anthropic") {
    const client = new Anthropic({ baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL, apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY ?? "dummy" });
    const stream = client.messages.stream({ model, max_tokens: 4096, system: systemPrompt, messages: [{ role: "user", content: userPrompt }] });
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") yield event.delta.text;
    }
    return;
  }

  if (provider === "gemini") {
    const client = new GoogleGenAI({ apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY ?? "dummy", httpOptions: { apiVersion: "", baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL } });
    const stream = await client.models.generateContentStream({ model, config: { maxOutputTokens: 4096 }, contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }] });
    for await (const chunk of stream) { if (chunk.text) yield chunk.text; }
    return;
  }

  throw new Error(`Unknown provider: ${provider}`);
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getDbUser();
  if (!actor) return err("Unauthorized", 401);
  if (actor.role !== "admin" && actor.role !== "teacher") return err("Forbidden", 403);

  const { id } = await params;
  const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
  if (!post) return err("Blog post not found", 404);

  const fm = await getModelForFeature("ai_assistant");

  const encoder = new TextEncoder();
  let fullContent = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const token of streamEnhanced(fm.provider, fm.model, post.title, post.category, post.content ?? "", post.excerpt ?? "")) {
          fullContent += token;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: token })}\n\n`));
        }

        const readMinutes = estimateReadMinutes(fullContent);

        const newExcerpt = fullContent
          .replace(/#{1,6} .+\n?/g, "")
          .replace(/\*\*/g, "")
          .split(/\n+/)
          .find((l) => l.trim().length > 40)
          ?.trim()
          ?.slice(0, 200) ?? post.excerpt;

        await db.update(blogPosts).set({
          content: fullContent,
          excerpt: newExcerpt ?? post.excerpt,
          readMinutes,
          aiEnhancedAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(blogPosts.id, id));

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, readMinutes, excerpt: newExcerpt })}\n\n`));
      } catch (err2) {
        console.error("[blog enhance]", err2);
        const msg = err2 instanceof Error ? err2.message : "AI enhancement failed";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}

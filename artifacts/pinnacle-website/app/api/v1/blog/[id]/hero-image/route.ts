/**
 * POST /api/v1/blog/[id]/hero-image
 *
 * Generate an on-brand hero image for a blog post using DALL-E 3 via the
 * Replit OpenAI integration proxy. Stores the generated URL in featuredImageUrl
 * and returns the updated post.
 *
 * Note: OpenAI image URLs expire after ~1 hour. Admins can re-upload via the
 * file upload widget to get a permanent object-storage URL.
 */
import { db } from "@workspace/db";
import { blogPosts } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { ok, err } from "@/lib/server/api-response";
import { getDbUser } from "@/lib/server/portal-auth";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 60;

function buildImagePrompt(title: string, category: string): string {
  const categoryDescriptions: Record<string, string> = {
    JEE: "competitive exam preparation, books, formulas, physics diagrams",
    NEET: "biology diagrams, medical textbooks, science laboratory",
    Chemistry: "chemical equations, molecular structures, laboratory glassware",
    Mathematics: "geometric diagrams, calculus graphs, equations on a chalkboard",
    Physics: "physics diagrams, light refraction, electromagnetic fields",
    Biology: "cell diagrams, human anatomy, nature microscopy",
    Strategy: "student studying, planning, focus, academic success",
    General: "student learning, books, education, academic excellence",
  };

  const catDesc = categoryDescriptions[category] ?? categoryDescriptions["General"];

  return `A professional, modern educational blog header image for an Indian JEE/NEET coaching institute. Topic: "${title}". Visual theme: ${catDesc}. Style: clean, flat illustration with a navy blue (#1a2e5a) and teal (#2a9d8f) color scheme, white background, no text or letters in the image, suitable for a professional academic website. High quality, 16:9 landscape format.`;
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getDbUser();
  if (!actor) return err("Unauthorized", 401);
  if (actor.role !== "admin" && actor.role !== "teacher") return err("Forbidden", 403);

  const { id } = await params;
  const [post] = await db.select({ id: blogPosts.id, title: blogPosts.title, category: blogPosts.category }).from(blogPosts).where(eq(blogPosts.id, id));
  if (!post) return err("Blog post not found", 404);

  const openaiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  const openaiBase = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  if (!openaiKey || !openaiBase) {
    return err("OpenAI integration not configured — set up the OpenAI AI integration first", 503);
  }

  try {
    const client = new OpenAI({ baseURL: openaiBase, apiKey: openaiKey });

    const imagePrompt = buildImagePrompt(post.title, post.category);

    const imageRes = await client.images.generate({
      model: "dall-e-3",
      prompt: imagePrompt,
      n: 1,
      size: "1792x1024",
      quality: "standard",
    });

    const imageUrl = imageRes.data?.[0]?.url;
    if (!imageUrl) return err("Image generation returned no URL", 500);

    const [updated] = await db.update(blogPosts).set({ featuredImageUrl: imageUrl, updatedAt: new Date() }).where(eq(blogPosts.id, id)).returning();

    return ok({ featuredImageUrl: imageUrl, post: updated });
  } catch (e) {
    console.error("[blog hero-image] error:", e);
    const msg = e instanceof Error ? e.message : "Image generation failed";
    return err(msg, 500);
  }
}

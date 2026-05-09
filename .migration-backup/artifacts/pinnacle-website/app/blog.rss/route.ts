/**
 * GET /blog.rss
 *
 * RSS 2.0 feed of the 20 most-recent published blog posts.
 * Served with Content-Type: application/rss+xml; charset=utf-8.
 */
import { db } from "@workspace/db";
import { blogPosts } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

export const runtime = "nodejs";
export const revalidate = 3600;

function esc(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://paconline.in";
  const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website").replace(/\/$/, "");

  const posts = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.status, "published"))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(20);

  const items = posts
    .map((p) => {
      const link = `${BASE_URL}${BASE_PATH}/blog/${p.slug}`;
      const pubDate = p.publishedAt ? new Date(p.publishedAt).toUTCString() : new Date(p.createdAt).toUTCString();
      const description = esc(p.metaDescription ?? p.excerpt ?? "");
      const category = esc(p.category);

      return `
    <item>
      <title>${esc(p.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${description}</description>
      <pubDate>${pubDate}</pubDate>
      <category>${category}</category>
      <author>faculty@paconline.in (${esc(p.authorName)})</author>
    </item>`.trim();
    })
    .join("\n    ");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Pinnacle Academic Classes — Study Tips &amp; Blog</title>
    <link>${BASE_URL}${BASE_PATH}/blog</link>
    <description>Expert study strategies, JEE &amp; NEET preparation tips, and academic guidance from the faculty at Pinnacle Academic Classes, Greater Noida.</description>
    <language>en-IN</language>
    <managingEditor>faculty@paconline.in (Pinnacle Faculty)</managingEditor>
    <webMaster>tech@paconline.in (Pinnacle Tech)</webMaster>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <ttl>60</ttl>
    <image>
      <url>${BASE_URL}${BASE_PATH}/opengraph.jpg</url>
      <title>Pinnacle Academic Classes</title>
      <link>${BASE_URL}${BASE_PATH}/blog</link>
    </image>
    <atom:link href="${BASE_URL}${BASE_PATH}/blog.rss" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=600",
    },
  });
}

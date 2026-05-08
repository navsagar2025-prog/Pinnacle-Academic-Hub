import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@workspace/db";
import { blogPosts } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import { Calendar, Clock, Tag } from "lucide-react";

const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website").replace(/\/$/, "");

const STATIC_ARTICLES = [
  {
    slug: "jee-mains-2026-preparation-strategy",
    title: "JEE Mains 2026: The Complete 90-Day Strategy",
    excerpt: "With JEE Mains just around the corner, here's a battle-tested plan covering revision priorities, mock test schedules, and the mindset shifts that separate rank-holders from the rest.",
    author: "Dr. Ramesh Kumar",
    date: "28 Apr 2026",
    readMinutes: 8,
    category: "JEE",
    content: null,
  },
  {
    slug: "organic-chemistry-named-reactions",
    title: "Master 40+ Named Reactions in Organic Chemistry",
    excerpt: "Named reactions form the backbone of JEE Advanced organic chemistry. This guide breaks them into logical families so you learn the pattern, not just memorise the steps.",
    author: "Ms. Priya Sharma",
    date: "22 Apr 2026",
    readMinutes: 12,
    category: "Chemistry",
    content: null,
  },
  {
    slug: "neet-biology-ncert-strategy",
    title: "Why NCERT Alone Isn't Enough for NEET Biology",
    excerpt: "Every NEET topper says 'read NCERT', but what they really mean is nuanced. Here's how to extract 100% of NEET marks from NCERT — and what extra resources to use.",
    author: "Dr. Sunita Patel",
    date: "15 Apr 2026",
    readMinutes: 7,
    category: "NEET",
    content: null,
  },
  {
    slug: "calculus-common-mistakes",
    title: "12 Calculus Mistakes Students Make in JEE (and How to Avoid Them)",
    excerpt: "Calculus accounts for 20-25% of JEE Mathematics. These are the 12 errors that cost students 20+ marks every attempt — illustrated with solutions.",
    author: "Mr. Ajay Tiwari",
    date: "10 Apr 2026",
    readMinutes: 10,
    category: "Mathematics",
    content: null,
  },
  {
    slug: "mock-test-analysis-guide",
    title: "How to Analyse a Mock Test (Most Students Do It Wrong)",
    excerpt: "Taking mock tests is easy. Extracting value from them is the skill. This step-by-step analysis framework will turn every test into a roadmap for your next 5 marks.",
    author: "Pinnacle Faculty",
    date: "5 Apr 2026",
    readMinutes: 6,
    category: "Strategy",
    content: null,
  },
  {
    slug: "study-schedule-for-droppers",
    title: "The Ideal Daily Schedule for a JEE/NEET Dropper",
    excerpt: "A dropper year demands structure and recovery in equal measure. Here's a practical 16-hour schedule designed around cognitive science — not just willpower.",
    author: "Pinnacle Faculty",
    date: "1 Apr 2026",
    readMinutes: 9,
    category: "Strategy",
    content: null,
  },
];

type Article = {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readMinutes: number;
  category: string;
  content: string | null;
  featuredImageUrl?: string | null;
  seoTitle?: string | null;
  metaDescription?: string | null;
};

async function getArticle(slug: string): Promise<Article | null> {
  const [row] = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug))
    .limit(1);

  if (row) {
    return {
      slug: row.slug,
      title: row.seoTitle ?? row.title,
      excerpt: row.excerpt ?? "",
      author: row.authorName,
      date: row.publishedAt
        ? new Date(row.publishedAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "",
      readMinutes: row.readMinutes ?? 5,
      category: row.category,
      content: row.content,
      featuredImageUrl: row.featuredImageUrl,
      seoTitle: row.seoTitle,
      metaDescription: row.metaDescription,
    };
  }

  const staticMatch = STATIC_ARTICLES.find((a) => a.slug === slug);
  if (staticMatch) return staticMatch;

  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "Article Not Found" };

  const title = article.seoTitle ?? article.title;
  const description = article.metaDescription ?? article.excerpt;
  const ogImageUrl = article.featuredImageUrl
    ? `/api/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&image=${encodeURIComponent(article.featuredImageUrl)}`
    : `/api/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}`;

  return {
    title,
    description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title,
      description,
      url: `/blog/${slug}`,
      type: "article",
      siteName: "Pinnacle Academic Classes",
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  return (
    <>
      <Navbar />
      <main>
        <section className="bg-[var(--color-navy)] py-14">
          <div className="max-w-3xl mx-auto px-4">
            <a
              href={`${BASE_PATH}/blog`}
              className="text-white/60 hover:text-white text-sm mb-6 inline-flex items-center gap-1 transition-colors"
            >
              ← Back to Blog
            </a>
            <div className="flex items-center gap-2 mb-4">
              <span className="badge text-xs bg-[var(--color-gold)]/20 text-[var(--color-gold)] font-semibold flex items-center gap-1">
                <Tag size={10} />
                {article.category}
              </span>
            </div>
            <h1 className="font-[family-name:var(--font-playfair)] text-white text-3xl md:text-4xl font-bold leading-tight mb-4">
              {article.title}
            </h1>
            <div className="flex items-center gap-4 text-white/60 text-sm">
              <span className="flex items-center gap-1"><Calendar size={13} />{article.date}</span>
              <span className="flex items-center gap-1"><Clock size={13} />{article.readMinutes} min read</span>
              <span>By {article.author}</span>
            </div>
          </div>
        </section>

        <section className="py-14 bg-white">
          <div className="max-w-3xl mx-auto px-4">
            {article.featuredImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={article.featuredImageUrl}
                alt={article.title}
                className="w-full rounded-2xl object-cover mb-10 max-h-96"
              />
            )}

            {article.content ? (
              <div
                className="prose prose-lg prose-slate max-w-none"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            ) : (
              <div className="text-center py-16">
                <p className="text-slate-500 text-lg mb-2">{article.excerpt}</p>
                <p className="text-slate-400 text-sm mt-6">Full article coming soon.</p>
              </div>
            )}
          </div>
        </section>

        <section className="py-12 bg-[var(--color-navy)] text-center">
          <div className="max-w-2xl mx-auto px-4">
            <h2 className="font-[family-name:var(--font-playfair)] text-white text-2xl font-bold mb-3">
              Get Tips Directly from Our Faculty
            </h2>
            <p className="text-white/70 mb-6">
              Join the Pinnacle WhatsApp broadcast for weekly study tips, test alerts, and motivation.
            </p>
            <a
              href="https://wa.me/919999000111"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary py-3 px-8"
            >
              Join WhatsApp Broadcast
            </a>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}

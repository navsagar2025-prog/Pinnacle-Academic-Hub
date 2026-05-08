import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import { Calendar, Clock, Tag } from "lucide-react";
import { db } from "@workspace/db";
import { blogPosts } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website").replace(/\/$/, "");

export const metadata = {
  title: "Study Tips & Blog — Pinnacle Academic Classes",
  description: "Expert study strategies, JEE & NEET preparation tips, and academic guidance from the faculty at Pinnacle Academic Classes, Greater Noida.",
  openGraph: {
    title: "Study Tips & Blog — Pinnacle Academic Classes",
    description: "Expert study strategies, JEE & NEET preparation tips, and academic guidance from the faculty at Pinnacle Academic Classes, Greater Noida.",
    url: "/blog",
    siteName: "Pinnacle Academic Classes",
    type: "website",
    images: [{ url: "/opengraph.jpg", width: 1200, height: 630, alt: "Pinnacle Academic Classes" }],
  },
  alternates: {
    canonical: "/blog",
    types: { "application/rss+xml": `${BASE_PATH}/blog.rss` },
  },
};

const STATIC_ARTICLES = [
  {
    slug: "jee-mains-2026-preparation-strategy",
    title: "JEE Mains 2026: The Complete 90-Day Strategy",
    excerpt: "With JEE Mains just around the corner, here's a battle-tested plan covering revision priorities, mock test schedules, and the mindset shifts that separate rank-holders from the rest.",
    author: "Dr. Ramesh Kumar",
    date: "28 Apr 2026",
    readMinutes: 8,
    category: "JEE",
  },
  {
    slug: "organic-chemistry-named-reactions",
    title: "Master 40+ Named Reactions in Organic Chemistry",
    excerpt: "Named reactions form the backbone of JEE Advanced organic chemistry. This guide breaks them into logical families so you learn the pattern, not just memorise the steps.",
    author: "Ms. Priya Sharma",
    date: "22 Apr 2026",
    readMinutes: 12,
    category: "Chemistry",
  },
  {
    slug: "neet-biology-ncert-strategy",
    title: "Why NCERT Alone Isn't Enough for NEET Biology",
    excerpt: "Every NEET topper says 'read NCERT', but what they really mean is nuanced. Here's how to extract 100% of NEET marks from NCERT — and what extra resources to use.",
    author: "Dr. Sunita Patel",
    date: "15 Apr 2026",
    readMinutes: 7,
    category: "NEET",
  },
  {
    slug: "calculus-common-mistakes",
    title: "12 Calculus Mistakes Students Make in JEE (and How to Avoid Them)",
    excerpt: "Calculus accounts for 20-25% of JEE Mathematics. These are the 12 errors that cost students 20+ marks every attempt — illustrated with solutions.",
    author: "Mr. Ajay Tiwari",
    date: "10 Apr 2026",
    readMinutes: 10,
    category: "Mathematics",
  },
  {
    slug: "mock-test-analysis-guide",
    title: "How to Analyse a Mock Test (Most Students Do It Wrong)",
    excerpt: "Taking mock tests is easy. Extracting value from them is the skill. This step-by-step analysis framework will turn every test into a roadmap for your next 5 marks.",
    author: "Pinnacle Faculty",
    date: "5 Apr 2026",
    readMinutes: 6,
    category: "Strategy",
  },
  {
    slug: "study-schedule-for-droppers",
    title: "The Ideal Daily Schedule for a JEE/NEET Dropper",
    excerpt: "A dropper year demands structure and recovery in equal measure. Here's a practical 16-hour schedule designed around cognitive science — not just willpower.",
    author: "Pinnacle Faculty",
    date: "1 Apr 2026",
    readMinutes: 9,
    category: "Strategy",
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  JEE: "bg-[var(--color-navy)]/10 text-[var(--color-navy)]",
  Chemistry: "bg-[var(--color-teal)]/10 text-[var(--color-teal)]",
  Mathematics: "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]",
  NEET: "bg-green-100 text-green-700",
  Strategy: "bg-[var(--color-gold)]/10 text-[var(--color-navy)]",
};

function categoryEmoji(cat: string) {
  if (cat === "JEE") return "⚡";
  if (cat === "Chemistry") return "🧪";
  if (cat === "Mathematics") return "📐";
  if (cat === "NEET") return "🔬";
  return "🎯";
}

export default async function BlogPage() {
  const dbPosts = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.status, "published"))
    .orderBy(desc(blogPosts.publishedAt));

  const dbArticles = dbPosts.map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt ?? "",
    author: p.authorName,
    date: p.publishedAt
      ? new Date(p.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
      : "",
    readMinutes: p.readMinutes ?? 5,
    category: p.category,
    fromDb: true,
  }));

  const staticSlugs = new Set(dbArticles.map((a) => a.slug));
  const staticArticles = STATIC_ARTICLES.filter((a) => !staticSlugs.has(a.slug)).map((a) => ({ ...a, fromDb: false }));

  const ALL_ARTICLES = [...dbArticles, ...staticArticles];
  const [featured, ...rest] = ALL_ARTICLES;

  return (
    <>
      <Navbar />
      <main>
        <section className="bg-[var(--color-navy)] py-14">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <span className="badge-gold mb-4 inline-block">Faculty Blog</span>
            <h1 className="font-[family-name:var(--font-playfair)] text-white text-4xl md:text-5xl font-bold">Study Tips & Insights</h1>
            <p className="text-white/70 text-lg mt-4 max-w-2xl mx-auto">
              Expert guidance from our IIT & medical college alumni faculty — covering strategy, subject mastery, and exam psychology.
            </p>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            {featured && (
              <div className="card mb-10 lg:flex lg:gap-8 hover:shadow-elevated transition-all group cursor-pointer">
                <div className="lg:w-96 h-52 lg:h-auto bg-gradient-to-br from-[var(--color-navy)] to-[var(--color-teal)] rounded-xl flex items-center justify-center flex-shrink-0 mb-4 lg:mb-0">
                  <span className="text-7xl opacity-30 select-none">{categoryEmoji(featured.category)}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="badge text-xs bg-[var(--color-gold)]/20 text-[var(--color-navy)] font-semibold">Featured</span>
                    <span className={`badge text-xs ${CATEGORY_COLORS[featured.category] ?? "bg-slate-100 text-slate-600"}`}>{featured.category}</span>
                  </div>
                  <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)] mb-3 group-hover:text-[var(--color-teal)] transition-colors">{featured.title}</h2>
                  <p className="text-slate-600 mb-4">{featured.excerpt}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Calendar size={12} />{featured.date}</span>
                    <span className="flex items-center gap-1"><Clock size={12} />{featured.readMinutes} min read</span>
                    <span>By {featured.author}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map((a) => (
                <div key={a.slug} className="card hover:shadow-elevated transition-all group cursor-pointer flex flex-col">
                  <div className="h-32 bg-gradient-to-br from-[var(--color-slate-light)] to-slate-200 rounded-xl flex items-center justify-center mb-4">
                    <span className="text-4xl opacity-40 select-none">{categoryEmoji(a.category)}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`badge text-xs ${CATEGORY_COLORS[a.category] ?? "bg-slate-100 text-slate-600"}`}>
                      <Tag size={9} className="inline mr-1" />{a.category}
                    </span>
                  </div>
                  <h3 className="font-[family-name:var(--font-playfair)] font-bold text-[var(--color-navy)] mb-2 group-hover:text-[var(--color-teal)] transition-colors flex-1">{a.title}</h3>
                  <p className="text-slate-500 text-sm mb-3 line-clamp-2">{a.excerpt}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-auto">
                    <span className="flex items-center gap-1"><Calendar size={11} />{a.date}</span>
                    <span className="flex items-center gap-1"><Clock size={11} />{a.readMinutes} min</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 bg-[var(--color-navy)] text-center">
          <div className="max-w-2xl mx-auto px-4">
            <h2 className="font-[family-name:var(--font-playfair)] text-white text-2xl font-bold mb-3">Get Tips Directly from Our Faculty</h2>
            <p className="text-white/70 mb-6">Join the Pinnacle WhatsApp broadcast for weekly study tips, test alerts, and motivation.</p>
            <a href="https://wa.me/919999000111" target="_blank" rel="noopener noreferrer" className="btn-primary py-3 px-8">
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

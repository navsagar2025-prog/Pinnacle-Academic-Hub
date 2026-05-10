import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import { Calendar, Clock, ArrowLeft, BookOpen } from "lucide-react";

const STATIC_ARTICLES: Record<string, { title: string; author: string; date: string; readMinutes: number; category: string; excerpt: string }> = {
  "jee-mains-2026-preparation-strategy": { title: "JEE Mains 2026: The Complete 90-Day Strategy", author: "Dr. Ramesh Kumar", date: "28 Apr 2026", readMinutes: 8, category: "JEE", excerpt: "With JEE Mains just around the corner, here's a battle-tested plan covering revision priorities, mock test schedules, and the mindset shifts that separate rank-holders from the rest." },
  "organic-chemistry-named-reactions": { title: "Master 40+ Named Reactions in Organic Chemistry", author: "Ms. Priya Sharma", date: "22 Apr 2026", readMinutes: 12, category: "Chemistry", excerpt: "Named reactions form the backbone of JEE Advanced organic chemistry. This guide breaks them into logical families so you learn the pattern, not just memorise the steps." },
  "neet-biology-ncert-strategy": { title: "Why NCERT Alone Isn't Enough for NEET Biology", author: "Dr. Sunita Patel", date: "15 Apr 2026", readMinutes: 7, category: "NEET", excerpt: "Every NEET topper says 'read NCERT', but what they really mean is nuanced. Here's how to extract 100% of NEET marks from NCERT — and what extra resources to use." },
  "calculus-common-mistakes": { title: "12 Calculus Mistakes Students Make in JEE (and How to Avoid Them)", author: "Mr. Ajay Tiwari", date: "10 Apr 2026", readMinutes: 10, category: "Mathematics", excerpt: "Calculus accounts for 20-25% of JEE Mathematics. These are the 12 errors that cost students 20+ marks every attempt — illustrated with solutions." },
  "mock-test-analysis-guide": { title: "How to Analyse a Mock Test (Most Students Do It Wrong)", author: "Pinnacle Faculty", date: "5 Apr 2026", readMinutes: 6, category: "Strategy", excerpt: "Taking mock tests is easy. Extracting value from them is the skill. This step-by-step analysis framework will turn every test into a roadmap for your next 5 marks." },
  "study-schedule-for-droppers": { title: "The Ideal Daily Schedule for a JEE/NEET Dropper", author: "Pinnacle Faculty", date: "1 Apr 2026", readMinutes: 9, category: "Strategy", excerpt: "A dropper year demands structure and recovery in equal measure. Here's a practical 16-hour schedule designed around cognitive science — not just willpower." },
};

type Article = {
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  authorName?: string;
  author?: string;
  publishedAt?: string | null;
  date?: string;
  readMinutes: number;
  category: string;
  featuredImageUrl?: string | null;
};

export default function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`${import.meta.env.BASE_URL}api/v1/blog/${slug}`)
      .then((r) => {
        if (r.status === 404) throw new Error("not found");
        return r.json();
      })
      .then((d) => {
        if (d.ok) setArticle(d.data);
        else setNotFound(true);
      })
      .catch(() => {
        const s = STATIC_ARTICLES[slug ?? ""];
        if (s) setArticle({ slug: slug ?? "", content: null, ...s });
        else setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const author = article?.authorName ?? article?.author ?? "Pinnacle Faculty";
  const date = article?.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : article?.date ?? "";

  return (
    <>
      <Navbar />
      <main>
        <section className="bg-[var(--color-navy)] py-10">
          <div className="max-w-3xl mx-auto px-4">
            <Link href="/blog" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm mb-6 transition-colors">
              <ArrowLeft size={14} /> Back to Blog
            </Link>
            {loading ? (
              <div className="h-12 bg-white/10 rounded animate-pulse w-2/3" />
            ) : notFound ? (
              <h1 className="text-white text-3xl font-bold font-[family-name:var(--font-playfair)]">Article not found</h1>
            ) : (
              <>
                <span className="text-[var(--color-gold)] text-sm font-semibold mb-3 block">{article?.category}</span>
                <h1 className="font-[family-name:var(--font-playfair)] text-white text-3xl md:text-4xl font-bold leading-snug mb-4">
                  {article?.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-white/60 text-sm">
                  <span className="flex items-center gap-1.5"><BookOpen size={13} /> {author}</span>
                  {date && <span className="flex items-center gap-1.5"><Calendar size={13} /> {date}</span>}
                  <span className="flex items-center gap-1.5"><Clock size={13} /> {article?.readMinutes} min read</span>
                </div>
              </>
            )}
          </div>
        </section>

        {!loading && !notFound && article && (
          <section className="py-12">
            <div className="max-w-3xl mx-auto px-4">
              {article.featuredImageUrl && (
                <img src={article.featuredImageUrl} alt={article.title} className="w-full rounded-2xl mb-8 shadow-md object-cover max-h-96" />
              )}
              {article.content ? (
                <div className="prose prose-slate max-w-none prose-headings:font-[family-name:var(--font-playfair)] prose-headings:text-[var(--color-navy)]"
                  dangerouslySetInnerHTML={{ __html: article.content }} />
              ) : (
                <div className="text-slate-600 leading-relaxed space-y-4">
                  <p className="text-lg text-slate-700">{article.excerpt}</p>
                  <p className="text-slate-500 italic border-l-4 border-[var(--color-gold)] pl-4">
                    Full article content coming soon. Check back shortly or visit our campus for the complete study guide from our faculty.
                  </p>
                </div>
              )}

              <div className="mt-12 p-6 bg-[var(--color-navy)] rounded-2xl text-center">
                <p className="text-white font-semibold text-lg mb-2">Ready to start your JEE/NEET journey?</p>
                <p className="text-white/70 text-sm mb-4">Join Pinnacle Academic Classes and learn from the best faculty in Greater Noida.</p>
                <Link href="/admissions" className="btn-gold px-6 py-2.5 inline-block">Enrol Now</Link>
              </div>
            </div>
          </section>
        )}

        {notFound && (
          <section className="py-20 text-center">
            <p className="text-slate-500 mb-4">This article does not exist or has been removed.</p>
            <Link href="/blog" className="btn-primary px-6 py-2.5">Browse All Articles</Link>
          </section>
        )}
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}

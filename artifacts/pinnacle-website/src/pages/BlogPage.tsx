import { useEffect, useState } from "react";
import { Link } from "wouter";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import { Calendar, Clock, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";

const STATIC_ARTICLES = [
  { slug: "jee-mains-2026-preparation-strategy", title: "JEE Mains 2026: The Complete 90-Day Strategy", excerpt: "With JEE Mains just around the corner, here's a battle-tested plan covering revision priorities, mock test schedules, and the mindset shifts that separate rank-holders from the rest.", author: "Dr. Ramesh Kumar", date: "28 Apr 2026", readMinutes: 8, category: "JEE" },
  { slug: "organic-chemistry-named-reactions", title: "Master 40+ Named Reactions in Organic Chemistry", excerpt: "Named reactions form the backbone of JEE Advanced organic chemistry. This guide breaks them into logical families so you learn the pattern, not just memorise the steps.", author: "Ms. Priya Sharma", date: "22 Apr 2026", readMinutes: 12, category: "Chemistry" },
  { slug: "neet-biology-ncert-strategy", title: "Why NCERT Alone Isn't Enough for NEET Biology", excerpt: "Every NEET topper says 'read NCERT', but what they really mean is nuanced. Here's how to extract 100% of NEET marks from NCERT — and what extra resources to use.", author: "Dr. Sunita Patel", date: "15 Apr 2026", readMinutes: 7, category: "NEET" },
  { slug: "calculus-common-mistakes", title: "12 Calculus Mistakes Students Make in JEE (and How to Avoid Them)", excerpt: "Calculus accounts for 20-25% of JEE Mathematics. These are the 12 errors that cost students 20+ marks every attempt — illustrated with solutions.", author: "Mr. Ajay Tiwari", date: "10 Apr 2026", readMinutes: 10, category: "Mathematics" },
  { slug: "mock-test-analysis-guide", title: "How to Analyse a Mock Test (Most Students Do It Wrong)", excerpt: "Taking mock tests is easy. Extracting value from them is the skill. This step-by-step analysis framework will turn every test into a roadmap for your next 5 marks.", author: "Pinnacle Faculty", date: "5 Apr 2026", readMinutes: 6, category: "Strategy" },
  { slug: "study-schedule-for-droppers", title: "The Ideal Daily Schedule for a JEE/NEET Dropper", excerpt: "A dropper year demands structure and recovery in equal measure. Here's a practical 16-hour schedule designed around cognitive science — not just willpower.", author: "Pinnacle Faculty", date: "1 Apr 2026", readMinutes: 9, category: "Strategy" },
];

type Article = {
  id?: string;
  slug: string;
  title: string;
  excerpt: string | null;
  author?: string;
  authorName?: string;
  date?: string;
  publishedAt?: string | null;
  readMinutes: number;
  category: string;
  featuredImageUrl?: string | null;
};

const CATEGORY_COLORS: Record<string, string> = {
  "JEE Main":               "bg-blue-100 text-blue-700",
  "JEE Advanced":           "bg-indigo-100 text-indigo-700",
  "NEET UG":                "bg-green-100 text-green-700",
  "Class 11-12 Boards":     "bg-orange-100 text-orange-700",
  "Class 9-10 Foundation":  "bg-yellow-100 text-yellow-700",
  "Study Skills":           "bg-teal-100 text-teal-700",
  "Career Guidance":        "bg-purple-100 text-purple-700",
  "Parent Guide":           "bg-pink-100 text-pink-700",
  JEE:                      "bg-blue-100 text-blue-700",
  NEET:                     "bg-green-100 text-green-700",
  Chemistry:                "bg-purple-100 text-purple-700",
  Mathematics:              "bg-orange-100 text-orange-700",
  Physics:                  "bg-red-100 text-red-700",
  Strategy:                 "bg-teal-100 text-teal-700",
  General:                  "bg-slate-100 text-slate-600",
};

function categoryColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? "bg-slate-100 text-slate-600";
}

const PAGE_SIZE = 20;

export default function BlogPage() {
  const [dbArticles, setDbArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [usingDb, setUsingDb] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${import.meta.env.BASE_URL}api/v1/blog?page=${page}&limit=${PAGE_SIZE}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && Array.isArray(d.data) && d.data.length > 0) {
          setDbArticles(d.data);
          setTotal(d.total ?? d.data.length);
          setUsingDb(true);
        } else {
          setUsingDb(false);
        }
      })
      .catch(() => { setUsingDb(false); })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const articles: Article[] = usingDb ? dbArticles : STATIC_ARTICLES;
  const totalPages = usingDb ? Math.ceil(total / PAGE_SIZE) : 1;

  return (
    <>
      <Navbar />
      <main>
        <section className="bg-[var(--color-navy)] py-14">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <span className="badge-gold mb-4 inline-block">Study Resources</span>
            <h1 className="font-[family-name:var(--font-playfair)] text-white text-4xl md:text-5xl font-bold">
              Study Tips &amp; Blog
            </h1>
            <p className="text-white/70 text-lg mt-4 max-w-2xl mx-auto">
              Expert strategies, preparation guides, and academic insights from Pinnacle's faculty — written for JEE &amp; NEET aspirants.
            </p>
            {usingDb && total > 0 && (
              <p className="text-[var(--color-gold)] text-sm mt-3 font-medium">
                {total} articles · Page {page} of {totalPages}
              </p>
            )}
          </div>
        </section>

        <section className="py-16 bg-[var(--color-slate-light)]">
          <div className="max-w-5xl mx-auto px-4">
            {loading ? (
              <div className="grid md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="card h-64 animate-pulse bg-slate-200" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-6">
                  {articles.map((article) => {
                    const author = article.authorName ?? article.author ?? "Pinnacle Faculty";
                    const date = article.publishedAt
                      ? new Date(article.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                      : article.date ?? "";
                    return (
                      <Link key={article.slug} href={`/blog/${article.slug}`} className="card group hover:shadow-lg transition-shadow cursor-pointer block">
                        {article.featuredImageUrl && (
                          <img src={article.featuredImageUrl} alt={article.title} className="w-full h-40 object-cover rounded-t-xl -mt-6 -mx-6 mb-4" style={{ width: "calc(100% + 3rem)" }} />
                        )}
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${categoryColor(article.category)}`}>
                            {article.category}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock size={11} /> {article.readMinutes} min read
                          </span>
                        </div>
                        <h2 className="font-[family-name:var(--font-playfair)] text-lg font-bold text-[var(--color-navy)] group-hover:text-[var(--color-teal)] transition-colors leading-snug mb-2">
                          {article.title}
                        </h2>
                        <p className="text-slate-600 text-sm line-clamp-3 mb-4">{article.excerpt}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-400 border-t border-slate-100 pt-3 mt-auto">
                          <span className="flex items-center gap-1"><BookOpen size={11} /> {author}</span>
                          {date && <span className="flex items-center gap-1"><Calendar size={11} /> {date}</span>}
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {usingDb && totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-12">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-white hover:border-[var(--color-teal)] hover:text-[var(--color-teal)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft size={15} /> Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {(() => {
                        const pages: number[] = [];
                        if (totalPages <= 7) {
                          for (let i = 1; i <= totalPages; i++) pages.push(i);
                        } else if (page <= 4) {
                          pages.push(1, 2, 3, 4, 5, -1, totalPages);
                        } else if (page >= totalPages - 3) {
                          pages.push(1, -1, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                        } else {
                          pages.push(1, -1, page - 1, page, page + 1, -2, totalPages);
                        }
                        return pages.map((p, idx) =>
                          p < 0 ? (
                            <span key={`ellipsis-${idx}`} className="w-9 h-9 flex items-center justify-center text-slate-400 text-sm">…</span>
                          ) : (
                            <button
                              key={p}
                              onClick={() => setPage(p)}
                              className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                                p === page
                                  ? "bg-[var(--color-navy)] text-white"
                                  : "text-slate-600 hover:bg-white hover:text-[var(--color-teal)] border border-transparent hover:border-[var(--color-teal)]"
                              }`}
                            >
                              {p}
                            </button>
                          )
                        );
                      })()}
                    </div>

                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-white hover:border-[var(--color-teal)] hover:text-[var(--color-teal)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      Next <ChevronRight size={15} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}

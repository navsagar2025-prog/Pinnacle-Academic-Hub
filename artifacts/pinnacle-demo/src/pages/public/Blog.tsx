import { PublicLayout } from "@/components/layout/PublicLayout";
import { Link } from "wouter";
import { Calendar, Clock, ArrowRight } from "lucide-react";

const posts = [
  {
    slug: "jee-2026-strategy",
    category: "JEE Prep",
    title: "The Ultimate JEE 2026 Strategy: How to Crack It in 12 Months",
    excerpt: "A detailed month-by-month roadmap crafted by our top faculty to help JEE 2026 aspirants maximize their score without burning out.",
    author: "Dr. Ramesh Kumar",
    date: "18 Apr 2026",
    readTime: "8 min read",
    featured: true,
  },
  {
    slug: "neet-biology-tips",
    category: "NEET Prep",
    title: "Biology for NEET 2026 — NCERT is Still the Bible",
    excerpt: "Our NEET toppers consistently credit thorough NCERT revision. Here's a proven, structured approach to mastering Biology in 6 months.",
    author: "Ms. Priya Sharma",
    date: "12 Apr 2026",
    readTime: "6 min read",
    featured: false,
  },
  {
    slug: "small-batch-advantage",
    category: "Learning",
    title: "Why Small Batch Sizes Produce Better Results",
    excerpt: "Research and our own 14-year track record show that batches under 35 students consistently outperform larger classes by 23%.",
    author: "Pinnacle Team",
    date: "5 Apr 2026",
    readTime: "4 min read",
    featured: false,
  },
  {
    slug: "parent-guide-to-jee",
    category: "For Parents",
    title: "A Parent's Guide to Supporting Your JEE/NEET Aspirant",
    excerpt: "Practical, evidence-backed advice on how parents can create the right environment at home during the most stressful prep years.",
    author: "Pinnacle Team",
    date: "28 Mar 2026",
    readTime: "5 min read",
    featured: false,
  },
  {
    slug: "time-management-students",
    category: "Study Tips",
    title: "Master Time Management: The Pinnacle Study Planner Method",
    excerpt: "How our students allocate their 8–10 daily study hours across 3 subjects for maximum retention and minimum fatigue.",
    author: "Mr. Ajay Tiwari",
    date: "20 Mar 2026",
    readTime: "7 min read",
    featured: false,
  },
  {
    slug: "class-11-foundation",
    category: "Foundation",
    title: "Class 11: The Most Underrated Year for JEE/NEET Success",
    excerpt: "Students who build a solid Class 11 foundation consistently score 40% higher in mock tests. Here's how to use this year wisely.",
    author: "Dr. Ramesh Kumar",
    date: "12 Mar 2026",
    readTime: "6 min read",
    featured: false,
  },
];

const CATEGORIES = ["All", "JEE Prep", "NEET Prep", "Study Tips", "For Parents", "Foundation", "Learning"];

export default function Blog() {
  const featured = posts.find(p => p.featured);
  const rest = posts.filter(p => !p.featured);

  return (
    <PublicLayout>
      <div className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Pinnacle Insights</h1>
          <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
            Expert advice, study strategies, and exam updates from our faculty — to help every student thrive.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 mb-10">
          {CATEGORIES.map((c) => (
            <button key={c} className="px-4 py-1.5 rounded-full text-sm font-semibold border border-border bg-card hover:border-primary hover:text-primary transition-all">
              {c}
            </button>
          ))}
        </div>

        {/* Featured Post */}
        {featured && (
          <div className="mb-12 bg-card border border-border rounded-2xl overflow-hidden grid md:grid-cols-2">
            <div className="bg-gradient-to-br from-primary to-secondary h-48 md:h-auto flex items-center justify-center p-8">
              <div className="text-center text-white">
                <div className="text-xs font-bold uppercase tracking-widest text-white/70 mb-2">{featured.category}</div>
                <div className="text-3xl font-serif font-bold leading-snug">Featured Article</div>
              </div>
            </div>
            <div className="p-8 flex flex-col justify-center">
              <span className="text-xs font-bold uppercase tracking-wider text-accent mb-3">{featured.category} · Featured</span>
              <h2 className="text-2xl font-serif font-bold text-primary mb-3">{featured.title}</h2>
              <p className="text-muted-foreground mb-6">{featured.excerpt}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-6">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{featured.date}</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{featured.readTime}</span>
                <span>By {featured.author}</span>
              </div>
              <button className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-secondary transition-colors">
                Read Article <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Post Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {rest.map((post, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <div className="h-36 bg-gradient-to-br from-primary/80 to-secondary/80 flex items-end p-4">
                <span className="text-xs font-bold uppercase tracking-wider text-white/80 bg-white/10 px-2 py-0.5 rounded">
                  {post.category}
                </span>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-serif font-bold text-primary text-lg mb-2 leading-snug">{post.title}</h3>
                <p className="text-muted-foreground text-sm mb-4 flex-1">{post.excerpt}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{post.date}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.readTime}</span>
                </div>
                <button className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-secondary transition-colors">
                  Read More <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Newsletter CTA */}
        <div className="mt-16 bg-primary text-primary-foreground rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-serif font-bold mb-2">Stay Updated</h2>
          <p className="text-primary-foreground/80 mb-6">Get weekly study tips and exam updates in your inbox.</p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Your email address"
              disabled
              className="flex-1 rounded-xl px-4 py-2 bg-white/10 border border-white/20 text-white placeholder:text-white/50 text-sm opacity-60 cursor-not-allowed"
            />
            <button disabled className="px-6 py-2 rounded-xl bg-accent text-primary font-bold text-sm opacity-60 cursor-not-allowed">
              Subscribe
            </button>
          </div>
          <p className="text-xs text-primary-foreground/40 mt-3">Newsletter subscription available in production</p>
        </div>
      </div>
    </PublicLayout>
  );
}

import { PublicLayout } from "@/components/layout/PublicLayout";

const toppers = [
  { name: "Arjun Mehta", exam: "JEE Advanced 2024", score: "AIR 247", batch: "JEE 2024", category: "JEE" },
  { name: "Rohan Gupta", exam: "JEE Mains 2024", score: "99.4 Percentile", batch: "JEE 2024", category: "JEE" },
  { name: "Priya Singh", exam: "NEET 2024", score: "695/720 · AIR 312", batch: "NEET 2024", category: "NEET" },
  { name: "Aisha Khan", exam: "NEET 2024", score: "672/720 · AIR 810", batch: "NEET 2024", category: "NEET" },
  { name: "Rahul Sharma", exam: "CBSE Class 12 PCM", score: "98.2%", batch: "Class 12 PCM", category: "Boards" },
  { name: "Ananya Kapoor", exam: "CBSE Class 12 PCB", score: "97.6%", batch: "Class 12 PCB", category: "Boards" },
  { name: "Sneha Patel", exam: "CBSE Class 10", score: "97.8%", batch: "Class 10 Boards", category: "Boards" },
  { name: "Vivek Rao", exam: "CBSE Class 10", score: "96.4%", batch: "Class 10 Boards", category: "Boards" },
];

const summary = [
  { label: "JEE Qualifiers (2024)", value: "38" },
  { label: "NEET Qualifiers (2024)", value: "26" },
  { label: "90%+ in Boards (2024)", value: "84" },
  { label: "School Toppers", value: "12" },
];

const categoryColors: Record<string, string> = {
  JEE: "bg-primary/10 text-primary",
  NEET: "bg-secondary/10 text-secondary",
  Boards: "bg-accent/10 text-accent-foreground",
};

export default function Results() {
  return (
    <PublicLayout>
      <div className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Results & Success Stories</h1>
          <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
            Every topper is a testament to hours of dedicated teaching and relentless student effort. Here's to our stars.
          </p>
        </div>
      </div>

      <div className="bg-accent/10 border-y border-accent/20 py-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {summary.map((s) => (
              <div key={s.label}>
                <div className="text-3xl md:text-4xl font-bold font-serif text-primary mb-1">{s.value}</div>
                <div className="text-sm text-muted-foreground font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-serif font-bold text-primary text-center mb-12">Class of 2024 — Star Achievers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {toppers.map((t, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary mx-auto mb-4 flex items-center justify-center font-bold text-xl">
                {t.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <h3 className="font-bold text-foreground mb-1">{t.name}</h3>
              <div className="text-xs text-muted-foreground mb-3">{t.batch}</div>
              <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${categoryColors[t.category] || "bg-muted text-foreground"}`}>
                {t.category}
              </span>
              <div className="mt-4 text-sm text-muted-foreground">{t.exam}</div>
              <div className="text-2xl font-bold font-serif text-primary mt-1">{t.score}</div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-primary text-primary-foreground rounded-3xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-serif font-bold mb-4">Want to be Next Year's Topper?</h2>
          <p className="text-primary-foreground/80 max-w-lg mx-auto mb-6 text-sm">
            Enroll today and get access to the same resources, faculty, and mentorship that produced these results.
          </p>
          <a href="/admissions" className="inline-flex items-center justify-center px-8 py-3 bg-accent text-accent-foreground font-semibold rounded-lg hover:bg-accent/90 transition-colors">
            Enquire About Admissions
          </a>
        </div>
      </div>
    </PublicLayout>
  );
}

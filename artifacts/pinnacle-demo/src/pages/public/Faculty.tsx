import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const faculty = [
  {
    name: "Dr. Ramesh Kumar",
    subject: "Physics",
    qualification: "M.Tech, IIT Delhi",
    experience: "14 Years",
    achievements: ["JEE Advanced Rank Holders' Mentor", "Published author in Physics pedagogy", "Trained 200+ IIT qualifiers"],
    batches: ["JEE Mains + Advanced", "Class 12 PCM"],
  },
  {
    name: "Ms. Priya Sharma",
    subject: "Chemistry",
    qualification: "M.Sc, AIIMS New Delhi",
    experience: "11 Years",
    achievements: ["NEET specialist faculty", "100+ NEET 600+ scorers", "Former AIIMS researcher"],
    batches: ["NEET Preparation", "Class 12 PCB"],
  },
  {
    name: "Mr. Ajay Tiwari",
    subject: "Mathematics",
    qualification: "M.Tech, IIT Bombay",
    experience: "9 Years",
    achievements: ["Calculus & Algebra specialist", "JEE Advanced paper analysis expert", "Authored 3 test-prep books"],
    batches: ["JEE Mains + Advanced", "Class 11 Foundation"],
  },
  {
    name: "Ms. Sunita Verma",
    subject: "Biology",
    qualification: "M.Sc, Life Sciences",
    experience: "12 Years",
    achievements: ["NEET Biology module developer", "80+ NEET AIR under 1000", "Biotechnology specialist"],
    batches: ["NEET Preparation", "Class 12 PCB", "Class 11 Foundation"],
  },
  {
    name: "Mr. Vikas Gupta",
    subject: "English & Reasoning",
    qualification: "M.A. English, BHU",
    experience: "8 Years",
    achievements: ["Board exam 95%+ specialist", "Verbal reasoning module creator", "Career counselling expert"],
    batches: ["Class 12 Boards", "Class 10 Board Prep"],
  },
  {
    name: "Ms. Kavita Rao",
    subject: "Accountancy & Economics",
    qualification: "M.Com, Delhi University",
    experience: "10 Years",
    achievements: ["Commerce board toppers' trainer", "CA Foundation mentor", "100+ students scored 95+ in Accounts"],
    batches: ["Class 12 Commerce", "Class 11 Foundation"],
  },
];

export default function Faculty() {
  return (
    <PublicLayout>
      <div className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Our Faculty</h1>
          <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
            Learn from IIT and AIIMS alumni with a combined 60+ years of coaching experience and a passionate commitment to student outcomes.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {faculty.map((f, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
              <div className="bg-primary/5 p-6 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shrink-0">
                  {f.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">{f.name}</h3>
                  <div className="text-sm font-semibold text-accent">{f.subject}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{f.qualification} · {f.experience}</div>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Key Achievements</div>
                  <ul className="space-y-1.5">
                    {f.achievements.map((a, j) => (
                      <li key={j} className="text-sm text-foreground flex items-start gap-2">
                        <span className="text-accent mt-1 shrink-0">✦</span> {a}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Teaches</div>
                  <div className="flex flex-wrap gap-2">
                    {f.batches.map((b, j) => (
                      <span key={j} className="text-xs bg-primary/8 text-primary px-2.5 py-1 rounded-full font-medium">{b}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-primary text-primary-foreground rounded-3xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-serif font-bold mb-4">Want to Join Our Faculty?</h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-6">
            We're always looking for passionate educators who want to make a real difference. Reach out to us.
          </p>
          <a href="mailto:careers@pinnacleacademic.in">
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">careers@pinnacleacademic.in</Button>
          </a>
        </div>
      </div>
    </PublicLayout>
  );
}

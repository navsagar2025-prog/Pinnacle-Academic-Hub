import { useState } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", "JEE", "NEET", "Boards", "Foundation"] as const;
type Category = (typeof CATEGORIES)[number];

const courses = [
  { category: "JEE", name: "IIT-JEE (Mains + Advanced)", desc: "Comprehensive preparation for engineering entrance exams with intensive problem-solving sessions and mock test series.", batches: "Morning, Evening", fees: "₹80,000 – ₹1,20,000/yr" },
  { category: "NEET", name: "NEET Preparation", desc: "Expert faculty for Biology, Physics, and Chemistry with special emphasis on NCERT and past-paper analysis.", batches: "Morning, Day", fees: "₹85,000 – ₹1,30,000/yr" },
  { category: "Boards", name: "Class 12 Boards (PCM)", desc: "Focused preparation for CBSE/ICSE board exams — full syllabus coverage, practicals, and internal assessment.", batches: "Evening", fees: "₹40,000/yr" },
  { category: "Boards", name: "Class 12 Boards (PCB)", desc: "Complete CBSE/ICSE board prep for Biology stream with in-depth diagrams and examination techniques.", batches: "Evening", fees: "₹40,000/yr" },
  { category: "Boards", name: "Class 12 Boards (Commerce)", desc: "Accounts, Economics, and Business Studies with CA-aligned accounting methodology.", batches: "Evening", fees: "₹35,000/yr" },
  { category: "Foundation", name: "Class 11 Foundation", desc: "Building strong academic foundations for JEE/NEET aspirants right from Class 11.", batches: "Day, Evening", fees: "₹60,000/yr" },
  { category: "Foundation", name: "Class 10 Board Prep", desc: "Complete CBSE/ICSE syllabus coverage with regular tests, revision, and board examination tips.", batches: "Evening", fees: "₹30,000/yr" },
  { category: "Foundation", name: "Class 9 & 8 Foundation", desc: "Early preparation for Olympiads, NTSE, and competitive mindset development.", batches: "Weekend Special", fees: "₹25,000/yr" },
  { category: "Foundation", name: "Class 6 & 7 Olympiad", desc: "Fostering analytical thinking and logical reasoning for IMO, NSO, and other Olympiads.", batches: "Weekend Special", fees: "₹20,000/yr" },
];

export default function Courses() {
  const [activeCategory, setActiveCategory] = useState<Category>("All");

  const filtered = activeCategory === "All" ? courses : courses.filter((c) => c.category === activeCategory);

  return (
    <PublicLayout>
      <div className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Our Courses</h1>
          <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
            Scientifically designed curriculum for every stage of your child's academic journey.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-3 justify-center mb-10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-semibold border transition-all duration-200",
                activeCategory === cat
                  ? "bg-primary text-primary-foreground border-primary shadow-md"
                  : "bg-white text-muted-foreground border-border hover:border-primary hover:text-primary"
              )}
            >
              {cat}
              {cat !== "All" && (
                <span className={cn(
                  "ml-2 text-xs font-medium px-1.5 py-0.5 rounded-full",
                  activeCategory === cat
                    ? "bg-white/20 text-white"
                    : "bg-muted text-muted-foreground"
                )}>
                  {courses.filter((c) => c.category === cat).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Course Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((course, i) => (
            <div key={i} className="bg-white border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
              <div className="text-xs font-bold uppercase tracking-wider text-accent mb-3">{course.category}</div>
              <h3 className="text-xl font-bold text-primary mb-2">{course.name}</h3>
              <p className="text-muted-foreground text-sm mb-6 flex-1">{course.desc}</p>
              <div className="space-y-2 mb-6 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Batches:</span>
                  <span className="font-medium">{course.batches}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Indicative Fees:</span>
                  <span className="font-medium">{course.fees}</span>
                </div>
              </div>
              <Link href="/admissions">
                <Button className="w-full">Enquire Now</Button>
              </Link>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">No courses found for this category.</div>
        )}
      </div>
    </PublicLayout>
  );
}

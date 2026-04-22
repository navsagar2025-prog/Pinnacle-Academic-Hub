import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const courses = [
  { category: "JEE", name: "IIT-JEE (Mains + Advanced)", desc: "Comprehensive preparation for engineering entrance.", batches: "Morning, Evening", fees: "₹80,000 - ₹1,20,000/yr" },
  { category: "NEET", name: "NEET Preparation", desc: "Expert faculty for medical entrance exams.", batches: "Morning, Day", fees: "₹85,000 - ₹1,30,000/yr" },
  { category: "Boards", name: "Class 12 Boards (PCM)", desc: "Focused preparation for CBSE/ICSE board exams.", batches: "Evening", fees: "₹40,000/yr" },
  { category: "Boards", name: "Class 12 Boards (PCB)", desc: "Focused preparation for CBSE/ICSE board exams.", batches: "Evening", fees: "₹40,000/yr" },
  { category: "Boards", name: "Class 12 Boards (Commerce)", desc: "Accounts, Economics, Business Studies.", batches: "Evening", fees: "₹35,000/yr" },
  { category: "Foundation", name: "Class 11 Foundation", desc: "Building strong basics for competitive exams.", batches: "Day, Evening", fees: "₹60,000/yr" },
  { category: "Foundation", name: "Class 10 Board Prep", desc: "Complete syllabus coverage with regular tests.", batches: "Evening", fees: "₹30,000/yr" },
  { category: "Foundation", name: "Class 9 & 8 Foundation", desc: "Early preparation for Olympiads and NTSE.", batches: "Weekend Special", fees: "₹25,000/yr" },
  { category: "Foundation", name: "Class 6 & 7 Olympiad", desc: "Fostering analytical thinking.", batches: "Weekend Special", fees: "₹20,000/yr" },
];

export default function Courses() {
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
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course, i) => (
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
      </div>
    </PublicLayout>
  );
}

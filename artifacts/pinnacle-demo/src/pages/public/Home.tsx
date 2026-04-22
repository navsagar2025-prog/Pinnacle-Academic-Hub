import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState } from "react";

const stats = [
  { value: "14+", label: "Years of Excellence" },
  { value: "500+", label: "Students Annually" },
  { value: "95%", label: "Success Rate" },
  { value: "4.9/5", label: "Parent Rating" },
];

const whyUs = [
  { title: "Expert Faculty", desc: "IIT & AIIMS alumni with 8–14 years of teaching experience. Every subject covered by a specialist." },
  { title: "Small Batch Sizes", desc: "Maximum 25 students per batch ensures every student gets individual attention and regular doubt clearing." },
  { title: "Live + Recorded Classes", desc: "Attend classes online or offline. All sessions are recorded and accessible via the student portal anytime." },
  { title: "Digital Study Material", desc: "Curated notes, practice papers, and topic-wise tests available digitally — updated every session." },
  { title: "Regular Tests & Analysis", desc: "Weekly tests with detailed performance analysis to identify and close gaps before exams." },
  { title: "Holistic Mentorship", desc: "Beyond academics — exam strategy, stress management, and counselling by experienced educators." },
];

const courses = [
  { cat: "JEE", name: "IIT-JEE Mains + Advanced", fees: "₹80,000–1,20,000/yr" },
  { cat: "NEET", name: "NEET Preparation", fees: "₹85,000–1,30,000/yr" },
  { cat: "Boards", name: "Class 12 Boards (PCM/PCB)", fees: "₹40,000/yr" },
  { cat: "Foundation", name: "Class 11 Foundation", fees: "₹60,000/yr" },
  { cat: "Foundation", name: "Class 10 Board Prep", fees: "₹30,000/yr" },
  { cat: "Olympiad", name: "Class 6–9 Foundation & Olympiad", fees: "₹20,000–25,000/yr" },
];

const toppers = [
  { name: "Arjun Mehta", exam: "JEE Advanced 2024", score: "AIR 247", batch: "JEE 2024 Batch" },
  { name: "Priya Singh", exam: "NEET 2024", score: "695/720 · AIR 312", batch: "NEET 2024 Batch" },
  { name: "Rahul Sharma", exam: "CBSE Class 12", score: "98.2%", batch: "Class 12 PCM" },
  { name: "Sneha Patel", exam: "CBSE Class 10", score: "97.8%", batch: "Class 10 Boards" },
];

const faculty = [
  { name: "Dr. Ramesh Kumar", subject: "Physics", qual: "IIT Delhi · M.Tech", exp: "14 yrs" },
  { name: "Ms. Priya Sharma", subject: "Chemistry", qual: "AIIMS · M.Sc", exp: "11 yrs" },
  { name: "Mr. Ajay Tiwari", subject: "Mathematics", qual: "IIT Bombay · M.Tech", exp: "9 yrs" },
  { name: "Ms. Sunita Verma", subject: "Biology", qual: "M.Sc Life Sciences", exp: "12 yrs" },
];

const testimonials = [
  {
    quote: "Pinnacle completely transformed my daughter's approach to studies. The faculty's patience and dedication is unmatched. She scored 97% in boards, something we didn't dare dream about.",
    name: "Sanjay Kapoor",
    role: "Parent of Ananya Kapoor · Class 12 PCM",
  },
  {
    quote: "What sets Pinnacle apart is the personal attention. My son would often be too shy to ask doubts in school. Here, the small batch ensured the teacher always noticed and corrected him.",
    name: "Meena Gupta",
    role: "Parent of Rohan Gupta · JEE 2024",
  },
  {
    quote: "The recorded classes feature is a lifesaver. My daughter could revisit difficult topics at her own pace. The results speak for themselves — AIR 312 in NEET!",
    name: "Arun Verma",
    role: "Parent of Priya Singh · NEET 2024",
  },
];

const notices = [
  { date: "20 Apr 2026", title: "New Batch Starting: JEE 2027 Foundation", tag: "Admissions" },
  { date: "15 Apr 2026", title: "Holiday Notice: Institute Closed on April 25 (Pooja)", tag: "Holiday" },
  { date: "10 Apr 2026", title: "Mock Test Series — JEE Mains Begins May 1", tag: "Exam" },
  { date: "05 Apr 2026", title: "Parent-Teacher Meeting Scheduled: April 30", tag: "Event" },
];

const faqs = [
  { q: "What is the admission process?", a: "Visit our Admissions page, fill the enquiry form or call us directly. We will schedule a counselling session and guide you through batch selection, fee payment, and enrollment." },
  { q: "Are online classes available?", a: "Yes. All classes are conducted live and simultaneously online. Recordings are available in the student portal for 30 days after each class." },
  { q: "What is the batch size?", a: "We maintain a maximum of 25 students per batch to ensure quality attention. Weekend batches may have up to 30 students." },
  { q: "How are fees structured?", a: "Fees vary by course and batch. We offer installment options in 2–3 tranches. Please visit our Fee Payment page or contact us for the exact fee schedule." },
  { q: "Is study material provided?", a: "Yes — comprehensive digital study material, topic notes, and practice papers are provided and accessible via the student portal." },
  { q: "Are doubt-clearing sessions available?", a: "Yes. Dedicated doubt-clearing sessions are available on Saturdays and through our portal's messaging system during the week." },
];

export default function Home() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  return (
    <PublicLayout>
      <section className="relative overflow-hidden bg-primary text-primary-foreground py-20 lg:py-32">
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 70% 50%, white 0%, transparent 60%)" }} />
        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col items-start gap-6">
            <div className="inline-flex items-center rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-sm font-semibold text-accent tracking-wide">
              Gaur City 2's Premier Coaching Institute
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold font-serif leading-tight">
              Shaping the Future of <span className="text-accent">Tomorrow's Leaders</span>
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-lg leading-relaxed">
              Expert faculty, small batch sizes, and a proven 95% success rate. We don't just teach — we mentor, guide, and ensure every student reaches their true potential.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/admissions">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
                  Enquire Now
                </Button>
              </Link>
              <Link href="/courses">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  View Courses
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="rounded-2xl overflow-hidden aspect-[4/3] bg-primary-foreground/10 flex items-center justify-center">
              <div className="text-center text-primary-foreground/30 p-8">
                <div className="text-6xl font-serif font-bold mb-2">14</div>
                <div className="text-lg font-medium">Years of Excellence</div>
                <div className="text-sm opacity-70 mt-1">Gaur City, Greater Noida</div>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 bg-accent text-accent-foreground rounded-2xl px-6 py-4 shadow-xl">
              <div className="text-2xl font-bold">500+</div>
              <div className="text-xs font-medium">Students Every Year</div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-accent/10 border-y border-accent/20 py-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="text-3xl md:text-4xl font-bold font-serif text-primary mb-1">{s.value}</div>
                <div className="text-sm text-muted-foreground font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <div className="text-sm font-bold uppercase tracking-widest text-accent mb-2">Why Pinnacle</div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary">What Sets Us Apart</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyUs.map((item, i) => (
              <div key={i} className="bg-card rounded-2xl p-6 border border-border hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4 font-bold text-primary text-sm">
                  0{i + 1}
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <div className="text-sm font-bold uppercase tracking-widest text-accent mb-2">Programs</div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary">Our Courses</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((c, i) => (
              <div key={i} className="bg-card rounded-2xl p-6 border border-border flex flex-col">
                <div className="text-xs font-bold uppercase tracking-widest text-accent mb-2">{c.cat}</div>
                <h3 className="text-lg font-bold text-primary mb-3">{c.name}</h3>
                <div className="text-sm text-muted-foreground mb-6 flex-1">Fees: {c.fees}</div>
                <Link href="/admissions">
                  <Button variant="outline" size="sm" className="w-full">Enquire Now</Button>
                </Link>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/courses"><Button size="lg">View All Courses</Button></Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <div className="text-sm font-bold uppercase tracking-widest text-accent mb-2">Hall of Fame</div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold">Our Star Achievers</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {toppers.map((t, i) => (
              <div key={i} className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20 text-center">
                <div className="w-16 h-16 rounded-full bg-accent/20 border-2 border-accent mx-auto mb-4 flex items-center justify-center font-bold text-accent text-lg">
                  {t.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="font-bold text-lg mb-1">{t.name}</div>
                <div className="text-sm text-primary-foreground/70 mb-3">{t.batch}</div>
                <div className="text-sm font-semibold text-accent mb-1">{t.exam}</div>
                <div className="text-2xl font-bold font-serif text-white">{t.score}</div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/results">
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">View All Results</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <div className="text-sm font-bold uppercase tracking-widest text-accent mb-2">Faculty</div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary">Learn from the Best</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {faculty.map((f, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6 text-center hover:shadow-md transition-shadow">
                <div className="w-16 h-16 rounded-full bg-primary/10 text-primary mx-auto mb-4 flex items-center justify-center font-bold text-lg">
                  {f.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <h3 className="font-bold text-foreground mb-1">{f.name}</h3>
                <div className="text-sm font-semibold text-accent mb-1">{f.subject}</div>
                <div className="text-xs text-muted-foreground">{f.qual} · {f.exp}</div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/faculty"><Button variant="outline" size="lg">Meet All Faculty</Button></Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/40">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-14">
            <div className="text-sm font-bold uppercase tracking-widest text-accent mb-2">Testimonials</div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary">What Parents Say</h2>
          </div>
          <div className="bg-card rounded-3xl border border-border p-8 md:p-12 text-center shadow-sm">
            <p className="text-lg text-muted-foreground italic leading-relaxed mb-8">
              "{testimonials[activeTestimonial].quote}"
            </p>
            <div className="font-bold text-foreground">{testimonials[activeTestimonial].name}</div>
            <div className="text-sm text-muted-foreground mt-1">{testimonials[activeTestimonial].role}</div>
          </div>
          <div className="flex justify-center gap-3 mt-6">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTestimonial(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${i === activeTestimonial ? "bg-primary w-6" : "bg-border"}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <div className="text-sm font-bold uppercase tracking-widest text-accent mb-2">Notice Board</div>
            <h2 className="text-3xl font-serif font-bold text-primary mb-8">Latest Announcements</h2>
            <div className="space-y-4">
              {notices.map((n, i) => (
                <div key={i} className="flex gap-4 p-4 bg-card border border-border rounded-xl hover:shadow-sm transition-shadow">
                  <div className="text-xs text-muted-foreground w-24 shrink-0 pt-0.5">{n.date}</div>
                  <div className="flex-1">
                    <div className="font-medium text-foreground text-sm">{n.title}</div>
                    <div className="text-xs text-accent font-semibold mt-1">{n.tag}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Link href="/notices"><Button variant="outline" size="sm">View All Notices</Button></Link>
            </div>
          </div>

          <div>
            <div className="text-sm font-bold uppercase tracking-widest text-accent mb-2">FAQ</div>
            <h2 className="text-3xl font-serif font-bold text-primary mb-8">Common Questions</h2>
            <div className="space-y-3">
              {faqs.slice(0, 4).map((faq, i) => (
                <details key={i} className="group bg-card border border-border rounded-xl overflow-hidden">
                  <summary className="flex items-center justify-between p-4 cursor-pointer list-none font-medium text-sm text-foreground">
                    {faq.q}
                    <span className="ml-4 shrink-0 text-muted-foreground group-open:rotate-180 transition-transform">▾</span>
                  </summary>
                  <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{faq.a}</div>
                </details>
              ))}
            </div>
            <div className="mt-6">
              <Link href="/faq"><Button variant="outline" size="sm">View All FAQs</Button></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary text-primary-foreground text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Ready to Begin Your Journey?</h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
            Seats are limited. Reach out today to reserve your child's spot in the next batch.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/admissions">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">Enquire Now</Button>
            </Link>
            <a href="tel:+919876543210">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">Call Us Now</Button>
            </a>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

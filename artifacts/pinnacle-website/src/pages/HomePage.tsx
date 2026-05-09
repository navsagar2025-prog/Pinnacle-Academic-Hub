import { Link } from "wouter";
import {
  BookOpen,
  Users,
  Award,
  TrendingUp,
  Phone,
  ArrowRight,
  CheckCircle,
  Star,
  ChevronRight,
  Video,
  FileText,
  Clock,
  MapPin,
  MessageCircle,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import { COURSES, FACULTY, TOPPERS, TESTIMONIALS, STATS, NOTICES, FAQ } from "@/lib/data";
import { CONTACT } from "@/lib/contact";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <QuickActions />
        <StatsSection />
        <CoursesSection />
        <WhyChooseSection />
        <FacultySection />
        <ToppersSection />
        <TestimonialsSection />
        <NoticeBoard />
        <FAQSection />
        <CTABanner />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}

function HeroSection() {
  return (
    <section className="relative bg-[var(--color-navy)] overflow-hidden min-h-[600px] flex items-center">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--color-teal)] opacity-10 rounded-full -translate-y-1/4 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[var(--color-gold)] opacity-5 rounded-full translate-y-1/4 -translate-x-1/4" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-[var(--color-gold)]/15 border border-[var(--color-gold)]/30 rounded-full px-4 py-1.5">
              <Star size={14} className="text-[var(--color-gold)]" fill="currentColor" />
              <span className="text-[var(--color-gold)] text-sm font-semibold">
                Greater Noida's #1 Coaching Institute
              </span>
            </div>

            <h1 className="font-[family-name:var(--font-playfair)] text-white text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Your Pinnacle of{" "}
              <span className="text-[var(--color-gold)]">Academic</span>{" "}
              Excellence
            </h1>

            <p className="text-white/75 text-lg leading-relaxed max-w-xl">
              Expert coaching for JEE Main, JEE Advanced, and NEET UG from India's top educators.
              Join 2,000+ students who transformed their potential into top ranks.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              {["JEE Main & Advanced", "NEET UG", "Class 11–12", "Foundation"].map((tag) => (
                <span
                  key={tag}
                  className="bg-white/10 text-white/90 text-xs font-medium px-3 py-1.5 rounded-full border border-white/20"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link href="/admissions" className="btn-gold text-base px-8 py-3.5">
                <BookOpen size={18} />
                Book Free Demo Class
              </Link>
              <Link href="/courses" className="btn-outline border-white/40 text-white hover:bg-white hover:text-[var(--color-navy)] text-base px-8 py-3.5">
                Explore Courses
                <ArrowRight size={18} />
              </Link>
            </div>

            <div className="flex items-center gap-6 pt-2 text-white/60 text-sm">
              {["Free demo class", "No advance payment", "Expert faculty"].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle size={15} className="text-[var(--color-gold)]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 space-y-4">
              <div className="text-white font-semibold text-lg font-[family-name:var(--font-playfair)]">
                2024 Achievements 🏆
              </div>
              {[
                { label: "IIT Selections", value: "47", icon: "🎓" },
                { label: "AIIMS / MBBS Selections", value: "38", icon: "🏥" },
                { label: "NIT Selections", value: "120+", icon: "⚙️" },
                { label: "Board Toppers (90%+)", value: "210+", icon: "📊" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{stat.icon}</span>
                    <span className="text-white/80 text-sm">{stat.label}</span>
                  </div>
                  <span className="text-[var(--color-gold)] font-bold text-lg">{stat.value}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-white/10">
                <p className="text-white/50 text-xs text-center">Join the legacy of excellence</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-slate-200 px-4 py-3 flex gap-3">
        <a
          href={CONTACT.telHref}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-[var(--color-navy)] text-white text-sm font-semibold"
        >
          <Phone size={15} />
          Call Now
        </a>
        <Link
          href="/admissions"
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-[var(--color-gold)] text-[var(--color-navy)] text-sm font-bold"
        >
          <BookOpen size={15} />
          Book Demo
        </Link>
        <a
          href={CONTACT.whatsappHref}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-[#25D366] text-white text-sm font-semibold"
        >
          <MessageCircle size={15} />
        </a>
      </div>
    </section>
  );
}

function QuickActions() {
  const actions = [
    { icon: <BookOpen size={20} />, label: "Book Demo Class", href: "/admissions", color: "navy" },
    { icon: <FileText size={20} />, label: "Download Brochure", href: "/admissions#brochure", color: "teal" },
    { icon: <Video size={20} />, label: "View Courses", href: "/courses", color: "maroon" },
    { icon: <Phone size={20} />, label: "Talk to Counsellor", href: CONTACT.telHref, color: "gold" },
  ];

  return (
    <div className="bg-[var(--color-cream)] border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {actions.map((a) => (
            <a
              key={a.label}
              href={a.href}
              className="flex flex-col items-center gap-2 bg-white border border-slate-100 rounded-xl p-4 hover:shadow-md hover:border-[var(--color-teal)]/30 transition-all group"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  a.color === "navy"
                    ? "bg-[var(--color-navy)]/10 text-[var(--color-navy)] group-hover:bg-[var(--color-navy)] group-hover:text-white"
                    : a.color === "teal"
                    ? "bg-[var(--color-teal)]/10 text-[var(--color-teal)] group-hover:bg-[var(--color-teal)] group-hover:text-white"
                    : a.color === "maroon"
                    ? "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)] group-hover:bg-[var(--color-maroon)] group-hover:text-white"
                    : "bg-[var(--color-gold)]/10 text-[var(--color-maroon)] group-hover:bg-[var(--color-gold)] group-hover:text-[var(--color-navy)]"
                }`}
              >
                {a.icon}
              </div>
              <span className="text-xs font-semibold text-slate-700 text-center">{a.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatsSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">
                {stat.value}
              </div>
              <div className="text-slate-500 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CoursesSection() {
  return (
    <section id="courses" className="py-20 bg-[var(--color-slate-light)]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <span className="badge-teal mb-3 inline-block">Our Programmes</span>
          <h2 className="section-heading">Courses Designed for Excellence</h2>
          <p className="section-subheading mx-auto">
            From foundational science to advanced competitive exam preparation — we have the right
            programme for every student at every stage.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {COURSES.map((course) => (
            <div
              key={course.id}
              className="card hover:shadow-elevated transition-all hover:-translate-y-1 flex flex-col"
            >
              <div className="flex items-start gap-4 mb-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                    course.color === "navy"
                      ? "bg-[var(--color-navy)]/10"
                      : course.color === "teal"
                      ? "bg-[var(--color-teal)]/10"
                      : course.color === "maroon"
                      ? "bg-[var(--color-maroon)]/10"
                      : "bg-[var(--color-gold)]/10"
                  }`}
                >
                  {course.icon}
                </div>
                <div>
                  <h3 className="font-bold text-[var(--color-navy)] text-lg font-[family-name:var(--font-playfair)] leading-tight">
                    {course.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock size={11} />
                      {course.duration}
                    </span>
                    <span className="text-xs text-slate-500">{course.seats} seats/batch</span>
                  </div>
                </div>
              </div>

              <p className="text-slate-600 text-sm leading-relaxed mb-4">{course.description}</p>

              <ul className="space-y-1.5 mb-5">
                {course.highlights.map((h) => (
                  <li key={h} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle size={13} className="text-[var(--color-teal)] flex-shrink-0" />
                    {h}
                  </li>
                ))}
              </ul>

              <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
                <div>
                  <span className="text-xs text-slate-500">From</span>
                  <div className="text-[var(--color-navy)] font-bold text-lg">
                    ₹{(course.fee / 1000).toFixed(0)}k
                    <span className="text-xs text-slate-500 font-normal">/year</span>
                  </div>
                </div>
                <Link
                  href={`/courses#${course.id}`}
                  className="btn-secondary py-2 px-4 text-sm"
                >
                  Learn More
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link href="/courses" className="btn-primary px-8 py-3">
            View All Courses
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function WhyChooseSection() {
  const reasons = [
    { icon: <Users size={24} />, title: "Expert Faculty", description: "IIT/NIT alumni and PhD-qualified faculty with 7–14 years of focused coaching experience.", color: "navy" },
    { icon: <TrendingUp size={24} />, title: "Proven Results", description: "85+ IIT & AIIMS selections, 320+ NIT/state medical seats in 2024. Our results speak.", color: "teal" },
    { icon: <FileText size={24} />, title: "Comprehensive Study Material", description: "Faculty-prepared notes, practice papers, and previous year question banks. All included.", color: "maroon" },
    { icon: <Clock size={24} />, title: "Flexible Batches", description: "Morning and evening batches to fit school schedules. Weekend batches for working parents.", color: "gold" },
    { icon: <Award size={24} />, title: "Regular Mock Tests", description: "Full-length mock tests with detailed performance analytics every 2 weeks. Just like the real exam.", color: "teal" },
    { icon: <Video size={24} />, title: "Live + Recorded Classes", description: "Never miss a class — all sessions are recorded and available for revision anytime in the student portal.", color: "navy" },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <span className="badge-navy mb-3 inline-block">Why Pinnacle</span>
          <h2 className="section-heading">What Sets Us Apart</h2>
          <p className="section-subheading mx-auto">
            We combine experienced faculty, structured curriculum, and modern technology to give every
            student the best chance at success.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reasons.map((r) => (
            <div key={r.title} className="group flex gap-4 p-5 rounded-xl hover:bg-[var(--color-slate-light)] transition-all border border-transparent hover:border-slate-200">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                  r.color === "navy"
                    ? "bg-[var(--color-navy)]/10 text-[var(--color-navy)] group-hover:bg-[var(--color-navy)] group-hover:text-white"
                    : r.color === "teal"
                    ? "bg-[var(--color-teal)]/10 text-[var(--color-teal)] group-hover:bg-[var(--color-teal)] group-hover:text-white"
                    : r.color === "maroon"
                    ? "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)] group-hover:bg-[var(--color-maroon)] group-hover:text-white"
                    : "bg-[var(--color-gold)]/10 text-[var(--color-maroon)] group-hover:bg-[var(--color-gold)] group-hover:text-[var(--color-navy)]"
                }`}
              >
                {r.icon}
              </div>
              <div>
                <h3 className="font-bold text-[var(--color-navy)] mb-1.5">{r.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{r.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FacultySection() {
  return (
    <section className="py-20 bg-[var(--color-navy)]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <span className="badge-gold mb-3 inline-block">Our Team</span>
          <h2 className="font-[family-name:var(--font-playfair)] text-white text-3xl md:text-4xl font-bold">
            Faculty Who Make a Difference
          </h2>
          <p className="text-white/60 text-lg mt-3 max-w-2xl mx-auto">
            Learn from educators who have mastered both the subject and the art of teaching.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FACULTY.slice(0, 6).map((f) => (
            <div key={f.name} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--color-teal)] to-[var(--color-navy)] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {f.initials}
                </div>
                <div>
                  <h3 className="text-white font-semibold font-[family-name:var(--font-playfair)]">{f.name}</h3>
                  <div className="text-[var(--color-gold)] text-xs font-medium mt-0.5">{f.designation}</div>
                  <div className="text-white/50 text-xs mt-1">{f.experience} teaching experience</div>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="text-white/60 text-xs">{f.qualification}</div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {f.teaches.split(" · ").map((t) => (
                    <span key={t} className="bg-[var(--color-teal)]/15 text-[var(--color-teal-light)] text-xs px-2 py-0.5 rounded-full">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link href="/faculty" className="btn-gold px-8 py-3">
            Meet All Faculty
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function ToppersSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <span className="badge-gold mb-3 inline-block">2024 Results</span>
          <h2 className="section-heading">Our Toppers Shine Bright</h2>
          <p className="section-subheading mx-auto">
            Students who trusted Pinnacle and achieved their dream ranks in JEE and NEET 2024.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TOPPERS.map((t) => (
            <div key={t.name} className="card border-l-4 border-l-[var(--color-gold)] hover:shadow-elevated transition-all">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-maroon)] flex items-center justify-center text-white font-bold flex-shrink-0">
                  {t.initials}
                </div>
                <div>
                  <h3 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">{t.name}</h3>
                  <div className="text-[var(--color-teal)] font-bold text-lg">{t.rank}</div>
                  <div className="text-slate-500 text-xs">{t.exam}</div>
                </div>
              </div>
              <div className="bg-[var(--color-slate-light)] rounded-lg px-3 py-2 mb-3">
                <div className="text-[var(--color-navy)] text-sm font-semibold">{t.college}</div>
              </div>
              <p className="text-slate-600 text-sm italic">"{t.quote}"</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link href="/results" className="btn-primary px-8 py-3">
            View All Results
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="py-20 bg-[var(--color-slate-light)]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <span className="badge-navy mb-3 inline-block">Testimonials</span>
          <h2 className="section-heading">What Parents Say</h2>
          <p className="section-subheading mx-auto">
            Real words from real families who trusted Pinnacle with their children's futures.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="card relative">
              <div className="flex mb-4 gap-0.5">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} size={16} className="text-[var(--color-gold)]" fill="currentColor" />
                ))}
              </div>
              <p className="text-slate-700 text-sm leading-relaxed mb-4">"{t.text}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-navy)] to-[var(--color-teal)] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {t.initials}
                </div>
                <div>
                  <div className="font-semibold text-[var(--color-navy)] text-sm">{t.name}</div>
                  <div className="text-slate-500 text-xs">{t.role}</div>
                </div>
              </div>
              <div className="absolute top-4 right-4 text-[var(--color-navy)]/10 font-serif text-6xl leading-none">"</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function NoticeBoard() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <span className="badge-teal mb-2 inline-block">Latest</span>
            <h2 className="section-heading">Notice Board</h2>
          </div>
          <Link href="/notices" className="btn-outline py-2 px-5 text-sm">
            View All Notices
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
          {NOTICES.slice(0, 5).map((n) => (
            <div
              key={n.id}
              className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 px-5 py-4 hover:bg-[var(--color-slate-light)] transition-colors"
            >
              <div className="flex-shrink-0">
                <span
                  className={`badge ${
                    n.category === "Test"
                      ? "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]"
                      : n.category === "Fee"
                      ? "bg-[var(--color-gold)]/15 text-[var(--color-navy)]"
                      : n.category === "Admissions"
                      ? "bg-[var(--color-teal)]/10 text-[var(--color-teal)]"
                      : "bg-[var(--color-navy)]/10 text-[var(--color-navy)]"
                  }`}
                >
                  {n.category}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[var(--color-navy)] text-sm">{n.title}</div>
                <div className="text-slate-500 text-xs mt-0.5 truncate">{n.body}</div>
              </div>
              <div className="text-slate-400 text-xs flex-shrink-0">
                {new Date(n.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  return (
    <section className="py-20 bg-[var(--color-slate-light)]">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <span className="badge-navy mb-3 inline-block">FAQ</span>
          <h2 className="section-heading">Frequently Asked Questions</h2>
          <p className="section-subheading mx-auto">
            Everything you need to know before joining Pinnacle Academic Classes.
          </p>
        </div>

        <div className="space-y-4">
          {FAQ.map((item, idx) => (
            <div key={idx} className="card">
              <h3 className="font-bold text-[var(--color-navy)] text-sm mb-2">{item.q}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link href="/faq" className="btn-outline px-8 py-3">
            View All FAQs
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function CTABanner() {
  return (
    <section className="py-20 bg-gradient-to-r from-[var(--color-teal)] to-[var(--color-navy)]">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="font-[family-name:var(--font-playfair)] text-white text-3xl md:text-4xl font-bold mb-4">
          Ready to Begin Your Journey to the Top?
        </h2>
        <p className="text-white/75 text-lg mb-8 max-w-2xl mx-auto">
          Take the first step with a free demo class. No fees, no commitment — just expert teaching
          to show you what's possible.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/admissions" className="btn-gold text-base px-10 py-4">
            <BookOpen size={18} />
            Book Free Demo Class
          </Link>
          <a
            href={CONTACT.telHref}
            className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-lg border-2 border-white/40 text-white font-semibold text-base hover:bg-white hover:text-[var(--color-navy)] transition-all"
          >
            <Phone size={18} />
            Call {CONTACT.phone}
          </a>
        </div>
        <div className="flex items-center justify-center gap-4 mt-8 flex-wrap">
          {[CONTACT.addressShort, CONTACT.hours, CONTACT.email].map((info) => (
            <div key={info} className="flex items-center gap-2 text-white/60 text-sm">
              <MapPin size={12} className="text-[var(--color-gold)]" />
              {info}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

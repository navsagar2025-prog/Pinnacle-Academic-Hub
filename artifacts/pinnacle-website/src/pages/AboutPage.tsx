import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import { STATS } from "@/lib/data";
import { CONTACT } from "@/lib/contact";
import { CheckCircle, Award, Users, MapPin, Phone, Mail } from "lucide-react";

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="bg-[var(--color-navy)] py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <span className="badge-gold mb-4 inline-block">Our Story</span>
            <h1 className="font-[family-name:var(--font-playfair)] text-white text-4xl md:text-5xl font-bold leading-tight">
              About Pinnacle Academic Classes
            </h1>
            <p className="text-white/70 text-lg mt-4 leading-relaxed">
              Founded in 2012 under KCK Corporate Services Pvt. Ltd., Pinnacle Academic Classes has been
              Greater Noida's most trusted coaching destination for competitive examinations and board excellence.
            </p>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="badge-navy mb-3 inline-block">Our Mission</span>
                <h2 className="section-heading">Shaping the Future, One Student at a Time</h2>
                <div className="mt-4 rounded-2xl overflow-hidden shadow-md">
                  <img
                    src="/gallery/campus/img04.jpg"
                    alt="Pinnacle Academic Classes — Gaur City 2, Greater Noida"
                    className="w-full h-48 object-cover object-top"
                  />
                </div>
                <p className="text-slate-600 mt-4 leading-relaxed">
                  At Pinnacle, we believe that every student has the potential to achieve great things.
                  Our mission is to provide world-class teaching, structured guidance, and a supportive
                  environment that helps students realise their full academic potential.
                </p>
                <p className="text-slate-600 mt-3 leading-relaxed">
                  From foundational science for Grade 6 students to advanced JEE and NEET preparation,
                  we have built a holistic ecosystem that nurtures not just academic excellence but also
                  character, discipline, and resilience.
                </p>
                <ul className="space-y-2 mt-6">
                  {[
                    "Expert faculty from IIT, NIT, and leading universities",
                    "Structured curriculum aligned with competitive exam patterns",
                    "Regular mock tests with detailed analytics",
                    "Parent-teacher collaboration for every student",
                    "Modern digital platform for anytime learning",
                  ].map((p) => (
                    <li key={p} className="flex items-start gap-2 text-slate-700 text-sm">
                      <CheckCircle size={15} className="text-[var(--color-teal)] flex-shrink-0 mt-0.5" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-[var(--color-navy)] rounded-2xl p-8 text-white space-y-6">
                <h3 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[var(--color-gold)]">
                  Key Milestones
                </h3>
                {[
                  { year: "2012", event: "Founded in Greater Noida with 2 batches and 12 students." },
                  { year: "2015", event: "Expanded to 5 course programmes. First IIT selection." },
                  { year: "2018", event: "500+ students trained. Moved to current Gaur City 2 campus." },
                  { year: "2021", event: "Launched digital student portal. Online classes during COVID." },
                  { year: "2024", event: "85+ IIT/AIIMS selections. 2,000+ students trained." },
                ].map((m) => (
                  <div key={m.year} className="flex gap-4">
                    <div className="w-14 h-8 bg-[var(--color-gold)]/20 rounded flex items-center justify-center text-[var(--color-gold)] font-bold text-sm flex-shrink-0">
                      {m.year}
                    </div>
                    <p className="text-white/70 text-sm leading-relaxed">{m.event}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-[var(--color-slate-light)]">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="section-heading">Our Numbers</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {STATS.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <div className="text-2xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">{stat.value}</div>
                  <div className="text-slate-500 text-sm mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-10">
              <span className="badge-teal mb-3 inline-block">What We Stand For</span>
              <h2 className="section-heading">Our Core Values</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: <Award size={24} />, title: "Excellence", description: "We never settle for less than the best — for ourselves and our students." },
                { icon: <Users size={24} />, title: "Inclusivity", description: "Quality coaching for every student, regardless of background or starting point." },
                { icon: <CheckCircle size={24} />, title: "Integrity", description: "Transparent communication, honest assessments, and ethical conduct always." },
                { icon: <Award size={24} />, title: "Innovation", description: "Continuously improving our methods, materials, and technology." },
              ].map((v) => (
                <div key={v.title} className="card text-center">
                  <div className="w-12 h-12 bg-[var(--color-teal)]/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-[var(--color-teal)]">{v.icon}</div>
                  <h3 className="font-bold text-[var(--color-navy)] mb-2 font-[family-name:var(--font-playfair)]">{v.title}</h3>
                  <p className="text-slate-600 text-sm">{v.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-[var(--color-slate-light)]">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <span className="badge-navy mb-3 inline-block">Find Us</span>
            <h2 className="section-heading">Visit Our Campus</h2>
            <div className="card mt-8 text-left">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex gap-3">
                  <MapPin size={18} className="text-[var(--color-teal)] flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-semibold text-[var(--color-navy)] mb-1">Address</div>
                    <p className="text-slate-600 text-sm">{CONTACT.address}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Phone size={18} className="text-[var(--color-teal)] flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-semibold text-[var(--color-navy)] mb-1">Phone</div>
                    <a href={CONTACT.telHref} className="text-slate-600 text-sm hover:text-[var(--color-teal)] transition-colors">{CONTACT.phone}</a>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Mail size={18} className="text-[var(--color-teal)] flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-semibold text-[var(--color-navy)] mb-1">Email</div>
                    <a href={CONTACT.emailHref} className="text-slate-600 text-sm hover:text-[var(--color-teal)] transition-colors">{CONTACT.email}</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}

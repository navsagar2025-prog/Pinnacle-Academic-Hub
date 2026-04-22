import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function About() {
  return (
    <PublicLayout>
      <div className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">About Pinnacle</h1>
          <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
            Nurturing excellence through quality education, dedicated mentorship, and an unwavering commitment to student success.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24">
          <div>
            <h2 className="text-3xl font-serif font-bold text-primary mb-6">Our History & Mission</h2>
            <p className="text-muted-foreground mb-4">
              Established with a vision to provide premium coaching to students in Greater Noida, Pinnacle Academic Classes has grown from a humble beginning into a trusted institution for academic excellence.
            </p>
            <p className="text-muted-foreground mb-6">
              Our mission is simple: to make high-quality education accessible, engaging, and result-oriented. We believe that every student has the potential to excel given the right environment, expert guidance, and personal attention.
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-sm text-foreground font-medium">
                <div className="w-2 h-2 rounded-full bg-accent"></div> 14+ Years of Educational Excellence
              </li>
              <li className="flex items-center gap-3 text-sm text-foreground font-medium">
                <div className="w-2 h-2 rounded-full bg-accent"></div> Consistently 95%+ Success Rate
              </li>
              <li className="flex items-center gap-3 text-sm text-foreground font-medium">
                <div className="w-2 h-2 rounded-full bg-accent"></div> Trusted by 500+ Parents Annually
              </li>
            </ul>
          </div>
          <div className="relative rounded-2xl overflow-hidden aspect-video shadow-xl">
            <img src="/about-classroom.png" alt="Pinnacle Smart Classroom" className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-border mb-24 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-accent"></div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-primary mb-6">A Note From Leadership</h2>
          <div className="max-w-3xl mx-auto">
            <p className="text-muted-foreground italic text-lg mb-6 leading-relaxed">
              "At Pinnacle, we don't just prepare students for exams; we prepare them for life. We understand the anxieties parents face and the pressure students feel. That's why our approach is rooted in empathy as much as it is in academic rigor. When you choose Pinnacle, you aren't just enrolling in a coaching class—you are joining a family that is deeply invested in your child's future."
            </p>
            <div className="font-bold text-foreground">Director, Pinnacle Academic Classes</div>
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-serif font-bold text-primary mb-12 text-center">Premium Infrastructure</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-background rounded-2xl p-6 border border-border">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6 text-xl font-bold">01</div>
              <h3 className="text-xl font-bold text-foreground mb-3">Smart Classrooms</h3>
              <p className="text-muted-foreground text-sm">Air-conditioned classrooms equipped with interactive digital panels to make learning visual and engaging.</p>
            </div>
            <div className="bg-background rounded-2xl p-6 border border-border">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6 text-xl font-bold">02</div>
              <h3 className="text-xl font-bold text-foreground mb-3">Digital Library</h3>
              <p className="text-muted-foreground text-sm">Access to thousands of e-books, previous year papers, and premium study materials through our student portal.</p>
            </div>
            <div className="bg-background rounded-2xl p-6 border border-border">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6 text-xl font-bold">03</div>
              <h3 className="text-xl font-bold text-foreground mb-3">Quiet Study Rooms</h3>
              <p className="text-muted-foreground text-sm">Dedicated spaces for self-study and doubt-clearing sessions outside of regular class hours.</p>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

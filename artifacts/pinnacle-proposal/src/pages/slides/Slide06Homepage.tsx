export default function Slide06Homepage() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg">
      <div className="absolute top-0 left-0 w-[5px] h-full bg-teal" />
      <div className="absolute inset-0 px-[8vw] pt-[7vh] pb-[5vh] flex flex-col">
        <p className="font-body text-accent text-[1.6vw] tracking-[0.25em] uppercase font-semibold mb-[1.5vh]">
          04 — Homepage Structure
        </p>
        <h2
          className="font-display text-primary text-[3.5vw] font-bold tracking-tight mb-[3.5vh]"
          style={{ textWrap: "balance" }}
        >
          What Visitors See — Section by Section
        </h2>
        <div className="w-[6vw] h-[3px] bg-accent mb-[3.5vh]" />
        <div className="flex gap-[2vw]" style={{ height: "52vh" }}>
          <div className="flex flex-col gap-[1.8vh] flex-1">
            <div className="flex items-start gap-[1.5vw]">
              <div className="w-[2.8vw] h-[2.8vw] rounded-full bg-primary flex-shrink-0 flex items-center justify-center">
                <span className="font-body text-white text-[1.4vw] font-bold">1</span>
              </div>
              <div>
                <p className="font-display text-primary text-[1.8vw] font-bold mb-[0.3vh]">Hero Banner</p>
                <p className="font-body text-muted text-[1.55vw]">
                  Full-width headline, badge list (IIT/JEE/NEET/Class 6–12), and two CTAs: Enquire Now + Book Free Demo
                </p>
              </div>
            </div>
            <div className="flex items-start gap-[1.5vw]">
              <div className="w-[2.8vw] h-[2.8vw] rounded-full bg-teal flex-shrink-0 flex items-center justify-center">
                <span className="font-body text-white text-[1.4vw] font-bold">2</span>
              </div>
              <div>
                <p className="font-display text-primary text-[1.8vw] font-bold mb-[0.3vh]">Trust Indicators</p>
                <p className="font-body text-muted text-[1.55vw]">
                  Key numbers — students enrolled, years of experience, results, satisfaction rate
                </p>
              </div>
            </div>
            <div className="flex items-start gap-[1.5vw]">
              <div className="w-[2.8vw] h-[2.8vw] rounded-full bg-accent flex-shrink-0 flex items-center justify-center">
                <span className="font-body text-primary text-[1.4vw] font-bold">3</span>
              </div>
              <div>
                <p className="font-display text-primary text-[1.8vw] font-bold mb-[0.3vh]">Courses Overview</p>
                <p className="font-body text-muted text-[1.55vw]">
                  Card grid: IIT-JEE, NEET, Boards, Foundation — each with description and Enrol CTA
                </p>
              </div>
            </div>
            <div className="flex items-start gap-[1.5vw]">
              <div className="w-[2.8vw] h-[2.8vw] rounded-full bg-maroon flex-shrink-0 flex items-center justify-center">
                <span className="font-body text-white text-[1.4vw] font-bold">4</span>
              </div>
              <div>
                <p className="font-display text-primary text-[1.8vw] font-bold mb-[0.3vh]">Why Pinnacle</p>
                <p className="font-body text-muted text-[1.55vw]">
                  Differentiators: expert faculty, live + recorded classes, digital materials, personal attention
                </p>
              </div>
            </div>
          </div>
          <div className="w-[1px]" style={{ background: "rgba(10,31,92,0.15)" }} />
          <div className="flex flex-col gap-[1.8vh] flex-1">
            <div className="flex items-start gap-[1.5vw]">
              <div className="w-[2.8vw] h-[2.8vw] rounded-full bg-primary flex-shrink-0 flex items-center justify-center">
                <span className="font-body text-white text-[1.4vw] font-bold">5</span>
              </div>
              <div>
                <p className="font-display text-primary text-[1.8vw] font-bold mb-[0.3vh]">Toppers & Results</p>
                <p className="font-body text-muted text-[1.55vw]">
                  Photo grid of top scorers with scores — social proof for parents and new enquiries
                </p>
              </div>
            </div>
            <div className="flex items-start gap-[1.5vw]">
              <div className="w-[2.8vw] h-[2.8vw] rounded-full bg-teal flex-shrink-0 flex items-center justify-center">
                <span className="font-body text-white text-[1.4vw] font-bold">6</span>
              </div>
              <div>
                <p className="font-display text-primary text-[1.8vw] font-bold mb-[0.3vh]">Faculty Spotlight</p>
                <p className="font-body text-muted text-[1.55vw]">
                  Teaching team with photos, subject, and brief credentials
                </p>
              </div>
            </div>
            <div className="flex items-start gap-[1.5vw]">
              <div className="w-[2.8vw] h-[2.8vw] rounded-full bg-accent flex-shrink-0 flex items-center justify-center">
                <span className="font-body text-primary text-[1.4vw] font-bold">7</span>
              </div>
              <div>
                <p className="font-display text-primary text-[1.8vw] font-bold mb-[0.3vh]">Parent Testimonials</p>
                <p className="font-body text-muted text-[1.55vw]">
                  Carousel of parent and student reviews to reinforce trust
                </p>
              </div>
            </div>
            <div className="flex items-start gap-[1.5vw]">
              <div className="w-[2.8vw] h-[2.8vw] rounded-full bg-maroon flex-shrink-0 flex items-center justify-center">
                <span className="font-body text-white text-[1.4vw] font-bold">8</span>
              </div>
              <div>
                <p className="font-display text-primary text-[1.8vw] font-bold mb-[0.3vh]">Sticky Enquiry + WhatsApp</p>
                <p className="font-body text-muted text-[1.55vw]">
                  Mobile-only sticky bar: Call · WhatsApp · Enquire — always visible, always converting
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

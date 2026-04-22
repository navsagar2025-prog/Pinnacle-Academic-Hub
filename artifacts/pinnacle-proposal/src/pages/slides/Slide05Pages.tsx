export default function Slide05Pages() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg">
      <div className="absolute top-0 left-0 w-[5px] h-full bg-teal" />
      <div className="absolute inset-0 px-[8vw] pt-[7vh] pb-[6vh] flex flex-col">
        <p className="font-body text-accent text-[1.6vw] tracking-[0.25em] uppercase font-semibold mb-[1.5vh]">
          03 — Website Coverage
        </p>
        <h2
          className="font-display text-primary text-[3.5vw] font-bold tracking-tight mb-[4vh]"
          style={{ textWrap: "balance" }}
        >
          16 Pages. Complete Coverage.
        </h2>
        <div className="w-[6vw] h-[3px] bg-accent mb-[4vh]" />
        <div className="grid grid-cols-2 gap-[3vw]" style={{ height: "50vh" }}>
          <div className="rounded-lg px-[2.5vw] py-[2.5vh]" style={{ background: "rgba(10,31,92,0.07)" }}>
            <p className="font-body text-teal text-[1.5vw] uppercase tracking-widest font-semibold mb-[1.5vh]">
              Marketing & Trust
            </p>
            <p className="font-body text-primary text-[1.7vw] leading-relaxed">
              Home · About Us · Courses · Faculty · Gallery · Blog · Testimonials
            </p>
          </div>
          <div className="rounded-lg px-[2.5vw] py-[2.5vh]" style={{ background: "rgba(10,31,92,0.07)" }}>
            <p className="font-body text-teal text-[1.5vw] uppercase tracking-widest font-semibold mb-[1.5vh]">
              Admissions & Results
            </p>
            <p className="font-body text-primary text-[1.7vw] leading-relaxed">
              Admissions · Results / Success Stories · Notice Board & Events
            </p>
          </div>
          <div className="rounded-lg px-[2.5vw] py-[2.5vh]" style={{ background: "rgba(10,31,92,0.07)" }}>
            <p className="font-body text-teal text-[1.5vw] uppercase tracking-widest font-semibold mb-[1.5vh]">
              Resources & Support
            </p>
            <p className="font-body text-primary text-[1.7vw] leading-relaxed">
              Study Material · Fee Payment · Contact Us · FAQ
            </p>
          </div>
          <div className="rounded-lg px-[2.5vw] py-[2.5vh]" style={{ background: "rgba(10,31,92,0.07)" }}>
            <p className="font-body text-teal text-[1.5vw] uppercase tracking-widest font-semibold mb-[1.5vh]">
              Legal & Policy
            </p>
            <p className="font-body text-primary text-[1.7vw] leading-relaxed">
              Privacy Policy · Terms & Conditions · Refund Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

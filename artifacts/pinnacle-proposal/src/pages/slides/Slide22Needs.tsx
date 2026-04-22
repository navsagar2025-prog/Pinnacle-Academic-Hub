export default function Slide22Needs() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg">
      <div className="absolute top-0 left-0 w-[5px] h-full bg-accent" />
      <div className="absolute inset-0 px-[8vw] pt-[7vh] pb-[6vh] flex flex-col">
        <p className="font-body text-accent text-[1.6vw] tracking-[0.25em] uppercase font-semibold mb-[1.5vh]">
          16 — Requirements
        </p>
        <h2
          className="font-display text-primary text-[3.5vw] font-bold tracking-tight mb-[4vh]"
          style={{ textWrap: "balance" }}
        >
          To Get Started, We Need From You
        </h2>
        <div className="w-[6vw] h-[3px] bg-accent mb-[5vh]" />
        <div className="flex flex-col gap-[3vh]" style={{ height: "48vh" }}>
          <div className="flex items-center gap-[3vw]">
            <div className="w-[3vw] h-[3vw] rounded-full bg-primary flex-shrink-0 flex items-center justify-center">
              <span className="font-body text-white text-[1.6vw] font-bold">1</span>
            </div>
            <div>
              <p className="font-display text-primary text-[2vw] font-bold">Zoom Business or Pro Account</p>
              <p className="font-body text-muted text-[1.6vw]">Required to enable the Server-to-Server API for creating meetings programmatically</p>
            </div>
          </div>
          <div className="flex items-center gap-[3vw]">
            <div className="w-[3vw] h-[3vw] rounded-full bg-primary flex-shrink-0 flex items-center justify-center">
              <span className="font-body text-white text-[1.6vw] font-bold">2</span>
            </div>
            <div>
              <p className="font-display text-primary text-[2vw] font-bold">Institute Logo & Branding Assets</p>
              <p className="font-body text-muted text-[1.6vw]">High-resolution logo in PNG/SVG format and any preferred brand colours</p>
            </div>
          </div>
          <div className="flex items-center gap-[3vw]">
            <div className="w-[3vw] h-[3vw] rounded-full bg-primary flex-shrink-0 flex items-center justify-center">
              <span className="font-body text-white text-[1.6vw] font-bold">3</span>
            </div>
            <div>
              <p className="font-display text-primary text-[2vw] font-bold">Course & Faculty Information</p>
              <p className="font-body text-muted text-[1.6vw]">List of courses offered, batch names, teacher profiles, and fee structure details</p>
            </div>
          </div>
          <div className="flex items-center gap-[3vw]">
            <div className="w-[3vw] h-[3vw] rounded-full bg-primary flex-shrink-0 flex items-center justify-center">
              <span className="font-body text-white text-[1.6vw] font-bold">4</span>
            </div>
            <div>
              <p className="font-display text-primary text-[2vw] font-bold">Results & Testimonials</p>
              <p className="font-body text-muted text-[1.6vw]">Student achievement data, topper photographs, and parent testimonials for the public website</p>
            </div>
          </div>
          <div className="flex items-center gap-[3vw]">
            <div className="w-[3vw] h-[3vw] rounded-full bg-primary flex-shrink-0 flex items-center justify-center">
              <span className="font-body text-white text-[1.6vw] font-bold">5</span>
            </div>
            <div>
              <p className="font-display text-primary text-[2vw] font-bold">WhatsApp Business Number</p>
              <p className="font-body text-muted text-[1.6vw]">The official WhatsApp number to be linked across all enquiry CTAs on the website</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

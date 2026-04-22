export default function Slide07Design() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-primary">
      <div className="absolute top-0 left-0 w-[8px] h-full bg-accent" />
      <div
        className="absolute right-0 top-0 w-[50vw] h-full opacity-5"
        style={{ background: "radial-gradient(ellipse at right center, #0D7377 0%, transparent 70%)" }}
      />
      <div className="absolute inset-0 px-[8vw] pt-[7vh] pb-[6vh] flex flex-col">
        <p className="font-body text-accent text-[1.6vw] tracking-[0.25em] uppercase font-semibold mb-[1.5vh]">
          05 — Design Direction
        </p>
        <h2
          className="font-display text-white text-[3.5vw] font-bold tracking-tight mb-[4vh]"
          style={{ textWrap: "balance" }}
        >
          Premium Academic Aesthetic
        </h2>
        <div className="w-[6vw] h-[3px] bg-accent mb-[5vh]" />
        <div className="flex gap-[4vw]" style={{ height: "48vh" }}>
          <div className="flex flex-col gap-[2vh] w-[28vw]">
            <p className="font-body text-[1.6vw] tracking-widest uppercase mb-[1vh]" style={{ color: "rgba(255,255,255,0.5)" }}>
              Colour Palette
            </p>
            <div className="flex items-center gap-[2vw]">
              <div className="w-[5vw] h-[5vw] rounded-md" style={{ background: "#0A1F5C" }} />
              <p className="font-body text-white text-[1.6vw]">Navy — Authority</p>
            </div>
            <div className="flex items-center gap-[2vw]">
              <div className="w-[5vw] h-[5vw] rounded-md" style={{ background: "#0D7377" }} />
              <p className="font-body text-white text-[1.6vw]">Teal — Growth</p>
            </div>
            <div className="flex items-center gap-[2vw]">
              <div className="w-[5vw] h-[5vw] rounded-md" style={{ background: "#8B1A1A" }} />
              <p className="font-body text-white text-[1.6vw]">Maroon — Heritage</p>
            </div>
            <div className="flex items-center gap-[2vw]">
              <div className="w-[5vw] h-[5vw] rounded-md" style={{ background: "#C9A84C" }} />
              <p className="font-body text-white text-[1.6vw]">Gold — Excellence</p>
            </div>
          </div>
          <div className="w-[1px]" style={{ background: "rgba(255,255,255,0.15)" }} />
          <div className="flex flex-col justify-center flex-1">
            <p className="font-body text-[1.6vw] tracking-widest uppercase mb-[3vh]" style={{ color: "rgba(255,255,255,0.5)" }}>
              Design Principles
            </p>
            <p className="font-display text-white text-[2.5vw] font-normal italic mb-[2.5vh]">
              "Professional, parent-friendly, and trustworthy — at every touchpoint."
            </p>
            <div className="flex flex-col gap-[1.5vh]">
              <p className="font-body text-[1.7vw]" style={{ color: "rgba(255,255,255,0.75)" }}>
                Clean layouts · Disciplined spacing · Strong typography
              </p>
              <p className="font-body text-[1.7vw]" style={{ color: "rgba(255,255,255,0.75)" }}>
                Fully mobile-responsive · Fast-loading · SEO-optimised
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

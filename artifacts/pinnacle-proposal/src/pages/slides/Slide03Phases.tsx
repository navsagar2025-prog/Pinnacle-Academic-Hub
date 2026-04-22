export default function Slide03Phases() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg">
      <div className="absolute top-0 left-0 w-[5px] h-full bg-teal" />
      <div className="absolute inset-0 px-[8vw] pt-[7vh] pb-[6vh] flex flex-col">
        <p className="font-body text-accent text-[1.6vw] tracking-[0.25em] uppercase font-semibold mb-[1.5vh]">
          02 — Project Timeline
        </p>
        <h2
          className="font-display text-primary text-[3.5vw] font-bold tracking-tight leading-tight mb-[4vh]"
          style={{ textWrap: "balance" }}
        >
          A Phased Approach to Digital Excellence
        </h2>
        <div className="w-[6vw] h-[3px] bg-accent mb-[5vh]" />
        <div className="flex gap-[2.5vw] items-stretch" style={{ height: "48vh" }}>
          <div className="flex-1 bg-primary rounded-lg flex flex-col px-[3vw] py-[4vh]">
            <p className="font-body text-accent text-[1.5vw] tracking-widest uppercase font-semibold mb-[1.5vh]">
              Phase 1
            </p>
            <h3 className="font-display text-white text-[2.5vw] font-bold mb-[1vh]">
              Website + Portals
            </h3>
            <p className="font-body text-[1.7vw] mb-[2.5vh]" style={{ color: "rgba(255,255,255,0.6)" }}>
              Months 1 – 3
            </p>
            <div className="w-full h-[1px] mb-[2.5vh]" style={{ background: "rgba(255,255,255,0.2)" }} />
            <p className="font-body text-white text-[1.7vw] leading-relaxed">
              Public website, student portal, parent portal, teacher portal, live class scheduling via Zoom, and admin panel — all fully functional.
            </p>
          </div>
          <div className="flex items-center justify-center w-[6vw]">
            <p className="font-body text-muted text-[3vw] font-light">→</p>
          </div>
          <div
            className="flex-1 rounded-lg flex flex-col px-[3vw] py-[4vh] border-[2px]"
            style={{ borderColor: "#0D7377" }}
          >
            <p
              className="font-body text-[1.5vw] tracking-widest uppercase font-semibold mb-[1.5vh]"
              style={{ color: "#0D7377" }}
            >
              Phase 2
            </p>
            <h3 className="font-display text-primary text-[2.5vw] font-bold mb-[1vh]">
              Android Application
            </h3>
            <p className="font-body text-muted text-[1.7vw] mb-[2.5vh]">Months 4 – 6</p>
            <div className="w-full h-[1px] bg-muted mb-[2.5vh]" />
            <p className="font-body text-primary text-[1.7vw] leading-relaxed">
              The complete platform optimised for mobile. Same database, same API — a native Android experience for students and parents.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

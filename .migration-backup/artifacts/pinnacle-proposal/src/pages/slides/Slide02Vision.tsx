export default function Slide02Vision() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg">
      <div className="absolute top-0 left-0 w-[5px] h-full bg-teal" />
      <div className="absolute inset-0 px-[8vw] pt-[7vh] pb-[6vh] flex flex-col">
        <p className="font-body text-accent text-[1.6vw] tracking-[0.25em] uppercase font-semibold mb-[1.5vh]">
          01 — The Vision
        </p>
        <h2
          className="font-display text-primary text-[4vw] font-bold leading-tight tracking-tight"
          style={{ textWrap: "balance" }}
        >
          One Platform.
        </h2>
        <h2
          className="font-display text-[4vw] font-bold leading-tight tracking-tight mb-[3vh]"
          style={{ color: "#0D7377", textWrap: "balance" }}
        >
          Every Stakeholder.
        </h2>
        <div className="w-[6vw] h-[3px] bg-accent mb-[5vh]" />
        <div className="grid grid-cols-3 gap-[3vw] flex-1">
          <div className="flex flex-col">
            <div className="w-[3vw] h-[3px] bg-primary mb-[2vh]" />
            <h3 className="font-display text-primary text-[2vw] font-bold mb-[1.5vh]">
              Public Website
            </h3>
            <p className="font-body text-muted text-[1.7vw] leading-relaxed">
              16 professionally designed pages generating daily admissions enquiries and building lasting institutional trust.
            </p>
          </div>
          <div className="flex flex-col">
            <div className="w-[3vw] h-[3px] mb-[2vh]" style={{ background: "#0D7377" }} />
            <h3
              className="font-display text-[2vw] font-bold mb-[1.5vh]"
              style={{ color: "#0D7377" }}
            >
              Role-Based Portals
            </h3>
            <p className="font-body text-muted text-[1.7vw] leading-relaxed">
              Dedicated, secure dashboards for students, parents, and teachers — all in one unified system.
            </p>
          </div>
          <div className="flex flex-col">
            <div className="w-[3vw] h-[3px] bg-accent mb-[2vh]" />
            <h3 className="font-display text-accent text-[2vw] font-bold mb-[1.5vh]">
              Android App
            </h3>
            <p className="font-body text-muted text-[1.7vw] leading-relaxed">
              Phase 2 — the full platform in every student's pocket. Same database, same data, new mobile surface.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

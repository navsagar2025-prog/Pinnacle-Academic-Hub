export default function Slide16WhyZoom() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg">
      <div className="absolute top-0 left-0 w-[5px] h-full bg-teal" />
      <div className="absolute inset-0 px-[8vw] pt-[7vh] pb-[6vh] flex flex-col">
        <p className="font-body text-accent text-[1.6vw] tracking-[0.25em] uppercase font-semibold mb-[1.5vh]">
          12 — Platform Choice
        </p>
        <h2
          className="font-display text-primary text-[3.5vw] font-bold tracking-tight mb-[4vh]"
        >
          Why We Chose Zoom
        </h2>
        <div className="w-[6vw] h-[3px] bg-accent mb-[4vh]" />
        <div className="grid grid-cols-2 gap-[2.5vw]" style={{ height: "50vh" }}>
          <div className="flex flex-col px-[2.5vw] py-[2.5vh] rounded-lg" style={{ background: "rgba(13,115,119,0.08)" }}>
            <p className="font-display text-teal text-[2vw] font-bold mb-[1.5vh]">Trusted by Indian Families</p>
            <p className="font-body text-muted text-[1.7vw] leading-relaxed">
              Parents and students already know Zoom. No learning curve. No hesitation.
            </p>
          </div>
          <div className="flex flex-col px-[2.5vw] py-[2.5vh] rounded-lg" style={{ background: "rgba(13,115,119,0.08)" }}>
            <p className="font-display text-teal text-[2vw] font-bold mb-[1.5vh]">Cloud Recording Built In</p>
            <p className="font-body text-muted text-[1.7vw] leading-relaxed">
              Every class is recorded automatically to Zoom's cloud — no extra setup, no storage costs on the institute.
            </p>
          </div>
          <div className="flex flex-col px-[2.5vw] py-[2.5vh] rounded-lg" style={{ background: "rgba(13,115,119,0.08)" }}>
            <p className="font-display text-teal text-[2vw] font-bold mb-[1.5vh]">No Extra Infrastructure</p>
            <p className="font-body text-muted text-[1.7vw] leading-relaxed">
              Meetings are created and managed via Zoom's API — no video server required for the institute.
            </p>
          </div>
          <div className="flex flex-col px-[2.5vw] py-[2.5vh] rounded-lg" style={{ background: "rgba(13,115,119,0.08)" }}>
            <p className="font-display text-teal text-[2vw] font-bold mb-[1.5vh]">Android-Ready for Phase 2</p>
            <p className="font-body text-muted text-[1.7vw] leading-relaxed">
              Zoom's Android SDK or deep-link integration ensures live classes work seamlessly in the Phase 2 mobile app.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

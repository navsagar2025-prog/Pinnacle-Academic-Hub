export default function Slide10Student() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg">
      <div className="absolute top-0 left-0 w-[5px] h-full bg-teal" />
      <div className="absolute inset-0 px-[8vw] pt-[7vh] pb-[6vh] flex flex-col">
        <p className="font-body text-accent text-[1.6vw] tracking-[0.25em] uppercase font-semibold mb-[1.5vh]">
          07 — Student Portal
        </p>
        <h2
          className="font-display text-primary text-[3.5vw] font-bold tracking-tight mb-[4vh]"
        >
          The Student Experience
        </h2>
        <div className="w-[6vw] h-[3px] bg-accent mb-[4vh]" />
        <div className="grid grid-cols-3 gap-[2vw]" style={{ height: "48vh" }}>
          <div className="rounded-lg px-[2vw] py-[2.5vh]" style={{ background: "rgba(13,115,119,0.08)" }}>
            <p className="font-display text-teal text-[1.9vw] font-bold mb-[1.2vh]">Live Classes</p>
            <p className="font-body text-muted text-[1.6vw] leading-relaxed">Join scheduled live classes via Zoom with a single tap from the dashboard.</p>
          </div>
          <div className="rounded-lg px-[2vw] py-[2.5vh]" style={{ background: "rgba(13,115,119,0.08)" }}>
            <p className="font-display text-teal text-[1.9vw] font-bold mb-[1.2vh]">Recorded Classes</p>
            <p className="font-body text-muted text-[1.6vw] leading-relaxed">Replay any missed class at any time — recordings auto-saved after every session.</p>
          </div>
          <div className="rounded-lg px-[2vw] py-[2.5vh]" style={{ background: "rgba(13,115,119,0.08)" }}>
            <p className="font-display text-teal text-[1.9vw] font-bold mb-[1.2vh]">Study Materials</p>
            <p className="font-body text-muted text-[1.6vw] leading-relaxed">Download subject-wise notes, PDFs, and resources uploaded by teachers.</p>
          </div>
          <div className="rounded-lg px-[2vw] py-[2.5vh]" style={{ background: "rgba(13,115,119,0.08)" }}>
            <p className="font-display text-teal text-[1.9vw] font-bold mb-[1.2vh]">Practice Papers</p>
            <p className="font-body text-muted text-[1.6vw] leading-relaxed">Access and download past exam papers and practice sets by subject and batch.</p>
          </div>
          <div className="rounded-lg px-[2vw] py-[2.5vh]" style={{ background: "rgba(13,115,119,0.08)" }}>
            <p className="font-display text-teal text-[1.9vw] font-bold mb-[1.2vh]">Timetable</p>
            <p className="font-body text-muted text-[1.6vw] leading-relaxed">View personal batch schedule and upcoming class timings at a glance.</p>
          </div>
          <div className="rounded-lg px-[2vw] py-[2.5vh]" style={{ background: "rgba(13,115,119,0.08)" }}>
            <p className="font-display text-teal text-[1.9vw] font-bold mb-[1.2vh]">Fee Status</p>
            <p className="font-body text-muted text-[1.6vw] leading-relaxed">Check payment history and view current fee dues anytime.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

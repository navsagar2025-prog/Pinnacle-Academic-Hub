export default function Slide15HowLive() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg">
      <div className="absolute top-0 left-0 w-[5px] h-full bg-teal" />
      <div className="absolute inset-0 px-[8vw] pt-[7vh] pb-[6vh] flex flex-col">
        <p className="font-body text-accent text-[1.6vw] tracking-[0.25em] uppercase font-semibold mb-[1.5vh]">
          11 — Live Class Workflow
        </p>
        <h2
          className="font-display text-primary text-[3.5vw] font-bold tracking-tight mb-[4vh]"
        >
          How a Live Class Works
        </h2>
        <div className="w-[6vw] h-[3px] bg-accent mb-[5vh]" />
        <div className="flex items-start gap-[0px]" style={{ height: "46vh" }}>
          <div className="flex flex-col items-center flex-1">
            <div className="w-[4vw] h-[4vw] rounded-full bg-primary flex items-center justify-center mb-[2vh]">
              <span className="font-body text-white text-[1.8vw] font-bold">1</span>
            </div>
            <p className="font-display text-primary text-[1.8vw] font-bold text-center mb-[1vh]">Teacher Schedules</p>
            <p className="font-body text-muted text-[1.5vw] text-center leading-relaxed">Selects batch, subject, and date/time in the teacher portal</p>
          </div>
          <div className="flex items-center justify-center pt-[1.5vh]" style={{ width: "4vw" }}>
            <p className="font-body text-muted text-[2.5vw]">→</p>
          </div>
          <div className="flex flex-col items-center flex-1">
            <div className="w-[4vw] h-[4vw] rounded-full bg-teal flex items-center justify-center mb-[2vh]">
              <span className="font-body text-white text-[1.8vw] font-bold">2</span>
            </div>
            <p className="font-display text-primary text-[1.8vw] font-bold text-center mb-[1vh]">Zoom Meeting Created</p>
            <p className="font-body text-muted text-[1.5vw] text-center leading-relaxed">System auto-creates a Zoom meeting and stores the join link in the portal</p>
          </div>
          <div className="flex items-center justify-center pt-[1.5vh]" style={{ width: "4vw" }}>
            <p className="font-body text-muted text-[2.5vw]">→</p>
          </div>
          <div className="flex flex-col items-center flex-1">
            <div className="w-[4vw] h-[4vw] rounded-full bg-accent flex items-center justify-center mb-[2vh]">
              <span className="font-body text-primary text-[1.8vw] font-bold">3</span>
            </div>
            <p className="font-display text-primary text-[1.8vw] font-bold text-center mb-[1vh]">Students Join</p>
            <p className="font-body text-muted text-[1.5vw] text-center leading-relaxed">Students see "Join Class" button in their dashboard and enter with one click</p>
          </div>
          <div className="flex items-center justify-center pt-[1.5vh]" style={{ width: "4vw" }}>
            <p className="font-body text-muted text-[2.5vw]">→</p>
          </div>
          <div className="flex flex-col items-center flex-1">
            <div className="w-[4vw] h-[4vw] rounded-full bg-maroon flex items-center justify-center mb-[2vh]">
              <span className="font-body text-white text-[1.8vw] font-bold">4</span>
            </div>
            <p className="font-display text-primary text-[1.8vw] font-bold text-center mb-[1vh]">Class Recorded</p>
            <p className="font-body text-muted text-[1.5vw] text-center leading-relaxed">Zoom cloud recording captures the full session automatically</p>
          </div>
          <div className="flex items-center justify-center pt-[1.5vh]" style={{ width: "4vw" }}>
            <p className="font-body text-muted text-[2.5vw]">→</p>
          </div>
          <div className="flex flex-col items-center flex-1">
            <div className="w-[4vw] h-[4vw] rounded-full bg-teal flex items-center justify-center mb-[2vh]">
              <span className="font-body text-white text-[1.8vw] font-bold">5</span>
            </div>
            <p className="font-display text-primary text-[1.8vw] font-bold text-center mb-[1vh]">Replay Available</p>
            <p className="font-body text-muted text-[1.5vw] text-center leading-relaxed">Recording link saved to portal — students can rewatch at any time</p>
          </div>
        </div>
      </div>
    </div>
  );
}

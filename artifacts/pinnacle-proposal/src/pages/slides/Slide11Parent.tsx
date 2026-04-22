export default function Slide11Parent() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg">
      <div className="absolute top-0 left-0 w-[5px] h-full bg-accent" />
      <div className="absolute inset-0 px-[8vw] pt-[7vh] pb-[6vh] flex flex-col">
        <p className="font-body text-accent text-[1.6vw] tracking-[0.25em] uppercase font-semibold mb-[1.5vh]">
          08 — Parent Portal
        </p>
        <h2
          className="font-display text-primary text-[3.5vw] font-bold tracking-tight mb-[4vh]"
        >
          The Parent Dashboard
        </h2>
        <div className="w-[6vw] h-[3px] bg-accent mb-[4vh]" />
        <div className="grid grid-cols-2 gap-[2.5vw]" style={{ height: "50vh" }}>
          <div className="flex flex-col gap-[2vh]">
            <div className="rounded-lg px-[2.5vw] py-[2.5vh]" style={{ background: "rgba(201,168,76,0.12)" }}>
              <p className="font-display text-primary text-[2vw] font-bold mb-[1vh]">Child Overview</p>
              <p className="font-body text-muted text-[1.7vw] leading-relaxed">Full view of child's enrolled batch, upcoming live classes, and recent activity.</p>
            </div>
            <div className="rounded-lg px-[2.5vw] py-[2.5vh]" style={{ background: "rgba(201,168,76,0.12)" }}>
              <p className="font-display text-primary text-[2vw] font-bold mb-[1vh]">Fee & Payments</p>
              <p className="font-body text-muted text-[1.7vw] leading-relaxed">View outstanding dues, payment history, and download fee receipts at any time.</p>
            </div>
            <div className="rounded-lg px-[2.5vw] py-[2.5vh]" style={{ background: "rgba(201,168,76,0.12)" }}>
              <p className="font-display text-primary text-[2vw] font-bold mb-[1vh]">Timetable</p>
              <p className="font-body text-muted text-[1.7vw] leading-relaxed">See the batch timetable and know when every class is scheduled.</p>
            </div>
          </div>
          <div className="flex flex-col gap-[2vh]">
            <div className="rounded-lg px-[2.5vw] py-[2.5vh]" style={{ background: "rgba(201,168,76,0.12)" }}>
              <p className="font-display text-primary text-[2vw] font-bold mb-[1vh]">Notices & Announcements</p>
              <p className="font-body text-muted text-[1.7vw] leading-relaxed">Stay informed on all institute notices, exam schedules, and important updates.</p>
            </div>
            <div className="rounded-lg px-[2.5vw] py-[2.5vh]" style={{ background: "rgba(201,168,76,0.12)" }}>
              <p className="font-display text-primary text-[2vw] font-bold mb-[1vh]">Recorded Classes</p>
              <p className="font-body text-muted text-[1.7vw] leading-relaxed">See which classes the child has watched and access recordings on their behalf.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

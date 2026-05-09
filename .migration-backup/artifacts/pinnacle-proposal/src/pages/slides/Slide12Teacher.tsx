export default function Slide12Teacher() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg">
      <div className="absolute top-0 left-0 w-[5px] h-full bg-maroon" />
      <div className="absolute inset-0 px-[8vw] pt-[7vh] pb-[6vh] flex flex-col">
        <p className="font-body text-maroon text-[1.6vw] tracking-[0.25em] uppercase font-semibold mb-[1.5vh]">
          09 — Teacher Portal
        </p>
        <h2
          className="font-display text-primary text-[3.5vw] font-bold tracking-tight mb-[4vh]"
        >
          The Teacher Workspace
        </h2>
        <div className="w-[6vw] h-[3px] bg-maroon mb-[4vh]" />
        <div className="grid grid-cols-2 gap-[2.5vw]" style={{ height: "50vh" }}>
          <div className="flex flex-col gap-[2vh]">
            <div className="rounded-lg px-[2.5vw] py-[2.5vh]" style={{ background: "rgba(139,26,26,0.07)" }}>
              <p className="font-display text-primary text-[2vw] font-bold mb-[1vh]">Schedule Live Classes</p>
              <p className="font-body text-muted text-[1.7vw] leading-relaxed">Create a class, select a batch and time — a Zoom meeting is created automatically.</p>
            </div>
            <div className="rounded-lg px-[2.5vw] py-[2.5vh]" style={{ background: "rgba(139,26,26,0.07)" }}>
              <p className="font-display text-primary text-[2vw] font-bold mb-[1vh]">Upload Study Materials</p>
              <p className="font-body text-muted text-[1.7vw] leading-relaxed">Upload notes and PDFs by subject and batch — instantly available to all assigned students.</p>
            </div>
            <div className="rounded-lg px-[2.5vw] py-[2.5vh]" style={{ background: "rgba(139,26,26,0.07)" }}>
              <p className="font-display text-primary text-[2vw] font-bold mb-[1vh]">Post Notices</p>
              <p className="font-body text-muted text-[1.7vw] leading-relaxed">Publish announcements, exam updates, and holiday notices visible to all or selected batches.</p>
            </div>
          </div>
          <div className="flex flex-col gap-[2vh]">
            <div className="rounded-lg px-[2.5vw] py-[2.5vh]" style={{ background: "rgba(139,26,26,0.07)" }}>
              <p className="font-display text-primary text-[2vw] font-bold mb-[1vh]">Practice Papers</p>
              <p className="font-body text-muted text-[1.7vw] leading-relaxed">Upload past papers and test sets tagged to subjects — students can download on demand.</p>
            </div>
            <div className="rounded-lg px-[2.5vw] py-[2.5vh]" style={{ background: "rgba(139,26,26,0.07)" }}>
              <p className="font-display text-primary text-[2vw] font-bold mb-[1vh]">Batch View</p>
              <p className="font-body text-muted text-[1.7vw] leading-relaxed">View student lists, timetables, and upcoming classes for every assigned batch.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

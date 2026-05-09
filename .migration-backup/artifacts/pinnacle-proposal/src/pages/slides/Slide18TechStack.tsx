export default function Slide18TechStack() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg">
      <div className="absolute top-0 left-0 w-[5px] h-full bg-teal" />
      <div className="absolute inset-0 px-[8vw] pt-[7vh] pb-[6vh] flex flex-col">
        <p className="font-body text-accent text-[1.6vw] tracking-[0.25em] uppercase font-semibold mb-[1.5vh]">
          13 — Technology Stack
        </p>
        <h2
          className="font-display text-primary text-[3.5vw] font-bold tracking-tight mb-[4vh]"
          style={{ textWrap: "balance" }}
        >
          Built for Performance &amp; Scale
        </h2>
        <div className="w-[6vw] h-[3px] bg-accent mb-[4.5vh]" />
        <div className="flex flex-col gap-[2.5vh]" style={{ height: "50vh" }}>
          <div className="flex items-center gap-[3vw] px-[3vw] py-[2vh] rounded-lg" style={{ background: "rgba(10,31,92,0.07)" }}>
            <div className="w-[16vw]">
              <p className="font-display text-primary text-[2vw] font-bold">Next.js 15</p>
            </div>
            <p className="font-body text-muted text-[1.7vw]">Full-stack React framework — server-rendered pages, SEO-optimised, and production-ready</p>
          </div>
          <div className="flex items-center gap-[3vw] px-[3vw] py-[2vh] rounded-lg" style={{ background: "rgba(10,31,92,0.07)" }}>
            <div className="w-[16vw]">
              <p className="font-display text-primary text-[2vw] font-bold">PostgreSQL</p>
            </div>
            <p className="font-body text-muted text-[1.7vw]">Shared relational database — powering both the website and the future Android app from one source</p>
          </div>
          <div className="flex items-center gap-[3vw] px-[3vw] py-[2vh] rounded-lg" style={{ background: "rgba(10,31,92,0.07)" }}>
            <div className="w-[16vw]">
              <p className="font-display text-primary text-[2vw] font-bold">Clerk Auth</p>
            </div>
            <p className="font-body text-muted text-[1.7vw]">Role-based authentication for Student, Parent, Teacher, and Admin — secure and mobile-compatible</p>
          </div>
          <div className="flex items-center gap-[3vw] px-[3vw] py-[2vh] rounded-lg" style={{ background: "rgba(10,31,92,0.07)" }}>
            <div className="w-[16vw]">
              <p className="font-display text-primary text-[2vw] font-bold">Zoom API</p>
            </div>
            <p className="font-body text-muted text-[1.7vw]">Server-to-server integration for programmatic meeting creation and cloud recording retrieval</p>
          </div>
          <div className="flex items-center gap-[3vw] px-[3vw] py-[2vh] rounded-lg" style={{ background: "rgba(10,31,92,0.07)" }}>
            <div className="w-[16vw]">
              <p className="font-display text-primary text-[2vw] font-bold">Cloud Storage</p>
            </div>
            <p className="font-body text-muted text-[1.7vw]">Secure file storage for PDFs, notes, and practice papers — direct download URLs served to all portals</p>
          </div>
        </div>
      </div>
    </div>
  );
}

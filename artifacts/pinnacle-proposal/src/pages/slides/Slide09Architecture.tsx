export default function Slide09Architecture() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg">
      <div className="absolute top-0 left-0 w-[5px] h-full bg-teal" />
      <div className="absolute inset-0 px-[8vw] pt-[7vh] pb-[6vh] flex flex-col">
        <p className="font-body text-accent text-[1.6vw] tracking-[0.25em] uppercase font-semibold mb-[1.5vh]">
          06 — Portal Architecture
        </p>
        <h2
          className="font-display text-primary text-[3.5vw] font-bold tracking-tight mb-[4vh]"
          style={{ textWrap: "balance" }}
        >
          Role-Based Access. Secure by Design.
        </h2>
        <div className="w-[6vw] h-[3px] bg-accent mb-[4vh]" />
        <div className="flex flex-col items-center" style={{ height: "50vh" }}>
          <div className="bg-primary rounded-lg px-[3vw] py-[2vh] mb-[3vh]">
            <p className="font-body text-white text-[1.8vw] font-semibold text-center tracking-wide">
              Admin — Full Access
            </p>
          </div>
          <div className="w-[2px] h-[4vh] bg-muted" />
          <div className="flex gap-[3vw] w-full justify-center">
            <div className="flex flex-col items-center">
              <div className="w-[2px] h-[3vh] bg-muted" />
              <div className="rounded-lg px-[2.5vw] py-[2vh]" style={{ background: "#0D7377" }}>
                <p className="font-body text-white text-[1.8vw] font-semibold text-center">Student</p>
              </div>
              <div className="mt-[1.5vh] flex flex-col gap-[0.8vh]">
                <p className="font-body text-muted text-[1.5vw] text-center">Live Classes + Recordings</p>
                <p className="font-body text-muted text-[1.5vw] text-center">Study Materials + Papers</p>
                <p className="font-body text-muted text-[1.5vw] text-center">Timetable + Fee Status</p>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-[2px] h-[3vh] bg-muted" />
              <div className="rounded-lg px-[2.5vw] py-[2vh]" style={{ background: "#0D7377" }}>
                <p className="font-body text-white text-[1.8vw] font-semibold text-center">Parent</p>
              </div>
              <div className="mt-[1.5vh] flex flex-col gap-[0.8vh]">
                <p className="font-body text-muted text-[1.5vw] text-center">Child's Progress</p>
                <p className="font-body text-muted text-[1.5vw] text-center">Fee Dues + History</p>
                <p className="font-body text-muted text-[1.5vw] text-center">Notices + Timetable</p>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-[2px] h-[3vh] bg-muted" />
              <div className="rounded-lg px-[2.5vw] py-[2vh]" style={{ background: "#0D7377" }}>
                <p className="font-body text-white text-[1.8vw] font-semibold text-center">Teacher</p>
              </div>
              <div className="mt-[1.5vh] flex flex-col gap-[0.8vh]">
                <p className="font-body text-muted text-[1.5vw] text-center">Schedule Live Classes</p>
                <p className="font-body text-muted text-[1.5vw] text-center">Upload Materials</p>
                <p className="font-body text-muted text-[1.5vw] text-center">Post Notices</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

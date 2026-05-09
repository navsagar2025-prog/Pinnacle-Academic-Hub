export default function Slide21Roadmap() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg">
      <div className="absolute top-0 left-0 w-[5px] h-full bg-teal" />
      <div className="absolute inset-0 px-[8vw] pt-[7vh] pb-[6vh] flex flex-col">
        <p className="font-body text-accent text-[1.6vw] tracking-[0.25em] uppercase font-semibold mb-[1.5vh]">
          15 — What Comes Next
        </p>
        <h2
          className="font-display text-primary text-[3.5vw] font-bold tracking-tight mb-[4vh]"
        >
          The Road Ahead
        </h2>
        <div className="w-[6vw] h-[3px] bg-accent mb-[4vh]" />
        <div className="flex gap-[4vw]" style={{ height: "50vh" }}>
          <div className="flex-1 flex flex-col">
            <div className="flex items-center gap-[1.5vw] mb-[2.5vh]">
              <div className="w-[3vw] h-[3vw] rounded-full bg-primary flex items-center justify-center">
                <span className="font-body text-white text-[1.5vw] font-bold">2</span>
              </div>
              <p className="font-display text-primary text-[2.2vw] font-bold">Phase 2 — Android App</p>
            </div>
            <div className="flex flex-col gap-[2vh] pl-[4.5vw]">
              <div className="flex items-start gap-[1vw]">
                <div className="w-[0.8vw] h-[0.8vw] rounded-full bg-teal mt-[0.5vh] flex-shrink-0" />
                <p className="font-body text-primary text-[1.7vw] leading-relaxed">Native Android app for students and parents</p>
              </div>
              <div className="flex items-start gap-[1vw]">
                <div className="w-[0.8vw] h-[0.8vw] rounded-full bg-teal mt-[0.5vh] flex-shrink-0" />
                <p className="font-body text-primary text-[1.7vw] leading-relaxed">Push notifications for class reminders and notices</p>
              </div>
              <div className="flex items-start gap-[1vw]">
                <div className="w-[0.8vw] h-[0.8vw] rounded-full bg-teal mt-[0.5vh] flex-shrink-0" />
                <p className="font-body text-primary text-[1.7vw] leading-relaxed">Offline access to materials and timetable</p>
              </div>
              <div className="flex items-start gap-[1vw]">
                <div className="w-[0.8vw] h-[0.8vw] rounded-full bg-teal mt-[0.5vh] flex-shrink-0" />
                <p className="font-body text-primary text-[1.7vw] leading-relaxed">Same database — zero additional backend work</p>
              </div>
            </div>
          </div>
          <div className="w-[1px] bg-muted" style={{ opacity: 0.3 }} />
          <div className="flex-1 flex flex-col">
            <p className="font-display text-primary text-[2.2vw] font-bold mb-[2.5vh]">Future Additions</p>
            <div className="flex flex-col gap-[2vh]">
              <div className="flex items-start gap-[1vw]">
                <div className="w-[0.8vw] h-[0.8vw] rounded-full bg-accent mt-[0.5vh] flex-shrink-0" />
                <p className="font-body text-muted text-[1.7vw] leading-relaxed">Online fee payment gateway</p>
              </div>
              <div className="flex items-start gap-[1vw]">
                <div className="w-[0.8vw] h-[0.8vw] rounded-full bg-accent mt-[0.5vh] flex-shrink-0" />
                <p className="font-body text-muted text-[1.7vw] leading-relaxed">Attendance marking and reports</p>
              </div>
              <div className="flex items-start gap-[1vw]">
                <div className="w-[0.8vw] h-[0.8vw] rounded-full bg-accent mt-[0.5vh] flex-shrink-0" />
                <p className="font-body text-muted text-[1.7vw] leading-relaxed">SMS and email notifications</p>
              </div>
              <div className="flex items-start gap-[1vw]">
                <div className="w-[0.8vw] h-[0.8vw] rounded-full bg-accent mt-[0.5vh] flex-shrink-0" />
                <p className="font-body text-muted text-[1.7vw] leading-relaxed">Live class embedded inside the app</p>
              </div>
              <div className="flex items-start gap-[1vw]">
                <div className="w-[0.8vw] h-[0.8vw] rounded-full bg-accent mt-[0.5vh] flex-shrink-0" />
                <p className="font-body text-muted text-[1.7vw] leading-relaxed">ERP and CRM integration</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Slide23Closing() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-primary">
      <div className="absolute top-0 left-0 w-[8px] h-full bg-accent" />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(135deg, #0A1F5C 0%, #1A3572 60%, rgba(13,115,119,0.4) 100%)" }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-[10vw]">
        <p
          className="font-body text-[1.5vw] tracking-[0.35em] uppercase font-medium mb-[2.5vh]"
          style={{ color: "rgba(201,168,76,0.8)" }}
        >
          Ready to Begin
        </p>
        <h1
          className="font-display text-[5vw] font-bold text-white text-center tracking-tight leading-tight mb-[1.5vh]"
          style={{ textWrap: "balance" }}
        >
          Let's Build This Together
        </h1>
        <p
          className="font-display text-[2.2vw] text-center font-normal mb-[4vh]"
          style={{ color: "rgba(255,255,255,0.65)", textWrap: "balance" }}
        >
          Pinnacle Academic Classes — Digital Platform
        </p>
        <div className="w-[14vw] h-[2px] bg-accent mb-[4vh]" />
        <div className="flex gap-[8vw] mb-[4vh]">
          <div className="flex flex-col items-center gap-[0.8vh]">
            <p className="font-body text-[1.4vw] uppercase tracking-widest" style={{ color: "rgba(201,168,76,0.75)" }}>
              Call / WhatsApp
            </p>
            <p className="font-body text-white text-[1.9vw] font-medium">
              +91 — your number
            </p>
          </div>
          <div className="w-[1px]" style={{ background: "rgba(255,255,255,0.2)" }} />
          <div className="flex flex-col items-center gap-[0.8vh]">
            <p className="font-body text-[1.4vw] uppercase tracking-widest" style={{ color: "rgba(201,168,76,0.75)" }}>
              Email
            </p>
            <p className="font-body text-white text-[1.9vw] font-medium">
              info@pinnacleacademic.in
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-[1vh]">
          <p className="font-body text-white text-[1.7vw] font-medium">
            PINNACLE ACADEMIC CLASSES
          </p>
          <p className="font-body text-[1.5vw]" style={{ color: "rgba(255,255,255,0.55)" }}>
            Shop No. 1–5, Shop Mart, Plot GH-03, Gaur City 2, Sector 16C, Greater Noida, UP 201009
          </p>
          <p className="font-body text-[1.5vw]" style={{ color: "rgba(201,168,76,0.75)" }}>
            A Unit of KCK Corporate Services Pvt. Ltd.
          </p>
        </div>
      </div>
      <div className="absolute bottom-[4vh] right-[5vw]">
        <p className="font-body text-[1.5vw]" style={{ color: "rgba(255,255,255,0.3)" }}>
          Prepared April 2026
        </p>
      </div>
    </div>
  );
}

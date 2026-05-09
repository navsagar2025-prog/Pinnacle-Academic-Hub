const base = import.meta.env.BASE_URL;

export default function Slide01Cover() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-primary">
      <img
        src={`${base}hero-cover.png`}
        crossOrigin="anonymous"
        className="absolute inset-0 w-full h-full object-cover"
        alt=""
      />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(135deg, rgba(10,31,92,0.92) 0%, rgba(10,31,92,0.78) 60%, rgba(13,115,119,0.65) 100%)" }}
      />
      <div className="absolute left-0 top-0 w-[5px] h-full bg-accent" />

      <div className="absolute inset-0 flex flex-col items-center justify-center px-[10vw]">
        <div
          className="flex items-center justify-center w-[9vw] h-[9vw] rounded-xl mb-[2.5vh]"
          style={{ border: "2px dashed rgba(201,168,76,0.55)", background: "rgba(201,168,76,0.08)" }}
        >
          <p className="font-body text-[1.4vw] text-center leading-tight" style={{ color: "rgba(201,168,76,0.7)" }}>
            Your<br />Logo
          </p>
        </div>

        <p
          className="font-body text-[1.5vw] tracking-[0.35em] uppercase font-medium mb-[2vh]"
          style={{ color: "rgba(201,168,76,0.85)" }}
        >
          A Unit of KCK Corporate Services Pvt. Ltd.
        </p>
        <h1
          className="font-display text-[6vw] font-bold text-white text-center tracking-tight leading-none mb-[2.5vh]"
          style={{ textWrap: "balance" }}
        >
          PINNACLE ACADEMIC CLASSES
        </h1>
        <div className="w-[14vw] h-[2px] bg-accent mb-[3vh]" />
        <p
          className="font-display text-[2.8vw] text-white text-center font-normal tracking-wide mb-[1.5vh]"
          style={{ textWrap: "balance" }}
        >
          Digital Transformation Platform
        </p>
        <p className="font-body text-[1.8vw]" style={{ color: "rgba(255,255,255,0.55)" }}>
          Client Proposal — April 2026
        </p>
      </div>

      <div className="absolute bottom-[4vh] left-[5vw]">
        <p className="font-body text-[1.5vw]" style={{ color: "rgba(255,255,255,0.4)" }}>
          Shop No. 1–5, Shop Mart, Plot GH-03, Gaur City 2, Sector 16C, Greater Noida, UP 201009
        </p>
      </div>
    </div>
  );
}

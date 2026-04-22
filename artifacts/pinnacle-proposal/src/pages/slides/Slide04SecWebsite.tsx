export default function Slide04SecWebsite() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-primary">
      <div className="absolute top-0 left-0 w-[8px] h-full bg-teal" />
      <div
        className="absolute right-0 top-0 w-[45vw] h-full opacity-5"
        style={{ background: "radial-gradient(ellipse at right center, #C9A84C 0%, transparent 70%)" }}
      />
      <div className="absolute inset-0 px-[10vw] flex flex-col justify-center">
        <p className="font-body text-accent text-[1.6vw] tracking-[0.4em] uppercase font-semibold mb-[3vh]">
          Section 01
        </p>
        <h2
          className="font-display text-white text-[7vw] font-bold tracking-tight leading-none mb-[0.5vh]"
        >
          The Public
        </h2>
        <h2
          className="font-display text-accent text-[7vw] font-bold tracking-tight leading-none mb-[4vh]"
        >
          Website
        </h2>
        <div className="w-[8vw] h-[3px] bg-accent mb-[3.5vh]" />
        <p className="font-body text-[2vw]" style={{ color: "rgba(255,255,255,0.6)" }}>
          Your digital front door — open 24 hours a day
        </p>
      </div>
    </div>
  );
}

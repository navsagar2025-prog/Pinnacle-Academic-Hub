export default function Slide06LeadGen() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg">
      <div className="absolute top-0 left-0 w-[5px] h-full bg-teal" />
      <div className="absolute inset-0 px-[8vw] pt-[7vh] pb-[6vh] flex flex-col">
        <p className="font-body text-accent text-[1.6vw] tracking-[0.25em] uppercase font-semibold mb-[1.5vh]">
          04 — Lead Generation
        </p>
        <h2
          className="font-display text-primary text-[3.5vw] font-bold tracking-tight mb-[4vh]"
          style={{ textWrap: "balance" }}
        >
          Built to Generate Admissions
        </h2>
        <div className="w-[6vw] h-[3px] bg-accent mb-[4vh]" />
        <div className="grid grid-cols-2 gap-[2.5vw]" style={{ height: "50vh" }}>
          <div className="flex flex-col px-[2.5vw] py-[2.5vh] rounded-lg" style={{ background: "rgba(10,31,92,0.07)" }}>
            <p className="font-display text-primary text-[2vw] font-bold mb-[1.5vh]">Enquiry Form</p>
            <p className="font-body text-muted text-[1.7vw] leading-relaxed">
              Capture student and parent enquiries around the clock — every lead delivered to the institute instantly.
            </p>
          </div>
          <div className="flex flex-col px-[2.5vw] py-[2.5vh] rounded-lg" style={{ background: "rgba(10,31,92,0.07)" }}>
            <p className="font-display text-primary text-[2vw] font-bold mb-[1.5vh]">Demo Class Booking</p>
            <p className="font-body text-muted text-[1.7vw] leading-relaxed">
              Let families book a free demo class directly from the website — reducing friction and increasing conversions.
            </p>
          </div>
          <div className="flex flex-col px-[2.5vw] py-[2.5vh] rounded-lg" style={{ background: "rgba(10,31,92,0.07)" }}>
            <p className="font-display text-primary text-[2vw] font-bold mb-[1.5vh]">WhatsApp Integration</p>
            <p className="font-body text-muted text-[1.7vw] leading-relaxed">
              One tap connects families directly via WhatsApp — the communication channel parents already trust.
            </p>
          </div>
          <div className="flex flex-col px-[2.5vw] py-[2.5vh] rounded-lg" style={{ background: "rgba(10,31,92,0.07)" }}>
            <p className="font-display text-primary text-[2vw] font-bold mb-[1.5vh]">Click-to-Call</p>
            <p className="font-body text-muted text-[1.7vw] leading-relaxed">
              Prominent call buttons across every page and a mobile sticky bar — the institute is always reachable.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

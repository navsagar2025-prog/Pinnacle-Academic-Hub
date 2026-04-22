export default function Slide19Security() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg">
      <div className="absolute top-0 left-0 w-[5px] h-full bg-maroon" />
      <div className="absolute inset-0 px-[8vw] pt-[7vh] pb-[6vh] flex flex-col">
        <p className="font-body text-maroon text-[1.6vw] tracking-[0.25em] uppercase font-semibold mb-[1.5vh]">
          14 — Data Security & Storage
        </p>
        <h2
          className="font-display text-primary text-[3.5vw] font-bold tracking-tight mb-[4vh]"
          style={{ textWrap: "balance" }}
        >
          Your Data Is Safe. Every Layer.
        </h2>
        <div className="w-[6vw] h-[3px] bg-maroon mb-[4vh]" />
        <div className="grid grid-cols-2 gap-[2.5vw]" style={{ height: "50vh" }}>
          <div className="flex flex-col px-[2.5vw] py-[2.5vh] rounded-lg" style={{ background: "rgba(139,26,26,0.07)" }}>
            <p className="font-display text-primary text-[2vw] font-bold mb-[1.2vh]">
              Replit App Storage
            </p>
            <p className="font-body text-muted text-[1.7vw] leading-relaxed">
              All uploaded files — study PDFs, practice papers, recorded class links — stored in Replit's managed App Storage. Secure, cloud-hosted, no self-managed servers required.
            </p>
          </div>
          <div className="flex flex-col px-[2.5vw] py-[2.5vh] rounded-lg" style={{ background: "rgba(139,26,26,0.07)" }}>
            <p className="font-display text-primary text-[2vw] font-bold mb-[1.2vh]">
              Role-Based Access Control
            </p>
            <p className="font-body text-muted text-[1.7vw] leading-relaxed">
              Every API route enforces the caller's role. Students see only their own data. Parents see only their child. Teachers see only their assigned batches.
            </p>
          </div>
          <div className="flex flex-col px-[2.5vw] py-[2.5vh] rounded-lg" style={{ background: "rgba(139,26,26,0.07)" }}>
            <p className="font-display text-primary text-[2vw] font-bold mb-[1.2vh]">
              Clerk Authentication
            </p>
            <p className="font-body text-muted text-[1.7vw] leading-relaxed">
              Industry-standard JWT-based auth with role metadata. Every session token is scoped — no credentials are stored in our database.
            </p>
          </div>
          <div className="flex flex-col px-[2.5vw] py-[2.5vh] rounded-lg" style={{ background: "rgba(139,26,26,0.07)" }}>
            <p className="font-display text-primary text-[2vw] font-bold mb-[1.2vh]">
              Data Isolation
            </p>
            <p className="font-body text-muted text-[1.7vw] leading-relaxed">
              All student, parent, and fee data sits in an isolated PostgreSQL database. TLS encryption in transit. No third party has access to your institute's data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

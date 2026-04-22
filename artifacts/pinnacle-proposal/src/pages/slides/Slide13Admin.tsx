export default function Slide13Admin() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-primary">
      <div className="absolute top-0 left-0 w-[8px] h-full bg-accent" />
      <div
        className="absolute right-0 top-0 w-[40vw] h-full opacity-5"
        style={{ background: "radial-gradient(ellipse at right center, #0D7377 0%, transparent 70%)" }}
      />
      <div className="absolute inset-0 px-[8vw] pt-[7vh] pb-[6vh] flex flex-col">
        <p className="font-body text-accent text-[1.6vw] tracking-[0.25em] uppercase font-semibold mb-[1.5vh]">
          10 — Admin Panel
        </p>
        <h2
          className="font-display text-white text-[3.5vw] font-bold tracking-tight mb-[4vh]"
          style={{ textWrap: "balance" }}
        >
          Complete Administrative Control
        </h2>
        <div className="w-[6vw] h-[3px] bg-accent mb-[5vh]" />
        <div className="grid grid-cols-2 gap-[2.5vw]" style={{ height: "48vh" }}>
          <div className="rounded-lg px-[2.5vw] py-[2.5vh]" style={{ background: "rgba(255,255,255,0.07)" }}>
            <p className="font-display text-accent text-[2vw] font-bold mb-[1.2vh]">User Management</p>
            <p className="font-body text-[1.7vw] leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
              Add, edit, and manage student, parent, and teacher accounts — and control batch assignments.
            </p>
          </div>
          <div className="rounded-lg px-[2.5vw] py-[2.5vh]" style={{ background: "rgba(255,255,255,0.07)" }}>
            <p className="font-display text-accent text-[2vw] font-bold mb-[1.2vh]">Content Management</p>
            <p className="font-body text-[1.7vw] leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
              Manage all notices, study materials, practice papers, and recordings across the platform.
            </p>
          </div>
          <div className="rounded-lg px-[2.5vw] py-[2.5vh]" style={{ background: "rgba(255,255,255,0.07)" }}>
            <p className="font-display text-accent text-[2vw] font-bold mb-[1.2vh]">Fee Records</p>
            <p className="font-body text-[1.7vw] leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
              Update fee status, payment records, and outstanding dues for individual students or entire batches.
            </p>
          </div>
          <div className="rounded-lg px-[2.5vw] py-[2.5vh]" style={{ background: "rgba(255,255,255,0.07)" }}>
            <p className="font-display text-accent text-[2vw] font-bold mb-[1.2vh]">Course & Website Content</p>
            <p className="font-body text-[1.7vw] leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
              Update course listings, faculty information, results, and testimonials shown on the public website.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

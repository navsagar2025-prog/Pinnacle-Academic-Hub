export default function Slide19Android() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg">
      <div className="absolute top-0 left-0 w-[5px] h-full bg-teal" />
      <div className="absolute inset-0 px-[8vw] pt-[7vh] pb-[6vh] flex flex-col">
        <p className="font-body text-accent text-[1.6vw] tracking-[0.25em] uppercase font-semibold mb-[1.5vh]">
          14 — Android Readiness
        </p>
        <h2
          className="font-display text-primary text-[3.5vw] font-bold tracking-tight mb-[4vh]"
          style={{ textWrap: "balance" }}
        >
          Designed for Android from Day One
        </h2>
        <div className="w-[6vw] h-[3px] bg-accent mb-[5vh]" />
        <div className="grid grid-cols-2 gap-[2.5vw]" style={{ height: "48vh" }}>
          <div className="flex flex-col px-[2.5vw] py-[3vh] rounded-lg" style={{ background: "rgba(13,115,119,0.08)" }}>
            <p className="font-body text-teal text-[1.5vw] uppercase tracking-widest font-semibold mb-[1.5vh]">Shared Database</p>
            <p className="font-display text-primary text-[2vw] font-bold mb-[1.5vh]">One Database. Both Platforms.</p>
            <p className="font-body text-muted text-[1.7vw] leading-relaxed">
              The Android app connects to the same PostgreSQL database. No migration, no duplication.
            </p>
          </div>
          <div className="flex flex-col px-[2.5vw] py-[3vh] rounded-lg" style={{ background: "rgba(13,115,119,0.08)" }}>
            <p className="font-body text-teal text-[1.5vw] uppercase tracking-widest font-semibold mb-[1.5vh]">Versioned API</p>
            <p className="font-display text-primary text-[2vw] font-bold mb-[1.5vh]">API-First Architecture</p>
            <p className="font-body text-muted text-[1.7vw] leading-relaxed">
              All data served via versioned REST endpoints (/api/v1/). The Android app plugs in on day one.
            </p>
          </div>
          <div className="flex flex-col px-[2.5vw] py-[3vh] rounded-lg" style={{ background: "rgba(13,115,119,0.08)" }}>
            <p className="font-body text-teal text-[1.5vw] uppercase tracking-widest font-semibold mb-[1.5vh]">Push Notifications</p>
            <p className="font-display text-primary text-[2vw] font-bold mb-[1.5vh]">Ready for FCM</p>
            <p className="font-body text-muted text-[1.7vw] leading-relaxed">
              User accounts include an FCM token field — ready for Android push notifications without a schema change.
            </p>
          </div>
          <div className="flex flex-col px-[2.5vw] py-[3vh] rounded-lg" style={{ background: "rgba(13,115,119,0.08)" }}>
            <p className="font-body text-teal text-[1.5vw] uppercase tracking-widest font-semibold mb-[1.5vh]">Offline Sync</p>
            <p className="font-display text-primary text-[2vw] font-bold mb-[1.5vh]">Delta Sync Ready</p>
            <p className="font-body text-muted text-[1.7vw] leading-relaxed">
              All API responses include updated_at timestamps so the Android app can cache and sync incrementally.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") ?? "Pinnacle Academic Classes";
  const description =
    searchParams.get("description") ??
    "Greater Noida's Premier JEE · NEET · Board Coaching Institute";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#1a2e5a",
          padding: "60px 80px",
        }}
      >
        {/* Gold accent bar */}
        <div
          style={{
            width: 72,
            height: 5,
            backgroundColor: "#d4a017",
            borderRadius: 3,
            marginBottom: 36,
          }}
        />

        {/* Institute badge */}
        <div
          style={{
            fontSize: 18,
            color: "#d4a017",
            fontWeight: 700,
            letterSpacing: 3,
            marginBottom: 28,
            textTransform: "uppercase",
          }}
        >
          Pinnacle Academic Classes
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: title.length > 55 ? 42 : 52,
            color: "#ffffff",
            fontWeight: 800,
            lineHeight: 1.2,
            marginBottom: 28,
            maxWidth: 960,
          }}
        >
          {title}
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: 22,
            color: "#94a3b8",
            lineHeight: 1.55,
            maxWidth: 840,
            flex: 1,
          }}
        >
          {description.length > 140
            ? description.slice(0, 137) + "…"
            : description}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 32,
            borderTop: "1px solid #2d4a7a",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {["JEE Main", "JEE Advanced", "NEET UG", "Class 10–12"].map(
              (tag) => (
                <div
                  key={tag}
                  style={{
                    fontSize: 14,
                    color: "#2a9d8f",
                    backgroundColor: "#162444",
                    padding: "5px 14px",
                    borderRadius: 20,
                    border: "1px solid #2a9d8f40",
                  }}
                >
                  {tag}
                </div>
              )
            )}
          </div>
          <div style={{ fontSize: 18, color: "#64748b", fontWeight: 500 }}>
            pinnacleacademic.in
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

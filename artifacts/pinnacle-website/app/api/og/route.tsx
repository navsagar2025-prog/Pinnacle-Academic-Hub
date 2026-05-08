import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") ?? "Pinnacle Academic Classes";
  const description =
    searchParams.get("description") ??
    "Greater Noida's Premier JEE · NEET · Board Coaching Institute";
  const imageUrl = searchParams.get("image") ?? null;

  // Attempt to fetch the Pinnacle logo from the same origin so it renders
  // in the card.  Falls back gracefully if the asset is unreachable.
  let logoDataUrl: string | null = null;
  try {
    const logoSrc = new URL(
      (process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website") + "/logo.png",
      request.url,
    ).href;
    const logoRes = await fetch(logoSrc, { cache: "no-store" });
    if (logoRes.ok) {
      const buf = await logoRes.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      logoDataUrl = `data:image/png;base64,${btoa(binary)}`;
    }
  } catch {
    // Logo fetch failed — continue without it.
  }

  // Featured image (optional ?image= param) — validate it's a remote URL.
  let featuredImageUrl: string | null = null;
  if (imageUrl) {
    try {
      const u = new URL(imageUrl);
      if (u.protocol === "https:" || u.protocol === "http:") {
        featuredImageUrl = imageUrl;
      }
    } catch {
      // Invalid URL — ignore.
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundImage: "linear-gradient(135deg, #0d1b38 0%, #1a2e5a 55%, #162444 100%)",
          padding: "52px 72px",
          position: "relative",
        }}
      >
        {/* Top row: logo + badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          {logoDataUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={logoDataUrl}
              width={52}
              height={52}
              style={{ borderRadius: 10, objectFit: "contain" }}
              alt="Pinnacle logo"
            />
          )}
          <div
            style={{
              fontSize: 15,
              color: "#d4a017",
              fontWeight: 700,
              letterSpacing: 3,
              textTransform: "uppercase",
            }}
          >
            Pinnacle Academic Classes
          </div>
        </div>

        {/* Gold accent bar */}
        <div
          style={{
            width: 64,
            height: 4,
            backgroundColor: "#d4a017",
            borderRadius: 3,
            marginBottom: 28,
          }}
        />

        {/* Content area — split if a featured image is present */}
        <div style={{ display: "flex", flex: 1, gap: 40, alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            {/* Title */}
            <div
              style={{
                fontSize: title.length > 55 ? 40 : 50,
                color: "#ffffff",
                fontWeight: 800,
                lineHeight: 1.2,
                marginBottom: 24,
              }}
            >
              {title}
            </div>

            {/* Description */}
            <div
              style={{
                fontSize: 21,
                color: "#94a3b8",
                lineHeight: 1.55,
                maxWidth: featuredImageUrl ? 600 : 840,
              }}
            >
              {description.length > 140
                ? description.slice(0, 137) + "…"
                : description}
            </div>
          </div>

          {/* Featured image (when ?image= is provided) */}
          {featuredImageUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={featuredImageUrl}
              width={280}
              height={200}
              style={{
                borderRadius: 16,
                objectFit: "cover",
                border: "2px solid #2d4a7a",
                flexShrink: 0,
              }}
              alt=""
            />
          )}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 28,
            borderTop: "1px solid #2d4a7a",
            marginTop: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {["JEE Main", "JEE Advanced", "NEET UG", "Class 10–12"].map((tag) => (
              <div
                key={tag}
                style={{
                  fontSize: 13,
                  color: "#2a9d8f",
                  backgroundColor: "#0d1b3880",
                  padding: "5px 13px",
                  borderRadius: 20,
                  border: "1px solid #2a9d8f40",
                }}
              >
                {tag}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 16, color: "#64748b", fontWeight: 500 }}>
            pinnacleacademic.in
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}

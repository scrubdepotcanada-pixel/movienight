import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #030712 0%, #111827 50%, #3b0764 100%)",
          fontFamily: "Arial, sans-serif",
        }}
      >
        {/* Emojis */}
        <div style={{ fontSize: 72, marginBottom: 24, display: "flex", gap: 24 }}>
          <span>🎬</span>
          <span>🍿</span>
          <span>🎭</span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            background: "linear-gradient(90deg, #c084fc, #f472b6)",
            backgroundClip: "text",
            color: "transparent",
            marginBottom: 16,
          }}
        >
          Next Movie
        </div>

        {/* Subtitle */}
        <div style={{ fontSize: 32, color: "#d1d5db", marginBottom: 32 }}>
          AI Movie Picks for the Whole Family
        </div>

        {/* Features */}
        <div style={{ display: "flex", gap: 32, marginBottom: 40 }}>
          {["Family Profiles", "Age-Safe Filtering", "Learns Your Taste"].map(
            (feature) => (
              <div
                key={feature}
                style={{
                  fontSize: 20,
                  color: "#9ca3af",
                  background: "rgba(255,255,255,0.05)",
                  padding: "8px 20px",
                  borderRadius: 20,
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {feature}
              </div>
            )
          )}
        </div>

        {/* CTA */}
        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "white",
            background: "#7c3aed",
            padding: "14px 48px",
            borderRadius: 28,
          }}
        >
          Try It Free
        </div>

        {/* URL */}
        <div style={{ fontSize: 18, color: "#6b7280", marginTop: 24 }}>
          nextmovie.app
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

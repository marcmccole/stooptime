import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Stoop — Meet your neighbors";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#F9F6F3",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* Orange accent bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 8, background: "#E8521A", display: "flex" }} />

        {/* Logo */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: "#E8521A",
            letterSpacing: "-2px",
            marginBottom: 24,
            display: "flex",
          }}
        >
          Stoop
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 36,
            color: "#1A1A1A",
            fontWeight: 400,
            letterSpacing: "-0.5px",
            marginBottom: 16,
            display: "flex",
          }}
        >
          Meet your neighbors.
        </div>

        <div
          style={{
            fontSize: 24,
            color: "#888888",
            fontWeight: 400,
            display: "flex",
          }}
        >
          Host a block party on your street.
        </div>

        {/* Bottom URL */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            fontSize: 20,
            color: "#BBBBBB",
            display: "flex",
          }}
        >
          stooptime.com
        </div>
      </div>
    ),
    { ...size }
  );
}

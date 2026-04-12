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
          background: "#E8521A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            fontSize: 120,
            fontWeight: 700,
            color: "#FFFFFF",
            letterSpacing: "-3px",
            display: "flex",
          }}
        >
          Stoop
        </div>
      </div>
    ),
    { ...size }
  );
}

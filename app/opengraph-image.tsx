import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Stoop — Text your neighbors.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The link-preview card keeps the homepage lettering large, with the wordmark above.
export default async function Image() {
  const assets = join(process.cwd(), "public", "landing", "assets");
  const [lettering, dmSans800] = await Promise.all([
    readFile(join(assets, "headline.png"), "base64"),
    readFile(join(assets, "dm-sans-800.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          background: "linear-gradient(180deg, #e1eeea 0%, #edf2e9 42%, #f8f7ec 78%, #fbf8ee 97%)",
          fontFamily: '"DM Sans"',
          color: "#203f32",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 44,
            left: 60,
            display: "flex",
            fontSize: 46,
            fontWeight: 800,
            letterSpacing: -3,
            lineHeight: 1,
          }}
        >
          stoop
        </div>
        <img
          src={`data:image/png;base64,${lettering}`}
          alt=""
          width={880}
          height={339}
        />
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "DM Sans", data: dmSans800, weight: 800, style: "normal" },
      ],
    }
  );
}

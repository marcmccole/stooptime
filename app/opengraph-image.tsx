import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Stoop — Meet your neighbors";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  // Fetch Plus Jakarta Sans ExtraBold from Google Fonts at runtime
  const fontRes = await fetch(
    "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@800",
    { headers: { "User-Agent": "Mozilla/5.0" } }
  );
  const css = await fontRes.text();
  const fontUrl = css.match(/url\((https:\/\/[^)]+)\)/)?.[1];
  const fontData = fontUrl
    ? await fetch(fontUrl).then((r) => r.arrayBuffer())
    : null;

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
          fontFamily: '"Plus Jakarta Sans"',
        }}
      >
        <div
          style={{
            fontSize: 140,
            fontWeight: 800,
            color: "#FFFFFF",
            letterSpacing: "-4px",
            display: "flex",
          }}
        >
          Stoop
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [{ name: "Plus Jakarta Sans", data: fontData, weight: 800 }]
        : [],
    }
  );
}

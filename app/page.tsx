import type { Metadata } from "next";
import Image from "next/image";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import TextSignupForm from "@/components/landing/TextSignupForm";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-tyn-display",
});

const body = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-tyn-body",
});

export const metadata: Metadata = {
  title: "Stoop — Text your neighbors",
  description:
    "One number for the whole neighborhood. Text what you need and Stoop asks the neighbor who knows, even if you've never met.",
  openGraph: {
    title: "Stoop — Text your neighbors",
    description:
      "One number for the whole neighborhood. Text what you need and Stoop asks the neighbor who knows, even if you've never met.",
    url: "https://stooptime.com",
    siteName: "Stoop",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stoop — Text your neighbors",
    description:
      "One number for the whole neighborhood. Text what you need and Stoop asks the neighbor who knows, even if you've never met.",
  },
};

const INK = "#14213A";
const ACCENT = "#C8401A";
const DISPLAY = "var(--font-tyn-display), system-ui, sans-serif";

type House = {
  ask: string;
  reply: string;
  wall: string;
  roof: string;
  gable: boolean;
  minHeight: number;
};

// Each house is a text someone sent; the stoop under it is what Stoop texts back.
// Neighbors stay anonymous in these replies: names only appear after both sides agree to an intro.
const houses: House[] = [
  {
    ask: "Need a roofer who actually knows these houses.",
    reply: "A neighbor on Kenwood used Marco's Roofing and would hire them again. Want the number?",
    wall: "#F7C9D0",
    roof: "#E79AA8",
    gable: true,
    minHeight: 150,
  },
  {
    ask: "Looking for a babysitter this Friday, 6 to 10.",
    reply: "A family on Darien has a 17-year-old who sits. Want an intro?",
    wall: "#F6E3A1",
    roof: "#D9B84A",
    gable: false,
    minHeight: 190,
  },
  {
    ask: "Away for two weeks. Could someone water my plants?",
    reply: "A neighbor two doors down said yes. Want me to introduce you?",
    wall: "#BFE5CF",
    roof: "#7FC7A0",
    gable: true,
    minHeight: 130,
  },
  {
    ask: "UPS left a box on my steps and I'm out till Sunday.",
    reply: "A neighbor across the street can grab it. OK to share your address?",
    wall: "#BFD9F2",
    roof: "#7FAEDD",
    gable: false,
    minHeight: 170,
  },
];

// Small things that pass between neighbors, shown as tilted request bubbles around the hero
// headline. Decorative: the real example lives in the thread under the illustration.
const asks = [
  { emoji: "🐕", text: "Can anyone walk Biscuit at 3?", color: "#F7A8B8" },
  { emoji: "🥛", text: "Out of milk. Anyone have a cup?", color: "#8EC5F5" },
  { emoji: "👷", text: "Who did your kitchen? We love it.", color: "#F9D25C" },
  { emoji: "🌱", text: "Tomato seedlings on our stoop. Take some!", color: "#86D9A5" },
  { emoji: "🌳", text: "Park on Sunday? We have little ones.", color: "#C3A8F2" },
  { emoji: "🍸", text: "Porch drinks Friday at 6?", color: "#F7A26B" },
];

// Scalloped "flower" shapes scattered behind the hero for colour.
const blobs = ["#F7A8B8", "#F9D25C", "#86D9A5", "#8EC5F5", "#C3A8F2"];

function Blob({ color, className }: { color: string; className: string }) {
  const petals = Array.from({ length: 8 }, (_, k) => {
    const a = (k * Math.PI) / 4;
    return { cx: 50 + 27 * Math.cos(a), cy: 50 + 27 * Math.sin(a) };
  });
  return (
    <svg className={className} viewBox="0 0 100 100" fill={color} aria-hidden="true">
      <circle cx="50" cy="50" r="30" />
      {petals.map((c, k) => (
        <circle key={k} cx={c.cx.toFixed(2)} cy={c.cy.toFixed(2)} r="21" />
      ))}
    </svg>
  );
}

const steps = [
  {
    title: "It starts with a text.",
    body: "Stoop lives in your messages, next to everyone else you text. Nothing to download, no account to set up.",
  },
  {
    title: "It gets to know you.",
    body: "A few questions over text: your house, who lives there, the plumber or sitter you would vouch for, what you would lend, what you might need.",
  },
  {
    title: "Then you just ask.",
    body: "Text what you need. Stoop works out which neighbors are likely to know and asks them for you.",
  },
];

export default function Home() {
  return (
    <div
      className={`${display.variable} ${body.variable} tyn-page`}
      style={{
        background: "#F9F6F3",
        color: INK,
        fontFamily: "var(--font-tyn-body), system-ui, sans-serif",
        fontSize: 17,
        lineHeight: 1.5,
        flex: 1,
      }}
    >
      {/* Nav */}
      <header className="landing-nav-safe" style={{ paddingLeft: 24, paddingRight: 24 }}>
        <div
          style={{
            maxWidth: 1160,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 30, letterSpacing: "-0.03em" }}>
            stoop
          </span>
          <a href="/auth" className="tyn-link" style={{ fontSize: 15, fontWeight: 500 }}>
            Sign in
          </a>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="tyn-hero">
          <div className="tyn-hero-top">
            <div className="tyn-scatter" aria-hidden="true">
              {blobs.map((color, i) => (
                <Blob key={color} color={color} className={`tyn-blob tyn-blob-${i}`} />
              ))}
              {asks.map((ask, i) => (
                <div key={ask.emoji} className={`tyn-ask tyn-ask-${i}`}>
                  <span className="tyn-ask-badge" style={{ background: ask.color }}>
                    {ask.emoji}
                  </span>
                  <span className="tyn-ask-text">{ask.text}</span>
                </div>
              ))}
            </div>
            <div className="tyn-hero-copy">
              <h1
                className="tyn-hero-title"
                style={{
                  margin: 0,
                  fontFamily: DISPLAY,
                  fontWeight: 800,
                  lineHeight: 0.92,
                  letterSpacing: "-0.045em",
                }}
              >
                Text your
                <br />
                neighbors.
              </h1>
              <p style={{ margin: 0, maxWidth: 520, fontSize: 21, lineHeight: 1.45, color: "#2B3A57" }}>
                One number for the whole neighborhood. Text what you need and Stoop asks the neighbor who knows, even if
                you&apos;ve never met.
              </p>
              <a href="#join" className="tyn-cta">
                Get Stoop on your street
              </a>
            </div>
          </div>

          {/* Illustration with an example thread laid over its lower edge */}
          <div className="tyn-hero-art">
            <Image
              src="/scene.png"
              alt="Three neighbors sitting together on a front stoop in the evening light"
              width={1232}
              height={928}
              priority
              sizes="(max-width: 640px) 100vw, 560px"
              style={{ width: "100%", height: "auto", borderRadius: 28, display: "block" }}
            />
            <div className="tyn-thread">
              <p
                style={{
                  margin: 0,
                  alignSelf: "flex-end",
                  maxWidth: "88%",
                  background: ACCENT,
                  color: "#FFFFFF",
                  padding: "12px 16px",
                  borderRadius: "20px 20px 6px 20px",
                  fontSize: 16,
                  lineHeight: 1.4,
                }}
              >
                We have two little kids. Any other families want to meet at the park on Sunday?
              </p>
              <p style={{ margin: 0, alignSelf: "center", textAlign: "center", fontSize: 13, color: "#3D4A63" }}>
                Asking families nearby with young kids
              </p>
              <p
                style={{
                  margin: 0,
                  alignSelf: "flex-start",
                  maxWidth: "88%",
                  background: "#F4EEE7",
                  color: INK,
                  padding: "12px 16px",
                  borderRadius: "20px 20px 20px 6px",
                  fontSize: 16,
                  lineHeight: 1.4,
                }}
              >
                Three families said yes. 10am at the playground. Want me to introduce you all?
              </p>
            </div>
          </div>
        </section>

        {/* The street */}
        <section className="tyn-street" aria-label="Examples of what neighbors text">
          <div
            style={{
              maxWidth: 1160,
              margin: "0 auto",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-end",
              gap: "40px 20px",
            }}
          >
            {houses.map((h) => (
              <div key={h.ask} className="tyn-house">
                {h.gable ? (
                  <div
                    aria-hidden="true"
                    style={{
                      height: 52,
                      margin: "0 14px",
                      background: h.roof,
                      clipPath: "polygon(50% 0, 100% 100%, 0 100%)",
                    }}
                  />
                ) : (
                  <div aria-hidden="true" style={{ height: 14, margin: "0 8px", background: h.roof }} />
                )}
                <div
                  className="tyn-house-wall"
                  style={{ margin: "0 14px", background: h.wall, padding: "24px 20px 28px", minHeight: h.minHeight }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontFamily: DISPLAY,
                      fontWeight: 700,
                      fontSize: 23,
                      lineHeight: 1.15,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {h.ask}
                  </p>
                </div>
                <div
                  style={{
                    margin: "0 7px",
                    background: INK,
                    color: "#FFFFFF",
                    padding: "14px 16px",
                    fontSize: 15,
                    lineHeight: 1.4,
                  }}
                >
                  <strong>Stoop:</strong> {h.reply}
                </div>
                <div aria-hidden="true" style={{ height: 10, background: "#2B3A57" }} />
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="tyn-how" style={{ background: "#FFFFFF" }}>
          <div style={{ maxWidth: 1160, margin: "0 auto", display: "flex", flexDirection: "column", gap: 48 }}>
            <h2
              className="tyn-section-title"
              style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.03em" }}
            >
              How it works
            </h2>

            <ol className="tyn-steps">
              {steps.map((s, i) => (
                <li key={s.title} className="tyn-step">
                  <span
                    aria-hidden="true"
                    style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 56, lineHeight: 1, color: ACCENT }}
                  >
                    {i + 1}
                  </span>
                  <h3 style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 700, fontSize: 26, lineHeight: 1.15 }}>
                    {s.title}
                  </h3>
                  <p style={{ margin: 0, color: "#2B3A57" }}>{s.body}</p>
                </li>
              ))}
            </ol>

            {/* Privacy: anonymous by default, named only after both sides agree */}
            <div className="tyn-privacy" style={{ background: "#F4EEE7", borderRadius: 28 }}>
              <div style={{ flex: "1 1 360px", minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
                <h3
                  style={{
                    margin: 0,
                    fontFamily: DISPLAY,
                    fontWeight: 800,
                    fontSize: 36,
                    lineHeight: 1.05,
                    letterSpacing: "-0.025em",
                    textWrap: "balance",
                  }}
                >
                  Private until you choose to be introduced.
                </h3>
                <p style={{ margin: 0, maxWidth: 460, color: "#2B3A57" }}>
                  What you tell Stoop helps your neighbors, but it never carries your name. You become a name and a
                  number only when you and the other neighbor both say yes.
                </p>
              </div>
              <div style={{ flex: "1 1 360px", minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span className="tyn-label">What neighbors see</span>
                  <p className="tyn-bubble">
                    <strong>A neighbor on Westgate</strong>{" "}
                    recommends Marcello&apos;s Plumbing.
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span className="tyn-label">Only if you both say yes</span>
                  <p className="tyn-bubble">
                    <strong>Bob on Westgate</strong>{" "}
                    recommends Marcello&apos;s Plumbing. He says to text him if you
                    want the full story.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Join */}
        <section id="join" className="tyn-join" style={{ background: INK, color: "#FFFFFF" }}>
          <div
            style={{
              maxWidth: 1160,
              margin: "0 auto",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-start",
              gap: "40px 64px",
            }}
          >
            <div style={{ flex: "1 1 420px", minWidth: 0, display: "flex", flexDirection: "column", gap: 24 }}>
              <h2
                className="tyn-join-title"
                style={{
                  margin: 0,
                  fontFamily: DISPLAY,
                  fontWeight: 800,
                  lineHeight: 0.98,
                  letterSpacing: "-0.035em",
                  textWrap: "balance",
                }}
              >
                No app. No feed. No group chat.
              </h2>
              <p style={{ margin: 0, maxWidth: 520, fontSize: 21, lineHeight: 1.45, color: "#DCE3EB" }}>
                You only hear from Stoop when a neighbor needs something you can help with.
              </p>
            </div>
            <div style={{ flex: "1 1 360px", minWidth: 0, maxWidth: 480 }}>
              <TextSignupForm />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        style={{
          background: INK,
          borderTop: "1px solid #3D4A63",
          padding: "24px 24px 32px",
        }}
      >
        <div
          style={{
            maxWidth: 1160,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px 24px",
            fontSize: 14,
            color: "#DCE3EB",
          }}
        >
          <div style={{ display: "flex", gap: 20 }}>
            <a href="/privacy" className="tyn-link-light">
              Privacy
            </a>
            <a href="mailto:support@stooptime.com" className="tyn-link-light">
              Support
            </a>
          </div>
          <span>© 2026 Stoop Inc. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}

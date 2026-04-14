"use client";
import { useEffect } from "react";
import { track } from "@/lib/mixpanel";

const howItWorksItems = [
  {
    img: "/flyers.png",
    title: "Print and deliver flyers",
    desc: "Print off a personalized flyer and drop it in their mailbox. No knocking or doors required.",
  },
  {
    img: "/rsvp.png",
    title: "See who's coming",
    desc: "Private RSVPs and live updates to build excitement without the stress.",
  },
  {
    img: "/team.png",
    title: "Make it a team effort",
    desc: "Easily coordinate chairs, drinks, and food so everyone contributes to the party.",
  },
];

export default function Home() {
  useEffect(() => { track("Landing Page Viewed"); }, []);

  return (
    <div style={{ fontFamily: "var(--font-plus-jakarta-sans), system-ui, sans-serif", color: "#1A1A1A", background: "#1A1A1A" }}>
      {/* Nav */}
      <nav className="landing-nav-safe" style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        zIndex: 10,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingLeft: 24,
        paddingRight: 24,
        paddingBottom: 20,
      }}>
        <img src="/stoop.svg" alt="Stoop" style={{ height: 28 }} />
        <a href="/auth" style={{ fontSize: 15, color: "white", textDecoration: "none", fontWeight: 500 }}>
          Sign in
        </a>

      </nav>

      {/* Hero */}
      <section style={{
        position: "relative",
        width: "100%",
        minHeight: "560px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        background: "url('/main_bg.png') center/cover no-repeat",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.55) 100%)",
        }} />
        <div style={{ position: "relative", zIndex: 1, padding: "120px 24px 80px" }}>
          <h1 style={{
            fontFamily: "var(--font-plus-jakarta-sans), system-ui, sans-serif",
            fontSize: "clamp(56px, 7vw, 96px)",
            fontWeight: 800,
            color: "white",
            lineHeight: 1,
            marginBottom: 20,
            letterSpacing: "-2.4px",
          }}>
            Meet your<br />neighbors.
          </h1>
          <p style={{
            fontSize: 18,
            color: "rgba(255,255,255,0.85)",
            maxWidth: 340,
            margin: "0 auto 36px",
            lineHeight: 1.6,
          }}>
            Get everyone together on your street, steps or stoop.
          </p>
          <a href="/host" className="btn-primary" onClick={() => track("Host CTA Clicked")}>
            Host a block party
          </a>
          <a
            href="/interest"
            onClick={() => track("Interest CTA Clicked")}
            style={{
              display: "inline-block",
              marginTop: 12,
              padding: "13px 28px",
              borderRadius: 50,
              border: "1.5px solid rgba(255,255,255,0.5)",
              color: "rgba(255,255,255,0.9)",
              fontSize: 15,
              fontWeight: 500,
              textDecoration: "none",
              transition: "border-color 0.2s, color 0.2s",
            }}
          >
            I'm interested in my block
          </a>
        </div>
      </section>

      {/* Flyer section */}
      <section style={{ background: "#FFFFFF", padding: "72px 24px" }}>
        <p style={{
          textAlign: "center",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.12em",
          color: "#999999",
          textTransform: "uppercase",
          marginBottom: 48,
        }}>
          Everybody needs good neighbors
        </p>

        <div className="flyer-section-grid">
          {/* Flyer mockup */}
          <div className="flyer-card">
            <div className="flyer-card-photo">
              <img
                src="/oak_ridge_family.png"
                alt="Oak Ridge family"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center 30%",
                  display: "block",
                }}
              />
            </div>

            <div style={{ padding: "16px 20px 20px" }}>
              <div style={{ fontSize: 11, color: "#999", marginBottom: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Backyard BBQ
              </div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 10, lineHeight: 1.2 }}>
                Oak Ridge Block Party
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 }}>
                {[
                  { icon: "📅", text: "Saturday, July 12 · 3–7 PM" },
                  { icon: "📍", text: "42 Oak Ridge Ave" },
                ].map(({ icon, text }) => (
                  <div key={text} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#444" }}>
                    <span style={{ fontSize: 11 }}>{icon}</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>

              <p style={{
                fontSize: 12,
                color: "#555",
                lineHeight: 1.6,
                fontStyle: "italic",
                marginBottom: 12,
                borderTop: "0.5px solid #E8E8E8",
                paddingTop: 12,
              }}>
                "Hi neighbors! We're Marc & Linda from #42. We've been here for 10 years and realize we don't know half of you. Let's change that with some burgers and music."
              </p>

              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "0.5px solid #E8E8E8",
                paddingTop: 10,
              }}>
                <div>
                  <div style={{ fontSize: 9, color: "#999", marginBottom: 2, letterSpacing: "0.05em" }}>SCAN & RSVP →</div>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 12, fontWeight: 700, color: "#1A1A1A" }}>Marc & Linda</div>
                </div>
                <div style={{
                  width: 44, height: 44,
                  background: "#1A1A1A",
                  borderRadius: 4,
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  padding: 4,
                  gap: 1,
                  flexShrink: 0,
                }}>
                  {Array.from({ length: 49 }).map((_, i) => {
                    const pattern = [0,0,0,0,0,0,0,0,1,1,0,1,1,0,0,0,1,0,0,1,0,0,0,1,1,0,1,0,0,0,0,0,0,0,0,0,1,0,1,0,1,0,0,1,1,0,0,1,0];
                    return (
                      <div key={i} style={{
                        background: pattern[i] ? "white" : "transparent",
                        borderRadius: 1,
                      }} />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right: copy — hidden on mobile */}
          <div className="flyer-copy">
            <h2 style={{
              fontFamily: "var(--font-plus-jakarta-sans), system-ui, sans-serif",
              fontSize: 48,
              fontWeight: 900,
              color: "#1A1A1A",
              lineHeight: 1.2,
              marginBottom: 16,
            }}>
              Turn strangers into neighbors
            </h2>
            <p style={{ fontSize: 16, color: "#666", lineHeight: 1.7, marginBottom: 28 }}>
              You know the kind of neighborhood where everyone knows each other? This is how you build one.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {["Someone to grab your mail when you're away", "A welcoming face when someone new moves in", "Kids who actually play outside together", "A street that looks out for each other"].map((step) => (
                <div key={step} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#E8521A", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <span style={{ fontSize: 16, color: "#1A1A1A" }}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: "#F9F6F3", padding: "80px 24px" }}>
        <h2 className="how-it-works-heading-desktop" style={{
          fontFamily: "var(--font-plus-jakarta-sans), system-ui, sans-serif",
          fontSize: 32,
          fontWeight: 700,
          textAlign: "center",
          marginBottom: 56,
          color: "#1A1A1A",
        }}>
          How it works
        </h2>
        <h2 className="how-it-works-heading-mobile" style={{
          fontFamily: "var(--font-plus-jakarta-sans), system-ui, sans-serif",
          fontSize: 28,
          fontWeight: 700,
          textAlign: "center",
          marginBottom: 40,
          color: "#1A1A1A",
        }}>
          Here's how it works
        </h2>

        <div className="how-it-works-grid">
          {howItWorksItems.map(({ img, title, desc }) => (
            <div key={title} className="how-it-works-item" style={{ textAlign: "center" }}>
              <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                <img src={img} alt={title} style={{ height: "100%", width: "auto", objectFit: "contain" }} />
              </div>
              <h3 style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#1A1A1A",
                marginBottom: 8,
              }}>
                {title}
              </h3>
              <p style={{ fontSize: 15, color: "#666", lineHeight: 1.6 }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Quote / CTA */}
      <section style={{ background: "#FFFFFF", padding: "96px 24px", textAlign: "center" }}>
        <div style={{
          fontSize: 32, color: "#E8521A", lineHeight: 1, marginBottom: 8,
          fontFamily: "Georgia, serif",
        }}>
          ❝
        </div>
        <blockquote style={{
          fontFamily: "var(--font-plus-jakarta-sans), system-ui, sans-serif",
          fontSize: "clamp(22px, 3vw, 32px)",
          fontWeight: 700,
          color: "#1A1A1A",
          lineHeight: 1.35,
          maxWidth: 640,
          margin: "0 auto 40px",
        }}>
          I found a babysitter and a gardening buddy! Who knew knowing your neighbors was so great
        </blockquote>
        <a href="/host" style={{ fontSize: 16, fontWeight: 500, color: "#E8521A", textDecoration: "none" }}>
          Start your first event →
        </a>
      </section>

      {/* Footer */}
      <footer style={{
        background: "#F9F6F3",
        borderTop: "0.5px solid #E8E8E8",
        padding: "28px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
      }}>
        <img src="/stoop.svg" alt="Stoop" style={{ height: 24 }} />
        <div className="footer-links">
          <a href="/privacy" style={{ fontSize: 13, color: "#666", textDecoration: "none" }}>Privacy</a>
          <a href="mailto:support@stooptime.com" style={{ fontSize: 13, color: "#666", textDecoration: "none" }}>Support</a>
        </div>
        <span style={{ fontSize: 12, color: "#999" }}>
          © 2026 Stoop Inc. All rights reserved.
        </span>
      </footer>
    </div>
  );
}

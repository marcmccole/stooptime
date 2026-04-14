"use client";
import { useEffect } from "react";
import { track } from "@/lib/mixpanel";

export default function InterestDone() {
  useEffect(() => { track("Interest Registered"); }, []);

  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
      background: "#FFFFFF",
      textAlign: "center",
      fontFamily: "inherit",
    }}>
      <a href="/" style={{ textDecoration: "none", marginBottom: 48 }}>
        <img src="/stoop.svg" alt="Stoop" style={{ height: 22 }} />
      </a>

      <div style={{
        width: 64, height: 64, borderRadius: "50%",
        background: "#EAF3DE", display: "flex", alignItems: "center",
        justifyContent: "center", marginBottom: 24,
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3B6D11" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>

      <h1 style={{
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: 32, fontWeight: 700, color: "#1A1A1A",
        marginBottom: 12, lineHeight: 1.2,
      }}>
        You're on the list.
      </h1>

      <p style={{ fontSize: 16, color: "#666", lineHeight: 1.7, maxWidth: 320, marginBottom: 40 }}>
        We'll let you know when neighbors nearby want to throw a block party. Good things are coming.
      </p>

      <a
        href="/"
        style={{
          fontSize: 14, color: "#E8521A", fontWeight: 500,
          textDecoration: "none",
        }}
      >
        Back to Stoop →
      </a>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { track } from "@/lib/mixpanel";

export default function InterestDone() {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    track("Interest Registered");

    // Save registration using session established by the magic link
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data?.user;
      const address = localStorage.getItem("stoop_interest_address");
      const email = localStorage.getItem("stoop_interest_email") ?? user?.email ?? "";

      if (user && address && email && !saved) {
        await fetch("/api/interest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, email, address }),
        });
        localStorage.removeItem("stoop_interest_address");
        localStorage.removeItem("stoop_interest_email");
        setSaved(true);
      }
    });
  }, []);

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

      {/* Confirmed banner */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        background: "#EAF3DE", color: "#3B6D11",
        fontSize: 13, fontWeight: 600,
        padding: "8px 16px", borderRadius: 50,
        marginBottom: 32,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Email confirmed
      </div>

      <h1 style={{
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: 32, fontWeight: 700, color: "#1A1A1A",
        marginBottom: 12, lineHeight: 1.2,
      }}>
        You're on the list.
      </h1>

      <p style={{ fontSize: 16, color: "#666", lineHeight: 1.7, maxWidth: 300, marginBottom: 40 }}>
        We'll let you know when neighbors nearby want to throw a block party.
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

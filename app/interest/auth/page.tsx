"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import InterestLayout from "@/components/interest/InterestLayout";
import { track } from "@/lib/mixpanel";

export default function InterestAuth() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("stoop_interest_address");
    if (!saved) { window.location.href = "/interest"; return; }
    // Move to localStorage so it survives the magic link redirect
    localStorage.setItem("stoop_interest_address", saved);
    sessionStorage.removeItem("stoop_interest_address");
    track("Interest Auth Viewed");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    localStorage.setItem("stoop_interest_email", email.trim());
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=%2Finterest%2Fdone`,
        data: { source: "interest" },
      },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    track("Interest Magic Link Sent");
    setSent(true);
  };

  if (sent) {
    return (
      <InterestLayout backHref="/interest">
        <div style={{ paddingTop: 16, textAlign: "center" }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            background: "#EAF3DE", display: "flex", alignItems: "center",
            justifyContent: "center", margin: "0 auto 20px",
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3B6D11" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1A1A1A", marginBottom: 10 }}>
            Check your email
          </h1>
          <p style={{ fontSize: 15, color: "#888", lineHeight: 1.6, marginBottom: 8 }}>
            We sent a sign-in link to
          </p>
          <p style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A", marginBottom: 28 }}>
            {email}
          </p>
          <p style={{ fontSize: 13, color: "#AAAAAA", lineHeight: 1.6 }}>
            Click the link in the email and you'll be all set.
          </p>
          <button
            onClick={() => { setSent(false); setEmail(""); }}
            style={{
              marginTop: 28, background: "none", border: "none", cursor: "pointer",
              fontSize: 13, color: "#BBBBBB", textDecoration: "underline",
            }}
          >
            Use a different email
          </button>
        </div>
      </InterestLayout>
    );
  }

  return (
    <InterestLayout backHref="/interest">
      <div style={{ paddingTop: 8 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1A1A1A", marginBottom: 8, lineHeight: 1.2 }}>
          What's your email?
        </h1>
        <p style={{ fontSize: 15, color: "#888", marginBottom: 32, lineHeight: 1.6 }}>
          We'll notify you when neighbors nearby plan a party. Click the link we send to confirm it's you.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@email.com"
            autoComplete="email"
            autoFocus
            style={{
              width: "100%", padding: "13px 14px",
              border: "1.5px solid #E8E8E8", borderRadius: 8,
              fontSize: 16, fontFamily: "inherit", boxSizing: "border-box",
              background: "#fff", marginBottom: 10,
            }}
          />
          {error && <p style={{ fontSize: 13, color: "#C8401A", marginBottom: 10 }}>{error}</p>}
          <button
            type="submit"
            disabled={loading || !email.trim()}
            style={{
              width: "100%", padding: "14px 0", borderRadius: 10,
              background: "#E8521A", color: "white", border: "none",
              fontSize: 15, fontWeight: 600, fontFamily: "inherit",
              cursor: loading || !email.trim() ? "default" : "pointer",
              opacity: loading || !email.trim() ? 0.45 : 1,
              transition: "opacity 0.15s",
            }}
          >
            {loading ? "Sending…" : "Send link"}
          </button>
        </form>

        <p style={{ fontSize: 11, color: "#CCCCCC", textAlign: "center", marginTop: 24, lineHeight: 1.7 }}>
          By continuing, you agree to our{" "}
          <a href="/privacy" style={{ color: "#CCCCCC" }}>Privacy Policy</a>.
        </p>
      </div>
    </InterestLayout>
  );
}

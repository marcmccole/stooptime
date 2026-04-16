"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import StepLayout from "@/components/onboarding/StepLayout";
import { track } from "@/lib/mixpanel";

export default function Step3() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInWithGoogle = async () => {
    track("Auth Started", { method: "google", context: "host_flow" });
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=%2Fhost%2Fdate`,
      },
    });
    if (error) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    track("Auth Started", { method: "magic_link", context: "host_flow" });
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=%2Fhost%2Fdate`,
      },
    });
    setLoading(false);
    if (error) { setError(error.message); } else { track("Magic Link Sent", { context: "host_flow" }); setSent(true); }
  };

  if (sent) {
    return (
      <StepLayout step={3} backHref="/host/address">
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
          <p style={{ fontSize: 15, color: "#888", lineHeight: 1.6, marginBottom: 28 }}>
            We sent a sign-in link to<br />
            <strong style={{ color: "#1A1A1A" }}>{email}</strong>
          </p>
          <p style={{ fontSize: 13, color: "#AAAAAA", lineHeight: 1.6 }}>
            Click the link and you'll land right back where you left off.
          </p>
          <button
            onClick={() => { setSent(false); setEmail(""); setLoading(false); }}
            style={{
              marginTop: 28, background: "none", border: "none", cursor: "pointer",
              fontSize: 13, color: "#BBBBBB", textDecoration: "underline",
            }}
          >
            Use a different email
          </button>
        </div>
      </StepLayout>
    );
  }

  return (
    <StepLayout step={3} backHref="/host/address">
      <div style={{ paddingTop: 16 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1A1A1A", marginBottom: 8, lineHeight: 1.2 }}>
          Great! Let's save your party.
        </h1>
        <p style={{ fontSize: 15, color: "#888", marginBottom: 32, lineHeight: 1.6 }}>
          Create an account so you can manage your party and track RSVPs.
        </p>

        {/* Google */}
        <button
          onClick={signInWithGoogle}
          disabled={loading}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            width: "100%", padding: "14px 20px", borderRadius: 10,
            border: "1.5px solid #E8E8E8", background: "#FFFFFF",
            fontSize: 15, fontWeight: 600, color: "#1A1A1A",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
            fontFamily: "inherit", marginBottom: 16,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {loading ? "Redirecting…" : "Continue with Google"}
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: "#E8E8E8" }} />
          <span style={{ fontSize: 12, color: "#BBBBBB", fontWeight: 500 }}>or</span>
          <div style={{ flex: 1, height: 1, background: "#E8E8E8" }} />
        </div>

        {/* Email magic link */}
        <form onSubmit={handleEmailSubmit}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Enter your email"
            autoComplete="email"
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
              fontSize: 15, fontWeight: 600,
              cursor: loading || !email.trim() ? "default" : "pointer",
              fontFamily: "inherit",
              opacity: loading || !email.trim() ? 0.45 : 1,
              transition: "opacity 0.15s",
            }}
          >
            {loading ? "Sending…" : "Send sign-in link"}
          </button>
        </form>

        <p style={{ fontSize: 11, color: "#CCCCCC", textAlign: "center", marginTop: 24, lineHeight: 1.7 }}>
          By continuing, you agree to our{" "}
          <a href="/privacy" style={{ color: "#CCCCCC" }}>Privacy Policy</a>.
        </p>
        <p style={{ fontSize: 12, color: "#CCCCCC", textAlign: "center", marginTop: 12 }}>
          Questions?{" "}
          <a href="mailto:support@stooptime.com" style={{ color: "#AAAAAA", textDecoration: "none" }}>
            support@stooptime.com
          </a>
        </p>
      </div>
    </StepLayout>
  );
}

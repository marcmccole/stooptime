"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { track } from "@/lib/mixpanel";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = () => {
    track("Auth Started", { method: "google", context: "sign_in" });
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/home` },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    track("Auth Started", { method: "magic_link", context: "sign_in" });
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/home` },
    });
    setLoading(false);
    if (error) { setError(error.message); } else { setSent(true); }
  };

  if (sent) {
    return (
      <div style={{
        minHeight: "100dvh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "#F9F6F3", fontFamily: "var(--font-plus-jakarta-sans), system-ui, sans-serif",
        padding: "0 24px", textAlign: "center",
      }}>
        <img src="/stoop.svg" alt="Stoop" style={{ height: 28, marginBottom: 40 }} />
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "#EAF3DE", display: "flex", alignItems: "center",
          justifyContent: "center", margin: "0 auto 20px",
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B6D11" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1A1A1A", marginBottom: 10, letterSpacing: "-0.3px" }}>
          Check your email
        </h1>
        <p style={{ fontSize: 15, color: "#888", lineHeight: 1.6, marginBottom: 28 }}>
          We sent a sign-in link to<br />
          <strong style={{ color: "#1A1A1A" }}>{email}</strong>
        </p>
        <button
          onClick={() => { setSent(false); setEmail(""); }}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#AAAAAA", textDecoration: "underline" }}
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100dvh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#F9F6F3", fontFamily: "var(--font-plus-jakarta-sans), system-ui, sans-serif",
      padding: "0 24px",
    }}>
      <img src="/stoop.svg" alt="Stoop" style={{ height: 28, marginBottom: 40 }} />

      <div style={{ width: "100%", maxWidth: 340 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1A1A1A", marginBottom: 8, letterSpacing: "-0.4px", textAlign: "center" }}>
          Sign in to Stoop
        </h1>
        <p style={{ fontSize: 15, color: "#888", textAlign: "center", marginBottom: 32, lineHeight: 1.5 }}>
          Save your party and manage RSVPs.
        </p>

        {/* Google */}
        <button
          onClick={handleGoogleSignIn}
          style={{
            width: "100%", padding: "13px 0", borderRadius: 10,
            background: "#fff", border: "1.5px solid #E8E8E8",
            fontSize: 15, fontWeight: 600, cursor: "pointer",
            fontFamily: "inherit", color: "#1A1A1A",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            marginBottom: 16,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.32-8.16 2.32-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: "#E8E8E8" }} />
          <span style={{ fontSize: 12, color: "#BBBBBB", fontWeight: 500 }}>or</span>
          <div style={{ flex: 1, height: 1, background: "#E8E8E8" }} />
        </div>

        {/* Email magic link */}
        <form onSubmit={handleSubmit}>
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
              fontSize: 15, fontWeight: 600, cursor: loading || !email.trim() ? "default" : "pointer",
              fontFamily: "inherit",
              opacity: loading || !email.trim() ? 0.45 : 1,
              transition: "opacity 0.15s",
            }}
          >
            {loading ? "Sending…" : "Send sign-in link"}
          </button>
        </form>
        <p style={{ fontSize: 12, color: "#CCCCCC", textAlign: "center", marginTop: 28 }}>
          Questions?{" "}
          <a href="mailto:support@stooptime.com" style={{ color: "#AAAAAA", textDecoration: "none" }}>
            support@stooptime.com
          </a>
        </p>
      </div>
    </div>
  );
}

"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import InterestLayout from "@/components/interest/InterestLayout";
import { track } from "@/lib/mixpanel";

export default function InterestAuth() {
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const saved = sessionStorage.getItem("stoop_interest_address");
    if (!saved) { window.location.href = "/interest"; return; }
    setAddress(saved);
    track("Interest Auth Viewed");
  }, []);

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true, data: { source: "interest" } },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    track("Interest OTP Sent");
    setCodeSent(true);
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  };

  const handleCodeInput = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[idx] = digit;
    setCode(next);
    if (digit && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
    // Auto-submit when all 6 filled
    if (digit && idx === 5 && next.every(d => d)) {
      verifyCode(next.join(""));
    }
  };

  const handleCodeKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      e.preventDefault();
      const next = pasted.split("");
      setCode(next);
      inputRefs.current[5]?.focus();
      verifyCode(pasted);
    }
  };

  const verifyCode = async (token: string) => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token,
      type: "email",
    });
    if (error) {
      setLoading(false);
      setError("That code didn't work. Double-check and try again.");
      return;
    }
    track("Interest Verified");

    // Save to DB
    const userId = data.user?.id;
    await fetch("/api/interest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, email: email.trim(), address }),
    });

    sessionStorage.removeItem("stoop_interest_address");
    window.location.href = "/interest/done";
  };

  return (
    <InterestLayout backHref="/interest">
      <div style={{ paddingTop: 8 }}>
        {!codeSent ? (
          <>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1A1A1A", marginBottom: 8, lineHeight: 1.2 }}>
              What's your email?
            </h1>
            <p style={{ fontSize: 15, color: "#888", marginBottom: 32, lineHeight: 1.6 }}>
              We'll send you a one-time code to confirm your spot.
            </p>

            <form onSubmit={sendCode}>
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
                {loading ? "Sending…" : "Send code"}
              </button>
            </form>
          </>
        ) : (
          <>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: "#EAF3DE", display: "flex", alignItems: "center",
              justifyContent: "center", marginBottom: 20,
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3B6D11" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1A1A1A", marginBottom: 8, lineHeight: 1.2 }}>
              Check your email
            </h1>
            <p style={{ fontSize: 15, color: "#888", marginBottom: 32, lineHeight: 1.6 }}>
              We sent a 6-digit code to <strong style={{ color: "#1A1A1A" }}>{email}</strong>
            </p>

            {/* OTP input */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16, justifyContent: "center" }} onPaste={handleCodePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleCodeInput(i, e.target.value)}
                  onKeyDown={e => handleCodeKeyDown(i, e)}
                  style={{
                    width: 48, height: 56, textAlign: "center",
                    fontSize: 24, fontWeight: 700,
                    border: `1.5px solid ${digit ? "#E8521A" : "#E8E8E8"}`,
                    borderRadius: 8, fontFamily: "inherit",
                    background: "#fff", caretColor: "#E8521A",
                  }}
                />
              ))}
            </div>

            {error && <p style={{ fontSize: 13, color: "#C8401A", textAlign: "center", marginBottom: 12 }}>{error}</p>}

            {loading && (
              <p style={{ fontSize: 14, color: "#AAAAAA", textAlign: "center" }}>Verifying…</p>
            )}

            <button
              onClick={() => { setCodeSent(false); setCode(["","","","","",""]); setError(null); }}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 13, color: "#BBBBBB", textDecoration: "underline",
                display: "block", margin: "24px auto 0",
              }}
            >
              Use a different email
            </button>
          </>
        )}

        <p style={{ fontSize: 11, color: "#CCCCCC", textAlign: "center", marginTop: 24, lineHeight: 1.7 }}>
          By continuing, you agree to our{" "}
          <a href="/privacy" style={{ color: "#CCCCCC" }}>Privacy Policy</a>.
        </p>
      </div>
    </InterestLayout>
  );
}

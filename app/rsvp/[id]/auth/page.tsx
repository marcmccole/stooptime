"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getTasks, getEvent, DbEvent } from "@/lib/db";

export default function RSVPAuth({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const [loading, setLoading] = useState<"google" | "magic" | null>(null);
  const [sent, setSent] = useState(false);
  const [unclaimedCount, setUnclaimedCount] = useState<number | null>(null);
  const [event, setEvent] = useState<DbEvent | null>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    getTasks(params.id).then(tasks => {
      setUnclaimedCount(tasks.filter(t => !t.claimed_by_name).length);
    });
    getEvent(params.id).then(setEvent);

    // Pre-fill email from RSVP step
    const stored = sessionStorage.getItem("stoop_rsvp");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.email) setEmail(parsed.email);
    }

    // Check if already signed in — skip auth screen
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace(`/rsvp/${params.id}/profile`);
    });
  }, [params.id]);

  const signInGoogle = async () => {
    setLoading("google");
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(`/rsvp/${params.id}/profile`)}`,
      },
    });
  };

  const sendMagicLink = async () => {
    if (!email.trim() || loading) return;
    setLoading("magic");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(`/rsvp/${params.id}/profile`)}`,
      },
    });
    setLoading(null);
    if (!error) setSent(true);
  };

  if (sent) {
    return (
      <div style={{
        minHeight: "100dvh", background: "#F9F6F3",
        fontFamily: "var(--font-plus-jakarta-sans), system-ui, sans-serif",
      }}>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 20px" }}>
          <img src="/stoop.svg" alt="Stoop" style={{ height: 20 }} />
        </div>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "60px 20px 48px", textAlign: "center" }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "#FDF0E8", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 28, margin: "0 auto 20px",
          }}>
            ✉️
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1A1A1A", lineHeight: 1.2, marginBottom: 10 }}>
            Check your inbox.
          </h1>
          <p style={{ fontSize: 15, color: "#888", lineHeight: 1.65, marginBottom: 8 }}>
            We sent a link to <strong style={{ color: "#1A1A1A" }}>{email}</strong>.
          </p>
          <p style={{ fontSize: 15, color: "#888", lineHeight: 1.65 }}>
            Click it to see who's coming and claim a task.
          </p>
          <button
            onClick={() => { setSent(false); setLoading(null); }}
            style={{
              marginTop: 32, background: "none", border: "none",
              fontSize: 14, color: "#BBBBBB", cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100dvh", background: "#F9F6F3",
      fontFamily: "var(--font-plus-jakarta-sans), system-ui, sans-serif",
    }}>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 20px" }}>
        <img src="/stoop.svg" alt="Stoop" style={{ height: 20 }} />
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "28px 20px 48px" }}>

        {/* Confirmation */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "#FDF0E8", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 28, margin: "0 auto 16px",
          }}>
            🎉
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1A1A1A", lineHeight: 1.15, marginBottom: 10 }}>
            You're on the list!
          </h1>
          <p style={{ fontSize: 15, color: "#888", lineHeight: 1.65 }}>
            Confirm your email to see who's coming, claim a task, and get party updates.
          </p>
        </div>

        {/* Task count badge */}
        {unclaimedCount !== null && unclaimedCount > 0 && (
          <div style={{
            background: "#FFFFFF", borderRadius: 12,
            border: "1.5px solid #E8E8E8",
            padding: "16px 18px", marginBottom: 24,
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
              background: "#FDF0E8", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 22,
            }}>
              ✋
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A" }}>
                {unclaimedCount} open task{unclaimedCount !== 1 ? "s" : ""} need volunteers.
              </div>
              <div style={{ fontSize: 13, color: "#999", marginTop: 2 }}>
                Claim one to help make it happen.
              </div>
            </div>
          </div>
        )}

        {/* Magic link */}
        <div style={{ marginBottom: 14 }}>
          <label style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
            color: "#AAAAAA", textTransform: "uppercase", display: "block", marginBottom: 8,
          }}>
            Email
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                flex: 1, padding: "14px", borderRadius: 10,
                border: "1.5px solid #E8E8E8", fontSize: 15,
                fontFamily: "inherit", color: "#1A1A1A",
                background: "#FFFFFF", outline: "none",
                boxSizing: "border-box",
              }}
            />
            <button
              onClick={sendMagicLink}
              disabled={!email.trim() || loading === "magic"}
              style={{
                padding: "14px 18px", borderRadius: 10,
                background: email.trim() ? "#E8521A" : "#E8E8E8",
                color: email.trim() ? "#FFFFFF" : "#AAAAAA",
                border: "none", fontSize: 15, fontWeight: 600,
                cursor: email.trim() ? "pointer" : "default",
                fontFamily: "inherit", whiteSpace: "nowrap",
                transition: "background 0.15s",
              }}
            >
              {loading === "magic" ? "Sending…" : "Send link"}
            </button>
          </div>
        </div>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
          <div style={{ flex: 1, height: 1, background: "#E8E8E8" }} />
          <span style={{ fontSize: 12, color: "#BBBBBB", fontWeight: 600 }}>or</span>
          <div style={{ flex: 1, height: 1, background: "#E8E8E8" }} />
        </div>

        {/* Google sign-in */}
        <button
          onClick={signInGoogle}
          disabled={loading === "google"}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            width: "100%", padding: "15px 20px", borderRadius: 50,
            background: "#FFFFFF", border: "1.5px solid #E8E8E8",
            fontSize: 16, fontWeight: 600, color: "#1A1A1A",
            cursor: loading === "google" ? "not-allowed" : "pointer",
            opacity: loading === "google" ? 0.6 : 1,
            fontFamily: "inherit",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {loading === "google" ? "Redirecting…" : "Continue with Google"}
        </button>

        <p style={{ fontSize: 11, color: "#CCCCCC", textAlign: "center", marginTop: 28, lineHeight: 1.7 }}>
          We'll only use your email to send party updates and let your neighbors know you're coming.
        </p>
      </div>
    </div>
  );
}

"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getTasks, getEvent, DbEvent } from "@/lib/db";

export default function RSVPAuth({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [unclaimedCount, setUnclaimedCount] = useState<number | null>(null);
  const [event, setEvent] = useState<DbEvent | null>(null);

  useEffect(() => {
    getTasks(params.id).then(tasks => {
      setUnclaimedCount(tasks.filter(t => !t.claimed_by_name).length);
    });
    getEvent(params.id).then(setEvent);

    // Check if already signed in — skip auth screen
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace(`/rsvp/${params.id}/profile`);
      }
    });
  }, [params.id]);

  const addToCalendar = () => {
    if (!event?.event_date) return;
    const [year, month, day] = event.event_date.split("-").map(Number);
    const [h, m] = (event.event_time || "14:00").split(":").map(Number);
    const start = new Date(year, month - 1, day, h, m);
    const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const vibe: Record<string, string> = { bbq: "Backyard BBQ", wine: "Wine on the Porch", cookout: "Block Cookout", pizza: "Pizza Party", potluck: "Bring a Dish Night", other: "Block Party" };
    const title = event.family_name?.trim()
      ? `${vibe[event.vibe || ""] || "Block Party"} at The ${event.family_name.trim()}s'`
      : (vibe[event.vibe || ""] || "Block Party");
    window.open(`https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${fmt(start)}/${fmt(end)}&location=${encodeURIComponent(event.address || "")}`, "_blank");
  };

  const signIn = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(`/rsvp/${params.id}/profile`)}`,
      },
    });
  };

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
            Sign in to get great party reminders, learn about your neighbors, and help make the party a success.
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

        {/* Google sign-in */}
        <button
          onClick={signIn}
          disabled={loading}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            width: "100%", padding: "15px 20px", borderRadius: 50,
            background: "#FFFFFF", border: "1.5px solid #E8E8E8",
            fontSize: 16, fontWeight: 600, color: "#1A1A1A",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
            fontFamily: "inherit", marginBottom: 14,
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {loading ? "Redirecting…" : "Continue with Google"}
        </button>

        <button
          onClick={addToCalendar}
          disabled={!event?.event_date}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            width: "100%", background: "none", border: "1.5px solid #E8E8E8",
            borderRadius: 50, padding: "14px 20px",
            fontSize: 15, fontWeight: 600, color: "#666",
            cursor: event?.event_date ? "pointer" : "default",
            fontFamily: "inherit", opacity: event?.event_date ? 1 : 0.4,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Add to my calendar
        </button>

        <p style={{ fontSize: 11, color: "#CCCCCC", textAlign: "center", marginTop: 32, lineHeight: 1.7 }}>
          We'll only use your account to send party updates and let your neighbors know you're coming.
        </p>
      </div>
    </div>
  );
}

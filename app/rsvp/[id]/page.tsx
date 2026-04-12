"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { getEvent, createRsvp, DbEvent } from "@/lib/db";
import { track } from "@/lib/mixpanel";

const VIBE_TITLES: Record<string, string> = {
  bbq: "Backyard BBQ", wine: "Wine on the Porch", cookout: "Block Cookout",
  pizza: "Pizza Party", potluck: "Bring a Dish Night", other: "Block Party",
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function formatShortDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return `${DAYS_SHORT[d.getDay()]}, ${MONTHS[month - 1]} ${day}`;
}

function buildEventTitle(event: DbEvent | null) {
  if (!event) return "Block Party";
  const vibe = VIBE_TITLES[event.vibe || ""] || "Block Party";
  return event.family_name?.trim() ? `${vibe} at The ${event.family_name.trim()}s'` : vibe;
}

export default function RSVPPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const [event, setEvent] = useState<DbEvent | null>(null);
  const [name, setName] = useState("");
  const [blockAddress, setBlockAddress] = useState("");
  const [tenure, setTenure] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getEvent(params.id).then(e => {
      setEvent(e);
      track("RSVP Page Viewed", { event_id: params.id });
    });
  }, [params.id]);

  const ready = name.trim().length > 0;

  const submit = async () => {
    if (!ready || submitting) return;
    setSubmitting(true);
    const rsvpId = await createRsvp({
      event_id: params.id,
      family_name: name,
      guest_count: 1,
      has_partner: false,
      has_kids: false,
      kid_count: 0,
      has_dog: false,
      family_note: tenure.trim() || undefined,
    });
    sessionStorage.setItem("stoop_rsvp", JSON.stringify({ name, blockAddress, tenure, rsvpId }));
    track("RSVP Submitted", { event_id: params.id, has_address: !!blockAddress.trim(), has_tenure: !!tenure.trim() });
    // Notify host — fire and forget
    fetch("/api/notify-rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: params.id, guestName: name, guestNote: tenure.trim() || null }),
    }).catch(() => {});
    router.push(`/rsvp/${params.id}/auth`);
  };

  const photo = event?.photo_url || "/oak_ridge_family.png";
  const eventTitle = buildEventTitle(event);
  const dateStr = event?.event_date ? formatShortDate(event.event_date) : null;
  const hostName = event?.family_name?.trim() ? `The ${event.family_name.trim()}s` : "your neighbors";

  return (
    <div style={{
      minHeight: "100dvh", background: "#FFFFFF",
      fontFamily: "var(--font-plus-jakarta-sans), system-ui, sans-serif",
    }}>
      {/* Nav */}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 20px" }}>
        <img src="/stoop.svg" alt="Stoop" style={{ height: 20 }} />
      </div>

      {/* Event context pill */}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px 14px" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "#FDF0E8", borderRadius: 20, padding: "6px 12px",
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#E8521A", letterSpacing: "0.03em" }}>
            {eventTitle}
          </span>
          {dateStr && (
            <>
              <span style={{ fontSize: 12, color: "#E8521A", opacity: 0.4 }}>·</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: "#C8401A" }}>{dateStr}</span>
            </>
          )}
        </div>
      </div>

      {/* Hero photo */}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px 24px" }}>
        <div className="skeleton" style={{ borderRadius: 14, overflow: "hidden", height: 180, position: "relative" }}>
          <img src={photo} alt="Event" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%" }} onLoad={e => (e.currentTarget.parentElement as HTMLElement)?.classList.remove("skeleton")} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.18) 0%, transparent 60%)" }} />
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px 48px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1A1A1A", lineHeight: 1.15, marginBottom: 8 }}>
          Let your neighbors know you're coming.
        </h1>
        <p style={{ fontSize: 15, color: "#888", marginBottom: 28, lineHeight: 1.6 }}>
          No login required. Just your name.
        </p>

        {/* Name */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Your name or family name</label>
          <input
            type="text"
            placeholder="The Robinsons"
            value={name}
            onChange={e => setName(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Block address */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>
            Address on the block{" "}
            <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, fontSize: 11 }}>(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. 42 Oak Lane"
            value={blockAddress}
            onChange={e => setBlockAddress(e.target.value)}
            style={inputStyle}
          />
          <p style={{ fontSize: 12, color: "#BBBBBB", marginTop: 6 }}>Only share what you're comfortable with.</p>
        </div>

        {/* Tenure */}
        <div style={{ marginBottom: 32 }}>
          <label style={labelStyle}>
            How long have you lived here?{" "}
            <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, fontSize: 11 }}>(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. 4 years, just moved in, born and raised here"
            value={tenure}
            onChange={e => setTenure(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* CTA */}
        <button
          onClick={submit}
          disabled={!ready || submitting}
          style={{
            width: "100%", padding: "16px", borderRadius: 50,
            background: ready ? "#E8521A" : "#E8E8E8",
            color: ready ? "white" : "#AAAAAA",
            border: "none", fontSize: 16, fontWeight: 600,
            cursor: ready ? "pointer" : "default",
            fontFamily: "inherit", transition: "background 0.15s",
            marginBottom: 12,
          }}
        >
          {submitting ? "Saving…" : "I'm coming →"}
        </button>

        <p style={{ fontSize: 13, color: "#BBBBBB", textAlign: "center" }}>
          You'll meet {hostName} on the day.
        </p>
        <p style={{ fontSize: 12, color: "#DDDDDD", textAlign: "center", marginTop: 24 }}>
          Questions?{" "}
          <a href="mailto:support@stooptime.com" style={{ color: "#BBBBBB", textDecoration: "none" }}>
            support@stooptime.com
          </a>
        </p>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
  color: "#AAAAAA", textTransform: "uppercase", display: "block", marginBottom: 8,
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "13px 14px",
  border: "1.5px solid #E8E8E8", borderRadius: 10,
  fontSize: 15, fontFamily: "inherit", boxSizing: "border-box",
  background: "#fff", color: "#1A1A1A", outline: "none",
};

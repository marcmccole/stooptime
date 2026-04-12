"use client";
import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { getPartyState, savePartyState, PartyState } from "@/lib/party-state";
import { supabase } from "@/lib/supabase";
import { saveEvent, seedTasks, uploadPhoto } from "@/lib/db";
import { track } from "@/lib/mixpanel";


const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_LONG = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

const VIBE_TITLES: Record<string, string> = {
  bbq: "Backyard BBQ",
  wine: "Wine on the Porch",
  cookout: "Block Cookout",
  pizza: "Pizza Party",
  potluck: "Bring a Dish Night",
  other: "Snacks & Socialize",
  cocktails: "Cocktail Hour",
  kids: "Kids Block Play",
  welcome: "Lawn Games",
};

function formatDate(date: { year: number; month: number; day: number }, time: string): string {
  const d = new Date(date.year, date.month, date.day);
  const dayName = DAYS_LONG[d.getDay()];
  const monthName = MONTHS[date.month];
  const [h, m] = time.split(":").map(Number);
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${dayName}, ${monthName} ${date.day} · ${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function buildTitle(state: Partial<PartyState>): string {
  const vibeTitle = VIBE_TITLES[state.vibe || ""] || "Block Party";
  const family = state.familyName?.trim();
  if (!family) return vibeTitle;
  // If familyName contains spaces it's a full custom title; otherwise format it
  if (family.includes(" ")) return family;
  return `${vibeTitle} at The ${family}s'`;
}

function buildHostLine(state: Partial<PartyState>): string {
  const parts: string[] = [];
  if (state.yourName?.trim()) parts.push(state.yourName.trim());
  if (state.partnerName?.trim()) parts.push(state.partnerName.trim());
  if (state.kids && state.kids.length > 0) {
    parts.push(`our ${state.kids.length} kid${state.kids.length > 1 ? "s" : ""}`);
  }
  if (state.pets && state.pets.length > 0) {
    const pet = state.pets[0];
    parts.push(pet.name?.trim() ? `${pet.name} (our ${pet.petType})` : `our ${pet.petType}`);
  }
  if (parts.length === 0) return "";
  if (parts.length === 1) return `Hosted by ${parts[0]}`;
  const last = parts.pop();
  return `Hosted by ${parts.join(", ")}, and ${last}.`;
}

export default function FlyerPreview() {
  const [state, setState] = useState<Partial<PartyState>>({});
  const [editingNote, setEditingNote] = useState(false);
  const [note, setNote] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [eventId, setEventId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const s = getPartyState();
    setState(s);
    setNote(s.whyNote?.trim() || s.familyNote?.trim() || "");
    initEvent(s);
  }, []);

  async function initEvent(s: Partial<PartyState>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSaving(true);
    try {
      const existingEventId = localStorage.getItem("stoop_event_id");

      // 1. Save event first (without photo) so we get the ID immediately
      const id = await saveEvent(s, user.id, existingEventId, undefined, user.email);
      if (!id) { console.error("saveEvent returned null"); return; }

      // 2. Seed tasks if this is a brand-new event
      if (!existingEventId && s.vibe) {
        await seedTasks(id, s.vibe);
        track("Event Created", { event_id: id, vibe: s.vibe, size: s.size, has_photo: !!s.photoDataUrl });
        // Email host confirmation
        if (user.email) {
          const dateStr = s.date
            ? `${s.date.year}-${String(s.date.month + 1).padStart(2, "0")}-${String(s.date.day).padStart(2, "0")}`
            : null;
          fetch("/api/event-created-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user.email,
              eventId: id,
              vibe: s.vibe,
              familyName: s.familyName,
              address: s.address,
              date: dateStr,
              time: s.time,
            }),
          }).then(r => { if (!r.ok) r.json().then(e => console.error("event-created-email failed:", e)); })
            .catch(e => console.error("event-created-email fetch error:", e));
        }
      }

      // 3a. Notify marc if this is a new street closure party
      if (!existingEventId && s.size === "street_closure") {
        const dateStr = s.date
          ? `${MONTHS[s.date.month]} ${s.date.day}, ${s.date.year}`
          : null;
        const [h, m] = (s.time || "14:00").split(":").map(Number);
        const ampm = h < 12 ? "AM" : "PM";
        const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        fetch("/api/notify-street-closure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hostEmail: user.email,
            hostName: user.user_metadata?.full_name ?? user.user_metadata?.name ?? "",
            address: s.address,
            date: dateStr,
            time: `${h12}:${String(m).padStart(2, "0")} ${ampm}`,
            vibe: VIBE_TITLES[s.vibe || ""] || s.vibe,
            size: "Street closure",
            eventId: id,
          }),
        }).catch(() => {});
      }

      // 3. Show QR code right away
      localStorage.setItem("stoop_event_id", id);
      setEventId(id);
      setSaving(false);

      // 4. Upload photo in the background and patch the event
      if (s.photoDataUrl?.startsWith("data:")) {
        const photoUrl = await uploadPhoto(s.photoDataUrl, "event-photos", `${user.id}/${id}`);
        if (photoUrl) await saveEvent(s, user.id, id, photoUrl);
      }
    } catch (e) {
      console.error("initEvent error:", e);
    } finally {
      setSaving(false);
    }
  }

  const title = buildTitle(state);
  const hostLine = buildHostLine(state);
  const dateStr = state.date
    ? formatDate(state.date, state.time || "14:00")
    : null;
  const vibeLabel = VIBE_TITLES[state.vibe || ""] || "Block Party";
  const photo = state.photoDataUrl || "/oak_ridge_family.png";

  return (
    <div style={{
      minHeight: "100dvh", background: "#F9F6F3",
      fontFamily: "var(--font-plus-jakarta-sans), system-ui, sans-serif",
    }}>
      {/* Header */}
      <div className="no-print" style={{
        maxWidth: 480, margin: "0 auto",
        padding: "32px 20px 24px",
      }}>
        <a href="/host/flyer" style={{ color: "#AAAAAA", display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none", fontSize: 13, marginBottom: 20 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/><path d="M12 5l-7 7 7 7"/>
          </svg>
          Back
        </a>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1A1A1A", marginBottom: 6, letterSpacing: "-0.5px" }}>
          Here's your flyer.
        </h1>
        <p style={{ fontSize: 15, color: "#888", lineHeight: 1.6, margin: 0 }}>
          Your invite is ready. Print it out and drop it in your neighbor's mail.
        </p>
      </div>

      {/* Print wrapper — vertically centers text + card on the page */}
      <div className="print-container">
        <div className="print-invited">You&rsquo;re invited&hellip;</div>

      {/* Flyer card — baseball card proportions, centered */}
      <div style={{ display: "flex", justifyContent: "center", padding: "0 20px 28px" }}>
        <div className="print-flyer" style={{
          width: 340,
          background: "#FFFFFF",
          borderRadius: 18,
          overflow: "hidden",
          boxShadow: "0 8px 40px rgba(0,0,0,0.14)",
          border: "1px solid #E8E8E8",
          flexShrink: 0,
        }}>
          {/* Photo — tall, dominant */}
          <div className="skeleton" style={{ width: "100%", height: 260, overflow: "hidden", position: "relative" }}>
            <img
              src={photo}
              alt="Family photo"
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 25%" }}
              onLoad={e => (e.currentTarget.parentElement as HTMLElement)?.classList.remove("skeleton")}
            />
            {/* Vibe badge top-left */}
            <div style={{
              position: "absolute", top: 12, left: 12,
              background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
              borderRadius: 6, padding: "3px 8px",
              fontSize: 9, fontWeight: 800, letterSpacing: "0.12em",
              color: "white", textTransform: "uppercase",
            }}>
              {vibeLabel}
            </div>
            {/* Street closure badge top-right */}
            {state.size === "street_closure" && (
              <div style={{
                position: "absolute", top: 12, right: 12,
                background: "#E8521A",
                borderRadius: 6, padding: "3px 8px",
                fontSize: 9, fontWeight: 800, letterSpacing: "0.1em",
                color: "white", textTransform: "uppercase",
                display: "flex", alignItems: "center", gap: 4,
              }}>
                🚧 Full block closed
              </div>
            )}
          </div>

          {/* Orange accent bar */}
          <div style={{ height: 5, background: "linear-gradient(90deg, #E8521A, #F07A40)" }} />

          {/* Info panel */}
          <div style={{ padding: "16px 18px 14px" }}>
            {/* Title */}
            <div style={{ marginBottom: 12 }}>
              {editingTitle ? (
                <input
                  autoFocus
                  value={titleDraft}
                  onChange={e => setTitleDraft(e.target.value)}
                  onBlur={() => {
                    const trimmed = titleDraft.trim();
                    if (trimmed) {
                      const updated = { ...state, familyName: trimmed };
                      setState(updated);
                      savePartyState(updated);
                      if (eventId) saveEvent(updated, "", eventId);
                    }
                    setEditingTitle(false);
                  }}
                  onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditingTitle(false); }}
                  style={{
                    width: "100%", border: "none", borderBottom: "1.5px solid #E8521A", outline: "none",
                    fontSize: 20, fontWeight: 800, color: "#1A1A1A",
                    lineHeight: 1.3, letterSpacing: "-0.3px", background: "transparent",
                    fontFamily: "var(--font-plus-jakarta-sans), system-ui, sans-serif",
                    padding: "0 0 2px",
                  }}
                />
              ) : (
                <div
                  onClick={() => { setTitleDraft(title); setEditingTitle(true); }}
                  style={{
                    fontSize: 20, fontWeight: 800, color: "#1A1A1A",
                    lineHeight: 1.15, letterSpacing: "-0.3px", cursor: "text",
                    fontFamily: "var(--font-plus-jakarta-sans), system-ui, sans-serif",
                  }}
                >
                  {title}
                </div>
              )}
            </div>

            {/* Date + Address stacked */}
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
              {dateStr && (
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E8521A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <span style={{ fontSize: 13, color: "#444", fontWeight: 500 }}>{dateStr}</span>
                </div>
              )}
              {state.address && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E8521A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 1, flexShrink: 0 }}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span style={{ fontSize: 13, color: "#444", fontWeight: 500, lineHeight: 1.4 }}>{state.address}</span>
                </div>
              )}
            </div>

            {/* Personal note */}
            {note && (
              <div style={{ borderTop: "0.5px solid #F0EEEB", paddingTop: 12, marginBottom: 14 }}>
                {editingNote ? (
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    onBlur={() => setEditingNote(false)}
                    autoFocus
                    rows={4}
                    style={{
                      width: "100%", border: "none", outline: "none",
                      fontSize: 12, color: "#555", lineHeight: 1.65,
                      fontFamily: "inherit", fontStyle: "italic",
                      resize: "none", background: "transparent",
                      boxSizing: "border-box",
                    }}
                  />
                ) : (
                  <p
                    onClick={() => setEditingNote(true)}
                    style={{ fontSize: 12, color: "#555", lineHeight: 1.65, fontStyle: "italic", margin: 0, cursor: "text" }}
                  >
                    "{note}"
                  </p>
                )}
              </div>
            )}

            {/* Bottom row: logo + QR */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "flex-end",
              borderTop: "0.5px solid #F0EEEB", paddingTop: 12,
            }}>
              <div>
                <img src="/stoop.svg" alt="Stoop" style={{ height: 16, display: "block", marginBottom: 4 }} />
                <div style={{ fontSize: 9, color: "#BBBBBB", letterSpacing: "0.06em", fontWeight: 600, textTransform: "uppercase" }}>
                  {saving ? "Saving…" : eventId ? `ID: ${eventId.slice(0, 8).toUpperCase()}` : "—"}
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", color: "#AAAAAA", textTransform: "uppercase", marginBottom: 5 }}>
                  Scan to RSVP
                </div>
                {eventId ? (
                  <QRCodeSVG
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/rsvp/${eventId}`}
                    size={64}
                    bgColor="#FFFFFF"
                    fgColor="#1A1A1A"
                    style={{ display: "block" }}
                  />
                ) : (
                  <div style={{ width: 64, height: 64, background: "#F0EEEB", borderRadius: 4 }} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>{/* end print-container */}

      {/* Actions */}
      <div className="no-print" style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px 16px" }}>
        <button
          onClick={() => { track("Flyer Printed", { context: "preview" }); window.print(); }}
          style={{
            width: "100%", padding: "15px 20px", borderRadius: 50,
            background: "#E8521A", color: "white", border: "none",
            fontSize: 16, fontWeight: 600, cursor: "pointer",
            fontFamily: "inherit", marginBottom: 10,
          }}
        >
          Print flyers
        </button>
        <a href="/event/manage" style={{
          display: "block", width: "100%", padding: "14px 20px", borderRadius: 50,
          border: "1.5px solid #E8E8E8", background: "white",
          fontSize: 16, fontWeight: 600, color: "#666",
          textDecoration: "none", textAlign: "center",
          boxSizing: "border-box",
        }}>
          Manage event
        </a>
      </div>

      {/* Encouragement */}
      <p className="no-print" style={{
        maxWidth: 480, margin: "0 auto", padding: "8px 20px 48px",
        fontSize: 13, color: "#AAAAAA", textAlign: "center", lineHeight: 1.6,
      }}>
        "Put one in every neighbor's mailbox. Your name on it makes all the difference."
      </p>
    </div>
  );
}

"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { getEventsByHost, getRsvpCount, getRsvpsByUser, DbEvent, DbRsvpWithEvent } from "@/lib/db";
import { track, identify } from "@/lib/mixpanel";

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS_LONG = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

const VIBE_TITLES: Record<string, string> = {
  bbq: "Backyard BBQ", wine: "Wine on the Porch", cookout: "Block Cookout",
  pizza: "Pizza Party", potluck: "Bring a Dish Night", other: "Block Party",
};
const VIBE_EMOJI: Record<string, string> = {
  bbq: "🔥", wine: "🍷", cookout: "🍳", pizza: "🍕", potluck: "🥘", other: "🎉",
};

function buildTitle(event: DbEvent) {
  const vibe = VIBE_TITLES[event.vibe || ""] || "Block Party";
  return event.family_name?.trim() ? `${vibe} at The ${event.family_name.trim()}s'` : vibe;
}

function formatEventDate(dateStr: string, timeStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  const [h, m] = (timeStr || "14:00").split(":").map(Number);
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const time = `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
  if (d.getTime() === today.getTime()) return `Today · ${time}`;
  if (d.getTime() === tomorrow.getTime()) return `Tomorrow · ${time}`;
  return `${DAYS_LONG[d.getDay()]}, ${MONTHS_SHORT[month - 1]} ${day} · ${time}`;
}

function isUpcoming(event: DbEvent) {
  if (!event.event_date) return true;
  const [year, month, day] = event.event_date.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return d >= today;
}

export default function HomeSignedIn() {
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [rsvpCounts, setRsvpCounts] = useState<Record<string, number>>({});
  const [attendingRsvps, setAttendingRsvps] = useState<DbRsvpWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { window.location.href = "/"; return; }
      identify(user.id, { $email: user.email, $name: user.user_metadata?.full_name ?? "" });
      track("Home Viewed");
      const [evts, attending] = await Promise.all([
        getEventsByHost(user.id),
        getRsvpsByUser(user.id),
      ]);
      setEvents(evts);
      // Filter attending to exclude events the user is also hosting
      const hostingIds = new Set(evts.map(e => e.id));
      setAttendingRsvps(attending.filter(r => !hostingIds.has(r.event_id)));
      const counts: Record<string, number> = {};
      await Promise.all(evts.map(async e => {
        counts[e.id] = await getRsvpCount(e.id);
      }));
      setRsvpCounts(counts);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const upcoming = events.filter(isUpcoming);
  const past = events.filter(e => !isUpcoming(e));

  return (
    <div style={{ minHeight: "100dvh", background: "#F9F6F3", fontFamily: "var(--font-plus-jakarta-sans), system-ui, sans-serif" }}>

      {/* Nav */}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <img src="/stoop.svg" alt="Stoop" style={{ height: 20 }} />
        <div ref={menuRef} style={{ position: "relative" }}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#888", display: "flex" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
            </svg>
          </button>
          {menuOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 100,
              background: "#FFFFFF", borderRadius: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
              border: "1px solid #F0EEEB", minWidth: 160, overflow: "hidden",
            }}>
              <button
                onClick={signOut}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  width: "100%", padding: "12px 16px", background: "none", border: "none",
                  cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#1A1A1A",
                  fontFamily: "inherit", textAlign: "left",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px" }}>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#BBBBBB", fontSize: 14 }}>Loading…</div>
        ) : events.length === 0 && attendingRsvps.length === 0 ? (
          <>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#1A1A1A", marginBottom: 20, lineHeight: 1.15 }}>
              Welcome to Stoop.
            </h2>
            <div style={{
              background: "#FFFFFF", border: "1px solid #E8E8E8", borderRadius: 16,
              padding: "40px 24px", textAlign: "center", marginBottom: 40,
            }}>
              <div style={{ fontSize: 40, marginBottom: 14 }}>🏘️</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>No events yet</div>
              <div style={{ fontSize: 14, color: "#AAAAAA", lineHeight: 1.7, maxWidth: 260, margin: "0 auto" }}>
                Start a block party and your neighbors will show up here once they RSVP.
              </div>
            </div>
          </>
        ) : (
          <>
            {upcoming.length > 0 && (
              <>
                <h2 style={{ fontSize: 28, fontWeight: 800, color: "#1A1A1A", marginBottom: 20, lineHeight: 1.15 }}>
                  Upcoming events
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 40 }}>
                  {upcoming.map(event => {
                    const count = rsvpCounts[event.id] ?? 0;
                    const title = buildTitle(event);
                    const dateStr = event.event_date ? formatEventDate(event.event_date, event.event_time || "14:00") : null;
                    return (
                      <div key={event.id} style={{ background: "#FFFFFF", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                        <div className="skeleton" style={{ height: 160, overflow: "hidden", position: "relative" }}>
                          {event.photo_url ? (
                            <img src={event.photo_url} alt="Event" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%" }} onLoad={e => (e.currentTarget.parentElement as HTMLElement)?.classList.remove("skeleton")} />
                          ) : (
                            <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #FDF0E8 0%, #F5E0D0 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>
                              {VIBE_EMOJI[event.vibe || ""] || "🎉"}
                            </div>
                          )}
                          <div style={{
                            position: "absolute", bottom: 10, left: 12,
                            background: "rgba(255,255,255,0.92)", backdropFilter: "blur(4px)",
                            borderRadius: 6, padding: "3px 8px",
                            fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "#E8521A", textTransform: "uppercase",
                          }}>
                            Hosting
                          </div>
                        </div>
                        <div style={{ padding: "14px 16px 16px" }}>
                          <h3 style={{ fontSize: 19, fontWeight: 700, color: "#1A1A1A", lineHeight: 1.2, marginBottom: 4 }}>{title}</h3>
                          {dateStr && <p style={{ fontSize: 14, color: "#999", marginBottom: 14 }}>{dateStr}</p>}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 14, color: count > 0 ? "#E8521A" : "#BBBBBB", fontWeight: 600 }}>
                              {count > 0 ? `${count} neighbor${count !== 1 ? "s" : ""} coming` : "No RSVPs yet"}
                            </span>
                            <a
                              href="/event/manage"
                              onClick={() => localStorage.setItem("stoop_event_id", event.id)}
                              style={{
                                background: "#E8521A", color: "white", borderRadius: 50,
                                padding: "10px 20px", fontSize: 14, fontWeight: 600,
                                textDecoration: "none", display: "inline-block",
                              }}
                            >
                              Manage event
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {past.length > 0 && (
              <>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1A1A1A", marginBottom: 4 }}>Past events</h2>
                <div style={{ marginBottom: 40 }}>
                  {past.map(event => {
                    const count = rsvpCounts[event.id] ?? 0;
                    const title = buildTitle(event);
                    const [year, month, day] = (event.event_date || "").split("-").map(Number);
                    const dateLabel = event.event_date ? `${MONTHS_SHORT[month - 1]} ${day}, ${year}` : "";
                    return (
                      <div key={event.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: "0.5px solid #F0EEEB" }}>
                        <div className="skeleton" style={{ width: 56, height: 56, borderRadius: 12, flexShrink: 0, overflow: "hidden" }}>
                          {event.photo_url ? (
                            <img src={event.photo_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={title} onLoad={e => (e.currentTarget.parentElement as HTMLElement)?.classList.remove("skeleton")} />
                          ) : (
                            <div style={{ width: "100%", height: "100%", background: "#F0EEEB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                              {VIBE_EMOJI[event.vibe || ""] || "🎉"}
                            </div>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", lineHeight: 1.3, marginBottom: 3 }}>{title}</div>
                          <div style={{ fontSize: 13, color: "#999" }}>{dateLabel}{count > 0 ? ` · ${count} attended` : ""}</div>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CCCCCC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Attending section */}
            {attendingRsvps.length > 0 && (
              <>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1A1A1A", marginBottom: 16, lineHeight: 1.2 }}>
                  Parties you're attending
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 40 }}>
                  {attendingRsvps.map(rsvp => {
                    const event = rsvp.events;
                    const title = buildTitle(event);
                    const dateStr = event.event_date ? formatEventDate(event.event_date, event.event_time || "14:00") : null;
                    const upcoming = isUpcoming(event);
                    return (
                      <a
                        key={rsvp.id}
                        href={`/event/${rsvp.event_id}`}
                        style={{ textDecoration: "none" }}
                      >
                        <div style={{ background: "#FFFFFF", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                          <div className="skeleton" style={{ height: 120, overflow: "hidden", position: "relative" }}>
                            {event.photo_url ? (
                              <img src={event.photo_url} alt="Event" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%" }} onLoad={e => (e.currentTarget.parentElement as HTMLElement)?.classList.remove("skeleton")} />
                            ) : (
                              <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #FDF0E8 0%, #F5E0D0 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>
                                {VIBE_EMOJI[event.vibe || ""] || "🎉"}
                              </div>
                            )}
                            <div style={{
                              position: "absolute", bottom: 10, left: 12,
                              background: "rgba(255,255,255,0.92)", backdropFilter: "blur(4px)",
                              borderRadius: 6, padding: "3px 8px",
                              fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "#3B6D11", textTransform: "uppercase",
                            }}>
                              {upcoming ? "Attending" : "Attended"}
                            </div>
                          </div>
                          <div style={{ padding: "14px 16px 16px" }}>
                            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1A1A1A", lineHeight: 1.2, marginBottom: 4 }}>{title}</h3>
                            {dateStr && <p style={{ fontSize: 13, color: "#999", margin: 0 }}>{dateStr}</p>}
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Host CTA */}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px 48px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <a href="/host" style={{
          display: "block", width: "100%", padding: "16px",
          background: "#E8521A", color: "white", borderRadius: 50,
          fontSize: 16, fontWeight: 600, textAlign: "center", textDecoration: "none", marginBottom: 8,
        }}>
          Start a block party
        </a>
        <p style={{ fontSize: 13, color: "#AAAAAA", margin: 0 }}>Bring your neighbors together</p>
      </div>

      {/* Footer */}
      <div style={{ padding: "0 20px 40px", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "#CCCCCC", margin: 0 }}>
          Questions?{" "}
          <a href="mailto:support@stooptime.com" style={{ color: "#AAAAAA", textDecoration: "none" }}>
            support@stooptime.com
          </a>
        </p>
      </div>

    </div>
  );
}

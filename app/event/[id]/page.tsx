"use client";
import { useState, useEffect, useRef, use } from "react";
import { getEvent, getRsvps, getTasks, getMessages, sendMessage, claimTask as dbClaimTask, unclaimTask as dbUnclaimTask, DbEvent, DbRsvp, DbTask, DbMessage } from "@/lib/db";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_LONG = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

const VIBE_TITLES: Record<string, string> = {
  bbq: "Backyard BBQ", wine: "Wine on the Porch", cookout: "Block Cookout",
  pizza: "Pizza Party", potluck: "Bring a Dish Night", other: "Block Party",
};

function buildTitle(event: DbEvent | null) {
  if (!event) return "Block Party";
  const vibe = VIBE_TITLES[event.vibe || ""] || "Block Party";
  return event.family_name?.trim() ? `${vibe} at The ${event.family_name.trim()}s'` : vibe;
}

function formatDate(dateStr: string, time: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  const [h, m] = time.split(":").map(Number);
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${DAYS_LONG[d.getDay()]}, ${MONTHS[month - 1]} ${day} · ${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function formatMessageTime(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

const AVATAR_COLORS = ["#E8521A","#3B6D11","#5B6AD0","#7B4EA0","#2A7D8C","#C8401A"];

function initials(name: string) {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

function Avatar({ text, color, photo, size = 40 }: { text: string; color: string; photo?: string | null; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, overflow: "hidden" }}>
      {photo ? (
        <img src={photo} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={text} />
      ) : (
        <div style={{ width: "100%", height: "100%", background: color, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: Math.round(size * 0.33), fontWeight: 700 }}>
          {text}
        </div>
      )}
    </div>
  );
}

type Tab = "tasks" | "neighbors";

export default function GuestEventPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const [event, setEvent] = useState<DbEvent | null>(null);
  const [tasks, setTasks] = useState<DbTask[]>([]);
  const [rsvps, setRsvps] = useState<DbRsvp[]>([]);
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [tab, setTab] = useState<Tab>("tasks");
  const [rsvp, setRsvp] = useState<{ name?: string; photo?: string; rsvpId?: string; tenure?: string } | null>(null);
  const [msgOpen, setMsgOpen] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getEvent(params.id).then(setEvent);
    getTasks(params.id).then(setTasks);
    getRsvps(params.id).then(setRsvps);
    getMessages(params.id).then(setMessages);

    const raw = sessionStorage.getItem("stoop_rsvp");
    if (raw) setRsvp(JSON.parse(raw));
  }, [params.id]);

  useEffect(() => {
    if (msgOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [msgOpen, messages.length]);

  const handleClaim = async (taskId: string) => {
    const name = rsvp?.name || "A neighbor";
    const rsvpId = rsvp?.rsvpId ?? null;
    await dbClaimTask(taskId, name, rsvpId);
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, claimed_by_name: name, claimed_by_rsvp_id: rsvpId } : t
    ));
  };

  const handleUnclaim = async (taskId: string) => {
    await dbUnclaimTask(taskId);
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, claimed_by_name: null, claimed_by_rsvp_id: null } : t
    ));
  };

  const handleSendMessage = async () => {
    const text = msgText.trim();
    if (!text || sending) return;
    const authorName = rsvp?.name || "A neighbor";
    setSending(true);
    // Optimistic
    const optimistic: DbMessage = {
      id: `temp-${Date.now()}`,
      event_id: params.id,
      author_name: authorName,
      text,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    setMsgText("");
    const saved = await sendMessage(params.id, authorName, text);
    if (saved) {
      setMessages(prev => prev.map(m => m.id === optimistic.id ? saved : m));
      fetch("/api/notify-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: params.id, authorName, text }),
      }).catch(() => {});
    }
    setSending(false);
  };

  const title = buildTitle(event);
  const dateStr = event?.event_date ? formatDate(event.event_date, event.event_time || "14:00") : null;
  const photo = event?.photo_url || null;
  const unclaimedCount = tasks.filter(t => !t.claimed_by_name).length;
  const totalRsvps = rsvps.length + (rsvp?.rsvpId ? 1 : 0);

  // Build guest list: current user first, then DB rsvps
  const myName = rsvp?.name;
  type Guest = { id: string; name: string; tenure: string | null; initials: string; color: string; photo?: string | null; isMe?: boolean };
  const allGuests: Guest[] = [];
  if (myName) {
    allGuests.push({
      id: "me", name: myName,
      tenure: rsvp?.tenure || null,
      initials: initials(myName), color: "#E8521A",
      photo: rsvp?.photo, isMe: true,
    });
  }
  rsvps.forEach((r, i) => {
    if (rsvp?.rsvpId && r.id === rsvp.rsvpId) return;
    const n = r.family_name || "Neighbor";
    allGuests.push({
      id: r.id, name: n,
      tenure: r.family_note || null,
      initials: initials(n),
      color: AVATAR_COLORS[(i + 1) % AVATAR_COLORS.length],
      photo: r.photo_url,
    });
  });

  return (
    <div style={{
      minHeight: "100dvh", background: "#F9F6F3",
      fontFamily: "var(--font-plus-jakarta-sans), system-ui, sans-serif",
    }}>
      {/* Nav */}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 20px" }}>
        <img src="/stoop.svg" alt="Stoop" style={{ height: 20 }} />
      </div>

      {/* Header — matches manage page */}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px 24px" }}>

        {/* Title + date/address */}
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1A1A1A", lineHeight: 1.15, margin: "0 0 6px" }}>
          {title}
        </h1>
        {(dateStr || event?.address) && (
          <p style={{ fontSize: 14, color: "#888", margin: "0 0 16px", lineHeight: 1.5 }}>
            {[dateStr, event?.address].filter(Boolean).join(" · ")}
          </p>
        )}

        {/* Photo */}
        {photo && (
          <div className="skeleton" style={{ borderRadius: 14, overflow: "hidden", height: 200, marginBottom: 20 }}>
            <img src={photo} alt="Event" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%" }} onLoad={e => (e.currentTarget.parentElement as HTMLElement)?.classList.remove("skeleton")} />
          </div>
        )}

        {/* RSVP count block */}
        {totalRsvps === 0 ? (
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#1A1A1A", lineHeight: 1.2, marginBottom: 4 }}>
              You're the first on the list.
            </div>
            <div style={{ fontSize: 14, color: "#999" }}>Share the invite to get your neighbors coming.</div>
          </div>
        ) : (
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#E8521A", lineHeight: 1.2, marginBottom: 4 }}>
              {totalRsvps} neighbor{totalRsvps !== 1 ? "s" : ""} coming
            </div>
            <div style={{ fontSize: 14, color: "#999" }}>
              {totalRsvps === 1 ? "Be the party starter — spread the word." : "The block is showing up."}
            </div>
          </div>
        )}
      </div>

      {/* Message board */}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px 16px" }}>
        <div style={{ background: "#FFFFFF", borderRadius: 14, border: "1.5px solid #E8E8E8", overflow: "hidden" }}>
          {/* Header row — always visible */}
          <button
            onClick={() => setMsgOpen(o => !o)}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              width: "100%", background: "none", border: "none",
              padding: "14px 16px", cursor: "pointer", fontFamily: "inherit",
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              background: "#F0EEEB", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>
                Message neighbors
                {messages.length > 0 && (
                  <span style={{ marginLeft: 6, fontSize: 12, fontWeight: 700, color: "#E8521A", background: "#FDF0E8", borderRadius: 10, padding: "1px 7px" }}>
                    {messages.length}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: "#AAAAAA", marginTop: 1 }}>Say hi, ask questions, coordinate</div>
            </div>
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CCCCCC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transition: "transform 0.2s", transform: msgOpen ? "rotate(90deg)" : "rotate(0deg)" }}
            >
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>

          {/* Expanded message thread */}
          {msgOpen && (
            <div style={{ borderTop: "1px solid #F0EEEB" }}>
              {/* Messages list */}
              <div style={{ maxHeight: 280, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
                {messages.length === 0 ? (
                  <p style={{ fontSize: 13, color: "#BBBBBB", textAlign: "center", margin: "12px 0" }}>
                    No messages yet. Say hi!
                  </p>
                ) : (
                  messages.map((msg, i) => {
                    const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
                    const isMe = rsvp?.name && msg.author_name === rsvp.name;
                    return (
                      <div key={msg.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <Avatar text={initials(msg.author_name)} color={isMe ? "#E8521A" : color} size={32} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 3 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A" }}>{msg.author_name}</span>
                            <span style={{ fontSize: 11, color: "#BBBBBB" }}>{formatMessageTime(msg.created_at)}</span>
                          </div>
                          <div style={{ fontSize: 14, color: "#444", lineHeight: 1.5 }}>{msg.text}</div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={{ borderTop: "1px solid #F0EEEB", padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-end" }}>
                <textarea
                  value={msgText}
                  onChange={e => setMsgText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                  placeholder="Say something..."
                  rows={1}
                  style={{
                    flex: 1, border: "1.5px solid #E8E8E8", borderRadius: 10,
                    padding: "10px 12px", fontSize: 14, fontFamily: "inherit",
                    resize: "none", background: "#F9F6F3", color: "#1A1A1A",
                    lineHeight: 1.5, outline: "none",
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!msgText.trim() || sending}
                  style={{
                    width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                    background: msgText.trim() ? "#E8521A" : "#E8E8E8",
                    border: "none", cursor: msgText.trim() ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.15s",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px 0" }}>
        <div style={{ display: "flex", borderBottom: "1.5px solid #E8E8E8", marginBottom: 20 }}>
          {(["tasks", "neighbors"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, background: "none", border: "none",
                padding: "12px 8px",
                fontSize: 14, fontWeight: 600,
                color: tab === t ? "#E8521A" : "#999",
                cursor: "pointer", fontFamily: "inherit",
                borderBottom: `2px solid ${tab === t ? "#E8521A" : "transparent"}`,
                marginBottom: -2, transition: "color 0.15s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              {t === "tasks" ? "Tasks" : "Neighbors"}
              {t === "tasks" && unclaimedCount > 0 && (
                <span style={{
                  background: tab === "tasks" ? "#E8521A" : "#E8E8E8",
                  color: tab === "tasks" ? "white" : "#999",
                  borderRadius: 10, fontSize: 11, fontWeight: 700,
                  padding: "1px 6px",
                }}>
                  {unclaimedCount}
                </span>
              )}
              {t === "neighbors" && allGuests.length > 0 && (
                <span style={{
                  background: tab === "neighbors" ? "#E8521A" : "#E8E8E8",
                  color: tab === "neighbors" ? "white" : "#999",
                  borderRadius: 10, fontSize: 11, fontWeight: 700,
                  padding: "1px 6px",
                }}>
                  {allGuests.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab: Tasks */}
      {tab === "tasks" && (
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px 48px" }}>
          {tasks.length === 0 ? (
            <p style={{ fontSize: 14, color: "#AAAAAA", textAlign: "center", padding: "32px 0" }}>No tasks yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {tasks.map(task => {
                const isMineClaimed = task.claimed_by_rsvp_id && rsvp?.rsvpId && task.claimed_by_rsvp_id === rsvp.rsvpId;
                return (
                  <div key={task.id} style={{
                    background: "#FFFFFF", borderRadius: 10,
                    borderLeft: `3px solid ${task.claimed_by_name ? "#E8521A" : "#E8E8E8"}`,
                    padding: "14px", display: "flex", alignItems: "center", gap: 12,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", marginBottom: 2 }}>{task.title}</div>
                      {task.claimed_by_name && (
                        <div style={{ fontSize: 13, color: "#999" }}>{task.claimed_by_name} is on it.</div>
                      )}
                    </div>
                    {task.claimed_by_name ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Avatar text={initials(task.claimed_by_name)} color="#E8521A" size={34} />
                        {isMineClaimed && (
                          <button onClick={() => handleUnclaim(task.id)} style={{
                            background: "none", border: "1.5px solid #E8E8E8", borderRadius: 8,
                            padding: "5px 10px", fontSize: 12, fontWeight: 600, color: "#999",
                            cursor: "pointer", fontFamily: "inherit",
                          }}>
                            Unclaim
                          </button>
                        )}
                      </div>
                    ) : (
                      <button onClick={() => handleClaim(task.id)} style={{
                        background: "none", border: "1.5px solid #E8521A", borderRadius: 8,
                        padding: "7px 14px", fontSize: 13, fontWeight: 600, color: "#E8521A",
                        cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                      }}>
                        Claim
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Neighbors */}
      {tab === "neighbors" && (
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px 48px" }}>
          {allGuests.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>👋</div>
              <p style={{ fontSize: 15, color: "#AAAAAA" }}>No neighbors yet. Be the first!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {allGuests.map(guest => (
                <div key={guest.id} style={{
                  background: "#FFFFFF", borderRadius: 12, padding: "14px 16px",
                  display: "flex", alignItems: "center", gap: 14,
                  border: guest.isMe ? "1.5px solid #E8521A" : "1.5px solid transparent",
                }}>
                  <Avatar text={guest.initials} color={guest.color} photo={guest.photo} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A" }}>{guest.name}</span>
                      {guest.isMe && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#E8521A", letterSpacing: "0.06em", background: "#FDF0E8", padding: "2px 6px", borderRadius: 6 }}>YOU</span>
                      )}
                    </div>
                    {guest.tenure && (
                      <div style={{ fontSize: 13, color: "#999", marginTop: 2 }}>
                        {guest.tenure}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

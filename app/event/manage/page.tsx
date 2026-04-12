"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import ReactCrop, { type PercentCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { getPartyState, savePartyState, PartyState } from "@/lib/party-state";
import { track } from "@/lib/mixpanel";
import { supabase } from "@/lib/supabase";
import {
  getEvent, getRsvps, getTasks, saveEvent,
  addTask as dbAddTask, deleteTask as dbDeleteTask,
  claimTask as dbClaimTask, unclaimTask as dbUnclaimTask,
  cancelEvent as dbCancelEvent,
  uploadPhoto,
  DbRsvp,
} from "@/lib/db";

// ── Types ─────────────────────────────────────────────────
interface Task {
  id: number;
  _uuid?: string;
  category: string;
  title: string;
  claimedBy: string | null;
  claimedInitials: string | null;
  claimedColor: string | null;
}

interface Guest {
  id: number;
  name: string;
  detail: string;
  initials: string;
  color: string;
}

interface Message {
  id: number;
  author: string;
  initials: string;
  color: string;
  text: string;
  time: string;
}

type Panel = null | "edit" | "invite" | "message" | "cancel";

// ── Constants ─────────────────────────────────────────────
const SEED_GUESTS: Guest[] = [];

const CATEGORIES = ["ESSENTIAL", "DRINKS", "FOOD", "ATMOSPHERE", "OTHER"];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_LONG = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

const VIBES = [
  { id: "bbq",       label: "Backyard BBQ" },
  { id: "wine",      label: "Wine on the Porch" },
  { id: "cookout",   label: "Block Cookout" },
  { id: "pizza",     label: "Pizza Party" },
  { id: "potluck",   label: "Bring a Dish Night" },
  { id: "other",     label: "Snacks & Socialize" },
  { id: "cocktails", label: "Cocktail Hour" },
  { id: "kids",      label: "Kids Block Play" },
  { id: "welcome",   label: "Lawn Games" },
];

const VIBE_TITLES: Record<string, string> = Object.fromEntries(VIBES.map(v => [v.id, v.label]));

const VIBE_TASKS: Record<string, { category: string; title: string }[]> = {
  bbq: [
    { category: "ESSENTIAL", title: "Grill (gas or charcoal)" },
    { category: "ESSENTIAL", title: "Charcoal or propane" },
    { category: "ESSENTIAL", title: "Tables and chairs" },
    { category: "ESSENTIAL", title: "Tongs, spatula, grill brush" },
    { category: "FOOD",      title: "Burgers and hot dogs" },
    { category: "FOOD",      title: "Buns, condiments, toppings" },
    { category: "FOOD",      title: "A side dish (salad, corn, coleslaw)" },
    { category: "DRINKS",    title: "Ice and a cooler" },
    { category: "DRINKS",    title: "Drinks (beer, soda, water)" },
    { category: "ATMOSPHERE", title: "Music playlist and speaker" },
  ],
  wine: [
    { category: "ESSENTIAL", title: "Tables and seating" },
    { category: "ESSENTIAL", title: "Tablecloths or blankets" },
    { category: "DRINKS",    title: "Wine (red and white)" },
    { category: "DRINKS",    title: "Wine glasses" },
    { category: "DRINKS",    title: "Non-alcoholic options" },
    { category: "FOOD",      title: "Cheese and charcuterie" },
    { category: "FOOD",      title: "Crackers, bread, and fruit" },
    { category: "FOOD",      title: "Something sweet for dessert" },
    { category: "ATMOSPHERE", title: "Ambient playlist" },
    { category: "ATMOSPHERE", title: "Candles or string lights" },
  ],
  cookout: [
    { category: "ESSENTIAL", title: "Grill and fuel" },
    { category: "ESSENTIAL", title: "Tables, chairs, and shade" },
    { category: "ESSENTIAL", title: "Plates, napkins, and utensils" },
    { category: "FOOD",      title: "Burgers and hot dogs" },
    { category: "FOOD",      title: "Buns and condiments" },
    { category: "FOOD",      title: "Corn on the cob" },
    { category: "FOOD",      title: "A side dish to share" },
    { category: "DRINKS",    title: "Cooler with ice" },
    { category: "DRINKS",    title: "Drinks for all ages" },
    { category: "ATMOSPHERE", title: "Music and a speaker" },
  ],
  pizza: [
    { category: "ESSENTIAL", title: "Order the pizza (confirm count day-of)" },
    { category: "ESSENTIAL", title: "Tables and chairs" },
    { category: "ESSENTIAL", title: "Plates, napkins, and serving tools" },
    { category: "FOOD",      title: "Caesar or green salad" },
    { category: "FOOD",      title: "Garlic bread or breadsticks" },
    { category: "FOOD",      title: "Something sweet for dessert" },
    { category: "DRINKS",    title: "Drinks and cups" },
    { category: "DRINKS",    title: "Ice for the cooler" },
    { category: "ATMOSPHERE", title: "Music playlist" },
  ],
  potluck: [
    { category: "ESSENTIAL", title: "Tables and chairs" },
    { category: "ESSENTIAL", title: "Serving utensils for every dish" },
    { category: "ESSENTIAL", title: "Labels for dishes (allergies matter)" },
    { category: "ESSENTIAL", title: "Trash and recycling bins" },
    { category: "FOOD",      title: "A main dish to anchor the spread" },
    { category: "FOOD",      title: "Bread or rolls" },
    { category: "FOOD",      title: "Dessert" },
    { category: "DRINKS",    title: "Drinks station (cups, ice, mixers)" },
    { category: "DRINKS",    title: "Non-alcoholic options" },
    { category: "ATMOSPHERE", title: "Music and a speaker" },
  ],
  other: [
    { category: "ESSENTIAL", title: "Set up outdoor space" },
    { category: "ESSENTIAL", title: "Tables and seating" },
    { category: "ESSENTIAL", title: "Plates, cups, and napkins" },
    { category: "FOOD",      title: "Snacks and finger food" },
    { category: "FOOD",      title: "Something sweet" },
    { category: "DRINKS",    title: "Drinks for everyone" },
    { category: "DRINKS",    title: "Ice and a cooler" },
    { category: "ATMOSPHERE", title: "Music and a speaker" },
  ],
  cocktails: [
    { category: "ESSENTIAL", title: "Tables and seating" },
    { category: "ESSENTIAL", title: "Glassware (enough for everyone)" },
    { category: "DRINKS",    title: "Spirits and mixers" },
    { category: "DRINKS",    title: "Wine and beer for non-cocktail folks" },
    { category: "DRINKS",    title: "Non-alcoholic options" },
    { category: "DRINKS",    title: "Ice, lots of it" },
    { category: "FOOD",      title: "Charcuterie or cheese board" },
    { category: "FOOD",      title: "Bite-sized snacks and nibbles" },
    { category: "ATMOSPHERE", title: "Ambient playlist" },
    { category: "ATMOSPHERE", title: "String lights or candles" },
  ],
  kids: [
    { category: "ESSENTIAL", title: "Mark off a safe play zone" },
    { category: "ESSENTIAL", title: "Sunscreen station" },
    { category: "ESSENTIAL", title: "First aid kit" },
    { category: "ATMOSPHERE", title: "Sidewalk chalk" },
    { category: "ATMOSPHERE", title: "Bubbles and outdoor toys" },
    { category: "ATMOSPHERE", title: "Sprinkler or water table" },
    { category: "FOOD",      title: "Kid-friendly snacks" },
    { category: "FOOD",      title: "Popsicles or ice cream" },
    { category: "DRINKS",    title: "Juice boxes and water" },
    { category: "DRINKS",    title: "Drinks for the parents too" },
  ],
  welcome: [
    { category: "ESSENTIAL", title: "Welcome card or small gift" },
    { category: "ESSENTIAL", title: "Tables and seating out front" },
    { category: "FOOD",      title: "A dish to share" },
    { category: "FOOD",      title: "Something sweet" },
    { category: "DRINKS",    title: "Drinks and cups" },
    { category: "DRINKS",    title: "Non-alcoholic options" },
    { category: "ATMOSPHERE", title: "Music — keep it low and easy" },
  ],
};

const CHECKLIST = [
  "Set up tables and chairs outside",
  "Ice the drinks cooler",
  "Put up the address sign",
  "Charge your speaker",
  "Have extra napkins and plates",
];

// ── Helpers ───────────────────────────────────────────────
function buildTitle(s: Partial<PartyState>) {
  const vibe = VIBE_TITLES[s.vibe || ""] || "Block Party";
  const family = s.familyName?.trim();
  if (!family) return vibe;
  if (family.includes(" ")) return family;
  return `${vibe} at The ${family}s'`;
}

function buildTitleFromFields(vibe: string, familyName: string) {
  const vibeLabel = VIBE_TITLES[vibe] || "Block Party";
  const family = familyName.trim();
  if (!family) return vibeLabel;
  if (family.includes(" ")) return family;
  return `${vibeLabel} at The ${family}s'`;
}

function centerSquareCrop(width: number, height: number): PercentCrop {
  return centerCrop(makeAspectCrop({ unit: "%", width: 90 }, 1, width, height), width, height) as PercentCrop;
}

function getCroppedDataUrl(img: HTMLImageElement, crop: PercentCrop): string {
  const canvas = document.createElement("canvas");
  const size = Math.min(1200, Math.max(
    (crop.width / 100) * img.naturalWidth,
    (crop.height / 100) * img.naturalHeight,
  ));
  canvas.width = size;
  canvas.height = size;
  canvas.getContext("2d")!.drawImage(
    img,
    (crop.x / 100) * img.naturalWidth,
    (crop.y / 100) * img.naturalHeight,
    (crop.width / 100) * img.naturalWidth,
    (crop.height / 100) * img.naturalHeight,
    0, 0, size, size,
  );
  return canvas.toDataURL("image/jpeg", 0.82);
}

function formatDate(date: { year: number; month: number; day: number }, time: string) {
  const d = new Date(date.year, date.month, date.day);
  const [h, m] = time.split(":").map(Number);
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${DAYS_LONG[d.getDay()]}, ${MONTHS[date.month]} ${date.day} · ${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

// ── Avatar ────────────────────────────────────────────────
function Avatar({ text, color, size = 36 }: { text: string; color: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: color, color: "white",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size <= 32 ? 10 : 13, fontWeight: 700, flexShrink: 0, letterSpacing: "-0.3px",
    }}>
      {text}
    </div>
  );
}

// ── Sheet wrapper ─────────────────────────────────────────
function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;
  return (
    <div
      className="sheet-overlay"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.4)",
        display: "flex", alignItems: "flex-end",
      }}
    >
      <div
        className="sheet-content"
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480, margin: "0 auto",
          background: "#FFFFFF", borderRadius: "20px 20px 0 0",
          maxHeight: "92dvh", overflowY: "auto",
          fontFamily: "var(--font-plus-jakarta-sans), system-ui, sans-serif",
        }}
      >
        {/* Drag handle */}
        <div style={{ padding: "12px 0 0", display: "flex", justifyContent: "center" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "#E8E8E8" }} />
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Input style ───────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 14px",
  border: "1.5px solid #E8E8E8", borderRadius: 8,
  fontSize: 15, fontFamily: "inherit", boxSizing: "border-box",
  background: "#fff",
};

// ── Main component ────────────────────────────────────────
let nextId = 10;

export default function ManageEvent() {
  const [party, setParty] = useState<Partial<PartyState>>({});
  const [panel, setPanel] = useState<Panel>(null);

  // DB data
  const [eventId, setEventId] = useState<string | null>(null);
  const [dbRsvps, setDbRsvps] = useState<DbRsvp[]>([]);

  // Tasks
  const [tasks, setTasks] = useState<Task[]>([]);
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("ESSENTIAL");
  const newTaskRef = useRef<HTMLInputElement>(null);

  // Guests
  const [showAllGuests, setShowAllGuests] = useState(false);

  // Checklist
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [checklistItems, setChecklistItems] = useState(CHECKLIST);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const checklistInputRef = useRef<HTMLInputElement>(null);

  // Edit panel state
  const [editVibe, setEditVibe] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editTime, setEditTime] = useState("14:00");
  const [editFamilyName, setEditFamilyName] = useState("");
  const [editFamilyNote, setEditFamilyNote] = useState("");
  const [editWhyNote, setEditWhyNote] = useState("");

  // Message panel state
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  const [dbPhotoUrl, setDbPhotoUrl] = useState<string | null>(null);

  // Photo edit
  const [rawPhotoSrc, setRawPhotoSrc] = useState<string | null>(null);
  const [photoCrop, setPhotoCrop] = useState<PercentCrop>();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cropImgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    track("Manage Event Viewed");
    const s = getPartyState();
    setParty(s);

    // Load from DB if we have an event ID
    const storedEventId = localStorage.getItem("stoop_event_id");
    if (storedEventId) {
      setEventId(storedEventId);
      // Load event — use DB as source of truth for all fields
      getEvent(storedEventId).then(ev => {
        if (!ev) return;
        if (ev.photo_url) setDbPhotoUrl(ev.photo_url);
        // Parse date string back to {year, month, day}
        let parsedDate: { year: number; month: number; day: number } | undefined;
        if (ev.event_date) {
          const [y, m, d] = ev.event_date.split("-").map(Number);
          parsedDate = { year: y, month: m - 1, day: d };
        }
        setParty(prev => ({
          ...prev,
          vibe: ev.vibe ?? prev.vibe,
          size: ev.size ?? prev.size,
          address: ev.address ?? prev.address,
          date: parsedDate ?? prev.date,
          time: ev.event_time ?? prev.time,
          familyName: ev.family_name ?? prev.familyName,
          partnerName: ev.partner_name ?? prev.partnerName,
          familyNote: ev.family_note ?? prev.familyNote,
          whyNote: ev.why_note ?? prev.whyNote,
        }));
      });
      // Load RSVPs
      getRsvps(storedEventId).then(setDbRsvps);
      // Load tasks from DB
      getTasks(storedEventId).then(dbTasks => {
        setTasks(dbTasks.map(t => ({
          id: parseInt(t.id.slice(0, 8), 16), // use part of UUID as numeric id for legacy state
          _uuid: t.id,
          category: t.category,
          title: t.title,
          claimedBy: t.claimed_by_name,
          claimedInitials: t.claimed_by_name ? t.claimed_by_name[0].toUpperCase() : null,
          claimedColor: t.claimed_by_name ? "#3B6D11" : null,
        })));
      });

      // Subscribe to real-time RSVP updates
      const channel = supabase
        .channel(`event_rsvps_${storedEventId}`)
        .on("postgres_changes", {
          event: "INSERT", schema: "public", table: "rsvps",
          filter: `event_id=eq.${storedEventId}`,
        }, payload => {
          setDbRsvps(prev => [...prev, payload.new as DbRsvp]);
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    } else {
      // Fallback to vibe-based defaults (event not yet saved to DB)
      const defaults = VIBE_TASKS[s.vibe || ""] || VIBE_TASKS.other;
      setTasks(defaults.map((t, i) => ({
        id: i + 1, category: t.category, title: t.title,
        claimedBy: null, claimedInitials: null, claimedColor: null,
      })));
    }
  }, []);

  useEffect(() => {
    if (addingTask) newTaskRef.current?.focus();
  }, [addingTask]);

  // Seed edit fields when panel opens
  useEffect(() => {
    if (panel === "edit") {
      setEditVibe(party.vibe || "bbq");
      setEditAddress(party.address || "");
      setEditTime(party.time || "14:00");
      setEditFamilyName(party.familyName || "");
      setEditFamilyNote(party.familyNote || "");
      setEditWhyNote(party.whyNote || "");
    }
    if (panel === "message") {
      setTimeout(() => messageInputRef.current?.focus(), 100);
    }
  }, [panel]);

  // ── Handlers ──
  const handleClaimTask = async (id: number, uuid?: string) => {
    const name = party.yourName || "You";
    const ini = name[0].toUpperCase();
    const taskTitle = tasks.find(t => t.id === id)?.title;
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, claimedBy: name, claimedInitials: ini, claimedColor: "#3B6D11" } : t
    ));
    track("Task Claimed", { context: "manage", task_title: taskTitle });
    if (uuid) await dbClaimTask(uuid, name);
  };

  const handleUnclaimTask = async (id: number, uuid?: string) => {
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, claimedBy: null, claimedInitials: null, claimedColor: null } : t
    ));
    if (uuid) await dbUnclaimTask(uuid);
  };

  const handleDeleteTask = async (id: number, uuid?: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (uuid) await dbDeleteTask(uuid);
  };

  const saveNewTask = async () => {
    if (!newTaskTitle.trim()) return;
    const title = newTaskTitle.trim();
    if (eventId) {
      const dbTask = await dbAddTask(eventId, title, newTaskCategory);
      if (dbTask) {
        setTasks(prev => [...prev, {
          id: nextId++, _uuid: dbTask.id, category: newTaskCategory, title,
          claimedBy: null, claimedInitials: null, claimedColor: null,
        }]);
      }
    } else {
      setTasks(prev => [...prev, {
        id: nextId++, category: newTaskCategory, title,
        claimedBy: null, claimedInitials: null, claimedColor: null,
      }]);
    }
    setNewTaskTitle(""); setNewTaskCategory("ESSENTIAL"); setAddingTask(false);
  };

  const toggleChecklist = (i: number) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    setChecklistItems(prev => [...prev, newChecklistItem.trim()]);
    setNewChecklistItem("");
    checklistInputRef.current?.focus();
  };

  const handlePhotoFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = e => {
      setRawPhotoSrc(e.target?.result as string);
      setPhotoCrop(undefined);
    };
    reader.readAsDataURL(file);
  }, []);

  const applyPhotoCrop = async () => {
    if (!cropImgRef.current || !photoCrop) return;
    setUploadingPhoto(true);
    const dataUrl = getCroppedDataUrl(cropImgRef.current, photoCrop);
    // Show locally right away regardless of upload outcome
    setDbPhotoUrl(dataUrl);
    setRawPhotoSrc(null);
    setUploadingPhoto(false);
    // Upload and persist in the background
    if (eventId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const photoUrl = await uploadPhoto(dataUrl, "event-photos", `${user.id}/${eventId}`);
        if (photoUrl) await saveEvent(party, user.id, eventId, photoUrl);
      }
    }
  };

  const saveEdit = async () => {
    const updated = { ...party, vibe: editVibe, address: editAddress, time: editTime, familyName: editFamilyName, familyNote: editFamilyNote, whyNote: editWhyNote };
    savePartyState(updated);
    setParty(updated);
    // Persist to DB if we have an event ID and a user session
    if (eventId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await saveEvent(updated, user.id, eventId);
    }
    setPanel(null);
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    track("Message Sent", { context: "manage", is_host: true });
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    setMessages(prev => [...prev, {
      id: nextId++,
      author: party.yourName || "You",
      initials: (party.yourName?.[0] || "Y").toUpperCase(),
      color: "#E8521A",
      text: newMessage.trim(),
      time: timeStr,
    }]);
    setNewMessage("");
    messageInputRef.current?.focus();
  };

  const cancelEvent = async () => {
    track("Event Cancelled", { event_id: eventId });
    if (eventId) await dbCancelEvent(eventId);
    localStorage.removeItem("stoop_event_id");
    window.location.href = "/";
  };

  // ── Derived ──
  const title = buildTitle(party);
  const dateStr = party.date ? formatDate(party.date, party.time || "14:00") : null;
  const photo = dbPhotoUrl || party.photoDataUrl || "/oak_ridge_family.png";
  const rsvpCount = dbRsvps.length;

  // Build guest list from DB RSVPs
  const AVATAR_COLORS_MANAGE = ["#5B6AD0", "#7B4EA0", "#3B6D11", "#2A7D8C", "#C8401A", "#E8521A"];
  const guests: Guest[] = dbRsvps.map((r, i) => ({
    id: i,
    name: r.family_name || "Neighbor",
    detail: r.family_note || "",
    initials: (r.family_name || "N").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase(),
    color: AVATAR_COLORS_MANAGE[i % AVATAR_COLORS_MANAGE.length],
  }));

  const visibleGuests = showAllGuests ? guests : guests.slice(0, 3);
  const vibeLabel = VIBE_TITLES[party.vibe || ""] || "Block Party";

  return (
    <div style={{
      minHeight: "100dvh", background: "#F9F6F3",
      fontFamily: "var(--font-plus-jakarta-sans), system-ui, sans-serif",
    }}>
      {/* Top nav */}
      <div style={{
        maxWidth: 480, margin: "0 auto", padding: "16px 20px 0",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <a href="/home"><img src="/stoop.svg" alt="Stoop" style={{ height: 20 }} /></a>
        <button style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#888", display: "flex" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
          </svg>
        </button>
      </div>

      {/* Event header */}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 20px 0" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1A1A1A", lineHeight: 1.15, marginBottom: 6 }}>
          {title}
        </h1>
        {(dateStr || party.address) && (
          <p style={{ fontSize: 14, color: "#888", margin: "0 0 16px" }}>
            {[dateStr, party.address].filter(Boolean).join(" | ")}
          </p>
        )}
      </div>

      {/* Family photo */}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px 20px" }}>
        <div className="skeleton" style={{ borderRadius: 14, overflow: "hidden", height: 200, position: "relative" }}>
          <img
            src={photo}
            alt="Family photo"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%" }}
            onLoad={e => (e.currentTarget.parentElement as HTMLElement)?.classList.remove("skeleton")}
          />
          {/* Edit photo label — label+input is more reliable than programmatic click on mobile */}
          <label
            htmlFor="manage-photo-input"
            style={{
              position: "absolute", bottom: 10, right: 10,
              background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
              borderRadius: 20, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5,
              padding: "6px 12px",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <span style={{ fontSize: 12, fontWeight: 600, color: "white", fontFamily: "inherit" }}>Edit photo</span>
          </label>
        </div>
        <input
          id="manage-photo-input"
          ref={photoInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoFile(f); e.target.value = ""; }}
        />
      </div>

      {/* Photo crop modal */}
      {rawPhotoSrc && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 300,
          background: "rgba(0,0,0,0.85)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: 20,
        }}>
          <p style={{ color: "white", fontSize: 14, fontWeight: 600, marginBottom: 16, fontFamily: "var(--font-plus-jakarta-sans), system-ui, sans-serif" }}>
            Drag to crop your photo
          </p>
          <ReactCrop
            crop={photoCrop}
            onChange={(_px, pct) => setPhotoCrop(pct)}
            aspect={1}
            style={{ borderRadius: 12, overflow: "hidden", maxHeight: "60dvh" }}
          >
            <img
              ref={cropImgRef}
              src={rawPhotoSrc}
              alt="Crop"
              onLoad={e => {
                const { width, height } = e.currentTarget;
                setPhotoCrop(centerSquareCrop(width, height));
              }}
              style={{ maxWidth: "100%", maxHeight: "60dvh", display: "block" }}
            />
          </ReactCrop>
          <div style={{ display: "flex", gap: 10, marginTop: 16, width: "100%", maxWidth: 400 }}>
            <button
              onClick={applyPhotoCrop}
              disabled={uploadingPhoto}
              style={{
                flex: 1, padding: "13px 0", borderRadius: 10,
                background: "#E8521A", color: "white", border: "none",
                fontSize: 15, fontWeight: 600, cursor: "pointer",
                fontFamily: "inherit", opacity: uploadingPhoto ? 0.6 : 1,
              }}
            >
              {uploadingPhoto ? "Saving…" : "Use this photo"}
            </button>
            <button
              onClick={() => setRawPhotoSrc(null)}
              style={{
                flex: 1, padding: "13px 0", borderRadius: 10,
                background: "transparent", color: "white", border: "1px solid rgba(255,255,255,0.3)",
                fontSize: 15, fontWeight: 500, cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* RSVP count */}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px 20px" }}>
        {rsvpCount === 0 ? (
          <>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#1A1A1A", lineHeight: 1.2, marginBottom: 4 }}>
              You're the first on the list.
            </div>
            <div style={{ fontSize: 14, color: "#999" }}>Waiting for your neighbors to RSVP</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#E8521A", lineHeight: 1.1, marginBottom: 4 }}>
              {rsvpCount} neighbor{rsvpCount !== 1 ? "s" : ""} coming
            </div>
            <div style={{ fontSize: 14, color: "#999" }}>Flyers delivered · waiting on more RSVPs</div>
          </>
        )}
      </div>

      {/* Quick actions */}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px 28px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { id: "edit",    label: "EDIT",    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> },
            { id: "message", label: "MESSAGE", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
            { id: "invite",  label: "INVITE",  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
            { id: "cancel",  label: "CANCEL",  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> },
          ].map(({ id, label, icon }) => (
            <button key={id} onClick={() => setPanel(id as Panel)} style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 8, padding: "16px 12px",
              background: "#FFFFFF", border: "1px solid #E8E8E8", borderRadius: 12, cursor: "pointer",
            }}>
              <div style={{ color: "#E8521A" }}>{icon}</div>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#1A1A1A" }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tasks */}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", margin: 0 }}>Tasks</h2>
          {!addingTask && (
            <button onClick={() => setAddingTask(true)} style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 14, fontWeight: 600, color: "#E8521A", padding: 0,
              display: "flex", alignItems: "center", gap: 4,
            }}>
              Add task
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {addingTask && (
            <div style={{ background: "#FFFFFF", borderRadius: 10, borderLeft: "3px solid #E8521A", padding: "14px" }}>
              <select value={newTaskCategory} onChange={e => setNewTaskCategory(e.target.value)} style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "#E8521A",
                textTransform: "uppercase", background: "none", border: "none", outline: "none",
                cursor: "pointer", padding: 0, marginBottom: 8, fontFamily: "inherit",
              }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input ref={newTaskRef} type="text" placeholder="What needs to happen?"
                value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") saveNewTask(); if (e.key === "Escape") setAddingTask(false); }}
                style={{
                  display: "block", width: "100%", border: "none", outline: "none",
                  fontSize: 15, fontWeight: 600, color: "#1A1A1A",
                  fontFamily: "inherit", background: "transparent", boxSizing: "border-box", marginBottom: 12,
                }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={saveNewTask} style={{
                  background: "#E8521A", color: "white", border: "none", borderRadius: 6,
                  padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}>Add</button>
                <button onClick={() => { setAddingTask(false); setNewTaskTitle(""); }} style={{
                  background: "none", color: "#AAAAAA", border: "1px solid #E8E8E8", borderRadius: 6,
                  padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}>Cancel</button>
              </div>
            </div>
          )}
          {tasks.map(task => (
            <div key={task.id} style={{
              background: "#FFFFFF", borderRadius: 10,
              borderLeft: `3px solid ${task.claimedBy ? "#E8521A" : "#E8E8E8"}`,
              padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: task.claimedBy ? "#E8521A" : "#AAAAAA", textTransform: "uppercase", marginBottom: 4 }}>
                  {task.category}
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A", marginBottom: task.claimedBy ? 4 : 6 }}>
                  {task.title}
                </div>
                {task.claimedBy ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#3B6D11" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span style={{ fontSize: 12, color: "#888" }}>Claimed by {task.claimedBy}</span>
                    <button onClick={() => handleUnclaimTask(task.id, (task as Task & { _uuid?: string })._uuid)} style={{
                      background: "none", border: "none", cursor: "pointer", padding: 0, marginLeft: 4,
                      fontSize: 11, color: "#CCCCCC", fontFamily: "inherit",
                    }}>
                      · unclaim
                    </button>
                  </div>
                ) : (
                  <button onClick={() => handleClaimTask(task.id, (task as Task & { _uuid?: string })._uuid)} style={{
                    background: "none", border: "none", cursor: "pointer", padding: 0,
                    fontSize: 13, fontWeight: 600, color: "#E8521A",
                    display: "flex", alignItems: "center", gap: 4, fontFamily: "inherit",
                  }}>
                    Claim this
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </button>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {task.claimedBy && <Avatar text={task.claimedInitials!} color={task.claimedColor!} size={32} />}
                <button onClick={() => handleDeleteTask(task.id, (task as Task & { _uuid?: string })._uuid)} title="Remove task" style={{
                  background: "none", border: "none", cursor: "pointer", color: "#DDDDDD", padding: 4, display: "flex",
                }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#E8521A")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#DDDDDD")}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Who's coming */}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px 28px" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 14 }}>
          {rsvpCount > 0 ? `Who's coming (${rsvpCount})` : "Who's coming"}
        </h2>
        {rsvpCount === 0 ? (
          <div style={{ background: "#FFFFFF", border: "1px solid #E8E8E8", borderRadius: 12, padding: "28px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>📬</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A", marginBottom: 6 }}>No RSVPs yet</div>
            <div style={{ fontSize: 13, color: "#AAAAAA", lineHeight: 1.6 }}>
              Once your neighbors scan the flyer, they'll show up here.
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {visibleGuests.map((guest, i) => (
                <div key={guest.id} style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "12px 0",
                  borderBottom: i < visibleGuests.length - 1 ? "0.5px solid #F0EEEB" : "none",
                }}>
                  <Avatar text={guest.initials} color={guest.color} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A" }}>{guest.name}</div>
                    <div style={{ fontSize: 13, color: "#999", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{guest.detail}</div>
                  </div>
                </div>
              ))}
            </div>
            {guests.length > 3 && (
              <button onClick={() => setShowAllGuests(v => !v)} style={{
                width: "100%", background: "none", border: "1px solid #E8E8E8", borderRadius: 8,
                padding: "11px 0", marginTop: 8, fontSize: 14, fontWeight: 600, color: "#E8521A",
                cursor: "pointer", fontFamily: "inherit",
              }}>
                {showAllGuests ? "Show less" : `See all ${guests.length} neighbors →`}
              </button>
            )}
          </>
        )}
      </div>

      {/* Day of checklist */}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px 48px" }}>
        <button onClick={() => setChecklistOpen(o => !o)} style={{
          width: "100%", background: "#FFFFFF", border: "1px solid #E8E8E8",
          borderRadius: checklistOpen ? "12px 12px 0 0" : 12, padding: "16px",
          display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#FDF0E8", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E8521A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A" }}>Day of checklist</span>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#AAAAAA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: checklistOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        {checklistOpen && (
          <div style={{ background: "#FFFFFF", border: "1px solid #E8E8E8", borderTop: "none", borderRadius: "0 0 12px 12px", padding: "4px 16px 12px" }}>
            {checklistItems.map((item, i) => (
              <div key={i} onClick={() => toggleChecklist(i)} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
                borderBottom: "0.5px solid #F5F3F0", cursor: "pointer",
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                  border: checkedItems.has(i) ? "none" : "1.5px solid #DDDDDD",
                  background: checkedItems.has(i) ? "#E8521A" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {checkedItems.has(i) && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
                <span style={{ fontSize: 14, color: checkedItems.has(i) ? "#BBBBBB" : "#1A1A1A", textDecoration: checkedItems.has(i) ? "line-through" : "none", flex: 1 }}>
                  {item}
                </span>
              </div>
            ))}
            {/* Add item row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 10 }}>
              <div style={{ width: 20, height: 20, borderRadius: 5, flexShrink: 0, border: "1.5px dashed #DDDDDD" }} />
              <input
                ref={checklistInputRef}
                type="text"
                value={newChecklistItem}
                onChange={e => setNewChecklistItem(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") addChecklistItem(); if (e.key === "Escape") setNewChecklistItem(""); }}
                placeholder="Add an item…"
                style={{
                  flex: 1, border: "none", outline: "none", fontSize: 14,
                  color: "#1A1A1A", fontFamily: "inherit", background: "transparent",
                  padding: 0,
                }}
              />
              {newChecklistItem.trim() && (
                <button onClick={addChecklistItem} style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#E8521A", display: "flex", padding: 2,
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── EDIT PANEL ── */}
      <Sheet open={panel === "edit"} onClose={() => setPanel(null)}>
        <div style={{ padding: "16px 20px 40px" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1A1A1A", marginBottom: 24 }}>Edit event</h2>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: "#AAAAAA", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Event name</label>
            <input
              type="text"
              value={buildTitleFromFields(editVibe, editFamilyName)}
              onChange={e => setEditFamilyName(e.target.value)}
              style={inputStyle}
              placeholder="e.g. Backyard BBQ at The Millers'"
            />
            <p style={{ fontSize: 11, color: "#BBBBBB", margin: "5px 0 0" }}>
              Enter a last name (e.g. "Miller") to auto-format, or type a custom title.
            </p>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: "#AAAAAA", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Party type</label>
            <select value={editVibe} onChange={e => setEditVibe(e.target.value)} style={{
              ...inputStyle, cursor: "pointer", appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23AAAAAA' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center",
            }}>
              {VIBES.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: "#AAAAAA", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Address</label>
            <input type="text" value={editAddress} onChange={e => setEditAddress(e.target.value)} style={inputStyle} placeholder="123 Oak Ridge Ave" />
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: "#AAAAAA", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Start time</label>
              <select value={editTime} onChange={e => setEditTime(e.target.value)} style={{
                ...inputStyle, cursor: "pointer", appearance: "none",
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23AAAAAA' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center",
              }}>
                {Array.from({ length: 24 * 2 }, (_, i) => {
                  const h = Math.floor(i / 2); const m = i % 2 === 0 ? "00" : "30";
                  const ampm = h < 12 ? "AM" : "PM"; const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
                  const value = `${String(h).padStart(2, "0")}:${m}`;
                  return <option key={value} value={value}>{h12}:{m} {ampm}</option>;
                })}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: "#AAAAAA", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Family name</label>
              <input type="text" value={editFamilyName} onChange={e => setEditFamilyName(e.target.value)} style={inputStyle} placeholder="e.g. Miller" />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: "#AAAAAA", textTransform: "uppercase", display: "block", marginBottom: 8 }}>About your family</label>
            <textarea value={editFamilyNote} onChange={e => setEditFamilyNote(e.target.value)} rows={3} placeholder="e.g. We're a loud, happy bunch who love weekend gardening…" style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }} />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: "#AAAAAA", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Why you're hosting</label>
            <textarea value={editWhyNote} onChange={e => setEditWhyNote(e.target.value)} rows={3} placeholder="e.g. We've lived here three years and barely know anyone…" style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }} />
          </div>

          <button onClick={saveEdit} style={{
            width: "100%", padding: "15px", borderRadius: 50, background: "#E8521A",
            color: "white", border: "none", fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          }}>
            Save changes
          </button>
        </div>
      </Sheet>

      {/* ── INVITE PANEL ── */}
      <Sheet open={panel === "invite"} onClose={() => setPanel(null)}>
        <div style={{ padding: "16px 20px 40px" }}>
          <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1A1A1A", margin: 0 }}>Your flyer</h2>
            <button onClick={() => { track("Flyer Printed", { context: "manage" }); window.print(); }} style={{
              background: "#E8521A", color: "white", border: "none", borderRadius: 50,
              padding: "9px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}>
              Print flyers
            </button>
          </div>

          {/* Flyer card — baseball card proportions, centered */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div className="print-flyer" style={{
              width: 340, flexShrink: 0,
              background: "#FFFFFF", borderRadius: 18, overflow: "hidden",
              boxShadow: "0 8px 40px rgba(0,0,0,0.14)", border: "1px solid #E8E8E8",
            }}>
              {/* Photo */}
              <div className="skeleton" style={{ width: "100%", height: 260, overflow: "hidden", position: "relative" }}>
                {dbPhotoUrl && (
                  <img
                    src={dbPhotoUrl}
                    alt="Family"
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 25%" }}
                    onLoad={e => (e.currentTarget.parentElement as HTMLElement)?.classList.remove("skeleton")}
                  />
                )}
                <div style={{
                  position: "absolute", top: 12, left: 12,
                  background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
                  borderRadius: 6, padding: "3px 8px",
                  fontSize: 9, fontWeight: 800, letterSpacing: "0.12em",
                  color: "white", textTransform: "uppercase",
                }}>
                  {vibeLabel}
                </div>
              </div>

              {/* Orange accent bar */}
              <div style={{ height: 5, background: "linear-gradient(90deg, #E8521A, #F07A40)" }} />

              {/* Info panel */}
              <div style={{ padding: "16px 18px 14px" }}>
                <div style={{
                  fontSize: 20, fontWeight: 800, color: "#1A1A1A",
                  lineHeight: 1.15, marginBottom: 12, letterSpacing: "-0.3px",
                }}>
                  {title}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
                  {dateStr && (
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E8521A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      <span style={{ fontSize: 13, color: "#444", fontWeight: 500 }}>{dateStr}</span>
                    </div>
                  )}
                  {party.address && (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E8521A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 1, flexShrink: 0 }}>
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      <span style={{ fontSize: 13, color: "#444", fontWeight: 500, lineHeight: 1.4 }}>{party.address}</span>
                    </div>
                  )}
                </div>

                {(party.whyNote || party.familyNote) && (
                  <div style={{ borderTop: "0.5px solid #F0EEEB", paddingTop: 12, marginBottom: 14 }}>
                    <p style={{ fontSize: 12, color: "#555", lineHeight: 1.65, fontStyle: "italic", margin: 0 }}>
                      "{party.whyNote?.trim() || party.familyNote?.trim()}"
                    </p>
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
                      {eventId ? `ID: ${eventId.slice(0, 8).toUpperCase()}` : "—"}
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

          {/* Copy link */}
          {eventId && (
            <button
              className="no-print"
              onClick={() => {
                const url = `${window.location.origin}/rsvp/${eventId}`;
                navigator.clipboard.writeText(url).then(() => alert("Link copied!"));
              }}
              style={{
                width: "100%", marginTop: 16, padding: "13px", borderRadius: 10,
                background: "none", border: "1.5px solid #E8E8E8",
                fontSize: 14, fontWeight: 600, color: "#666", cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copy RSVP link
            </button>
          )}
        </div>
      </Sheet>

      {/* ── MESSAGE PANEL ── */}
      <Sheet open={panel === "message"} onClose={() => setPanel(null)}>
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", minHeight: 400 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>Message board</h2>
          <p style={{ fontSize: 14, color: "#999", marginBottom: 20 }}>
            Everyone coming to the party can see this.
          </p>

          {messages.length === 0 ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A", marginBottom: 6 }}>Nothing here yet</div>
              <div style={{ fontSize: 13, color: "#AAAAAA", textAlign: "center", lineHeight: 1.6, maxWidth: 260 }}>
                Post a message for your neighbors — a heads up, something to bring, or just a hello.
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
              {messages.map(msg => (
                <div key={msg.id} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <Avatar text={msg.initials} color={msg.color} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A" }}>{msg.author}</span>
                      <span style={{ fontSize: 12, color: "#CCCCCC" }}>{msg.time}</span>
                    </div>
                    <div style={{
                      background: "#F9F6F3", borderRadius: "0 10px 10px 10px",
                      padding: "10px 14px", fontSize: 14, color: "#1A1A1A", lineHeight: 1.5,
                    }}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Compose */}
          <div style={{ borderTop: "0.5px solid #F0EEEB", paddingTop: 16, marginTop: messages.length === 0 ? 20 : 0 }}>
            <textarea
              ref={messageInputRef}
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Say something to your neighbors…"
              rows={3}
              style={{
                width: "100%", padding: "12px 14px", border: "1.5px solid #E8E8E8",
                borderRadius: 10, fontSize: 14, fontFamily: "inherit", resize: "none",
                boxSizing: "border-box", lineHeight: 1.5, marginBottom: 10,
              }}
            />
            <button onClick={sendMessage} disabled={!newMessage.trim()} style={{
              width: "100%", padding: "13px", borderRadius: 50,
              background: newMessage.trim() ? "#E8521A" : "#E8E8E8",
              color: newMessage.trim() ? "white" : "#AAAAAA",
              border: "none", fontSize: 15, fontWeight: 600, cursor: newMessage.trim() ? "pointer" : "default",
              fontFamily: "inherit", transition: "background 0.15s",
            }}>
              Post message
            </button>
          </div>
        </div>
      </Sheet>

      {/* ── CANCEL CONFIRMATION ── */}
      {panel === "cancel" && (
        <div
          onClick={() => setPanel(null)}
          style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#FFFFFF", borderRadius: 16, padding: "28px 24px",
              width: "100%", maxWidth: 360,
              fontFamily: "var(--font-plus-jakarta-sans), system-ui, sans-serif",
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 12 }}>😔</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>Cancel this event?</h2>
            <p style={{ fontSize: 14, color: "#888", lineHeight: 1.6, marginBottom: 28 }}>
              Your neighbors who already RSVPd will be notified. This can't be undone.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={cancelEvent} style={{
                width: "100%", padding: "14px", borderRadius: 50,
                background: "#1A1A1A", color: "white", border: "none",
                fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}>
                Yes, cancel the event
              </button>
              <button onClick={() => setPanel(null)} style={{
                width: "100%", padding: "13px", borderRadius: 50,
                background: "none", color: "#666", border: "1.5px solid #E8E8E8",
                fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}>
                Never mind
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

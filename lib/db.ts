import { supabase } from "./supabase";
import { PartyState } from "./party-state";

// ── Types ────────────────────────────────────────────────────

export interface DbEvent {
  id: string;
  host_id: string;
  vibe: string | null;
  size: string | null;
  address: string | null;
  event_date: string | null;  // ISO date string
  event_time: string | null;
  family_name: string | null;
  partner_name: string | null;
  family_note: string | null;
  why_note: string | null;
  photo_url: string | null;
  status: string;
  created_at: string;
}

export interface DbRsvp {
  id: string;
  event_id: string;
  family_name: string | null;
  email: string | null;
  phone: string | null;
  guest_count: number;
  has_partner: boolean;
  has_kids: boolean;
  kid_count: number;
  has_dog: boolean;
  family_note: string | null;
  photo_url: string | null;
  status: string;
  created_at: string;
}

export interface DbTask {
  id: string;
  event_id: string;
  title: string;
  category: string;
  is_default: boolean;
  claimed_by_rsvp_id: string | null;
  claimed_by_name: string | null;
  created_at: string;
}

// ── Vibe task seeds ───────────────────────────────────────────

const VIBE_TASKS: Record<string, { category: string; title: string }[]> = {
  bbq: [
    { category: "ESSENTIAL", title: "Grill (gas or charcoal)" },
    { category: "ESSENTIAL", title: "Charcoal or propane" },
    { category: "ESSENTIAL", title: "Tables and chairs" },
    { category: "ESSENTIAL", title: "Tongs, spatula, grill brush" },
    { category: "FOOD",      title: "Burgers and hot dogs" },
    { category: "FOOD",      title: "Buns, condiments, toppings" },
    { category: "FOOD",      title: "Salads and sides" },
    { category: "DRINKS",    title: "Drinks and ice" },
    { category: "ATMOSPHERE", title: "Playlist / speaker" },
    { category: "ATMOSPHERE", title: "Sunscreen station" },
  ],
  wine: [
    { category: "ESSENTIAL", title: "Wine glasses and napkins" },
    { category: "ESSENTIAL", title: "Folding tables" },
    { category: "DRINKS",    title: "Red wines (2–3 bottles)" },
    { category: "DRINKS",    title: "White wines (2–3 bottles)" },
    { category: "DRINKS",    title: "Sparkling water and juice" },
    { category: "FOOD",      title: "Cheese and charcuterie" },
    { category: "FOOD",      title: "Crackers and bread" },
    { category: "FOOD",      title: "Fruit and olives" },
    { category: "ATMOSPHERE", title: "Lighting / string lights" },
    { category: "ATMOSPHERE", title: "Playlist / speaker" },
  ],
  cookout: [
    { category: "ESSENTIAL", title: "Grill and fuel" },
    { category: "ESSENTIAL", title: "Tables and chairs" },
    { category: "ESSENTIAL", title: "Plates, utensils, napkins" },
    { category: "FOOD",      title: "Proteins (chicken, ribs, etc.)" },
    { category: "FOOD",      title: "Corn, veggies for grilling" },
    { category: "FOOD",      title: "Sides and salads" },
    { category: "DRINKS",    title: "Cooler with drinks and ice" },
    { category: "ATMOSPHERE", title: "Playlist / speaker" },
    { category: "ATMOSPHERE", title: "Lawn games" },
  ],
  pizza: [
    { category: "ESSENTIAL", title: "Oven or pizza stone" },
    { category: "ESSENTIAL", title: "Plates and napkins" },
    { category: "FOOD",      title: "Pizza dough (homemade or store-bought)" },
    { category: "FOOD",      title: "Sauce and cheese" },
    { category: "FOOD",      title: "Toppings bar (meats, veggies)" },
    { category: "FOOD",      title: "Salad" },
    { category: "DRINKS",    title: "Drinks and ice" },
    { category: "ATMOSPHERE", title: "Playlist / speaker" },
    { category: "ATMOSPHERE", title: "Dessert pizza (Nutella, fruit)" },
  ],
  potluck: [
    { category: "ESSENTIAL", title: "Tables and chairs" },
    { category: "ESSENTIAL", title: "Plates, utensils, napkins" },
    { category: "ESSENTIAL", title: "Serving spoons and dishes" },
    { category: "FOOD",      title: "Main dish (host provides)" },
    { category: "FOOD",      title: "Vegetarian option" },
    { category: "FOOD",      title: "Dessert" },
    { category: "DRINKS",    title: "Drinks and ice" },
    { category: "DRINKS",    title: "Lemonade or punch" },
    { category: "ATMOSPHERE", title: "Playlist / speaker" },
  ],
  other: [
    { category: "ESSENTIAL", title: "Tables and chairs" },
    { category: "ESSENTIAL", title: "Plates, utensils, napkins" },
    { category: "FOOD",      title: "Snacks and appetizers" },
    { category: "FOOD",      title: "Main dish" },
    { category: "DRINKS",    title: "Drinks and ice" },
    { category: "ATMOSPHERE", title: "Playlist / speaker" },
    { category: "ATMOSPHERE", title: "Decorations" },
  ],
};

// ── Helpers ───────────────────────────────────────────────────

/** Convert a base64 data URL to a Blob for storage upload */
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/** Upload a data URL to Supabase Storage. Returns the public URL. */
export async function uploadPhoto(
  dataUrl: string,
  bucket: string,
  path: string
): Promise<string | null> {
  try {
    const blob = dataUrlToBlob(dataUrl);
    const ext = blob.type.includes("png") ? "png" : "jpg";
    const filePath = `${path}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(filePath, blob, {
      contentType: blob.type,
      upsert: true,
    });
    if (error) { console.error("Storage upload error:", error); return null; }
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  } catch (e) {
    console.error("uploadPhoto failed:", e);
    return null;
  }
}

// ── Events ────────────────────────────────────────────────────

/**
 * Create or update the host's event.
 * If eventId is provided, updates that row. Otherwise inserts a new one.
 * Returns the event UUID.
 */
export async function saveEvent(
  party: Partial<PartyState>,
  userId: string,
  eventId?: string | null,
  photoUrl?: string | null
): Promise<string | null> {
  // Convert stored date object to ISO date string
  let dateStr: string | null = null;
  if (party.date) {
    const { year, month, day } = party.date;
    dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const payload = {
    host_id: userId,
    vibe: party.vibe ?? null,
    size: party.size ?? null,
    address: party.address ?? null,
    event_date: dateStr,
    event_time: party.time ?? null,
    family_name: party.familyName ?? null,
    partner_name: party.partnerName ?? null,
    family_note: party.familyNote ?? null,
    why_note: party.whyNote ?? null,
    ...(photoUrl !== undefined ? { photo_url: photoUrl } : {}),
    status: "active",
  };

  if (eventId) {
    const { data, error } = await supabase
      .from("events")
      .update(payload)
      .eq("id", eventId)
      .select("id")
      .single();
    if (error) { console.error("Event update error:", error); return null; }
    return data.id;
  } else {
    const { data, error } = await supabase
      .from("events")
      .insert(payload)
      .select("id")
      .single();
    if (error) { console.error("Event insert error:", error); return null; }
    return data.id;
  }
}

/** Seed default tasks for a newly created event */
export async function seedTasks(eventId: string, vibe: string): Promise<void> {
  const templates = VIBE_TASKS[vibe] ?? VIBE_TASKS.other;
  const rows = templates.map(t => ({
    event_id: eventId,
    title: t.title,
    category: t.category,
    is_default: true,
    claimed_by_rsvp_id: null,
    claimed_by_name: null,
  }));
  const { error } = await supabase.from("tasks").insert(rows);
  if (error) console.error("Seed tasks error:", error);
}

/** Fetch a single event by ID */
export async function getEvent(id: string): Promise<DbEvent | null> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();
  if (error) { console.error("getEvent error:", error); return null; }
  return data as DbEvent;
}

/** Fetch all active events for a host */
export async function getEventsByHost(hostId: string): Promise<DbEvent[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("host_id", hostId)
    .eq("status", "active")
    .order("event_date", { ascending: true });
  if (error) { console.error("getEventsByHost error:", error); return []; }
  return data as DbEvent[];
}

/** Get RSVP count for an event */
export async function getRsvpCount(eventId: string): Promise<number> {
  const { count, error } = await supabase
    .from("rsvps")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("status", "going");
  if (error) { console.error("getRsvpCount error:", error); return 0; }
  return count ?? 0;
}

/** Cancel an event (soft delete) */
export async function cancelEvent(id: string): Promise<void> {
  await supabase.from("events").update({ status: "cancelled" }).eq("id", id);
}

// ── RSVPs ─────────────────────────────────────────────────────

export interface RsvpPayload {
  event_id: string;
  family_name: string;
  email?: string;
  phone?: string;
  guest_count: number;
  has_partner: boolean;
  has_kids: boolean;
  kid_count: number;
  has_dog: boolean;
  family_note?: string;
  photo_url?: string;
}

export async function createRsvp(payload: RsvpPayload): Promise<string | null> {
  const { data, error } = await supabase
    .from("rsvps")
    .insert(payload)
    .select("id")
    .single();
  if (error) { console.error("createRsvp error:", error); return null; }
  return data.id;
}

export async function updateRsvpPhoto(rsvpId: string, photoUrl: string): Promise<void> {
  await supabase.from("rsvps").update({ photo_url: photoUrl }).eq("id", rsvpId);
}

export async function updateRsvpNote(rsvpId: string, note: string): Promise<void> {
  await supabase.from("rsvps").update({ family_note: note }).eq("id", rsvpId);
}

// ── Messages ──────────────────────────────────────────────────

export interface DbMessage {
  id: string;
  event_id: string;
  author_name: string;
  text: string;
  created_at: string;
}

export async function getMessages(eventId: string): Promise<DbMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });
  if (error) { console.error("getMessages error:", error); return []; }
  return data as DbMessage[];
}

export async function sendMessage(
  eventId: string,
  authorName: string,
  text: string
): Promise<DbMessage | null> {
  const { data, error } = await supabase
    .from("messages")
    .insert({ event_id: eventId, author_name: authorName, text })
    .select()
    .single();
  if (error) { console.error("sendMessage error:", error); return null; }
  return data as DbMessage;
}

export async function updateRsvpHousehold(
  rsvpId: string,
  data: { has_partner: boolean; has_kids: boolean; kid_count: number; has_dog: boolean; guest_count: number }
): Promise<void> {
  await supabase.from("rsvps").update(data).eq("id", rsvpId);
}

export async function getRsvps(eventId: string): Promise<DbRsvp[]> {
  const { data, error } = await supabase
    .from("rsvps")
    .select("*")
    .eq("event_id", eventId)
    .eq("status", "going")
    .order("created_at", { ascending: true });
  if (error) { console.error("getRsvps error:", error); return []; }
  return data as DbRsvp[];
}

// ── Tasks ─────────────────────────────────────────────────────

export async function getTasks(eventId: string): Promise<DbTask[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });
  if (error) { console.error("getTasks error:", error); return []; }
  return data as DbTask[];
}

export async function addTask(
  eventId: string,
  title: string,
  category: string
): Promise<DbTask | null> {
  const { data, error } = await supabase
    .from("tasks")
    .insert({ event_id: eventId, title, category, is_default: false })
    .select()
    .single();
  if (error) { console.error("addTask error:", error); return null; }
  return data as DbTask;
}

export async function claimTask(
  taskId: string,
  name: string,
  rsvpId?: string | null
): Promise<void> {
  await supabase.from("tasks").update({
    claimed_by_name: name,
    claimed_by_rsvp_id: rsvpId ?? null,
  }).eq("id", taskId);
}

export async function unclaimTask(taskId: string): Promise<void> {
  await supabase.from("tasks").update({
    claimed_by_name: null,
    claimed_by_rsvp_id: null,
  }).eq("id", taskId);
}

export async function deleteTask(taskId: string): Promise<void> {
  await supabase.from("tasks").delete().eq("id", taskId);
}

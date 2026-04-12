export interface PartyState {
  address: string;
  size: string;
  date: { year: number; month: number; day: number } | null;
  time: string;
  vibe: string;
  yourName: string;
  familyName: string;
  partnerName: string;
  kids: { name: string; ageRange: string }[];
  pets: { name: string; petType: string }[];
  familyNote: string;
  whyNote: string;
  photoDataUrl: string | null;
}

const KEY = "stoop_party";
const PHOTO_KEY = "stoop_photo";

export function getPartyState(): Partial<PartyState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    const state: Partial<PartyState> = raw ? JSON.parse(raw) : {};
    // Photo is stored separately in sessionStorage
    const photo = sessionStorage.getItem(PHOTO_KEY);
    if (photo) state.photoDataUrl = photo;
    return state;
  } catch {
    return {};
  }
}

export function savePartyState(patch: Partial<PartyState>): void {
  if (typeof window === "undefined") return;
  // Save photo separately in sessionStorage (can handle large base64 payloads)
  if ("photoDataUrl" in patch) {
    try {
      if (patch.photoDataUrl) {
        sessionStorage.setItem(PHOTO_KEY, patch.photoDataUrl);
      } else {
        sessionStorage.removeItem(PHOTO_KEY);
      }
    } catch {
      // ignore
    }
  }
  // Save everything else to localStorage
  const { photoDataUrl: _, ...rest } = patch;
  if (Object.keys(rest).length === 0) return;
  try {
    const raw = localStorage.getItem(KEY);
    const current: Partial<PartyState> = raw ? JSON.parse(raw) : {};
    localStorage.setItem(KEY, JSON.stringify({ ...current, ...rest }));
  } catch {
    // ignore
  }
}

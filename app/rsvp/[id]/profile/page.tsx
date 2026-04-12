"use client";
import { useState, useRef, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { uploadPhoto, updateRsvpPhoto, updateRsvpHousehold } from "@/lib/db";

type AgeRange = "baby" | "toddler" | "elementary" | "teen";
type PetType = "big dog" | "small dog" | "very opinionated dog" | "cat" | "other";

interface Kid { id: number; name: string; ageRange: AgeRange }
interface Pet { id: number; name: string; petType: PetType }

const AGE_RANGES: { value: AgeRange; label: string }[] = [
  { value: "baby", label: "Baby (0–1)" },
  { value: "toddler", label: "Toddler (2–4)" },
  { value: "elementary", label: "Elementary age (5–12)" },
  { value: "teen", label: "Teen (13+)" },
];

const PET_TYPES: { value: PetType; label: string }[] = [
  { value: "big dog", label: "Big dog" },
  { value: "small dog", label: "Small dog" },
  { value: "very opinionated dog", label: "Very opinionated dog" },
  { value: "cat", label: "Cat" },
  { value: "other", label: "Other" },
];

let nextId = 1;

export default function RSVPProfile({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [partnerName, setPartnerName] = useState("");
  const [kids, setKids] = useState<Kid[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const rsvpRaw = typeof window !== "undefined" ? sessionStorage.getItem("stoop_rsvp") : null;
  const rsvp = rsvpRaw ? JSON.parse(rsvpRaw) : {};

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = e => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const MAX = 800;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        setPreview(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const addKid = () => setKids(k => [...k, { id: nextId++, name: "", ageRange: "elementary" }]);
  const removeKid = (id: number) => setKids(k => k.filter(x => x.id !== id));
  const updateKid = (id: number, patch: Partial<Kid>) => setKids(k => k.map(x => x.id === id ? { ...x, ...patch } : x));

  const addPet = () => setPets(p => [...p, { id: nextId++, name: "", petType: "big dog" }]);
  const removePet = (id: number) => setPets(p => p.filter(x => x.id !== id));
  const updatePet = (id: number, patch: Partial<Pet>) => setPets(p => p.map(x => x.id === id ? { ...x, ...patch } : x));

  const save = async () => {
    if (saving) return;
    setSaving(true);
    const existing = JSON.parse(sessionStorage.getItem("stoop_rsvp") || "{}");
    let photoUrl: string | null = null;

    if (preview && existing.rsvpId) {
      photoUrl = await uploadPhoto(preview, "rsvp-photos", `${params.id}/${existing.rsvpId}`);
      if (photoUrl) await updateRsvpPhoto(existing.rsvpId, photoUrl);
    }

    if (existing.rsvpId) {
      const hasPartner = partnerName.trim().length > 0;
      const hasDog = pets.some(p => p.petType.includes("dog"));
      await updateRsvpHousehold(existing.rsvpId, {
        has_partner: hasPartner,
        has_kids: kids.length > 0,
        kid_count: kids.length,
        has_dog: hasDog,
        guest_count: 1 + (hasPartner ? 1 : 0) + kids.length,
      });
    }

    sessionStorage.setItem("stoop_rsvp", JSON.stringify({
      ...existing,
      photo: photoUrl ?? preview,
      partnerName,
      kids: kids.map(({ name, ageRange }) => ({ name, ageRange })),
      pets: pets.map(({ name, petType }) => ({ name, petType })),
    }));
    router.push(`/event/${params.id}`);
  };

  return (
    <div style={{
      minHeight: "100dvh", background: "#F9F6F3",
      fontFamily: "var(--font-plus-jakarta-sans), system-ui, sans-serif",
    }}>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 20px" }}>
        <img src="/stoop.svg" alt="Stoop" style={{ height: 20 }} />
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "8px 20px 48px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "#FDF0E8", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 24, margin: "0 auto 14px",
          }}>
            🎉
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1A1A1A", lineHeight: 1.2, marginBottom: 8 }}>
            You're going to the party.
          </h1>
          <p style={{ fontSize: 15, color: "#888", lineHeight: 1.6 }}>
            So your neighbors know who to look for — tell them a little about yourself.
          </p>
        </div>

        {/* Photo card */}
        <div style={{ background: "#FFFFFF", borderRadius: 16, padding: "22px 20px", marginBottom: 14, boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>Put a face to the name.</h2>
          <p style={{ fontSize: 14, color: "#888", marginBottom: 18, lineHeight: 1.6 }}>
            Add a photo of you or your family so your neighbors know who's coming.
          </p>

          <div
            onClick={() => inputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            style={{
              width: 110, height: 110, borderRadius: "50%",
              border: `2px dashed ${dragOver ? "#E8521A" : "#DDDDDD"}`,
              background: dragOver ? "#FDF0E8" : "#F9F6F3",
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", cursor: "pointer",
              margin: "0 auto 14px", overflow: "hidden", transition: "all 0.15s",
            }}
          >
            {preview ? (
              <img src={preview} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Your photo" />
            ) : (
              <>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 4 }}>
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                <span style={{ fontSize: 11, color: "#CCCCCC", fontWeight: 600 }}>Add photo</span>
              </>
            )}
          </div>
          <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

          <button
            onClick={() => inputRef.current?.click()}
            style={{
              display: "block", margin: "0 auto",
              background: "#F0EEEB", border: "none", borderRadius: 8,
              padding: "9px 20px", fontSize: 14, fontWeight: 600,
              color: "#666", cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {preview ? "Change photo" : "Upload photo"}
          </button>
          {!preview && (
            <p style={{ fontSize: 12, color: "#BBBBBB", textAlign: "center", marginTop: 10 }}>
              Best on your stoop, porch, or front steps.
            </p>
          )}
        </div>

        {/* Household card */}
        <div style={{ background: "#FFFFFF", borderRadius: 16, padding: "22px 20px", marginBottom: 28, boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>Who's coming with you?</h2>
          <p style={{ fontSize: 14, color: "#888", marginBottom: 20, lineHeight: 1.6 }}>All optional.</p>

          {/* Partner */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>❤️</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>Partner</span>
            </div>
            <input
              type="text"
              placeholder="Partner's name (optional)"
              value={partnerName}
              onChange={e => setPartnerName(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ width: "100%", height: 1, background: "#F0EEEB", marginBottom: 20 }} />

          {/* Kids */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 16 }}>😊</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>Kids</span>
            </div>
            {kids.map(kid => (
              <div key={kid.id} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="Name (optional)"
                  value={kid.name}
                  onChange={e => updateKid(kid.id, { name: e.target.value })}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <select
                  value={kid.ageRange}
                  onChange={e => updateKid(kid.id, { ageRange: e.target.value as AgeRange })}
                  style={{ ...inputStyle, flex: 1, cursor: "pointer" }}
                >
                  {AGE_RANGES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
                <button onClick={() => removeKid(kid.id)} style={removeBtn}>×</button>
              </div>
            ))}
            <button onClick={addKid} style={addBtn}>+ Add a kid</button>
          </div>

          <div style={{ width: "100%", height: 1, background: "#F0EEEB", marginBottom: 20 }} />

          {/* Pets */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 16 }}>🐾</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>Pets</span>
            </div>
            {pets.map(pet => (
              <div key={pet.id} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="Name (optional)"
                  value={pet.name}
                  onChange={e => updatePet(pet.id, { name: e.target.value })}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <select
                  value={pet.petType}
                  onChange={e => updatePet(pet.id, { petType: e.target.value as PetType })}
                  style={{ ...inputStyle, flex: 1, cursor: "pointer" }}
                >
                  {PET_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                <button onClick={() => removePet(pet.id)} style={removeBtn}>×</button>
              </div>
            ))}
            <button onClick={addPet} style={addBtn}>+ Add a pet</button>
          </div>
        </div>

        {/* CTAs */}
        <button
          onClick={save}
          disabled={saving}
          style={{
            width: "100%", padding: "16px", borderRadius: 50,
            background: "#E8521A", color: "white", border: "none",
            fontSize: 16, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer",
            fontFamily: "inherit", marginBottom: 14,
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Saving…" : "Take me to the party →"}
        </button>
        <button
          onClick={() => router.push(`/event/${params.id}`)}
          style={{
            display: "block", width: "100%", background: "none", border: "none",
            fontSize: 14, fontWeight: 500, color: "#BBBBBB", cursor: "pointer",
            fontFamily: "inherit", textAlign: "center",
          }}
        >
          Skip for now →
        </button>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 14px",
  border: "1.5px solid #E8E8E8", borderRadius: 8,
  fontSize: 14, fontFamily: "inherit", boxSizing: "border-box",
  background: "#fff", color: "#1A1A1A",
};

const addBtn: React.CSSProperties = {
  background: "none", border: "1.5px dashed #E8E8E8", borderRadius: 8,
  padding: "9px 16px", fontSize: 13, fontWeight: 600, color: "#E8521A",
  cursor: "pointer", width: "100%", textAlign: "center", fontFamily: "inherit",
};

const removeBtn: React.CSSProperties = {
  background: "none", border: "none", fontSize: 20, color: "#CCCCCC",
  cursor: "pointer", padding: "0 4px", lineHeight: 1, flexShrink: 0,
};

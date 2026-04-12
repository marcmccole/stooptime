"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import StepLayout from "@/components/onboarding/StepLayout";
import { savePartyState } from "@/lib/party-state";
import { track } from "@/lib/mixpanel";
import { supabase } from "@/lib/supabase";

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

export default function Step6() {
  const router = useRouter();
  const [yourName, setYourName] = useState("");
  const [familyName, setFamilyName] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.replace("/host/auth"); return; }
    });
  }, [router]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const name = data.user?.user_metadata?.full_name || data.user?.user_metadata?.name || "";
      const first = name.split(" ")[0] || "";
      const last = name.split(" ").slice(1).join(" ") || "";
      if (first) setYourName(first);
      if (last) setFamilyName(last);
    });
  }, []);
  const [partnerName, setPartnerName] = useState("");
  const [kids, setKids] = useState<Kid[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [familyNote, setFamilyNote] = useState("");
  const [whyNote, setWhyNote] = useState("");

  const addKid = () => setKids(k => [...k, { id: nextId++, name: "", ageRange: "elementary" }]);
  const removeKid = (id: number) => setKids(k => k.filter(x => x.id !== id));
  const updateKid = (id: number, patch: Partial<Kid>) => setKids(k => k.map(x => x.id === id ? { ...x, ...patch } : x));

  const addPet = () => setPets(p => [...p, { id: nextId++, name: "", petType: "big dog" }]);
  const removePet = (id: number) => setPets(p => p.filter(x => x.id !== id));
  const updatePet = (id: number, patch: Partial<Pet>) => setPets(p => p.map(x => x.id === id ? { ...x, ...patch } : x));

  const ready = familyNote.trim().length > 0 && familyName.trim().length > 0;

  return (
    <StepLayout step={6} backHref="/host/vibe">
      <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1A1A1A", marginBottom: 8, lineHeight: 1.2 }}>
        Help your neighbors get to know you.
      </h1>
      <p style={{ fontSize: 15, color: "#888", marginBottom: 28, lineHeight: 1.6 }}>
        The best neighborhoods are the ones where people know each other. Let's start with your story.
      </p>

      {/* Family name — first name comes from Google, just confirm last */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", display: "block", marginBottom: 6 }}>
          Family name <span style={{ color: "#E8521A" }}>*</span>
        </label>
        <input
          type="text"
          placeholder="e.g. Miller"
          value={familyName}
          onChange={e => setFamilyName(e.target.value)}
          style={inputStyle}
        />
        <p style={{ fontSize: 12, color: "#BBBBBB", marginTop: 6 }}>
          Used on the flyer — e.g. "at The Millers'"
        </p>
      </div>

      <div style={{ width: "100%", height: 1, background: "#F0EEEB", marginBottom: 24 }} />

      {/* Who's at home */}
      <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#AAAAAA", marginBottom: 14 }}>
        Who's at home with you?
      </div>

      {/* Partner */}
      <div style={{ marginBottom: 16 }}>
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

      {/* Kids */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
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
              style={{ ...inputStyle, flex: 1, marginBottom: 0 }}
            />
            <select
              value={kid.ageRange}
              onChange={e => updateKid(kid.id, { ageRange: e.target.value as AgeRange })}
              style={{ ...inputStyle, flex: 1, marginBottom: 0, cursor: "pointer" }}
            >
              {AGE_RANGES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
            <button onClick={() => removeKid(kid.id)} style={removeBtn}>×</button>
          </div>
        ))}
        <button onClick={addKid} style={addBtn}>+ Add a kid</button>
      </div>

      {/* Pets */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
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
              style={{ ...inputStyle, flex: 1, marginBottom: 0 }}
            />
            <select
              value={pet.petType}
              onChange={e => updatePet(pet.id, { petType: e.target.value as PetType })}
              style={{ ...inputStyle, flex: 1, marginBottom: 0, cursor: "pointer" }}
            >
              {PET_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <button onClick={() => removePet(pet.id)} style={removeBtn}>×</button>
          </div>
        ))}
        <button onClick={addPet} style={addBtn}>+ Add a pet</button>
      </div>

      <div style={{ width: "100%", height: 1, background: "#F0EEEB", marginBottom: 24 }} />

      {/* Family description */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", display: "block", marginBottom: 6 }}>
          Describe your family in a sentence <span style={{ color: "#E8521A" }}>*</span>
        </label>
        <textarea
          value={familyNote}
          onChange={e => setFamilyNote(e.target.value)}
          placeholder="e.g. We're a loud, happy bunch who love weekend gardening and baking more cookies than we can eat…"
          rows={3}
          style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
        />
      </div>

      {/* Why excited */}
      <div style={{ marginBottom: 32 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", display: "block", marginBottom: 4 }}>
          Why do you want to meet your neighbors?{" "}
          <span style={{ fontSize: 12, color: "#BBBBBB", fontWeight: 400 }}>Optional</span>
        </label>
        <p style={{ fontSize: 12, color: "#BBBBBB", marginBottom: 8 }}>We'll use this to write your flyer note.</p>
        <textarea
          value={whyNote}
          onChange={e => setWhyNote(e.target.value)}
          placeholder="e.g. We've lived here three years and realized we don't know a single neighbor by name. That felt wrong…"
          rows={3}
          style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
        />
      </div>

      <div style={{ marginTop: "auto" }}>
        <a
          href={ready ? "/host/flyer" : undefined}
          onClick={() => {
            if (ready) {
              savePartyState({
                yourName,
                familyName,
                partnerName,
                kids: kids.map(({ name, ageRange }) => ({ name, ageRange })),
                pets: pets.map(({ name, petType }) => ({ name, petType })),
                familyNote,
                whyNote,
              });
              track("About Completed", {
                has_partner: !!partnerName.trim(),
                has_kids: kids.length > 0,
                kid_count: kids.length,
                has_pets: pets.length > 0,
                has_why_note: !!whyNote.trim(),
              });
            }
          }}
          className="btn-primary"
          style={{
            display: "block", textAlign: "center",
            opacity: ready ? 1 : 0.45,
            pointerEvents: ready ? "auto" : "none",
          }}
        >
          Continue
        </a>
        <p style={{ fontSize: 12, color: "#CCCCCC", textAlign: "center", marginTop: 12 }}>
          We'll use this to write your flyer
        </p>
      </div>
    </StepLayout>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 14px",
  border: "1.5px solid #E8E8E8", borderRadius: 8,
  fontSize: 14, fontFamily: "inherit",
  boxSizing: "border-box", marginBottom: 0,
  background: "#fff",
};

const addBtn: React.CSSProperties = {
  background: "none", border: "1.5px dashed #E8E8E8", borderRadius: 8,
  padding: "9px 16px", fontSize: 13, fontWeight: 600, color: "#E8521A",
  cursor: "pointer", width: "100%", textAlign: "center",
  transition: "border-color 0.15s",
};

const removeBtn: React.CSSProperties = {
  background: "none", border: "none", fontSize: 18, color: "#CCCCCC",
  cursor: "pointer", padding: "0 4px", lineHeight: 1, flexShrink: 0,
};

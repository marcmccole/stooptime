"use client";
import { useRouter } from "next/navigation";
import StepLayout from "@/components/onboarding/StepLayout";
import { savePartyState } from "@/lib/party-state";

const vibes = [
  { id: "bbq",       label: "Backyard BBQ",        emoji: "🔥" },
  { id: "wine",      label: "Wine on the porch",   emoji: "🍷" },
  { id: "cookout",   label: "Block cookout",        emoji: "🍳" },
  { id: "pizza",     label: "Pizza party",          emoji: "🍕" },
  { id: "potluck",   label: "Bring a dish",         emoji: "🥘" },
  { id: "other",     label: "Snacks & Socialize",   emoji: "✨" },
  { id: "cocktails", label: "Cocktail hour",        emoji: "🍸" },
  { id: "kids",      label: "Kids block play",      emoji: "🧸" },
  { id: "welcome",   label: "Lawn games",            emoji: "🏓" },
];

export default function Step5() {
  const router = useRouter();

  return (
    <StepLayout step={5} backHref="/host/date">
      <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1A1A1A", marginBottom: 8, lineHeight: 1.2 }}>
        What's the vibe?
      </h1>
      <p style={{ fontSize: 15, color: "#888", marginBottom: 28, lineHeight: 1.6 }}>
        Help your guests know what to expect, and we'll help them get involved.
      </p>

      <div className="vibe-grid">
        {vibes.map(({ id, label, emoji }) => (
          <button
            key={id}
            onClick={() => { savePartyState({ vibe: id }); router.push("/host/about"); }}
            className="option-card"
            style={{ textAlign: "center", padding: "18px 12px" }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>{emoji}</div>
            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3, color: "#1A1A1A" }}>
              {label}
            </div>
          </button>
        ))}
      </div>
    </StepLayout>
  );
}

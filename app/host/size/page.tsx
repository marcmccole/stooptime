"use client";
import { useRouter } from "next/navigation";
import StepLayout from "@/components/onboarding/StepLayout";
import { savePartyState } from "@/lib/party-state";
import { track } from "@/lib/mixpanel";

const sizes = [
  {
    id: "intimate",
    label: "Just the neighbors nearby",
    sublabel: "Steps or yards · 5–10 families",
    desc: "A relaxed hang with the houses closest to you. Low-key and easy.",
    img: "/small_group.png",
    locked: false,
  },
  {
    id: "whole_block",
    label: "The whole block",
    sublabel: "Kerbside · 10–20 families",
    desc: "Your whole street comes together. Tables out front, neighbours meeting for the first time.",
    img: "/middle_group.png",
    locked: true,
  },
  {
    id: "street_closure",
    label: "Close the street!",
    sublabel: "Permit likely required · 20+ families",
    desc: "Shut it down. Tables in the road, kids running free, music loud.",
    img: "/large_group.png",
    locked: true,
  },
];

export default function Step2() {
  const router = useRouter();

  return (
    <StepLayout step={2} backHref="/host">
      <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1A1A1A", marginBottom: 8, lineHeight: 1.2 }}>
        How big are you thinking?
      </h1>
      <p style={{ fontSize: 15, color: "#888", marginBottom: 28, lineHeight: 1.6 }}>
        Don't worry, you can always adjust later. We just want to help you set the right mood.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
        {sizes.map(({ id, label, sublabel, desc, img, locked }) => (
          <div
            key={id}
            onClick={() => {
              if (locked) return;
              savePartyState({ size: id });
              track("Party Size Selected", { size: id });
              router.push("/host/auth");
            }}
            className="option-card"
            style={{
              opacity: locked ? 1 : 1,
              cursor: locked ? "default" : "pointer",
              position: "relative",
              background: locked ? "#FAFAFA" : "#FFFFFF",
              borderColor: locked ? "#EFEFEF" : undefined,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{
                width: 88, height: 72, flexShrink: 0, borderRadius: 8,
                background: "#FFFFFF", overflow: "hidden",
                display: "flex", alignItems: "center", justifyContent: "center",
                opacity: locked ? 0.35 : 1,
              }}>
                <img
                  src={img}
                  alt={label}
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              </div>
              <div style={{ textAlign: "left", flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: locked ? "#BBBBBB" : "#1A1A1A" }}>
                    {label}
                  </div>
                  {locked && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                      color: "#AAAAAA", background: "#F0EEEB",
                      padding: "2px 7px", borderRadius: 50,
                      textTransform: "uppercase",
                    }}>
                      Unlocks after your first party
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: locked ? "#CCCCCC" : "#E8521A", fontWeight: 600, marginBottom: 4 }}>
                  {sublabel}
                </div>
                <div style={{ fontSize: 13, color: locked ? "#CCCCCC" : "#888", lineHeight: 1.45 }}>
                  {desc}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </StepLayout>
  );
}

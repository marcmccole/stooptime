"use client";
import { useState, useRef, useEffect } from "react";
import Script from "next/script";
import usePlacesAutocomplete, { Suggestion } from "use-places-autocomplete";
import StepLayout from "@/components/onboarding/StepLayout";
import { savePartyState } from "@/lib/party-state";
import { track } from "@/lib/mixpanel";

function AddressInput({ onSelect }: { onSelect: (val: string) => void }) {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    callbackName: "initPlaces",
    requestOptions: { types: ["address"], componentRestrictions: { country: "us" } },
    debounce: 250,
  });

  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const suggestions = status === "OK" ? data : [];

  const handleSelect = (suggestion: Suggestion) => {
    setValue(suggestion.description, false);
    onSelect(suggestion.description);
    clearSuggestions();
    setOpen(false);
    setActiveIdx(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && activeIdx >= 0) { e.preventDefault(); handleSelect(suggestions[activeIdx]); }
    if (e.key === "Escape") { setOpen(false); }
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#AAAAAA", display: "flex", pointerEvents: "none" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </span>
        <input
          type="text"
          value={value}
          disabled={!ready}
          onChange={e => { setValue(e.target.value); setOpen(true); setActiveIdx(-1); }}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
          placeholder={ready ? "123 Oak Ridge Ave, Brooklyn…" : "Loading…"}
          autoComplete="off"
          style={{
            width: "100%", padding: "13px 14px 13px 36px",
            border: "1.5px solid #E8E8E8", borderRadius: open && suggestions.length > 0 ? "8px 8px 0 0" : 8,
            fontSize: 15, fontFamily: "inherit", boxSizing: "border-box",
            background: "#fff",
          }}
        />
      </div>

      {open && suggestions.length > 0 && (
        <ul style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
          background: "#fff", border: "1.5px solid #E8521A", borderTop: "none",
          borderRadius: "0 0 8px 8px", margin: 0, padding: 0, listStyle: "none",
          boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
        }}>
          {suggestions.map((s, i) => {
            const { main_text, secondary_text } = s.structured_formatting;
            return (
              <li
                key={s.place_id}
                onMouseDown={() => handleSelect(s)}
                onMouseEnter={() => setActiveIdx(i)}
                style={{
                  padding: "11px 14px",
                  cursor: "pointer",
                  background: i === activeIdx ? "#FDF0E8" : "#fff",
                  borderBottom: i < suggestions.length - 1 ? "0.5px solid #F0EEEB" : "none",
                  display: "flex", alignItems: "baseline", gap: 8,
                  transition: "background 0.1s",
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {main_text}
                </span>
                <span style={{ fontSize: 12, color: "#AAAAAA", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {secondary_text}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function Step2() {
  const [address, setAddress] = useState("");
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    track("Address Step Viewed");
  }, []);

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initPlaces`}
        strategy="afterInteractive"
      />
      <StepLayout step={2} backHref="/host">
        {/* Hero image */}
        <div style={{ margin: "4px -20px 32px", position: "relative", height: 240, overflow: "hidden" }}>
          <img
            src="/community_gathering.png"
            alt="Neighbourhood aerial view"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }}
          />
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(255,255,255,0.96)", backdropFilter: "blur(4px)",
            borderRadius: 12, padding: "16px 24px", textAlign: "center",
            boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
            width: "calc(100% - 80px)", maxWidth: 280,
          }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1A1A1A", margin: "0 0 4px" }}>
              Where's your block?
            </h1>
            <p style={{ fontSize: 13, color: "#999", margin: 0, lineHeight: 1.4 }}>
              So we know where to throw the party
            </p>
          </div>
        </div>

        <label style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", marginBottom: 8, display: "block" }}>
          Your Neighborhood Address
        </label>
        <div style={{ marginBottom: 8 }}>
          <AddressInput onSelect={setAddress} />
        </div>

        <div style={{ marginTop: "auto" }}>
          <a
            href={address.trim() ? "/host/auth" : undefined}
            onClick={() => {
              if (address.trim()) {
                savePartyState({ address });
                track("Address Entered");
              }
            }}
            className="btn-primary"
            style={{
              display: "block", textAlign: "center",
              opacity: address.trim() ? 1 : 0.45,
              pointerEvents: address.trim() ? "auto" : "none",
            }}
          >
            Let's go →
          </a>
          <p style={{ fontSize: 12, color: "#999999", textAlign: "center", marginTop: 12 }}>
            Nothing is set in stone — you can adjust everything later
          </p>
        </div>
      </StepLayout>
    </>
  );
}

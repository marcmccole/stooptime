"use client";
import { useEffect, useState } from "react";
import { track } from "@/lib/mixpanel";

type Status = "idle" | "sending" | "done" | "error";

export default function TextSignupForm() {
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    track("Landing Page Viewed", { version: "text-your-neighbors" });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch("/api/text-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, address }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "That didn't go through. Please try again in a minute.");
        return;
      }
      track("Text Signup Submitted");
      setStatus("done");
    } catch {
      setStatus("error");
      setMessage("That didn't go through. Check your connection and try again.");
    }
  }

  if (status === "done") {
    return (
      <div role="status" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <p
          style={{
            margin: 0,
            fontFamily: "var(--font-tyn-display), system-ui, sans-serif",
            fontWeight: 700,
            fontSize: 28,
            lineHeight: 1.15,
          }}
        >
          Got it.
        </p>
        <p style={{ margin: 0, fontSize: 18, color: "#DCE3EB" }}>
          We&apos;ll text you when Stoop reaches your street.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ margin: 0, fontSize: 18, color: "#FFFFFF" }}>
        Stoop is starting in Mt. Davidson Manor. Leave your number and we&apos;ll text you when your street is on.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label htmlFor="tyn-phone" style={{ fontSize: 14, fontWeight: 600, color: "#DCE3EB" }}>
          Mobile number
        </label>
        <input
          id="tyn-phone"
          className="tyn-input"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(415) 555-0123"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label htmlFor="tyn-address" style={{ fontSize: 14, fontWeight: 600, color: "#DCE3EB" }}>
          Street address
        </label>
        <input
          id="tyn-address"
          className="tyn-input"
          type="text"
          autoComplete="street-address"
          placeholder="123 Upland Drive"
          required
          maxLength={200}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>
      {status === "error" && (
        <p role="alert" style={{ margin: 0, fontSize: 15, color: "#FFC9BD" }}>
          {message}
        </p>
      )}
      <button type="submit" className="tyn-submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : "Tell me when my street is on"}
      </button>
      <p style={{ margin: 0, fontSize: 13, color: "#DCE3EB" }}>
        We&apos;ll only text you about Stoop.{" "}
        <a href="/privacy" className="tyn-link-light">
          Privacy
        </a>
      </p>
    </form>
  );
}

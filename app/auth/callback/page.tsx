"use client";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const next = searchParams.get("next")
      ?? localStorage.getItem("stoop_auth_next")
      ?? "/home";
    localStorage.removeItem("stoop_auth_next");

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ data }) => {
        const user = data?.user;
        // New user if created within the last 10 seconds
        if (user?.email && user.created_at) {
          const ageMs = Date.now() - new Date(user.created_at).getTime();
          if (ageMs < 10_000) {
            fetch("/api/welcome-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: user.email,
                name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? "",
              }),
            }).catch(() => {}); // fire and forget
          }
        }
        router.replace(next);
      });
    } else {
      router.replace(next);
    }
  }, []);

  return null;
}

export default function AuthCallback() {
  return (
    <div style={{
      minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--font-plus-jakarta-sans), system-ui, sans-serif",
      background: "#F9F6F3", color: "#888", fontSize: 15,
    }}>
      <Suspense fallback={null}>
        <CallbackHandler />
      </Suspense>
      Signing you in…
    </div>
  );
}

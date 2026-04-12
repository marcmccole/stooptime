"use client";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { identify, track } from "@/lib/mixpanel";

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
        if (user) {
          const name = user.user_metadata?.full_name ?? user.user_metadata?.name ?? "";
          identify(user.id, { $email: user.email, $name: name });
          const ageMs = user.created_at ? Date.now() - new Date(user.created_at).getTime() : Infinity;
          const isNewUser = ageMs < 10_000;
          track("Auth Completed", { is_new_user: isNewUser });
          if (isNewUser && user.email) {
            fetch("/api/welcome-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: user.email, name }),
            }).catch(() => {});
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

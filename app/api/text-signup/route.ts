import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Accepts US numbers typed any common way and returns +1XXXXXXXXXX, or null.
function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  const ten = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (ten.length !== 10) return null;
  // Area codes and exchanges never start with 0 or 1.
  if (/^[01]/.test(ten) || /^[01]/.test(ten.slice(3))) return null;
  return `+1${ten}`;
}

export async function POST(req: NextRequest) {
  let payload: { phone?: unknown; address?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Something was off with that request." }, { status: 400 });
  }

  const phone = typeof payload.phone === "string" ? normalizePhone(payload.phone) : null;
  const address = typeof payload.address === "string" ? payload.address.trim().slice(0, 200) : "";

  if (!phone) {
    return NextResponse.json(
      { error: "That doesn't look like a US mobile number. Try it with the area code." },
      { status: 400 }
    );
  }
  if (address.length < 5) {
    return NextResponse.json({ error: "Add your street address so we know which street you're on." }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("text-signup: Supabase environment variables are missing");
    return NextResponse.json({ error: "Signups are down right now. Please try again later." }, { status: 500 });
  }

  const supabaseAdmin = createClient(url, key);
  // Same number signing up twice just updates the address.
  const { error } = await supabaseAdmin
    .from("text_signups")
    .upsert({ phone, address }, { onConflict: "phone" });

  if (error) {
    console.error("text-signup: insert failed", error.message);
    return NextResponse.json({ error: "That didn't go through. Please try again in a minute." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

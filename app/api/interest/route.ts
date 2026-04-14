import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function geocodeAddress(address: string): Promise<{
  lat: number | null;
  lng: number | null;
  neighborhood: string | null;
}> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return { lat: null, lng: null, neighborhood: null };

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    );
    const data = await res.json();
    if (data.status !== "OK" || !data.results?.[0]) {
      return { lat: null, lng: null, neighborhood: null };
    }
    const result = data.results[0];
    const { lat, lng } = result.geometry.location;

    // Extract neighborhood — try neighborhood, then sublocality, then locality
    const components: { types: string[]; long_name: string }[] = result.address_components;
    const neighborhood =
      components.find(c => c.types.includes("neighborhood"))?.long_name ||
      components.find(c => c.types.includes("sublocality_level_1"))?.long_name ||
      components.find(c => c.types.includes("sublocality"))?.long_name ||
      components.find(c => c.types.includes("locality"))?.long_name ||
      null;

    return { lat, lng, neighborhood };
  } catch {
    return { lat: null, lng: null, neighborhood: null };
  }
}

export async function POST(req: NextRequest) {
  const { userId, email, address } = await req.json();
  if (!address || !email) {
    return NextResponse.json({ error: "Missing address or email" }, { status: 400 });
  }

  const { lat, lng, neighborhood } = await geocodeAddress(address);

  const { error } = await supabaseAdmin
    .from("interest_registrations")
    .insert({
      user_id: userId ?? null,
      email,
      address,
      lat,
      lng,
      neighborhood,
    });

  if (error) {
    console.error("interest insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

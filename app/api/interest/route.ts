import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";

function getClients() {
  return {
    supabaseAdmin: createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    ),
    resend: new Resend(process.env.RESEND_API_KEY),
  };
}

const NOTIFY_THRESHOLD = 2;
const RADIUS_METERS = 805; // 0.5 miles

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

async function sendSoloNotification(
  resend: Resend,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: SupabaseClient<any>,
  recipient: { id: string; email: string },
  notifiedNeighborCount: number,
  neighborhood: string | null
) {
  const locationLabel = neighborhood ?? "your area";
  const neighborWord = notifiedNeighborCount === 1 ? "neighbor" : "neighbors";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#F2F2F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F2F2F0;padding:40px 16px 0;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#FFFFFF;">

        <tr><td style="padding:32px 40px 0;">
          <span style="font-size:20px;font-weight:800;color:#E8521A;letter-spacing:-0.5px;">Stoop</span>
        </td></tr>

        <tr><td style="padding:32px 40px 0;">
          <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:38px;font-weight:700;color:#1A1A1A;line-height:1.1;letter-spacing:-1px;">
            You're not<br />alone.
          </h1>
        </td></tr>

        <tr><td style="padding:24px 40px 0;">
          <p style="margin:0 0 16px;font-size:16px;color:#1A1A1A;line-height:1.6;">
            ${notifiedNeighborCount} ${neighborWord} near you in ${locationLabel} ${notifiedNeighborCount === 1 ? "has" : "have"} already expressed interest in a block party.
          </p>
          <p style="margin:0 0 16px;font-size:15px;color:#555555;line-height:1.7;">
            All it takes is one person to make it happen. It could be you — and we'll help with everything.
          </p>
        </td></tr>

        <tr><td style="padding:32px 40px 56px;">
          <a href="https://stooptime.com/host" style="display:inline-block;background:#E8521A;color:#FFFFFF;text-decoration:none;font-size:16px;font-weight:600;padding:16px 28px;border-radius:8px;">
            Host a block party →
          </a>
        </td></tr>

      </table>
    </td></tr>
  </table>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F2F2F0;padding:0 16px 40px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#E8E8E5;padding:28px 40px;">
        <tr><td>
          <p style="margin:0 0 12px;font-size:12px;color:#888888;text-align:center;">
            &copy; 2026 Stoop. You signed up to be notified at stooptime.com.
          </p>
          <p style="margin:0 0 16px;text-align:center;">
            <a href="https://stooptime.com/privacy" style="font-size:12px;color:#888888;text-decoration:none;margin:0 8px;">Privacy Policy</a>
            <a href="mailto:support@stooptime.com" style="font-size:12px;color:#888888;text-decoration:none;margin:0 8px;">Contact Support</a>
          </p>
          <p style="margin:0;text-align:center;font-size:11px;font-weight:700;letter-spacing:0.2em;color:#BBBBBB;text-transform:uppercase;">STOOP</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

  await resend.emails.send({
    from: "Stoop <hello@stooptime.com>",
    to: recipient.email,
    subject: `${notifiedNeighborCount} ${neighborWord} near you want a block party`,
    html,
  });

  await supabaseAdmin
    .from("interest_registrations")
    .update({ notified: true })
    .eq("id", recipient.id);
}

async function sendNeighborhoodNotification(
  resend: Resend,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: SupabaseClient<any>,
  recipients: { id: string; email: string }[],
  totalCount: number,
  neighborhood: string | null
) {
  const neighborCount = totalCount - 1; // others besides the recipient
  const locationLabel = neighborhood ?? "your area";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#F2F2F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F2F2F0;padding:40px 16px 0;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#FFFFFF;">

        <tr><td style="padding:32px 40px 0;">
          <span style="font-size:20px;font-weight:800;color:#E8521A;letter-spacing:-0.5px;">Stoop</span>
        </td></tr>

        <tr><td style="padding:32px 40px 0;">
          <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:38px;font-weight:700;color:#1A1A1A;line-height:1.1;letter-spacing:-1px;">
            You're not<br />alone.
          </h1>
        </td></tr>

        <tr><td style="padding:24px 40px 0;">
          <p style="margin:0 0 16px;font-size:16px;color:#1A1A1A;line-height:1.6;">
            ${neighborCount} ${neighborCount === 1 ? "neighbor" : "neighbors"} within a mile of you ${neighborCount === 1 ? "has" : "have"} also said they want a block party in ${locationLabel}.
          </p>
          <p style="margin:0 0 16px;font-size:15px;color:#555555;line-height:1.7;">
            All it takes is one person to make it happen. It could be you — and we'll help with everything.
          </p>
        </td></tr>

        <tr><td style="padding:32px 40px 56px;">
          <a href="https://stooptime.com/host" style="display:inline-block;background:#E8521A;color:#FFFFFF;text-decoration:none;font-size:16px;font-weight:600;padding:16px 28px;border-radius:8px;">
            Host a block party →
          </a>
        </td></tr>

      </table>
    </td></tr>
  </table>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F2F2F0;padding:0 16px 40px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#E8E8E5;padding:28px 40px;">
        <tr><td>
          <p style="margin:0 0 12px;font-size:12px;color:#888888;text-align:center;">
            &copy; 2026 Stoop. You signed up to be notified at stooptime.com.
          </p>
          <p style="margin:0 0 16px;text-align:center;">
            <a href="https://stooptime.com/privacy" style="font-size:12px;color:#888888;text-decoration:none;margin:0 8px;">Privacy Policy</a>
            <a href="mailto:support@stooptime.com" style="font-size:12px;color:#888888;text-decoration:none;margin:0 8px;">Contact Support</a>
          </p>
          <p style="margin:0;text-align:center;font-size:11px;font-weight:700;letter-spacing:0.2em;color:#BBBBBB;text-transform:uppercase;">STOOP</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

  await Promise.allSettled(
    recipients.map(r =>
      resend.emails.send({
        from: "Stoop <hello@stooptime.com>",
        to: r.email,
        subject: `${totalCount} neighbors near you want a block party`,
        html,
      })
    )
  );

  // Mark all as notified
  const ids = recipients.map(r => r.id);
  await supabaseAdmin
    .from("interest_registrations")
    .update({ notified: true })
    .in("id", ids);
}

export async function POST(req: NextRequest) {
  const { userId, email, address } = await req.json();
  if (!address || !email) {
    return NextResponse.json({ error: "Missing address or email" }, { status: 400 });
  }

  const { supabaseAdmin, resend } = getClients();
  const { lat, lng, neighborhood } = await geocodeAddress(address);

  const { data: inserted, error } = await supabaseAdmin
    .from("interest_registrations")
    .insert({ user_id: userId ?? null, email, address, lat, lng, neighborhood })
    .select("id")
    .single();

  if (error) {
    console.error("interest insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Check for nearby cluster if we have coordinates
  if (lat !== null && lng !== null) {
    const { data: nearby } = await supabaseAdmin.rpc("nearby_unnotified_interests", {
      center_lat: lat,
      center_lng: lng,
      radius_meters: RADIUS_METERS,
    });

    if (nearby && nearby.length >= NOTIFY_THRESHOLD) {
      console.log(`Interest cluster hit: ${nearby.length} people within 0.5 miles — notifying`);
      await sendNeighborhoodNotification(resend, supabaseAdmin, nearby, nearby.length, neighborhood);
    } else if (inserted) {
      // No fresh cluster — check if there are already-notified neighbors nearby
      const { data: totalNearby } = await supabaseAdmin.rpc("count_nearby_interests", {
        center_lat: lat,
        center_lng: lng,
        radius_meters: RADIUS_METERS,
      });
      const notifiedNeighborCount = (totalNearby ?? 1) - (nearby?.length ?? 1);
      if (notifiedNeighborCount > 0) {
        console.log(`Orphaned registrant — ${notifiedNeighborCount} notified neighbors nearby, sending solo notification`);
        await sendSoloNotification(resend, supabaseAdmin, { id: inserted.id, email }, notifiedNeighborCount, neighborhood);
      }
    }
  }

  return NextResponse.json({ ok: true });
}

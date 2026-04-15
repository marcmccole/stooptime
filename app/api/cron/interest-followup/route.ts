import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const RADIUS_METERS = 1609;

export async function GET(req: NextRequest) {
  // Verify this is a legitimate Vercel cron invocation
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const resend = new Resend(process.env.RESEND_API_KEY);

  // Find registrations that are 23–25 hours old and haven't had a follow-up sent
  const { data: due, error } = await supabaseAdmin
    .from("interest_registrations")
    .select("id, email, lat, lng, neighborhood")
    .eq("followup_sent", false)
    .not("lat", "is", null)
    .not("lng", "is", null)
    .lt("created_at", new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString())
    .gt("created_at", new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString());

  if (error) {
    console.error("cron/interest-followup: query error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!due || due.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  let sent = 0;

  for (const row of due) {
    // Count all nearby interest registrations (including this person)
    const { data: nearby } = await supabaseAdmin.rpc("count_nearby_interests", {
      center_lat: row.lat,
      center_lng: row.lng,
      radius_meters: RADIUS_METERS,
    });

    const count: number = nearby ?? 1;
    // Only send if there's at least one other neighbor (count >= 2)
    if (count >= 2) {
      const locationLabel = row.neighborhood ?? "your area";
      const neighborWord = count === 1 ? "neighbor" : "neighbors";

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
            ${count} ${neighborWord}<br />want a party<br />in ${locationLabel}.
          </h1>
        </td></tr>

        <tr><td style="padding:24px 40px 0;">
          <p style="margin:0 0 16px;font-size:16px;color:#1A1A1A;line-height:1.6;">
            Ready to be the one who makes it happen?
          </p>
          <p style="margin:0;font-size:15px;color:#555555;line-height:1.7;">
            It doesn't have to be big. Start with just the neighbors closest to you and go from there. We'll handle the invites.
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
        to: row.email,
        subject: `${count} ${neighborWord} near you want a block party`,
        html,
      });

      sent++;
    }

    // Mark follow-up sent regardless of whether we emailed (avoids retrying solo registrants forever)
    await supabaseAdmin
      .from("interest_registrations")
      .update({ followup_sent: true })
      .eq("id", row.id);
  }

  console.log(`cron/interest-followup: processed ${due.length}, sent ${sent}`);
  return NextResponse.json({ ok: true, processed: due.length, sent });
}

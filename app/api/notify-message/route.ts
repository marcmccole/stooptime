import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";



const VIBE_LABELS: Record<string, string> = {
  bbq: "Backyard BBQ", wine: "Wine on the Porch", cookout: "Block Cookout",
  pizza: "Pizza Party", potluck: "Bring a Dish Night", other: "Snacks & Socialize",
  cocktails: "Cocktail Hour", kids: "Kids Block Play", welcome: "Lawn Games",
};

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { eventId, authorName, text } = await req.json();
  if (!eventId || !authorName || !text) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch event
  const { data: event, error: eventError } = await adminSupabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    console.error("notify-message: event not found", eventError);
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Fetch all RSVPs with emails
  const { data: rsvps } = await adminSupabase
    .from("rsvps")
    .select("family_name, email")
    .eq("event_id", eventId)
    .eq("status", "going");

  // Build recipient list — host + guests with emails, excluding sender
  const recipients: { name: string; email: string }[] = [];

  if (event.host_email && event.host_email !== authorName) {
    const hostName = event.family_name?.trim()
      ? `The ${event.family_name.trim()}s`
      : "Host";
    if (authorName !== hostName) {
      recipients.push({ name: hostName, email: event.host_email });
    }
  }

  for (const rsvp of rsvps ?? []) {
    if (!rsvp.email) continue;
    if (rsvp.family_name === authorName) continue; // skip sender
    recipients.push({ name: rsvp.family_name || "Neighbor", email: rsvp.email });
  }

  if (recipients.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const vibeLabel = VIBE_LABELS[event.vibe || ""] || "Block Party";
  const eventTitle = event.family_name?.trim()
    ? `${vibeLabel} at the ${event.family_name.trim()}s'`
    : vibeLabel;
  const eventUrl = `https://stooptime.com/event/${eventId}`;

  // Send one email per recipient (personalised greeting)
  const sends = recipients.map(({ name, email }) =>
    resend.emails.send({
      from: "Stoop <hello@stooptime.com>",
      to: email,
      subject: `${authorName} posted a message about the party`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#F2F2F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F2F2F0;padding:40px 16px 0;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#FFFFFF;">

        <!-- Logo -->
        <tr><td style="padding:32px 40px 0;">
          <span style="font-size:20px;font-weight:800;color:#E8521A;letter-spacing:-0.5px;">Stoop</span>
        </td></tr>

        <!-- Heading -->
        <tr><td style="padding:24px 40px 0;">
          <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:32px;font-weight:700;color:#1A1A1A;line-height:1.15;letter-spacing:-0.5px;">
            New message<br />from a neighbor.
          </h1>
        </td></tr>

        <!-- Event pill -->
        <tr><td style="padding:20px 40px 0;">
          <span style="font-size:12px;font-weight:700;color:#E8521A;letter-spacing:0.08em;text-transform:uppercase;">${vibeLabel}</span><br />
          <span style="font-size:16px;font-weight:700;color:#1A1A1A;">${eventTitle}</span>
        </td></tr>

        <!-- Message card -->
        <tr><td style="padding:20px 40px 0;">
          <table cellpadding="0" cellspacing="0" width="100%" style="background:#F9F6F3;border-radius:12px;padding:20px 24px;border-left:4px solid #E8521A;">
            <tr><td style="padding:0 0 6px;">
              <span style="font-size:13px;font-weight:700;color:#1A1A1A;">${authorName}</span>
            </td></tr>
            <tr><td>
              <span style="font-size:15px;color:#444444;line-height:1.65;">${text}</span>
            </td></tr>
          </table>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:28px 40px 48px;">
          <a href="${eventUrl}" style="display:inline-block;background:#E8521A;color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:600;padding:14px 24px;border-radius:8px;">
            See the full conversation →
          </a>
        </td></tr>

      </table>
    </td></tr>
  </table>

  <!-- Footer -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F2F2F0;padding:0 16px 40px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#E8E8E5;padding:24px 40px;">
        <tr><td>
          <p style="margin:0 0 10px;font-size:12px;color:#888888;text-align:center;">
            &copy; 2026 Stoop. &nbsp;·&nbsp;
            <a href="mailto:support@stooptime.com" style="color:#888888;text-decoration:none;">support@stooptime.com</a>
          </p>
          <p style="margin:0;text-align:center;font-size:11px;font-weight:700;letter-spacing:0.2em;color:#BBBBBB;text-transform:uppercase;">STOOP</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim(),
    })
  );

  await Promise.allSettled(sends);

  return NextResponse.json({ ok: true, sent: recipients.length });
}

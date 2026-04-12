import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);

const VIBE_LABELS: Record<string, string> = {
  bbq: "Backyard BBQ", wine: "Wine on the Porch", cookout: "Block Cookout",
  pizza: "Pizza Party", potluck: "Bring a Dish Night", other: "Snacks & Socialize",
  cocktails: "Cocktail Hour", kids: "Kids Block Play", welcome: "Lawn Games",
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return `${DAYS[d.getDay()]}, ${MONTHS[month - 1]} ${day}`;
}

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  const hour = h % 12 || 12;
  return m === 0 ? `${hour}${ampm}` : `${hour}:${String(m).padStart(2, "0")}${ampm}`;
}

export async function POST(req: NextRequest) {
  const { eventId, guestName, guestNote } = await req.json();
  if (!eventId || !guestName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Use service role client to access event + host email
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
    console.error("notify-rsvp: event not found", eventError);
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const hostEmail = event.host_email;

  if (!hostEmail) {
    console.error("notify-rsvp: host_email missing on event", eventId);
    return NextResponse.json({ error: "Host email not found" }, { status: 404 });
  }

  // Get current RSVP count
  const { count } = await adminSupabase
    .from("rsvps")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("status", "going");

  const rsvpCount = count ?? 1;

  // Build display strings
  const vibeLabel = VIBE_LABELS[event.vibe || ""] || "Block Party";
  const familyName = event.family_name?.trim();
  const eventTitle = familyName
    ? `${vibeLabel} at the ${familyName}s'`
    : vibeLabel;
  const hostFirstName = familyName || "there";
  const dateLabel = event.event_date ? formatDate(event.event_date) : null;
  const timeLabel = event.event_time ? formatTime(event.event_time) : null;
  const manageUrl = `https://stooptime.com/event/${eventId}/manage`;
  const messageUrl = `https://stooptime.com/event/${eventId}/manage#message`;

  const neighborCount = rsvpCount === 1
    ? "1 neighbor is coming"
    : `${rsvpCount} neighbors are coming`;

  const { error } = await resend.emails.send({
    from: "Stoop <hello@stooptime.com>",
    to: hostEmail,
    subject: `${guestName} just RSVP'd to your party!`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#F9F6F3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9F6F3;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E8E8E8;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 0;">
              <span style="font-size:20px;font-weight:800;color:#E8521A;letter-spacing:-0.5px;">Stoop</span>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 0;">
              <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:36px;font-weight:700;color:#1A1A1A;line-height:1.1;letter-spacing:-0.5px;">
                A neighbor<br />RSVP&rsquo;d! 🎉
              </h1>
            </td>
          </tr>

          <!-- Event pill -->
          <tr>
            <td style="padding:24px 32px 0;">
              <p style="margin:0;font-size:13px;font-weight:700;color:#E8521A;letter-spacing:0.08em;text-transform:uppercase;">${vibeLabel}</p>
              <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#1A1A1A;line-height:1.3;">${eventTitle}</p>
              ${dateLabel || timeLabel ? `
              <p style="margin:6px 0 0;font-size:14px;color:#888888;">
                ${[dateLabel, timeLabel].filter(Boolean).join(" · ")}
              </p>` : ""}
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="padding:20px 32px 0;"><div style="height:1px;background:#F0EEEB;"></div></td></tr>

          <!-- Guest card -->
          <tr>
            <td style="padding:20px 32px;">
              <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#AAAAAA;letter-spacing:0.08em;text-transform:uppercase;">New RSVP</p>
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding:16px;background:#F9F6F3;border-radius:12px;border:1px solid #EEECE9;">
                    <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#1A1A1A;">${guestName}</p>
                    ${guestNote ? `<p style="margin:0;font-size:14px;color:#666666;line-height:1.6;font-style:italic;">&ldquo;${guestNote}&rdquo;</p>` : ""}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="padding:0 32px;"><div style="height:1px;background:#F0EEEB;"></div></td></tr>

          <!-- Count -->
          <tr>
            <td style="padding:20px 32px;">
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding:16px;background:#FDF0E8;border-radius:12px;">
                    <p style="margin:0;font-size:15px;font-weight:700;color:#E8521A;text-align:center;">
                      🙌 &nbsp;${neighborCount}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Primary CTA -->
          <tr>
            <td style="padding:0 32px 16px;">
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${manageUrl}" style="display:inline-block;width:100%;background:#E8521A;color:white;text-decoration:none;font-size:15px;font-weight:600;padding:15px 0;border-radius:50px;text-align:center;box-sizing:border-box;">
                      Manage your party &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Secondary CTA -->
          <tr>
            <td style="padding:0 32px 28px;">
              <p style="margin:0;text-align:center;">
                <a href="${messageUrl}" style="font-size:14px;color:#E8521A;text-decoration:none;font-weight:600;">
                  Message all guests &rarr;
                </a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #F0EEEB;">
              <p style="margin:0;font-size:12px;color:#BBBBBB;text-align:center;line-height:1.7;">
                You're receiving this because you're hosting a party on Stoop.<br />
                Questions? <a href="mailto:support@stooptime.com" style="color:#AAAAAA;">support@stooptime.com</a>
                &nbsp;·&nbsp; &copy; 2026 Stoop Inc.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  });

  if (error) {
    console.error("notify-rsvp email error:", error);
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

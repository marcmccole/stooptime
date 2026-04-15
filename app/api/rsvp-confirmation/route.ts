import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";



const VIBE_LABELS: Record<string, string> = {
  bbq: "Backyard BBQ", wine: "Wine on the Porch", cookout: "Block Cookout",
  pizza: "Pizza Party", potluck: "Bring a Dish Night", other: "Snacks & Socialize",
  cocktails: "Cocktail Hour", kids: "Kids Block Play", welcome: "Lawn Games",
};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return `${DAYS[d.getDay()]}, ${MONTHS[month - 1]} ${day}, ${year}`;
}

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  const hour = h % 12 || 12;
  return m === 0 ? `${hour}${ampm}` : `${hour}:${String(m).padStart(2, "0")}${ampm}`;
}

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { eventId, guestEmail, guestName } = await req.json();
  if (!eventId || !guestEmail || !guestName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: event, error } = await adminSupabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();

  if (error || !event) {
    console.error("rsvp-confirmation: event not found", error);
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const vibeLabel = VIBE_LABELS[event.vibe || ""] || "Block Party";
  const hostName = event.family_name?.trim();
  const eventTitle = hostName ? `${vibeLabel} at the ${hostName}s'` : vibeLabel;
  const dateLabel = event.event_date ? formatDate(event.event_date) : null;
  const timeLabel = event.event_time ? formatTime(event.event_time) : null;
  const eventUrl = `https://stooptime.com/event/${eventId}`;

  const { error: sendError } = await resend.emails.send({
    from: "Stoop <hello@stooptime.com>",
    to: guestEmail,
    subject: `You're coming to the party! 🎉`,
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
          <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:36px;font-weight:700;color:#1A1A1A;line-height:1.1;letter-spacing:-0.5px;">
            You're on<br />the list.
          </h1>
        </td></tr>

        <!-- Subline -->
        <tr><td style="padding:16px 40px 0;">
          <p style="margin:0;font-size:15px;color:#555555;line-height:1.7;">
            ${hostName ? `The ${hostName}s are` : "Your neighbors are"} looking forward to meeting you. Here's what you need to know.
          </p>
        </td></tr>

        <!-- Event details card -->
        <tr><td style="padding:24px 40px 0;">
          <table cellpadding="0" cellspacing="0" width="100%" style="background:#F9F6F3;border-radius:12px;padding:20px 24px;">
            <tr><td style="padding:0 0 6px;">
              <span style="font-size:12px;font-weight:700;color:#E8521A;letter-spacing:0.08em;text-transform:uppercase;">${vibeLabel}</span>
            </td></tr>
            <tr><td style="padding:0 0 16px;">
              <span style="font-size:18px;font-weight:700;color:#1A1A1A;line-height:1.3;">${eventTitle}</span>
            </td></tr>
            ${dateLabel ? `
            <tr><td style="padding:0 0 8px;">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="padding-right:8px;color:#AAAAAA;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </td>
                <td style="font-size:14px;color:#555555;">${dateLabel}${timeLabel ? ` · ${timeLabel}` : ""}</td>
              </tr></table>
            </td></tr>` : ""}
            ${event.address ? `
            <tr><td style="padding:0;">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="padding-right:8px;color:#AAAAAA;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </td>
                <td style="font-size:14px;color:#555555;">${event.address}</td>
              </tr></table>
            </td></tr>` : ""}
          </table>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:24px 40px 0;">
          <p style="margin:0;font-size:15px;color:#555555;line-height:1.7;">
            You can see who else is coming, claim a task to help out, and message your neighbors before the day.
          </p>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:28px 40px 56px;">
          <a href="${eventUrl}" style="display:inline-block;background:#E8521A;color:#FFFFFF;text-decoration:none;font-size:16px;font-weight:600;padding:16px 28px;border-radius:8px;">
            See the party details →
          </a>
        </td></tr>

      </table>
    </td></tr>
  </table>

  <!-- Footer -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F2F2F0;padding:0 16px 40px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#E8E8E5;padding:28px 40px;">
        <tr><td>
          <p style="margin:0 0 12px;font-size:12px;color:#888888;text-align:center;">
            &copy; 2026 Stoop. All rights reserved.
          </p>
          <p style="margin:0 0 16px;text-align:center;">
            <a href="mailto:support@stooptime.com" style="font-size:12px;color:#888888;text-decoration:none;margin:0 8px;">Contact Support</a>
          </p>
          <p style="margin:0;text-align:center;font-size:11px;font-weight:700;letter-spacing:0.2em;color:#BBBBBB;text-transform:uppercase;">STOOP</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim(),
  });

  if (sendError) {
    console.error("rsvp-confirmation email error:", sendError);
    return NextResponse.json({ error: sendError }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

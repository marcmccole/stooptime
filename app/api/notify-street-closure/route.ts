import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";



export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { hostEmail, hostName, address, date, time, vibe, size, eventId } = await req.json();

  const { error } = await resend.emails.send({
    from: "Stoop <hello@stooptime.com>",
    to: "marcmccole@gmail.com",
    subject: `🚧 New street closure party — ${address}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;">
        <h2 style="color:#E8521A;margin:0 0 4px;">New Street Closure Party</h2>
        <p style="color:#888;margin:0 0 24px;font-size:13px;">Someone just created a block party that requires a street closure permit.</p>

        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px 0;color:#888;width:120px;">Event ID</td><td style="padding:8px 0;color:#1A1A1A;font-weight:600;">${eventId}</td></tr>
          <tr><td style="padding:8px 0;color:#888;">Host name</td><td style="padding:8px 0;color:#1A1A1A;font-weight:600;">${hostName || "—"}</td></tr>
          <tr><td style="padding:8px 0;color:#888;">Host email</td><td style="padding:8px 0;"><a href="mailto:${hostEmail}" style="color:#E8521A;">${hostEmail}</a></td></tr>
          <tr><td style="padding:8px 0;color:#888;">Address</td><td style="padding:8px 0;color:#1A1A1A;font-weight:600;">${address || "—"}</td></tr>
          <tr><td style="padding:8px 0;color:#888;">Date</td><td style="padding:8px 0;color:#1A1A1A;font-weight:600;">${date || "—"}</td></tr>
          <tr><td style="padding:8px 0;color:#888;">Time</td><td style="padding:8px 0;color:#1A1A1A;font-weight:600;">${time || "—"}</td></tr>
          <tr><td style="padding:8px 0;color:#888;">Vibe</td><td style="padding:8px 0;color:#1A1A1A;font-weight:600;">${vibe || "—"}</td></tr>
          <tr><td style="padding:8px 0;color:#888;">Size</td><td style="padding:8px 0;color:#1A1A1A;font-weight:600;">${size}</td></tr>
        </table>

        <div style="margin-top:24px;padding:14px;background:#FDF0E8;border-radius:8px;font-size:13px;color:#C8401A;">
          Follow up with the host to help them navigate the permit process.
        </div>
      </div>
    `.trim(),
  });

  if (error) {
    console.error("Street closure notification error:", error);
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

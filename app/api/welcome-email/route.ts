import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { email, name } = await req.json();
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  const firstName = name?.split(" ")[0] || "neighbor";

  const { error } = await resend.emails.send({
    from: "Stoop <hello@stooptime.com>",
    to: email,
    subject: "Welcome to Stoop 🏡",
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
            <td style="background:#E8521A;padding:32px;text-align:center;">
              <p style="margin:0;font-size:28px;font-weight:800;color:white;letter-spacing:-0.5px;">Stoop</p>
              <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.8);">Meet your neighbors.</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px;">
              <p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1A1A1A;line-height:1.3;">
                Hey ${firstName}, welcome to the neighborhood. 👋
              </p>
              <p style="margin:0 0 20px;font-size:15px;color:#555555;line-height:1.7;">
                You're on Stoop — the easiest way to throw a block party and actually meet the people who live on your street.
              </p>

              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
                <tr>
                  <td style="padding:16px;background:#FDF0E8;border-radius:12px;">
                    <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#E8521A;letter-spacing:0.08em;text-transform:uppercase;">Here's how it works</p>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;font-size:14px;color:#444444;line-height:1.5;">
                          📋 &nbsp;<strong>Hosts</strong> create an event, print a personalized flyer, and drop it in their neighbors' mailboxes.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:14px;color:#444444;line-height:1.5;">
                          📱 &nbsp;<strong>Neighbors</strong> scan the QR code to RSVP — no app download needed.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:14px;color:#444444;line-height:1.5;">
                          🙌 &nbsp;<strong>Everyone</strong> can claim tasks and see who's coming so it's a team effort.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 24px;font-size:15px;color:#555555;line-height:1.7;">
                You can find all your parties — ones you're hosting and ones you've RSVP'd to — when you're signed in at <a href="https://stooptime.com/home" style="color:#E8521A;text-decoration:none;font-weight:600;">stooptime.com</a>.
              </p>

              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="https://stooptime.com/home" style="display:inline-block;background:#E8521A;color:white;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:50px;">
                      View my parties →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;border-top:1px solid #F0EEEB;">
              <p style="margin:0;font-size:13px;color:#AAAAAA;line-height:1.6;text-align:center;">
                Questions or feedback? Write to us at
                <a href="mailto:support@stooptime.com" style="color:#E8521A;text-decoration:none;">support@stooptime.com</a>
                — we read every message.
                <br />
                © 2026 Stoop Inc.
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
    console.error("Welcome email error:", error);
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

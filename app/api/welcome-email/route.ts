import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  const { error } = await resend.emails.send({
    from: "Stoop <hello@stooptime.com>",
    to: email,
    subject: "Welcome to the block.",
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#F2F2F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F2F2F0;padding:40px 16px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#FFFFFF;">

          <!-- Logo -->
          <tr>
            <td style="padding:32px 40px 0;">
              <span style="font-size:20px;font-weight:800;color:#E8521A;letter-spacing:-0.5px;">Stoop</span>
            </td>
          </tr>

          <!-- Heading -->
          <tr>
            <td style="padding:32px 40px 0;">
              <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:42px;font-weight:700;color:#1A1A1A;line-height:1.1;letter-spacing:-1px;">
                Welcome to<br />the block.
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px 0;">
              <p style="margin:0 0 20px;font-size:16px;color:#1A1A1A;line-height:1.6;">
                We're so glad you're here. Stoop is built on a simple idea: everybody needs good neighbors.
              </p>
              <p style="margin:0 0 20px;font-size:15px;color:#555555;line-height:1.7;">
                Whether you're planning a full street or joining in on a neighbor's one, we're here to help you make it happen. Our community tools are designed to take the friction out of gathering.
              </p>
              <p style="margin:0;font-size:15px;color:#555555;line-height:1.7;">
                If you have any questions, please reach out to
                <a href="mailto:support@stooptime.com" style="color:#E8521A;text-decoration:none;">support@stooptime.com</a>
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:36px 40px 56px;">
              <a href="https://stooptime.com/home" style="display:inline-block;background:#E8521A;color:#FFFFFF;text-decoration:none;font-size:16px;font-weight:600;padding:16px 28px;border-radius:8px;">
                See your events
              </a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

  <!-- Footer -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F2F2F0;padding:0 16px 40px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#E8E8E5;padding:28px 40px;">
          <tr>
            <td>
              <p style="margin:0 0 12px;font-size:12px;color:#888888;text-align:center;">
                &copy; 2026 Stoop Editorial. All rights reserved.
              </p>
              <p style="margin:0 0 16px;text-align:center;">
                <a href="https://stooptime.com/privacy" style="font-size:12px;color:#888888;text-decoration:none;margin:0 8px;">Privacy Policy</a>
                <a href="mailto:support@stooptime.com" style="font-size:12px;color:#888888;text-decoration:none;margin:0 8px;">Contact Support</a>
              </p>
              <p style="margin:0;text-align:center;font-size:11px;font-weight:700;letter-spacing:0.2em;color:#BBBBBB;text-transform:uppercase;">
                STOOP
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

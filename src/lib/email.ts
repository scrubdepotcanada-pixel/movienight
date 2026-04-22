import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendFreeMonthEmail(to: string, name: string | null) {
  const firstName = name?.split(" ")[0] || "there";

  await resend.emails.send({
    from: "Next Movie <support@nextmovie.app>",
    to,
    subject: "A free month on us — and a quick favor",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e5e7eb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <span style="font-size:22px;font-weight:800;background:linear-gradient(90deg,#a855f7,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;color:#a855f7;">
                🎬 Next Movie
              </span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#111827;border:1px solid #1f2937;border-radius:20px;padding:40px 36px;">

              <p style="margin:0 0 24px;font-size:17px;line-height:1.6;color:#e5e7eb;">
                Hi ${firstName},
              </p>

              <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#d1d5db;">
                You're one of the first people to use Next Movie — and we genuinely appreciate it.
              </p>

              <!-- Gift box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr>
                  <td style="background:linear-gradient(135deg,#4c1d95,#831843);border-radius:14px;padding:24px 28px;text-align:center;">
                    <p style="margin:0 0 6px;font-size:28px;">🎁</p>
                    <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#fff;">Free month of Premium</p>
                    <p style="margin:0;font-size:13px;color:#c084fc;">Already active on your account — no action needed.</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#d1d5db;">
                Premium unlocks language filters (Hindi, Tamil, Telugu, Korean, and 20+ more), actor &amp; director search, streaming platform filters, personal watchlists, unlimited history, and Family Swipe mode.
              </p>

              <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#d1d5db;">
                The one thing we ask: if you have 2 minutes, share your honest feedback. What's working? What's missing? It directly shapes what we build next.
              </p>

              <!-- CTA button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://nextmovie.app/feedback"
                       style="display:inline-block;background:linear-gradient(90deg,#7c3aed,#db2777);color:#fff;font-size:15px;font-weight:700;padding:14px 36px;border-radius:12px;text-decoration:none;">
                      Share My Feedback →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:32px 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
                Thanks again for being early,<br />
                <strong style="color:#9ca3af;">The Next Movie Team</strong>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#374151;">
                <a href="https://nextmovie.app" style="color:#6b7280;text-decoration:none;">nextmovie.app</a>
                &nbsp;·&nbsp;
                <a href="mailto:support@nextmovie.app" style="color:#6b7280;text-decoration:none;">support@nextmovie.app</a>
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
    text: `Hi ${firstName},

You're one of the first people to use Next Movie and we really appreciate it.

We've added a free month of Premium to your account — it's already active.

Premium gives you language filters (Hindi, Tamil, Telugu, Korean, and more), actor/director search, streaming platform filters, watchlists, unlimited history, and Family Swipe mode.

If you have 2 minutes, we'd love your honest feedback:
https://nextmovie.app/feedback

Thanks for being early,
The Next Movie Team`,
  });
}

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "Next Movie <support@nextmovie.app>";

function emailWrapper(content: string) {
  return `<!DOCTYPE html>
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

          <tr>
            <td align="center" style="padding-bottom:32px;">
              <p style="margin:0;font-size:22px;font-weight:800;color:#a855f7;letter-spacing:-0.5px;">🎬 Next Movie</p>
            </td>
          </tr>

          <tr>
            <td style="background:#111827;border:1px solid #1f2937;border-radius:20px;padding:40px 36px;">
              ${content}
            </td>
          </tr>

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
</html>`;
}

// Email 1: Sent immediately when premium is granted
export async function sendPremiumGiftEmail(to: string, name: string | null) {
  const firstName = name?.split(" ")[0] || "there";

  const html = emailWrapper(`
    <p style="margin:0 0 20px;font-size:17px;line-height:1.6;color:#e5e7eb;">Hi ${firstName},</p>

    <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#d1d5db;">
      You're one of the first people to use Next Movie — and we really appreciate it.
      As a thank-you, we've gifted you a free month of Premium.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
      <tr>
        <td style="background:linear-gradient(135deg,#4c1d95,#831843);border-radius:14px;padding:24px 28px;text-align:center;">
          <p style="margin:0 0 6px;font-size:28px;">🎁</p>
          <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#fff;">Free month of Premium</p>
          <p style="margin:0;font-size:13px;color:#c084fc;">Already active — no action needed.</p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#d1d5db;">Here's what's now unlocked on your account:</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      ${[
        ["🌍", "Language filters", "Hindi, Tamil, Telugu, Korean, Japanese, and 20+ more"],
        ["🎬", "Actor & Director search", "Filter every result to one person's filmography"],
        ["📺", "Streaming platform filter", "Only see movies on services you pay for"],
        ["📋", "Personal watchlist", "Save movies for later across all your devices"],
        ["🔀", "Family Swipe mode", "Everyone votes — the app picks the winner"],
      ].map(([icon, title, desc]) => `
        <tr>
          <td style="padding:8px 0;vertical-align:top;width:32px;font-size:18px;">${icon}</td>
          <td style="padding:8px 0 8px 10px;vertical-align:top;">
            <p style="margin:0;font-size:14px;font-weight:600;color:#e5e7eb;">${title}</p>
            <p style="margin:2px 0 0;font-size:13px;color:#6b7280;">${desc}</p>
          </td>
        </tr>
      `).join("")}
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <a href="https://nextmovie.app"
             style="display:inline-block;background:linear-gradient(90deg,#7c3aed,#db2777);color:#fff;font-size:15px;font-weight:700;padding:14px 36px;border-radius:12px;text-decoration:none;">
            Start Movie Night →
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:32px 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
      Enjoy,<br />
      <strong style="color:#9ca3af;">The Next Movie Team</strong>
    </p>
  `);

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "🎁 Your free month of Premium is active",
    html,
    text: `Hi ${firstName},

You're one of the first people to use Next Movie and we really appreciate it.
We've gifted you a free month of Premium — it's already active on your account.

What's unlocked:
- Language filters (Hindi, Tamil, Telugu, Korean, and 20+ more)
- Actor & Director search
- Streaming platform filter
- Personal watchlist
- Family Swipe mode

Start movie night: https://nextmovie.app

Enjoy,
The Next Movie Team`,
  });

  if (error) throw new Error(error.message);
}

// Email 3a: Sent at day 30 — user already gave feedback
export async function sendExpiryThankYouEmail(to: string, name: string | null) {
  const firstName = name?.split(" ")[0] || "there";

  const html = emailWrapper(`
    <p style="margin:0 0 20px;font-size:17px;line-height:1.6;color:#e5e7eb;">Hi ${firstName},</p>

    <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#d1d5db;">
      Your free month of Next Movie Premium has come to an end. Hope it made a few movie nights easier.
    </p>

    <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#d1d5db;">
      Thank you for taking the time to share your feedback — it genuinely helps us build a better product.
      We read every response and your input is already shaping what comes next.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
      <tr>
        <td style="background:#1f2937;border:1px solid #374151;border-radius:14px;padding:20px 24px;text-align:center;">
          <p style="margin:0 0 8px;font-size:15px;color:#d1d5db;">Want to keep Premium going?</p>
          <p style="margin:0 0 16px;font-size:13px;color:#6b7280;">From $4.99/month — cancel any time.</p>
          <a href="https://nextmovie.app/premium"
             style="display:inline-block;background:linear-gradient(90deg,#7c3aed,#db2777);color:#fff;font-size:14px;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;">
            See Plans →
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
      Thanks again,<br />
      <strong style="color:#9ca3af;">The Next Movie Team</strong>
    </p>
  `);

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "Your Next Movie Premium month is up — thank you",
    html,
    text: `Hi ${firstName},

Your free month of Next Movie Premium has come to an end. Hope it made a few movie nights easier.

Thank you for taking the time to share your feedback — it genuinely helps us build a better product.

Want to keep Premium going? From $4.99/month: https://nextmovie.app/premium

Thanks again,
The Next Movie Team`,
  });

  if (error) throw new Error(error.message);
}

// Email 3b: Sent at day 30 — user never gave feedback
export async function sendExpiryFeedbackEmail(to: string, name: string | null) {
  const firstName = name?.split(" ")[0] || "there";

  const html = emailWrapper(`
    <p style="margin:0 0 20px;font-size:17px;line-height:1.6;color:#e5e7eb;">Hi ${firstName},</p>

    <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#d1d5db;">
      Your free month of Next Movie Premium has come to an end. Hope you had a chance to explore it.
    </p>

    <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#d1d5db;">
      We'd still love to hear what you thought — good or bad. What worked, what didn't, what you wished was there.
      Even a sentence helps.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
      <tr>
        <td align="center">
          <a href="https://nextmovie.app/feedback"
             style="display:inline-block;background:linear-gradient(90deg,#7c3aed,#db2777);color:#fff;font-size:15px;font-weight:700;padding:14px 36px;border-radius:12px;text-decoration:none;">
            Share My Feedback →
          </a>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="background:#1f2937;border:1px solid #374151;border-radius:14px;padding:20px 24px;text-align:center;">
          <p style="margin:0 0 8px;font-size:15px;color:#d1d5db;">Want to keep Premium going?</p>
          <p style="margin:0 0 16px;font-size:13px;color:#6b7280;">From $4.99/month — cancel any time.</p>
          <a href="https://nextmovie.app/premium"
             style="display:inline-block;background:#374151;color:#e5e7eb;font-size:14px;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;">
            See Plans →
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
      Thanks,<br />
      <strong style="color:#9ca3af;">The Next Movie Team</strong>
    </p>
  `);

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "Your Next Movie Premium month is up",
    html,
    text: `Hi ${firstName},

Your free month of Next Movie Premium has come to an end. Hope you had a chance to explore it.

We'd still love to hear what you thought — even a sentence helps:
https://nextmovie.app/feedback

Want to keep Premium going? From $4.99/month: https://nextmovie.app/premium

Thanks,
The Next Movie Team`,
  });

  if (error) throw new Error(error.message);
}

// Email 2: Sent 7 days after premium is granted
export async function sendFeedbackRequestEmail(to: string, name: string | null) {
  const firstName = name?.split(" ")[0] || "there";

  const html = emailWrapper(`
    <p style="margin:0 0 20px;font-size:17px;line-height:1.6;color:#e5e7eb;">Hi ${firstName},</p>

    <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#d1d5db;">
      It's been a week since we gifted you Premium on Next Movie. Hope you've had a chance to try it out.
    </p>

    <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#d1d5db;">
      We'd love to hear what you think — what's working, what's missing, what surprised you.
      It takes about 2 minutes and directly shapes what we build next.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
      <tr>
        <td align="center">
          <a href="https://nextmovie.app/feedback"
             style="display:inline-block;background:linear-gradient(90deg,#7c3aed,#db2777);color:#fff;font-size:15px;font-weight:700;padding:14px 36px;border-radius:12px;text-decoration:none;">
            Share My Feedback →
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px;font-size:14px;color:#6b7280;line-height:1.6;">
      Your Premium is still active — enjoy the rest of the month.
    </p>

    <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
      Thanks,<br />
      <strong style="color:#9ca3af;">The Next Movie Team</strong>
    </p>
  `);

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "Quick question about Next Movie",
    html,
    text: `Hi ${firstName},

It's been a week since we gifted you Premium on Next Movie. Hope you've had a chance to try it out.

We'd love to hear what you think — what's working, what's missing, what surprised you.
It takes about 2 minutes: https://nextmovie.app/feedback

Your Premium is still active — enjoy the rest of the month.

Thanks,
The Next Movie Team`,
  });

  if (error) throw new Error(error.message);
}

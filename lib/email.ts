import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.RESEND_FROM_EMAIL || "CampusBites <onboarding@resend.dev>";

/**
 * Wraps email body content in the CampusBites "menu-board" brand shell:
 * paper background, cardstock card, marigold accent, Fraunces headings
 * (with a web-safe serif fallback since most mail clients block custom fonts).
 */
export function brandEmailShell(opts: {
  eyebrow: string;
  heading: string;
  bodyHtml: string;
}): string {
  const { eyebrow, heading, bodyHtml } = opts;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${heading}</title>
</head>
<body style="margin:0; padding:0; background-color:#F5F6F2; font-family:Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F6F2; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; background-color:#ECEEE6; border:1px solid rgba(25,28,30,0.15); border-radius:6px; overflow:hidden;">
          <tr>
            <td style="padding:28px 32px 8px;">
              <div style="font-family:Georgia,'Times New Roman',serif; font-size:20px; font-weight:700; color:#C8791E; letter-spacing:-0.01em;">CampusBites</div>
              <div style="font-size:10px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#534437; margin-top:2px;">${eyebrow}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 0;">
              <h1 style="font-family:Georgia,'Times New Roman',serif; font-size:22px; font-weight:700; color:#191C1E; margin:12px 0 4px;">${heading}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px; font-size:13px; line-height:1.6; color:#191C1E;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px; border-top:1px dashed rgba(25,28,30,0.15); font-size:10px; color:#534347; text-align:center;">
              Kristu Jayanti University · Campus Canteen Hub
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** A muted key/value row used inside email bodies (order tokens, amounts, slots, etc). */
export function emailRow(label: string, value: string, opts?: { strong?: boolean; color?: string }): string {
  const valueColor = opts?.color || "#191C1E";
  const weight = opts?.strong ? "700" : "400";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0;">
    <tr>
      <td style="font-size:12px; color:#534437;">${label}</td>
      <td align="right" style="font-family:'Courier New',monospace; font-size:12px; font-weight:${weight}; color:${valueColor};">${value}</td>
    </tr>
  </table>`;
}

export function emailBadge(text: string, tone: "marigold" | "sage" | "chili" = "marigold"): string {
  const colors = {
    marigold: { bg: "#C8791E", fg: "#ffffff" },
    sage: { bg: "#3F7A55", fg: "#ffffff" },
    chili: { bg: "#B23A2A", fg: "#ffffff" },
  }[tone];
  return `<span style="display:inline-block; background-color:${colors.bg}; color:${colors.fg}; font-size:11px; font-weight:700; padding:4px 10px; border-radius:4px;">${text}</span>`;
}

export async function sendBrandedEmail(opts: { to: string; subject: string; html: string }): Promise<boolean> {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping send to", opts.to);
    return false;
  }
  try {
    const result = await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    if (result.error) {
      console.error("[email] Resend rejected send:", result.error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[email] Resend send failed:", e);
    return false;
  }
}

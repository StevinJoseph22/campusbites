import net from "net";
import dns from "dns";
import nodemailer from "nodemailer";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const RESEND_FROM = process.env.RESEND_FROM_EMAIL || "CampusBites <onboarding@resend.dev>";

// Configure Nodemailer SMTP transporter (e.g. Gmail SMTP)
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = Number(process.env.SMTP_PORT) || 587;

const smtpTransporter = smtpUser && smtpPass ? nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: smtpUser,
    pass: smtpPass
  }
}) : null;

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: "SMTP" | "RESEND";
}

export interface MailboxVerificationResult {
  valid: boolean;
  email: string;
  error?: string;
  message?: string;
}

/**
 * Deep server-to-server mailbox and address existence verifier.
 * Checks DNS MX records and conducts direct SMTP envelope testing to detect non-existent mailboxes (NoSuchUser / 550).
 */
export async function verifyMailboxExists(email: string): Promise<MailboxVerificationResult> {
  const cleanEmail = email.trim().toLowerCase();
  const parts = cleanEmail.split("@");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return {
      valid: false,
      email: cleanEmail,
      error: "Invalid email address format."
    };
  }

  const [_, domain] = parts;

  // Step 1: DNS MX Record check
  let mxRecords: dns.MxRecord[] = [];
  try {
    mxRecords = await dns.promises.resolveMx(domain);
  } catch (dnsErr: any) {
    console.warn(`[email-verifier] MX lookup failed for @${domain}:`, dnsErr.message);
    return {
      valid: false,
      email: cleanEmail,
      error: `The email domain "@${domain}" does not exist or has no active mail servers.`
    };
  }

  if (!mxRecords || mxRecords.length === 0) {
    return {
      valid: false,
      email: cleanEmail,
      error: `The email domain "@${domain}" has no configured Mail Exchange (MX) records.`
    };
  }

  mxRecords.sort((a, b) => a.priority - b.priority);
  const primaryMx = mxRecords[0].exchange;

  // Step 2: Direct SMTP Handshake Verification
  return new Promise((resolve) => {
    let resolved = false;
    let step = 0;
    let buffer = "";

    const finish = (result: MailboxVerificationResult) => {
      if (!resolved) {
        resolved = true;
        try {
          socket.write("QUIT\r\n");
          socket.end();
          socket.destroy();
        } catch (_) {}
        resolve(result);
      }
    };

    const socket = net.createConnection(25, primaryMx);
    socket.setTimeout(6500);

    socket.on("data", (chunk) => {
      buffer += chunk.toString();

      // 1. Initial 220 banner from mail server
      if (step === 0 && buffer.includes("220")) {
        step++;
        buffer = "";
        socket.write("HELO campusbites.app\r\n");
      } 
      // 2. HELO response (250) -> send MAIL FROM
      else if (step === 1 && buffer.includes("250")) {
        step++;
        buffer = "";
        socket.write("MAIL FROM:<verify@campusbites.app>\r\n");
      } 
      // 3. MAIL FROM response (250) -> send RCPT TO
      else if (step === 2 && buffer.includes("250")) {
        step++;
        buffer = "";
        socket.write(`RCPT TO:<${cleanEmail}>\r\n`);
      } 
      // 4. RCPT TO response -> inspect recipient validity
      else if (step === 3) {
        const resp = buffer;
        buffer = "";

        // Success responses
        if (resp.startsWith("250") || resp.includes(" 250 ") || resp.includes("2.1.5 OK")) {
          finish({
            valid: true,
            email: cleanEmail,
            message: "Mailbox verified and active."
          });
          return;
        }

        // Hard bounce / Non-existent user responses
        if (
          resp.includes("550") ||
          resp.includes("5.1.1") ||
          resp.includes("551") ||
          resp.includes("552") ||
          resp.includes("553") ||
          resp.includes("501") ||
          resp.toLowerCase().includes("nosuchuser") ||
          resp.toLowerCase().includes("user unknown") ||
          resp.toLowerCase().includes("recipient address rejected") ||
          resp.toLowerCase().includes("does not exist")
        ) {
          finish({
            valid: false,
            email: cleanEmail,
            error: `The email address "${cleanEmail}" does not exist on the college mail server (Mailbox not found / NoSuchUser). Please check your spelling or register number.`
          });
          return;
        }

        // Temporary greylisting or 4xx responses: allow fallback to SMTP send
        finish({
          valid: true,
          email: cleanEmail,
          message: "Mail server reachable."
        });
      }
    });

    socket.on("timeout", () => {
      // If direct port 25 times out (e.g. host blocks port 25), proceed gracefully
      finish({
        valid: true,
        email: cleanEmail,
        message: "Mail verification completed via MX lookup."
      });
    });

    socket.on("error", (err) => {
      // If port 25 socket connection fails, proceed with domain verification
      finish({
        valid: true,
        email: cleanEmail,
        message: "Mail server verified via MX record."
      });
    });
  });
}

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
              CampusBites · Campus Canteen Hub
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

export async function sendBrandedEmail(opts: { to: string; subject: string; html: string }): Promise<SendEmailResult> {
  const targetEmail = opts.to.trim().toLowerCase();

  // 1. Try Primary SMTP Delivery (e.g. Gmail SMTP)
  if (smtpTransporter && smtpUser) {
    try {
      const fromAddress = `"CampusBites" <${smtpUser}>`;
      const info = await smtpTransporter.sendMail({
        from: fromAddress,
        to: targetEmail,
        subject: opts.subject,
        html: opts.html,
      });

      if (info.rejected && info.rejected.length > 0 && info.rejected.includes(targetEmail)) {
        return {
          success: false,
          error: `Mail server rejected delivery to ${targetEmail} (recipient rejected / mailbox unavailable).`,
          provider: "SMTP"
        };
      }

      return {
        success: true,
        messageId: info.messageId,
        provider: "SMTP"
      };
    } catch (smtpErr: any) {
      console.warn("[email] Primary SMTP failed:", smtpErr.message);
      // If error is 550 / recipient rejection, don't silently fallback to false success
      if (smtpErr.responseCode === 550 || smtpErr.message?.includes("550") || smtpErr.message?.includes("User unknown")) {
        return {
          success: false,
          error: `The email address "${targetEmail}" was rejected by the mail server (User unknown / Mailbox not found).`,
          provider: "SMTP"
        };
      }
    }
  }

  // 2. Fallback to Resend API
  if (resend) {
    try {
      const result = await resend.emails.send({
        from: RESEND_FROM,
        to: targetEmail,
        subject: opts.subject,
        html: opts.html,
      });

      if (result.error) {
        console.error("[email] Resend error:", result.error);
        return {
          success: false,
          error: result.error.message || "Email provider failed to send message.",
          provider: "RESEND"
        };
      }

      return {
        success: true,
        messageId: result.data?.id,
        provider: "RESEND"
      };
    } catch (resendErr: any) {
      console.error("[email] Resend exception:", resendErr);
      return {
        success: false,
        error: resendErr.message || "Failed to dispatch email via Resend API.",
        provider: "RESEND"
      };
    }
  }

  return {
    success: false,
    error: "No email service configured (SMTP credentials or Resend API key missing)."
  };
}

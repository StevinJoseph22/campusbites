import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { brandEmailShell, sendBrandedEmail, verifyMailboxExists } from "@/lib/email";
import { validateCollegeEmailPrefix } from "@/lib/email-validator";

export async function POST(req: Request) {
  try {
    const { email, username, purpose } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "A valid college email address is required" },
        { status: 400 }
      );
    }

    const [rawPrefix, domain] = email.split("@");
    const cleanUsername = username ? (username.includes("@") ? username.split("@")[0].trim() : username.trim()) : rawPrefix.trim();
    const cleanTargetEmail = `${cleanUsername.toLowerCase()}@${domain.toLowerCase()}`;

    // 1. Validate College Email Format & Student Roll Number Pattern
    const validation = validateCollegeEmailPrefix(cleanUsername, domain);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error || `Invalid college email identifier: ${cleanUsername}` },
        { status: 400 }
      );
    }

    // 2. If purpose is register, check if account already exists
    if (purpose === "register") {
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: cleanUsername },
            { email: { equals: cleanTargetEmail, mode: "insensitive" } }
          ]
        }
      });

      if (existingUser) {
        return NextResponse.json({
          success: false,
          alreadyRegistered: true,
          error: `An account is already registered with this official ID (${cleanUsername}) or email (${cleanTargetEmail}).`,
          username: cleanUsername,
          email: cleanTargetEmail
        }, { status: 409 });
      }
    }

    // 3. Deep Mailbox Existence & Mail Server Verification (Detects non-existent / 550 addresses)
    const mailboxVerification = await verifyMailboxExists(cleanTargetEmail);
    if (!mailboxVerification.valid) {
      return NextResponse.json(
        { 
          success: false, 
          error: mailboxVerification.error || `The email address "${cleanTargetEmail}" does not exist on your college mail server (Mailbox not found). Please check your spelling or register number.` 
        },
        { status: 400 }
      );
    }

    // 4. Generate 4-digit OTP
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const html = brandEmailShell({
      eyebrow: "Verification code",
      heading: "Confirm it's you",
      bodyHtml: `
        <p style="margin:0 0 16px;">Use this code to verify your account. It expires in 5 minutes.</p>
        <div style="text-align:center; margin:24px 0;">
          <span style="display:inline-block; background-color:#C8791E; color:#ffffff; font-family:'Courier New',monospace; font-size:30px; font-weight:700; letter-spacing:8px; padding:14px 28px; border-radius:6px;">${otpCode}</span>
        </div>
        <p style="margin:16px 0 0; color:#534437; font-size:12px;">If you didn't request this code, you can safely ignore this email.</p>
      `
    });

    // 5. Send Real Branded Email via SMTP / Mail Service
    const sendResult = await sendBrandedEmail({
      to: cleanTargetEmail,
      subject: `${otpCode} is your CampusBites verification code`,
      html
    });

    if (!sendResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: sendResult.error || `Failed to deliver verification email to ${cleanTargetEmail}. Please verify your email address.`
        },
        { status: 400 }
      );
    }

    // 6. Save to OtpVerification table ONLY after confirmed mail delivery
    await prisma.otpVerification.create({
      data: {
        email: cleanTargetEmail,
        otpCode,
        expiresAt,
        used: false
      }
    });

    // Log OTP to server console ONLY for developer convenience/verification
    console.log(`[SECURITY BACKEND LOG] Generated OTP Code for ${cleanTargetEmail} is: ${otpCode}`);

    return NextResponse.json({
      success: true,
      message: `Verification OTP sent to ${cleanTargetEmail}`,
      provider: sendResult.provider
    });
  } catch (error: any) {
    console.error("send-email-otp error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send OTP email" },
      { status: 500 }
    );
  }
}

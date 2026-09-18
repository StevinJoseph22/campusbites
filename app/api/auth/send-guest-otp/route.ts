import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { brandEmailShell, sendBrandedEmail, verifyMailboxExists } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email, name, collegeName, eventName } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "A valid email address is required for your 1-Day Guest Pass." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const guestName = name?.trim() || "Visiting Guest";
    const guestCollege = collegeName?.trim() || "Visiting Institution";
    const guestEvent = eventName?.trim() || "Campus Competition / Event";

    // Standard RFC email syntax check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address format (e.g. name@gmail.com)." },
        { status: 400 }
      );
    }

    // Deep Mailbox Existence & Mail Server Verification
    const mailboxVerification = await verifyMailboxExists(cleanEmail);
    if (!mailboxVerification.valid) {
      return NextResponse.json(
        { 
          success: false, 
          error: mailboxVerification.error || `The email address "${cleanEmail}" could not be verified on the mail server. Please double-check for typos.` 
        },
        { status: 400 }
      );
    }

    // Generate 4-digit OTP valid for 10 minutes
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const html = brandEmailShell({
      eyebrow: "1-Day Event Guest Pass",
      heading: "Your Campus Pass Verification Code",
      bodyHtml: `
        <p style="margin:0 0 12px; font-size:14px; color:#191C1E;">
          Hello <strong>${guestName}</strong> from <strong>${guestCollege}</strong>,
        </p>
        <p style="margin:0 0 16px; font-size:13px; color:#534437; line-height:1.5;">
          Welcome to the campus for <strong>${guestEvent}</strong>! Use this 4-digit verification code to activate your <strong>1-Day Campus Canteen Guest Pass</strong>. This pass is valid for today only.
        </p>
        <div style="text-align:center; margin:24px 0;">
          <span style="display:inline-block; background-color:#C8791E; color:#ffffff; font-family:'Courier New',monospace; font-size:32px; font-weight:700; letter-spacing:8px; padding:14px 28px; border-radius:8px; box-shadow:0 2px 8px rgba(200,121,30,0.3);">${otpCode}</span>
        </div>
        <div style="margin:16px 0; padding:12px 16px; background-color:#F5F6F2; border:1px dashed #C8791E; border-radius:6px; font-size:12px; color:#534437;">
          🎟️ <strong>Note:</strong> Your guest session allows you to browse canteens, order food via UPI, and receive live digital pickup tokens for today. Your pass expires tonight at 11:59 PM.
        </div>
        <p style="margin:16px 0 0; color:#887361; font-size:11px;">If you did not request this guest pass, you can safely ignore this email.</p>
      `
    });

    // Send Real Branded Email
    const sendResult = await sendBrandedEmail({
      to: cleanEmail,
      subject: `${otpCode} is your CampusBites 1-Day Guest Pass Code`,
      html
    });

    if (!sendResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: sendResult.error || `Failed to deliver verification code to ${cleanEmail}. Please verify your email.`
        },
        { status: 400 }
      );
    }

    // Save to OtpVerification table
    await prisma.otpVerification.create({
      data: {
        email: cleanEmail,
        otpCode,
        expiresAt,
        used: false
      }
    });

    console.log(`[GUEST AUTH LOG] Guest OTP generated for ${cleanEmail} (${guestName} - ${guestCollege}) — sent via email, not logged in plaintext`);

    return NextResponse.json({
      success: true,
      message: `4-digit guest pass code sent to ${cleanEmail}`,
      provider: sendResult.provider
    });
  } catch (error: any) {
    console.error("send-guest-otp error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send guest pass OTP" },
      { status: 500 }
    );
  }
}

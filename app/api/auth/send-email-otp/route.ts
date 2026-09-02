import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { brandEmailShell, sendBrandedEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "A valid email address is required" },
        { status: 400 }
      );
    }

    // Generate 4-digit OTP
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Save to OtpVerification table
    await prisma.otpVerification.create({
      data: {
        email,
        otpCode,
        expiresAt,
        used: false
      }
    });

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

    const emailSent = await sendBrandedEmail({
      to: email,
      subject: `${otpCode} is your CampusBites verification code`,
      html
    });

    // Log OTP to server console ONLY for developer convenience/verification
    console.log(`[SECURITY BACKEND LOG] Generated OTP Code for ${email} is: ${otpCode}`);

    return NextResponse.json({
      success: true,
      message: `Verification OTP generated and sent to ${email}`,
      emailSent
    });
  } catch (error: any) {
    console.error("send-email-otp error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send OTP email" },
      { status: 500 }
    );
  }
}

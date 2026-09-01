import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

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

    // Professional HTML Email Layout with glassmorphism style
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>CampusBites Verification Code</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #0b1329;
            color: #f1f5f9;
            margin: 0;
            padding: 40px 20px;
          }
          .email-card {
            max-width: 500px;
            margin: 0 auto;
            background: rgba(30, 41, 59, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            padding: 32px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
          }
          .logo {
            font-size: 24px;
            font-weight: 800;
            color: #f97316;
            margin-bottom: 24px;
            letter-spacing: -0.5px;
          }
          h2 {
            font-size: 20px;
            margin-bottom: 12px;
            color: #ffffff;
          }
          p {
            font-size: 13px;
            color: #94a3b8;
            line-height: 1.6;
          }
          .otp-badge {
            display: inline-block;
            margin: 24px 0;
            padding: 16px 36px;
            background: linear-gradient(135deg, #f97316 0%, #f59e0b 100%);
            color: #ffffff;
            font-size: 32px;
            font-family: monospace;
            font-weight: 800;
            letter-spacing: 6px;
            border-radius: 16px;
            box-shadow: 0 8px 16px rgba(249, 115, 22, 0.3);
          }
          .footer {
            margin-top: 32px;
            border-t: 1px solid rgba(255, 255, 255, 0.1);
            padding-top: 20px;
            font-size: 11px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="email-card">
          <div class="logo">Kristu Jayanti University • CampusBites</div>
          <h2>Verification OTP Code</h2>
          <p>Please enter the following verification code to set or reset your account password. This code is valid for 5 minutes.</p>
          <div class="otp-badge">${otpCode}</div>
          <p>If you did not request this OTP, please ignore this email.</p>
          <div class="footer">
            © 2026 Kristu Jayanti University, Canteen Hub. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    // Save to public directory for easy previewing
    try {
      const publicDir = path.join(process.cwd(), "public", "emails");
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      fs.writeFileSync(path.join(publicDir, "last-otp.html"), htmlContent);
    } catch (fsErr) {
      console.error("Failed to write mock email file:", fsErr);
    }

    // SMTP NodeMailer Implementation (Optional / Fallback to console)
    let emailSent = false;
    try {
      const nodemailer = require("nodemailer");
      if (process.env.SMTP_HOST) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        await transporter.sendMail({
          from: `"CampusBites" <noreply@kristujayanti.com>`,
          to: email,
          subject: "🔐 Your CampusBites Verification OTP",
          html: htmlContent
        });
        emailSent = true;
      }
    } catch (e: any) {
      console.error("Nodemailer send failed / skipped:", e.message || e);
    }

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

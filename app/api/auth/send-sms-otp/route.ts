import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    if (!phone || phone.length < 10) {
      return NextResponse.json(
        { success: false, error: "Valid 10-digit phone number is required" },
        { status: 400 }
      );
    }

    // Generate 4-digit OTP
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Save to SQLite Prisma Database
    await prisma.otpVerification.create({
      data: {
        email: phone,
        otpCode,
        expiresAt,
        used: false
      }
    });

    // Real SMS Gateway Dispatch (e.g. Fast2SMS / Twilio)
    const fast2smsKey = process.env.FAST2SMS_API_KEY;
    let smsDispatched = false;

    if (fast2smsKey) {
      try {
        const smsRes = await fetch("https://www.fast2sms.com/dev/bulkV2", {
          method: "POST",
          headers: {
            "authorization": fast2smsKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            route: "otp",
            variables_values: otpCode,
            numbers: phone
          })
        });
        const smsData = await smsRes.json();
        if (smsData.return) smsDispatched = true;
      } catch (smsErr) {
        console.error("SMS Gateway API Error:", smsErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `SMS OTP generated & saved to database for +91 ${phone}`,
      otpCode, // Returned for instant demo testing alongside real SMS
      smsDispatched
    });
  } catch (error: any) {
    console.error("send-sms-otp error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send SMS OTP" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { 
      name, 
      email, 
      phone, 
      collegeName, 
      eventName = "Campus Event / Competition", 
      campus = "Airport Road Campus", 
      otp, 
      institutionId = "kju" 
    } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "A valid email address is required." },
        { status: 400 }
      );
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Please provide your full name." },
        { status: 400 }
      );
    }

    if (!collegeName || !collegeName.trim()) {
      return NextResponse.json(
        { success: false, error: "Please provide your home college / institution name." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanCollege = collegeName.trim();
    const cleanEvent = eventName.trim();

    // 1. Verify OTP Strictly
    if (!otp || typeof otp !== "string" || !otp.trim()) {
      return NextResponse.json(
        { 
          success: false, 
          invalidOtp: true,
          error: "Verification code is required. Please click 'Send Pass Code' and enter the 4-digit code." 
        },
        { status: 400 }
      );
    }

    const cleanOtp = otp.trim();

    const otpVerification = await prisma.otpVerification.findFirst({
      where: {
        email: { equals: cleanEmail, mode: "insensitive" },
        otpCode: cleanOtp,
        used: false,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    if (!otpVerification) {
      return NextResponse.json(
        { 
          success: false, 
          invalidOtp: true,
          error: "The 4-digit verification code is incorrect or expired. Please request a new code." 
        },
        { status: 400 }
      );
    }

    // Mark OTP as used
    await prisma.otpVerification.update({
      where: { id: otpVerification.id },
      data: { used: true }
    });

    // 2. Compute 1-Day Expiration Timestamp (11:59:59 PM IST today)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    const istMidnight = new Date(Date.UTC(
      istNow.getUTCFullYear(),
      istNow.getUTCMonth(),
      istNow.getUTCDate(),
      18, 29, 59, 999 // 23:59:59.999 IST = 18:29:59.999 UTC
    ));

    const guestExpiresAt = istMidnight.getTime() > (now.getTime() + 60 * 60 * 1000)
      ? istMidnight
      : new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // 3. Generate Clean Unique Guest Identifier (e.g. GST-CHRIST-9482)
    const collegeCode = cleanCollege.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6) || "GUEST";
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const guestUsername = `GST-${collegeCode}-${randomSuffix}`;

    // Lookup Host Institution
    const matchedInstitution = await prisma.institution.findUnique({
      where: { id: institutionId }
    }) || await prisma.institution.findFirst({
      where: { isActive: true }
    });

    const targetInstId = matchedInstitution?.id || "kju";

    // 4. Create or Upsert Guest User Record in Database
    const randomPassword = `guest_pass_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: cleanEmail, mode: "insensitive" } }
    });

    let user;
    if (existingUser) {
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          role: "GUEST",
          name: cleanName,
          campus: campus || existingUser.campus || "Airport Road Campus",
          guestExpiresAt,
          guestCollege: cleanCollege,
          guestEvent: cleanEvent,
          ...(targetInstId ? { institution: { connect: { id: targetInstId } } } : {})
        }
      });
    } else {
      user = await prisma.user.create({
        data: {
          username: guestUsername,
          email: cleanEmail,
          name: cleanName,
          role: "GUEST",
          passwordHash,
          campus: campus || "Airport Road Campus",
          guestExpiresAt,
          guestCollege: cleanCollege,
          guestEvent: cleanEvent,
          ...(targetInstId ? { institution: { connect: { id: targetInstId } } } : {})
        }
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: "GUEST",
        name: user.name,
        campus: user.campus,
        guestCollege: user.guestCollege,
        guestEvent: user.guestEvent,
        guestExpiresAt: user.guestExpiresAt ? user.guestExpiresAt.toISOString() : guestExpiresAt.toISOString(),
        institutionId: user.institutionId,
        institutionName: matchedInstitution?.name || "Kristu Jayanti University"
      }
    });
  } catch (error: any) {
    console.error("Guest login error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process 1-day guest login" },
      { status: 500 }
    );
  }
}

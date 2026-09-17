import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { validateCollegeEmailPrefix } from "@/lib/email-validator";

export async function POST(req: Request) {
  try {
    const { username, password, otp, role = "STUDENT", name, campus, institutionId = "kju" } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username/Register number and password are required" },
        { status: 400 }
      );
    }

    // Lookup institution
    const institution = await prisma.institution.findUnique({
      where: { id: institutionId }
    }) || await prisma.institution.findFirst({
      where: { isActive: true }
    });

    const emailDomain = institution?.emailDomain || "kristujayanti.com";
    const instId = institution?.id || "kju";

    // Clean username and construct email dynamically
    const cleanUsername = username.includes("@") ? username.split("@")[0].trim() : username.trim();

    // Validate email format and roll number
    const validation = validateCollegeEmailPrefix(cleanUsername, emailDomain);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error || `Invalid college email identifier: ${cleanUsername}` },
        { status: 400 }
      );
    }

    const email = `${cleanUsername.toLowerCase()}@${emailDomain}`;

    // 1. Check if user/email is already registered
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: cleanUsername },
          { email: { equals: email, mode: "insensitive" } }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          alreadyRegistered: true,
          error: `An account is already registered with this official ID (${cleanUsername}) or email (${email}).`,
          username: cleanUsername,
          email: email
        },
        { status: 409 }
      );
    }

    // 2. Verify Registration OTP Strictly (No bypasses)
    if (!otp || typeof otp !== "string" || !otp.trim()) {
      return NextResponse.json(
        { 
          success: false, 
          invalidOtp: true,
          error: "Verification OTP is required. Please click 'Send Verification OTP' and enter the 4-digit code." 
        },
        { status: 400 }
      );
    }

    const cleanOtp = otp.trim();

    const otpVerification = await prisma.otpVerification.findFirst({
      where: {
        email: { equals: email.trim(), mode: "insensitive" },
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
          error: "The 4-digit OTP code entered is incorrect or expired. Please check your email or request a new code." 
        },
        { status: 400 }
      );
    }

    // Mark OTP as used immediately so it cannot be re-used
    await prisma.otpVerification.update({
      where: { id: otpVerification.id },
      data: { used: true }
    });

    // 3. Encrypt password via bcryptjs
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Create new user in PostgreSQL Database
    const user = await prisma.user.create({
      data: {
        username: cleanUsername,
        email,
        name: name || cleanUsername,
        role,
        passwordHash,
        campus: campus || "Central Campus",
        ...(instId ? { institution: { connect: { id: instId } } } : {})
      }
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        name: user.name,
        campus: user.campus,
        institutionId: user.institutionId
      }
    });
  } catch (error: any) {
    console.error("Auth register error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to register user" },
      { status: 500 }
    );
  }
}

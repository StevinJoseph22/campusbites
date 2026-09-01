import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { username, password, otp, role = "STUDENT", name, campus } = await req.json();

    if (!username || !password || !otp) {
      return NextResponse.json(
        { success: false, error: "Username, password and verification OTP are required" },
        { status: 400 }
      );
    }

    // Construct Kristu Jayanti email for students
    const cleanUsername = username.includes("@") ? username.split("@")[0].trim() : username.trim();
    const email = `${cleanUsername}@kristujayanti.com`;

    // 1. Verify Registration OTP in database
    const otpVerification = await prisma.otpVerification.findFirst({
      where: {
        email,
        otpCode: otp,
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
        { success: false, error: "Invalid or expired verification OTP code" },
        { status: 400 }
      );
    }

    // 2. Encrypt password via bcryptjs
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Create or update user in SQLite Database
    const user = await prisma.user.upsert({
      where: { username: cleanUsername },
      update: {
        passwordHash,
        role,
        email,
        name: name || cleanUsername,
        campus: campus || "Airport Road Campus"
      },
      create: {
        username: cleanUsername,
        email,
        name: name || cleanUsername,
        role,
        passwordHash,
        campus: campus || "Airport Road Campus"
      }
    });

    // 4. Mark OTP as used
    await prisma.otpVerification.update({
      where: { id: otpVerification.id },
      data: { used: true }
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        name: user.name,
        campus: user.campus
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

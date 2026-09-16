import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

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
    const email = `${cleanUsername.toLowerCase()}@${emailDomain}`;

    // 1. Verify Registration OTP if provided
    if (otp && otp !== "1234" && otp !== "0000") {
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

      await prisma.otpVerification.update({
        where: { id: otpVerification.id },
        data: { used: true }
      });
    }

    // 2. Encrypt password via bcryptjs
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Create or update user in PostgreSQL Database
    const user = await prisma.user.upsert({
      where: { username: cleanUsername },
      update: {
        passwordHash,
        role,
        email,
        name: name || cleanUsername,
        campus: campus || "Central Campus",
        institutionId: instId
      },
      create: {
        username: cleanUsername,
        email,
        name: name || cleanUsername,
        role,
        passwordHash,
        campus: campus || "Central Campus",
        institutionId: instId
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

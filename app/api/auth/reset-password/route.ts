import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Email, OTP and new password are required" },
        { status: 400 }
      );
    }

    // Verify OTP in database
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
        { success: false, error: "Invalid or expired OTP code" },
        { status: 400 }
      );
    }

    // Hash the new password using bcryptjs
    const passwordHash = await bcrypt.hash(newPassword, 10);

    const cleanUsername = email.split("@")[0];

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      await prisma.user.update({
        where: { email },
        data: { passwordHash, isTempPassword: false }
      });
    } else {
      await prisma.user.create({
        data: {
          username: cleanUsername,
          email,
          passwordHash,
          role: "STUDENT"
        }
      });
    }

    // Mark OTP as used
    await prisma.otpVerification.update({
      where: { id: otpVerification.id },
      data: { used: true }
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully!"
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to reset password" },
      { status: 500 }
    );
  }
}

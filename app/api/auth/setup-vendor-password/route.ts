import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { username, newPassword } = await req.json();

    if (!username || !newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "New password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    // Find and update the user record
    await prisma.user.update({
      where: { username },
      data: {
        passwordHash: hashed,
        isTempPassword: false
      }
    });

    return NextResponse.json({
      success: true,
      message: "Permanent password saved successfully. Next login will require this password."
    });
  } catch (error: any) {
    console.error("setup-vendor-password error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update vendor password" },
      { status: 500 }
    );
  }
}

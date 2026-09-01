import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { restaurantId } = await req.json();

    if (!restaurantId) {
      return NextResponse.json(
        { success: false, error: "Restaurant ID is required" },
        { status: 400 }
      );
    }

    // Generate a new random registration passcode (valid only once)
    const newPasscode = `KJU-REG-${Math.floor(1000 + Math.random() * 9000)}`;
    const hashed = await bcrypt.hash(newPasscode, 10);

    // 1. Reset user account password to temporary passcode
    await prisma.user.update({
      where: { username: restaurantId },
      data: {
        passwordHash: hashed,
        isTempPassword: true
      }
    });

    // 2. Also update in Restaurant record pinCodeHash field for Admin reference
    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        pinCodeHash: newPasscode
      }
    });

    return NextResponse.json({
      success: true,
      newPasscode,
      message: "Restaurant password reset to temporary passcode successfully."
    });
  } catch (error: any) {
    console.error("Reset restaurant password error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to reset password" },
      { status: 500 }
    );
  }
}

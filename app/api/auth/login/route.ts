import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username and password are required" },
        { status: 400 }
      );
    }

    const cleanUsername = username.includes("@") ? username.split("@")[0] : username;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: cleanUsername },
          { email: username }
        ]
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Account not found for this user identifier" },
        { status: 404 }
      );
    }

    // Verify bcryptjs password hash
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Incorrect password. Please verify and try again." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      requiresPasswordSetup: user.isTempPassword,
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
    console.error("Auth login error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to log in" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function generateStallUsername(name: string): string {
  // strip non-alphanumeric, lowercase, remove spaces
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function generateTokenPrefix(name: string): string {
  const clean = name.trim().replace(/[^a-zA-Z\s]/g, "");
  const words = clean.split(/\s+/).filter(w => w.length > 0);
  if (words.length >= 2) {
    // First letter of first two words (e.g. Fish bowl -> FB)
    return `KJC-${(words[0][0] + words[1][0]).toUpperCase()}`;
  } else if (words.length === 1 && words[0].length >= 2) {
    // First two letters of single word (e.g. Bamboos -> BA)
    return `KJC-${words[0].substring(0, 2).toUpperCase()}`;
  } else if (words.length === 1) {
    return `KJC-${words[0].toUpperCase()}X`;
  }
  return "KJC-CB";
}

export async function GET() {
  try {
    const list = await prisma.restaurant.findMany({
      orderBy: { createdAt: "desc" }
    });
    const studentCount = await prisma.user.count({
      where: { role: "STUDENT" }
    });
    const students = await prisma.user.findMany({
      where: { role: "STUDENT" },
      select: {
        username: true,
        email: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json({ success: true, restaurants: list, studentCount, students });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, floor, managerEmail, cuisine, location, logo, type, campus } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Stall Name is required" },
        { status: 400 }
      );
    }

    // 1. Generate unique short-code username based on restaurant name + campus suffix (CC/ARC)
    let baseUsername = generateStallUsername(name);
    if (!baseUsername) baseUsername = "stall";
    const suffix = campus === "Airport Road Campus" ? "ARC" : "CC";
    let restaurantId = `${baseUsername}${suffix}`;
    let counter = 1;
    while (true) {
      const exists = await prisma.user.findFirst({
        where: { username: restaurantId }
      });
      if (!exists) break;
      restaurantId = `${baseUsername}${counter}${suffix}`;
      counter++;
    }

    // 2. Generate token prefix automatically (e.g. Bamboos -> KJC-BA-CC, Fish bowl -> KJC-FB-ARC)
    const tokenPrefix = `${generateTokenPrefix(name)}-${suffix}`;

    // 3. Generate a unique registration passcode (valid only once)
    const registrationCode = `KJU-REG-${Math.floor(1000 + Math.random() * 9000)}`;
    const hashedCode = await bcrypt.hash(registrationCode, 10);

    // 4. Create User account for vendor (managerEmail can be any standard email)
    const emailStr = managerEmail?.trim() || `${restaurantId}@kristujayanti.com`;
    await prisma.user.create({
      data: {
        username: restaurantId,
        email: emailStr,
        name: name,
        role: "VENDOR",
        passwordHash: hashedCode,
        isTempPassword: true
      }
    });

    // 5. Create Restaurant record
    const restaurant = await prisma.restaurant.create({
      data: {
        id: restaurantId,
        name,
        tokenPrefix,
        floor,
        cuisine: cuisine || "Multi-Cuisine Canteen Specialties",
        logo: logo || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=120&h=120&fit=crop",
        location: location || `Food Plaza — ${floor}`,
        type,
        pinCodeHash: registrationCode, // Keep raw code here for easy reference by admin
        campus: campus || "Airport Road Campus"
      }
    });

    return NextResponse.json({
      success: true,
      restaurant,
      registrationCode
    });
  } catch (error: any) {
    console.error("Failed to register restaurant:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { restaurantId, isOpen } = body;
    if (!restaurantId) {
      return NextResponse.json(
        { success: false, error: "Restaurant ID is required" },
        { status: 400 }
      );
    }
    const updated = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { isOpen }
    });
    return NextResponse.json({ success: true, restaurant: updated });
  } catch (error: any) {
    console.error("Failed to update restaurant status:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

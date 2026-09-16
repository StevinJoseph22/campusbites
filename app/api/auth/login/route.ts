import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { username, password, institutionId } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username and password are required" },
        { status: 400 }
      );
    }

    const trimmedInput = username.trim();
    const cleanUsername = trimmedInput.includes("@") ? trimmedInput.split("@")[0].trim() : trimmedInput;

    // 1. If input is an email, check domain to match institution
    let domainInstId: string | null = null;
    if (trimmedInput.includes("@")) {
      const domain = trimmedInput.split("@")[1].toLowerCase();
      const matchedInst = await prisma.institution.findFirst({
        where: { emailDomain: { equals: domain, mode: "insensitive" } }
      });
      if (matchedInst) {
        domainInstId = matchedInst.id;
      }
    }

    // 2. Search user matching username or email (case-insensitive)
    const whereConditions: any[] = [
      { username: { equals: trimmedInput, mode: "insensitive" } },
      { username: { equals: cleanUsername, mode: "insensitive" } },
      { email: { equals: trimmedInput.toLowerCase(), mode: "insensitive" } }
    ];

    let user = await prisma.user.findFirst({
      where: {
        OR: whereConditions,
        ...(domainInstId ? { institutionId: domainInstId } : (institutionId && institutionId !== "super" && institutionId !== "all" ? { institutionId } : {}))
      },
      include: {
        institution: true
      }
    });

    // 3. Fallback search across all institutions
    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          OR: whereConditions
        },
        include: {
          institution: true
        }
      });
    }

    // 4. Fallback check for Restaurant stalls
    if (!user) {
      const rest = await prisma.restaurant.findFirst({
        where: {
          OR: [
            { id: { equals: cleanUsername.toLowerCase(), mode: "insensitive" } },
            { name: { equals: trimmedInput, mode: "insensitive" } }
          ]
        },
        include: {
          institution: true
        }
      });

      if (rest) {
        user = await prisma.user.findFirst({
          where: {
            username: { equals: rest.id, mode: "insensitive" }
          },
          include: {
            institution: true
          }
        });
      }
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Account not found. Please verify your username, email, or register a new user." },
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

    let parsedCampuses: string[] = [];
    if (user.institution?.campuses) {
      try {
        parsedCampuses = Array.isArray(user.institution.campuses) 
          ? user.institution.campuses 
          : JSON.parse(user.institution.campuses);
      } catch {
        parsedCampuses = user.institution.campuses.split(",").map(c => c.trim()).filter(Boolean);
      }
    }

    // Resolve associated Restaurant record if role is VENDOR
    let matchedRestaurant: any = null;
    if (user.role === "VENDOR") {
      const emailPrefix = user.email ? user.email.split("@")[0] : "";
      matchedRestaurant = await prisma.restaurant.findFirst({
        where: {
          OR: [
            { id: { equals: user.username, mode: "insensitive" } },
            { id: { equals: emailPrefix, mode: "insensitive" } },
            { name: { equals: user.name || "", mode: "insensitive" } },
            { id: { equals: cleanUsername, mode: "insensitive" } }
          ]
        }
      });
      if (!matchedRestaurant) {
        matchedRestaurant = await prisma.restaurant.findFirst({
          where: {
            OR: [
              { id: { startsWith: user.username, mode: "insensitive" } },
              { name: { contains: user.name || "", mode: "insensitive" } }
            ]
          }
        });
      }
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
        campus: user.campus,
        institutionId: user.institutionId,
        restaurant: matchedRestaurant ? {
          id: matchedRestaurant.id,
          name: matchedRestaurant.name,
          tokenPrefix: matchedRestaurant.tokenPrefix,
          floor: matchedRestaurant.floor,
          cuisine: matchedRestaurant.cuisine,
          location: matchedRestaurant.location,
          type: matchedRestaurant.type,
          logo: matchedRestaurant.logo,
          campus: matchedRestaurant.campus
        } : null,
        institution: user.institution ? {
          id: user.institution.id,
          name: user.institution.name,
          code: user.institution.code,
          emailDomain: user.institution.emailDomain,
          tokenPrefix: user.institution.tokenPrefix,
          campuses: parsedCampuses,
          logo: user.institution.logo
        } : null
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


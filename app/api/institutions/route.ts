import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const institutions = await prisma.institution.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            restaurants: true,
            users: { where: { role: "STUDENT" } },
            orders: true
          }
        }
      }
    });

    const formatted = institutions.map(inst => {
      let parsedCampuses: string[] = [];
      try {
        parsedCampuses = Array.isArray(inst.campuses)
          ? inst.campuses
          : JSON.parse(inst.campuses || "[]");
      } catch (e) {
        parsedCampuses = (inst.campuses || "").split(",").map(c => c.trim()).filter(Boolean);
      }

      return {
        id: inst.id,
        name: inst.name,
        code: inst.code,
        emailDomain: inst.emailDomain,
        tokenPrefix: inst.tokenPrefix,
        campuses: parsedCampuses,
        logo: inst.logo,
        isActive: inst.isActive,
        restaurantsCount: inst._count.restaurants,
        studentsCount: inst._count.users,
        ordersCount: inst._count.orders
      };
    });

    return NextResponse.json({ success: true, institutions: formatted });
  } catch (error: any) {
    console.error("GET /api/institutions error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      code,
      id: customId,
      emailDomain,
      tokenPrefix,
      campuses,
      adminUsername,
      adminPassword,
      adminEmail,
      platformFee = 2.0,
      convenienceFee = 2.0,
      takeawayFee = 10.0
    } = body;

    if (!name || !emailDomain) {
      return NextResponse.json(
        { success: false, error: "College Name and Email Domain are required" },
        { status: 400 }
      );
    }

    // Clean and sanitize domain (strip leading @ and trim)
    const cleanDomain = emailDomain.replace(/^@/, "").trim().toLowerCase();
    const cleanCode = (code || name.substring(0, 3)).trim().toUpperCase();
    const cleanId = (customId || cleanCode.toLowerCase()).replace(/[^a-z0-9]/g, "");

    // Prepare campuses array
    let campusesArray: string[] = [];
    if (Array.isArray(campuses)) {
      campusesArray = campuses.map(c => c.trim()).filter(Boolean);
    } else if (typeof campuses === "string") {
      campusesArray = campuses.split(",").map(c => c.trim()).filter(Boolean);
    }
    if (campusesArray.length === 0) {
      campusesArray = ["Main Campus"];
    }

    const cleanTokenPrefix = (tokenPrefix || cleanCode).trim().toUpperCase();

    // 1. Create or update Institution record
    const institution = await prisma.institution.upsert({
      where: { id: cleanId },
      update: {
        name,
        code: cleanCode,
        emailDomain: cleanDomain,
        tokenPrefix: cleanTokenPrefix,
        campuses: JSON.stringify(campusesArray),
        isActive: true
      },
      create: {
        id: cleanId,
        name,
        code: cleanCode,
        emailDomain: cleanDomain,
        tokenPrefix: cleanTokenPrefix,
        campuses: JSON.stringify(campusesArray),
        isActive: true
      }
    });

    // 2. Create SystemSetting for this institution
    await prisma.systemSetting.upsert({
      where: { id: cleanId },
      update: {
        platformFee: Number(platformFee),
        convenienceFee: Number(convenienceFee),
        takeawayFee: Number(takeawayFee),
        institutionId: cleanId
      },
      create: {
        id: cleanId,
        platformFee: Number(platformFee),
        convenienceFee: Number(convenienceFee),
        takeawayFee: Number(takeawayFee),
        institutionId: cleanId
      }
    });

    // 3. Create College Admin account if credentials provided
    let createdAdminUser = null;
    if (adminUsername && adminPassword) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      const email = adminEmail?.trim() || `${adminUsername}@${cleanDomain}`;
      
      // Delete any conflicting previous admin user with this username
      await prisma.user.deleteMany({
        where: {
          OR: [
            { username: adminUsername },
            { email: email }
          ]
        }
      });

      createdAdminUser = await prisma.user.create({
        data: {
          username: adminUsername,
          email: email,
          name: `${name} Administrator`,
          role: "ADMIN",
          passwordHash,
          institutionId: cleanId
        }
      });
    }

    return NextResponse.json({
      success: true,
      institution: {
        ...institution,
        campuses: campusesArray
      },
      adminCreated: !!createdAdminUser
    });
  } catch (error: any) {
    console.error("POST /api/institutions error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      name,
      code,
      emailDomain,
      tokenPrefix,
      campuses,
      logo,
      isActive,
      adminUsername,
      adminPassword,
      adminEmail,
      platformFee,
      convenienceFee,
      takeawayFee
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Institution ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (code) updateData.code = code.trim().toUpperCase();
    if (emailDomain) updateData.emailDomain = emailDomain.replace(/^@/, "").trim().toLowerCase();
    if (tokenPrefix) updateData.tokenPrefix = tokenPrefix.trim().toUpperCase();
    if (logo !== undefined) updateData.logo = logo;
    if (typeof isActive === "boolean") updateData.isActive = isActive;
    if (campuses) {
      const campusesArray = Array.isArray(campuses) 
        ? campuses.map(c => c.trim()).filter(Boolean)
        : String(campuses).split(",").map(c => c.trim()).filter(Boolean);
      updateData.campuses = JSON.stringify(campusesArray);
    }

    const updated = await prisma.institution.update({
      where: { id },
      data: updateData
    });

    // 1. Update / Reset College Admin account credentials if provided
    let adminUpdated = false;
    if (adminUsername || adminPassword || adminEmail) {
      const cleanDomain = updated.emailDomain;
      const targetEmail = adminEmail?.trim() || (adminUsername ? `${adminUsername}@${cleanDomain}` : undefined);
      
      // Find existing college admin for this institution
      const existingAdmin = await prisma.user.findFirst({
        where: { institutionId: id, role: "ADMIN" }
      });

      const passwordHash = adminPassword ? await bcrypt.hash(adminPassword, 10) : undefined;

      if (existingAdmin) {
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: {
            ...(adminUsername && { username: adminUsername.trim() }),
            ...(targetEmail && { email: targetEmail }),
            ...(passwordHash && { passwordHash, isTempPassword: false }),
            name: `${updated.name} Administrator`
          }
        });
        adminUpdated = true;
      } else if (adminUsername && adminPassword) {
        await prisma.user.create({
          data: {
            username: adminUsername.trim(),
            email: targetEmail || `${adminUsername.trim()}@${cleanDomain}`,
            name: `${updated.name} Administrator`,
            role: "ADMIN",
            passwordHash: passwordHash!,
            institutionId: id
          }
        });
        adminUpdated = true;
      }
    }

    // 2. Update Institution SystemSetting fees if provided
    if (platformFee !== undefined || convenienceFee !== undefined || takeawayFee !== undefined) {
      await prisma.systemSetting.upsert({
        where: { id },
        update: {
          ...(platformFee !== undefined && { platformFee: Number(platformFee) }),
          ...(convenienceFee !== undefined && { convenienceFee: Number(convenienceFee) }),
          ...(takeawayFee !== undefined && { takeawayFee: Number(takeawayFee) }),
          institutionId: id
        },
        create: {
          id,
          platformFee: Number(platformFee) || 2.0,
          convenienceFee: Number(convenienceFee) || 2.0,
          takeawayFee: Number(takeawayFee) || 10.0,
          institutionId: id
        }
      });
    }

    return NextResponse.json({
      success: true,
      institution: updated,
      adminUpdated
    });
  } catch (error: any) {
    console.error("PUT /api/institutions error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Institution ID is required" }, { status: 400 });
    }

    if (id === "kju") {
      return NextResponse.json({ success: false, error: "Primary institution (KJU) cannot be deleted" }, { status: 400 });
    }

    // Soft-deactivate institution
    await prisma.institution.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ success: true, message: "Institution deactivated successfully" });
  } catch (error: any) {
    console.error("DELETE /api/institutions error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Smart resolution of restaurant ID to match existing database records
async function resolveRestaurantId(rawId: string): Promise<string> {
  const trimmed = rawId.trim();

  const direct = await prisma.restaurant.findUnique({
    where: { id: trimmed }
  });
  if (direct) return direct.id;

  const byInsensitive = await prisma.restaurant.findFirst({
    where: {
      OR: [
        { id: { equals: trimmed, mode: "insensitive" } },
        { name: { equals: trimmed, mode: "insensitive" } },
        { tokenPrefix: { equals: trimmed, mode: "insensitive" } }
      ]
    }
  });
  if (byInsensitive) return byInsensitive.id;

  const byFuzzy = await prisma.restaurant.findFirst({
    where: {
      OR: [
        { id: { startsWith: trimmed, mode: "insensitive" } },
        { name: { contains: trimmed, mode: "insensitive" } }
      ]
    }
  });
  if (byFuzzy) return byFuzzy.id;

  try {
    const created = await prisma.restaurant.create({
      data: {
        id: trimmed,
        name: trimmed.charAt(0).toUpperCase() + trimmed.slice(1),
        tokenPrefix: `KJC-${trimmed.substring(0, 3).toUpperCase()}`,
        floor: "Ground Floor",
        cuisine: "Multi-Cuisine Specialties",
        logo: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=120&h=120&fit=crop",
        location: "Main Food Court",
        type: "MIXED",
        campus: "Airport Road Campus",
        institutionId: "kju",
        pinCodeHash: "123456"
      }
    });
    return created.id;
  } catch (e) {

    console.warn("Bulk auto-create restaurant fallback error:", e);
  }

  return trimmed;
}

export async function POST(req: Request) {
  try {
    const { restaurantId, items } = await req.json();

    if (!restaurantId || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: "Restaurant ID and an array of items are required" },
        { status: 400 }
      );
    }

    const targetRestaurantId = await resolveRestaurantId(restaurantId);

    // Insert all items within a single database transaction
    const created = await prisma.$transaction(
      items.map((item: any) =>
        prisma.menuItem.create({
          data: {
            restaurantId: targetRestaurantId,
            name: item.name?.trim() || "Unnamed Dish",
            description: item.description?.trim() || "",
            price: Number(item.price) || 0,
            category: item.category?.trim() || "Mains",
            prepTime: Number(item.prepTime) || 10,
            image: item.image?.trim() || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop",
            isVeg: item.isVeg === true || String(item.isVeg).toLowerCase() === "true",
            takeawayCharge: Number(item.takeawayCharge) || 10,
            stockCount: item.stockType === "UNLIMITED" ? 999 : Number(item.stockCount) || 50,
            stockType: item.stockType === "UNLIMITED" ? "UNLIMITED" : "COUNTED",
            available: true,
            availableFrom: item.availableFrom?.trim() || "10:00 AM"
          }
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${created.length} items to canteen menu.`,
      count: created.length
    });
  } catch (error: any) {
    console.error("Bulk import failed:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to bulk import menu items" },
      { status: 500 }
    );
  }
}


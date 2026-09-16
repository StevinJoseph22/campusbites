import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Smart resolution of restaurant ID to match existing database records
async function resolveRestaurantId(rawId: string, autoCreateOnMissing = false): Promise<string> {
  const trimmed = rawId.trim();

  // 1. Direct match by ID
  const direct = await prisma.restaurant.findUnique({
    where: { id: trimmed }
  });
  if (direct) return direct.id;

  // 2. Case-insensitive match on ID, Name, or TokenPrefix
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

  // 3. Prefix/Contains match on ID or Name
  const byFuzzy = await prisma.restaurant.findFirst({
    where: {
      OR: [
        { id: { startsWith: trimmed, mode: "insensitive" } },
        { name: { contains: trimmed, mode: "insensitive" } }
      ]
    }
  });
  if (byFuzzy) return byFuzzy.id;

  // 4. Auto-create if writing to prevent foreign key constraint violation
  if (autoCreateOnMissing) {
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
      console.warn("Auto create restaurant fallback encountered error:", e);
    }
  }


  return trimmed;
}

// Fetch menu items for a restaurant stall or campus-wide offers in 1 fast query
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get("restaurantId");
    const offersOnly = searchParams.get("offersOnly") === "true";
    const campus = searchParams.get("campus");
    const all = searchParams.get("all") === "true";

    // 1. Fast Batch Query: Campus-wide Hot Deals / All Dishes (eliminates 15 sequential HTTP requests)
    if (offersOnly || all || !restaurantId) {
      const whereCondition: any = {};
      if (offersOnly) {
        whereCondition.offerType = { not: "NONE" };
        whereCondition.offerValue = { gt: 0 };
        whereCondition.available = true;
      }
      if (campus) {
        whereCondition.restaurant = {
          campus: campus
        };
      }

      const items = await prisma.menuItem.findMany({
        where: whereCondition,
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              tokenPrefix: true,
              campus: true,
              floor: true,
              cuisine: true,
              isOpen: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });

      // Format items with stall info
      const formattedItems = items.map(item => ({
        ...item,
        stallId: item.restaurant.id,
        stallName: item.restaurant.name,
        stallInitials: item.restaurant.tokenPrefix ? item.restaurant.tokenPrefix.replace(/^KJU-|^KJC-/, "") : "STALL",
        campus: item.restaurant.campus,
        floor: item.restaurant.floor,
        cuisine: item.restaurant.cuisine,
        isStallOpen: item.restaurant.isOpen
      }));

      return NextResponse.json({ success: true, items: formattedItems, count: formattedItems.length });
    }

    // 2. Single Stall Menu Query
    const resolvedId = await resolveRestaurantId(restaurantId);

    const items = await prisma.menuItem.findMany({
      where: {
        OR: [
          { restaurantId },
          { restaurantId: resolvedId }
        ]
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, items, resolvedRestaurantId: resolvedId });
  } catch (error: any) {
    console.error("GET menu items error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch menu" },
      { status: 500 }
    );
  }
}

// Add a new menu item
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      restaurantId,
      name,
      description,
      price,
      category,
      prepTime,
      image,
      isVeg,
      takeawayCharge,
      stockCount,
      stockType,
      available,
      availableFrom,
      offerType,
      offerValue,
      isDineInOnly,
      variants
    } = body;

    if (!restaurantId || !name || price === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const targetRestaurantId = await resolveRestaurantId(restaurantId, true);

    const newItem = await prisma.menuItem.create({
      data: {
        restaurantId: targetRestaurantId,
        name,
        description: description || "",
        price: Number(price),
        category: category || "Veg",
        prepTime: Number(prepTime) || 10,
        image: image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop",
        isVeg: Boolean(isVeg),
        takeawayCharge: Number(takeawayCharge) || 10,
        stockCount: Number(stockCount) || 100,
        stockType: stockType || "COUNTED",
        available: available !== undefined ? Boolean(available) : true,
        availableFrom: availableFrom || "10:00 AM",
        offerType: offerType || "NONE",
        offerValue: Number(offerValue) || 0,
        isDineInOnly: Boolean(isDineInOnly),
        variants: variants && Array.isArray(variants) && variants.length > 0 ? JSON.stringify(variants) : null
      }
    });

    return NextResponse.json({ success: true, item: newItem });
  } catch (error: any) {
    console.error("POST menu item error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add menu item" },
      { status: 500 }
    );
  }
}


// Update a menu item (details or stock)
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      name,
      description,
      price,
      category,
      prepTime,
      image,
      isVeg,
      takeawayCharge,
      stockCount,
      stockType,
      available,
      isBestseller,
      availableFrom,
      offerType,
      offerValue,
      isDineInOnly,
      variants
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Menu item ID is required" },
        { status: 400 }
      );
    }

    const updatedItem = await prisma.menuItem.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: Number(price) }),
        ...(category && { category }),
        ...(prepTime !== undefined && { prepTime: Number(prepTime) }),
        ...(image && { image }),
        ...(isVeg !== undefined && { isVeg: Boolean(isVeg) }),
        ...(takeawayCharge !== undefined && { takeawayCharge: Number(takeawayCharge) }),
        ...(stockCount !== undefined && { stockCount: Number(stockCount) }),
        ...(stockType && { stockType }),
        ...(available !== undefined && { available: Boolean(available) }),
        ...(availableFrom !== undefined && { availableFrom }),
        ...(isBestseller !== undefined && { isBestseller: Boolean(isBestseller) }),
        ...(offerType && { offerType }),
        ...(offerValue !== undefined && { offerValue: Number(offerValue) }),
        ...(isDineInOnly !== undefined && { isDineInOnly: Boolean(isDineInOnly) }),
        ...(variants !== undefined && { variants: Array.isArray(variants) && variants.length > 0 ? JSON.stringify(variants) : null })
      }
    });

    return NextResponse.json({ success: true, item: updatedItem });
  } catch (error: any) {
    console.error("PUT menu item error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update menu item" },
      { status: 500 }
    );
  }
}

// Delete a menu item
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Menu item ID is required" },
        { status: 400 }
      );
    }

    await prisma.menuItem.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Menu item deleted" });
  } catch (error: any) {
    console.error("DELETE menu item error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete menu item" },
      { status: 500 }
    );
  }
}

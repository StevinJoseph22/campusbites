import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { restaurantId, items } = await req.json();

    if (!restaurantId || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: "Restaurant ID and an array of items are required" },
        { status: 400 }
      );
    }

    // Insert all items within a single database transaction
    const created = await prisma.$transaction(
      items.map((item: any) =>
        prisma.menuItem.create({
          data: {
            restaurantId,
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

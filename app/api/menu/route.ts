import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Fetch menu items for a restaurant stall
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get("restaurantId");

    if (!restaurantId) {
      return NextResponse.json(
        { success: false, error: "Restaurant ID is required" },
        { status: 400 }
      );
    }

    const items = await prisma.menuItem.findMany({
      where: { restaurantId },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, items });
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
      variants
    } = body;

    if (!restaurantId || !name || price === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newItem = await prisma.menuItem.create({
      data: {
        restaurantId,
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

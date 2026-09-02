import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let setting = await prisma.systemSetting.findUnique({
      where: { id: "default" }
    });

    if (!setting) {
      setting = await prisma.systemSetting.create({
        data: {
          id: "default",
          platformFee: 5.0,
          takeawayFee: 10.0
        }
      });
    }

    return NextResponse.json({ success: true, settings: setting });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { platformFee, takeawayFee } = await req.json();

    const updated = await prisma.systemSetting.upsert({
      where: { id: "default" },
      update: {
        platformFee: Number(platformFee),
        takeawayFee: Number(takeawayFee)
      },
      create: {
        id: "default",
        platformFee: Number(platformFee),
        takeawayFee: Number(takeawayFee)
      }
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { amount, currency = "INR", receipt } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid payment amount" },
        { status: 400 }
      );
    }

    const orderId = `rzp_order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    return NextResponse.json({
      success: true,
      order: {
        id: orderId,
        entity: "order",
        amount: Math.round(amount * 100),
        amount_paid: 0,
        amount_due: Math.round(amount * 100),
        currency,
        receipt: receipt || `rcpt_${Date.now()}`,
        status: "created",
        attempts: 0,
        created_at: Math.floor(Date.now() / 1000)
      },
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_campusbites"
    });
  } catch (error: any) {
    console.error("Razorpay create order error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create Razorpay order" },
      { status: 500 }
    );
  }
}

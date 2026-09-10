import { NextResponse } from "next/server";

const CASHFREE_API_BASE =
  process.env.CASHFREE_MODE === "sandbox"
    ? "https://sandbox.cashfree.com/pg"
    : "https://api.cashfree.com/pg";

export async function POST(req: Request) {
  try {
    const { amount, customerId, customerEmail, customerPhone } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid payment amount" },
        { status: 400 }
      );
    }

    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    if (!appId || !secretKey) {
      console.error("Cashfree keys are not configured");
      return NextResponse.json(
        { success: false, error: "Payments are not configured" },
        { status: 500 }
      );
    }

    const orderId = `cb_order_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    const res = await fetch(`${CASHFREE_API_BASE}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": appId,
        "x-client-secret": secretKey,
        "x-api-version": "2023-08-01",
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: Number(amount),
        order_currency: "INR",
        customer_details: {
          customer_id: (customerId || "guest").replace(/[^a-zA-Z0-9_-]/g, "_"),
          customer_email: customerEmail || "student@kristujayanti.com",
          customer_phone: customerPhone || "9999999999",
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Cashfree create order error:", data);
      return NextResponse.json(
        { success: false, error: data.message || "Failed to create Cashfree order" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: data.order_id,
      paymentSessionId: data.payment_session_id,
    });
  } catch (error: any) {
    console.error("Cashfree create order error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create Cashfree order" },
      { status: 500 }
    );
  }
}

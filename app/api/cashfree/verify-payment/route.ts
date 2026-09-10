import { NextResponse } from "next/server";

const CASHFREE_API_BASE =
  process.env.CASHFREE_MODE === "sandbox"
    ? "https://sandbox.cashfree.com/pg"
    : "https://api.cashfree.com/pg";

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Missing order id" },
        { status: 400 }
      );
    }

    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    if (!appId || !secretKey) {
      console.error("Cashfree keys are not configured");
      return NextResponse.json(
        { success: false, error: "Payment verification is not configured" },
        { status: 500 }
      );
    }

    // Cashfree's recommended pattern: never trust the client-side checkout
    // result alone — always confirm the order's real status server-to-server.
    const res = await fetch(`${CASHFREE_API_BASE}/orders/${encodeURIComponent(orderId)}`, {
      method: "GET",
      headers: {
        "x-client-id": appId,
        "x-client-secret": secretKey,
        "x-api-version": "2023-08-01",
      },
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Cashfree order status error:", data);
      return NextResponse.json(
        { success: false, error: data.message || "Failed to verify payment" },
        { status: 500 }
      );
    }

    const isValid = data.order_status === "PAID";

    if (!isValid) {
      return NextResponse.json(
        { success: false, verified: false, error: `Order status: ${data.order_status}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      verified: true,
      orderId: data.order_id,
      orderStatus: data.order_status,
      message: "Cashfree Payment Verified Successfully!",
    });
  } catch (error: any) {
    console.error("Cashfree verification error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to verify Cashfree payment" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = await req.json();

    if (!razorpay_payment_id || !razorpay_order_id) {
      return NextResponse.json(
        { success: false, error: "Missing Razorpay payment verification parameters" },
        { status: 400 }
      );
    }

    if (!razorpay_signature) {
      return NextResponse.json(
        { success: false, error: "Missing Razorpay payment verification parameters" },
        { status: 400 }
      );
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      console.error("RAZORPAY_KEY_SECRET is not configured");
      return NextResponse.json(
        { success: false, error: "Payment verification is not configured" },
        { status: 500 }
      );
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    const expectedBuf = Buffer.from(expectedSignature, "hex");
    const givenBuf = Buffer.from(razorpay_signature, "hex");
    const isValid =
      expectedBuf.length === givenBuf.length &&
      crypto.timingSafeEqual(expectedBuf, givenBuf);

    if (!isValid) {
      return NextResponse.json(
        { success: false, verified: false, error: "Payment signature verification failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      verified: true,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      message: "Razorpay Payment Verified Successfully!"
    });
  } catch (error: any) {
    console.error("Razorpay verification error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to verify Razorpay payment" },
      { status: 500 }
    );
  }
}

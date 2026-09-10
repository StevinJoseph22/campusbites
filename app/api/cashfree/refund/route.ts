import { NextResponse } from "next/server";
import { issueCashfreeRefund } from "@/lib/cashfree";

export async function POST(req: Request) {
  try {
    const { cashfreeOrderId, refundId, refundAmount, refundNote } = await req.json();

    const result = await issueCashfreeRefund(cashfreeOrderId, refundId, refundAmount, refundNote || "Order refund");

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, refundId: result.refundId, refundStatus: result.refundStatus });
  } catch (error: any) {
    console.error("Cashfree refund route error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to issue refund" },
      { status: 500 }
    );
  }
}

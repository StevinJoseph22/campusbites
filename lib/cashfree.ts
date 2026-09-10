const CASHFREE_API_BASE =
  process.env.CASHFREE_MODE === "sandbox"
    ? "https://sandbox.cashfree.com/pg"
    : "https://api.cashfree.com/pg";

export interface RefundResult {
  success: boolean;
  refundId?: string;
  refundStatus?: string;
  error?: string;
}

/**
 * Issues a refund against a Cashfree order. Safe to retry with the same refundId —
 * Cashfree treats a repeat refund_id as idempotent rather than double-refunding.
 */
export async function issueCashfreeRefund(
  cashfreeOrderId: string,
  refundId: string,
  refundAmount: number,
  refundNote: string
): Promise<RefundResult> {
  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;

  if (!appId || !secretKey) {
    console.error("Cashfree keys are not configured — cannot issue refund");
    return { success: false, error: "Refunds are not configured" };
  }

  if (!cashfreeOrderId || !refundId || !refundAmount || refundAmount <= 0) {
    return { success: false, error: "Missing or invalid refund parameters" };
  }

  try {
    const res = await fetch(`${CASHFREE_API_BASE}/orders/${encodeURIComponent(cashfreeOrderId)}/refunds`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": appId,
        "x-client-secret": secretKey,
        "x-api-version": "2023-08-01",
      },
      body: JSON.stringify({
        refund_id: refundId,
        refund_amount: Number(refundAmount.toFixed(2)),
        refund_note: refundNote,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Cashfree refund error:", data);
      return { success: false, error: data.message || "Failed to issue refund" };
    }

    return { success: true, refundId: data.refund_id, refundStatus: data.refund_status };
  } catch (error: any) {
    console.error("Cashfree refund error:", error);
    return { success: false, error: error.message || "Failed to issue refund" };
  }
}

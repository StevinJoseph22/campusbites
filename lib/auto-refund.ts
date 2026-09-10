import { prisma } from "@/lib/prisma";
import { issueCashfreeRefund } from "@/lib/cashfree";
import { brandEmailShell, emailBadge, emailRow, sendBrandedEmail } from "@/lib/email";

// If a vendor hasn't confirmed (or rejected) an order within this window, the student
// gets an automatic full refund for that vendor's portion instead of waiting forever.
const CONFIRM_TIMEOUT_MINUTES = 15;

// Throttle so this doesn't re-scan the whole table on every single poll request —
// it only actually runs once per interval per warm server instance.
let lastRunAt = 0;
const RUN_INTERVAL_MS = 60_000;

export async function autoRefundStaleOrders() {
  const now = Date.now();
  if (now - lastRunAt < RUN_INTERVAL_MS) return;
  lastRunAt = now;

  try {
    const cutoff = new Date(now - CONFIRM_TIMEOUT_MINUTES * 60 * 1000);

    const staleItems = await prisma.orderItem.findMany({
      where: {
        status: "PLACED",
        createdAt: { lt: cutoff }
      },
      include: { order: true }
    });

    for (const item of staleItems) {
      const cashfreeOrderId = item.order?.cashfreeOrderId;
      if (!cashfreeOrderId) {
        console.error(`AUTO-REFUND SKIPPED: token ${item.tokenNumber} has no cashfreeOrderId on file (placed before refund tracking was added) — needs a manual refund via the Cashfree dashboard.`);
        continue;
      }

      const result = await issueCashfreeRefund(
        cashfreeOrderId,
        `refund-${item.tokenNumber}`,
        item.subtotal,
        `Auto-refund — ${item.stallName} did not confirm within ${CONFIRM_TIMEOUT_MINUTES} minutes`
      );

      if (!result.success) {
        console.error(`AUTO-REFUND FAILED for token ${item.tokenNumber} (₹${item.subtotal}):`, result.error);
        continue;
      }

      await prisma.orderItem.update({
        where: { id: item.id },
        data: { status: "REFUNDED" }
      });

      if (item.order?.email) {
        await sendAutoRefundEmail(item.order.email, item.stallName, item.tokenNumber, item.subtotal);
      }

      console.log(`Auto-refunded token ${item.tokenNumber} (₹${item.subtotal}) — ${item.stallName} did not confirm in time.`);
    }
  } catch (err) {
    console.error("autoRefundStaleOrders error:", err);
  }
}

async function sendAutoRefundEmail(email: string, stallName: string, tokenNumber: string, amount: number) {
  try {
    const html = brandEmailShell({
      eyebrow: "Order update",
      heading: "Your order was auto-refunded",
      bodyHtml: `
        <div style="margin-bottom:14px;">${emailBadge("AUTO-REFUNDED", "chili")}</div>
        <p style="margin:0 0 14px;"><strong>${stallName}</strong> didn't confirm your order (Token: <strong>${tokenNumber}</strong>) within ${CONFIRM_TIMEOUT_MINUTES} minutes, so we've automatically refunded it in full. We're sorry for the wait.</p>
        ${emailRow("Refund amount", `₹${amount.toFixed(2)}`, { strong: true, color: "#3F7A55" })}
      `
    });

    await sendBrandedEmail({ to: email, subject: `Auto-refunded — ${stallName} didn't confirm in time`, html });
  } catch (err) {
    console.error("sendAutoRefundEmail error:", err);
  }
}

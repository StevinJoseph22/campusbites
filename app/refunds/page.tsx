import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/Footer";

export const metadata = { title: "Refunds & Cancellations — CampusBites" };

export default function RefundsPage() {
  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col">
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10 space-y-6">
        <Link href="/student/dashboard" className="inline-flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to CampusBites
        </Link>

        <div className="card-surface p-6 sm:p-8 space-y-6 text-sm text-ink leading-relaxed">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Refunds & Cancellations</h1>
            <p className="text-xs text-ink-soft mt-1">Last updated: September 2026</p>
          </div>

          <section className="space-y-2">
            <h2 className="font-display text-base font-semibold">Cancelling an Order</h2>
            <p className="text-ink-soft">
              An order can be cancelled free of charge only while it is still in the <strong className="text-ink">"Placed"</strong> stage — before the vendor has accepted it and started preparation. Once a vendor accepts an order and begins cooking, it can no longer be cancelled, since preparation has already started.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-base font-semibold">Out-of-Stock Items</h2>
            <p className="text-ink-soft">
              If a vendor marks an item in your order as out of stock after payment, only the amount for that specific item is affected. You'll be notified in your order tracking page and given the choice to continue with the rest of the order or cancel it entirely. The out-of-stock portion is automatically refunded to your original payment method via Cashfree — no action is needed on your part beyond confirming your choice in the app.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-base font-semibold">Refund Timeline</h2>
            <p className="text-ink-soft">
              Approved refunds are processed back to your original payment method (UPI, card, or bank account) through Cashfree. Depending on your bank or UPI provider, this typically takes <strong className="text-ink">5–7 business days</strong> to reflect, though it is often faster.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-base font-semibold">Completed Orders</h2>
            <p className="text-ink-soft">
              Once an order has been marked as picked up / delivered at the vendor counter, it is considered complete and is not eligible for a refund, except in cases of a genuine error on the vendor's part (e.g. wrong or missing items), which should be reported immediately at the counter or via our contact page.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-base font-semibold">Need Help?</h2>
            <p className="text-ink-soft">
              For any refund or cancellation issue not covered above, reach out with your order token number via our <Link href="/contact-us" className="text-marigold font-semibold hover:underline">Contact Us</Link> page and we'll help sort it out.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

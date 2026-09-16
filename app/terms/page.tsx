import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/Footer";

export const metadata = { title: "Terms & Conditions — CampusBites" };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col">
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10 space-y-6">
        <Link href="/student/dashboard" className="inline-flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to CampusBites
        </Link>

        <div className="card-surface p-6 sm:p-8 space-y-6 text-sm text-ink leading-relaxed">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Terms & Conditions</h1>
            <p className="text-xs text-ink-soft mt-1">Last updated: September 2026</p>
          </div>

          <section className="space-y-2">
            <h2 className="font-display text-base font-semibold">1. About CampusBites</h2>
            <p className="text-ink-soft">
              CampusBites is a pre-order system that lets students, faculty, and staff at Kristu Jayanti University browse menus from campus canteen stalls, place a combined order across multiple vendors, pay online, and collect their food using a token number at the pickup counter. CampusBites is a technology platform connecting the campus community with independent canteen vendors operating on campus — each vendor is responsible for preparing and fulfilling their own portion of an order.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-base font-semibold">2. Who Can Use This Service</h2>
            <p className="text-ink-soft">
              This service is intended for students, staff, and visitors of Kristu Jayanti University. Vendor and admin accounts are issued only to registered canteen stalls operating on campus.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-base font-semibold">3. Orders & Pricing</h2>
            <p className="text-ink-soft">
              All prices displayed are in Indian Rupees (INR) and are set independently by each vendor, inclusive of any applicable platform or packaging fees shown at checkout. Placing an order and completing payment constitutes a binding request to the relevant vendor(s) to prepare the ordered items for pickup at your selected time slot.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-base font-semibold">4. Payments</h2>
            <p className="text-ink-soft">
              Payments are processed securely through Cashfree Payments. CampusBites does not store your card, UPI, or banking details — these are handled entirely by Cashfree's payment infrastructure.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-base font-semibold">5. Pickup</h2>
            <p className="text-ink-soft">
              Orders must be collected from the respective vendor's counter using the token number generated at checkout, within a reasonable time of your selected pickup slot. CampusBites does not offer delivery — all orders are collected in person on campus.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-base font-semibold">6. Vendor Responsibility</h2>
            <p className="text-ink-soft">
              Food quality, preparation, hygiene, and accuracy of each order portion are the responsibility of the individual vendor stall that prepared it. CampusBites facilitates ordering and payment but does not itself prepare or handle food.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-base font-semibold">7. Changes to These Terms</h2>
            <p className="text-ink-soft">
              These terms may be updated from time to time to reflect changes in how the service operates. Continued use of CampusBites after an update constitutes acceptance of the revised terms.
            </p>
          </section>

          <p className="text-xs text-ink-soft border-t border-dashed border-ink/15 pt-4">
            Questions about these terms? <Link href="/contact-us" className="text-marigold font-semibold hover:underline">Contact us</Link>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

import Link from "next/link";
import { ArrowLeft, Mail, Phone, MapPin } from "lucide-react";
import { Footer } from "@/components/Footer";

export const metadata = { title: "Contact Us — CampusBites" };

export default function ContactUsPage() {
  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col">
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10 space-y-6">
        <Link href="/student/dashboard" className="inline-flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to CampusBites
        </Link>

        <div className="card-surface p-6 sm:p-8 space-y-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Contact Us</h1>
            <p className="text-xs text-ink-soft mt-1">
              CampusBites — Multi-Vendor Canteen Pre-Order System, Kristu Jayanti University
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-marigold/10 text-marigold flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-ink-soft uppercase tracking-wider font-bold">Email</p>
                <a href="mailto:aditya94727@gmail.com" className="text-sm font-semibold text-ink hover:text-marigold transition-colors">
                  aditya94727@gmail.com
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-marigold/10 text-marigold flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-ink-soft uppercase tracking-wider font-bold">Phone</p>
                <a href="tel:+916299043460" className="text-sm font-semibold text-ink hover:text-marigold transition-colors">
                  +91 62990 43460
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-marigold/10 text-marigold flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-ink-soft uppercase tracking-wider font-bold">Address</p>
                <p className="text-sm font-semibold text-ink">Kristu Jayanti University, Kothanur, Bengaluru, Karnataka, India</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-ink-soft leading-relaxed border-t border-dashed border-ink/15 pt-4">
            For order issues, refunds, or vendor complaints, please write to us with your order token number and we'll respond as soon as possible.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

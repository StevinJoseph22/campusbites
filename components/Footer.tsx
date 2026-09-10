import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-ink/15 bg-surface mt-10">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-soft">
        <span>© {new Date().getFullYear()} CampusBites · Kristu Jayanti University</span>
        <nav className="flex items-center gap-4 font-semibold">
          <Link href="/contact-us" className="hover:text-marigold transition-colors">Contact Us</Link>
          <Link href="/terms" className="hover:text-marigold transition-colors">Terms & Conditions</Link>
          <Link href="/refunds" className="hover:text-marigold transition-colors">Refunds & Cancellations</Link>
        </nav>
      </div>
    </footer>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UtensilsCrossed,
  ShoppingBag,
  MapPin,
  Search,
  User,
  ChevronDown,
  LogOut,
  Ticket,
  Clock,
  Sparkles,
  Building2,
  Award,
  Info,
  Check,
  CheckCircle2
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { initNotificationPermission, sendBrowserNotification } from "@/lib/notifications";

interface NavbarProps {
  cartCount?: number;
  onOpenCart?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  selectedCampus?: string;
  onCampusChange?: (campus: string) => void;
}

const CAMPUS_OPTIONS = [
  {
    name: "Airport Road Campus",
    tagline: "Main Block, Food Court & PG Canteens",
    badge: "Active",
  },
  {
    name: "Central Campus",
    tagline: "Heritage Block, South Canteen & Cafes",
    badge: "Active",
  },
];

export function Navbar({ 
  cartCount = 0, 
  onOpenCart, 
  searchQuery = "", 
  onSearchChange,
  selectedCampus = "Airport Road Campus",
  onCampusChange
}: NavbarProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [campus, setCampus] = useState("North Campus Food Court");
  const [studentReg, setStudentReg] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [guestCollege, setGuestCollege] = useState<string | null>(null);
  const [guestEvent, setGuestEvent] = useState<string | null>(null);
  const [guestExpiresAt, setGuestExpiresAt] = useState<string | null>(null);
  const [guestTimeRemaining, setGuestTimeRemaining] = useState<string | null>(null);
  const [showGuestPassModal, setShowGuestPassModal] = useState(false);
  const [isCampusDropdownOpen, setIsCampusDropdownOpen] = useState(false);
  const campusDropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (campusDropdownRef.current && !campusDropdownRef.current.contains(event.target as Node)) {
        setIsCampusDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCampusDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Check user session & enforce 1-Day Guest Pass validity
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const reg = localStorage.getItem("campusbites_student_reg");
      const role = localStorage.getItem("campusbites_user_role");
      const name = localStorage.getItem("campusbites_user_name");
      const college = localStorage.getItem("campusbites_guest_college");
      const event = localStorage.getItem("campusbites_guest_event");
      const expiresAt = localStorage.getItem("campusbites_guest_expires_at");

      if (role && role !== "STUDENT" && role !== "GUEST") {
        if (role === "VENDOR") {
          router.push("/vendor/orders");
        } else if (role === "ADMIN") {
          router.push("/admin");
        }
      }

      // Check if guest pass has expired
      if (role === "GUEST" && expiresAt) {
        const expTime = new Date(expiresAt).getTime();
        if (Date.now() >= expTime) {
          // Clear expired guest credentials
          localStorage.removeItem("campusbites_user_role");
          localStorage.removeItem("campusbites_user_phone");
          localStorage.removeItem("campusbites_student_reg");
          localStorage.removeItem("campusbites_user_name");
          localStorage.removeItem("campusbites_guest_expires_at");
          localStorage.removeItem("campusbites_guest_college");
          localStorage.removeItem("campusbites_guest_event");
          router.push("/login?expired=guest");
          return;
        }
      }

      setStudentReg(reg);
      setUserRole(role);
      setUserName(name);
      setGuestCollege(college);
      setGuestEvent(event);
      setGuestExpiresAt(expiresAt);
    }
    initNotificationPermission();
  }, [router]);

  // Live countdown timer for 1-Day Guest Pass
  useEffect(() => {
    if (userRole !== "GUEST" || !guestExpiresAt) return;

    const updateCountdown = () => {
      const expTime = new Date(guestExpiresAt).getTime();
      const diff = expTime - Date.now();

      if (diff <= 0) {
        setGuestTimeRemaining("Expired");
        localStorage.removeItem("campusbites_user_role");
        localStorage.removeItem("campusbites_user_phone");
        localStorage.removeItem("campusbites_student_reg");
        localStorage.removeItem("campusbites_user_name");
        localStorage.removeItem("campusbites_guest_expires_at");
        router.push("/login?expired=guest");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setGuestTimeRemaining(`${hours}h ${minutes}m`);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 30000);
    return () => clearInterval(timer);
  }, [userRole, guestExpiresAt, router]);

  // Poll active orders in the background and fire a browser notification whenever
  // a vendor updates a token's status (covers the whole site, not just the order page).
  useEffect(() => {
    const email = typeof window !== "undefined" ? localStorage.getItem("campusbites_user_phone") : null;
    if (!email) return;

    const notifyStatus = (stallName: string, tokenNumber: string, status: string) => {
      if (status === "CONFIRMED") sendBrowserNotification(`${stallName} confirmed your order`, `Token ${tokenNumber} is now being prepared.`);
      else if (status === "READY") sendBrowserNotification(`${stallName}: order ready!`, `Token ${tokenNumber} is ready for pickup.`);
      else if (status === "FULFILLED") sendBrowserNotification(`${stallName}: order picked up`, `Token ${tokenNumber} — thanks for ordering!`);
      else if (status === "REFUNDED") sendBrowserNotification(`${stallName}: order refunded`, `Token ${tokenNumber} was out of stock. Refund processed.`);
    };

    const checkOrderStatuses = async () => {
      try {
        const res = await fetch(`/api/orders?studentEmail=${email}`);
        const data = await res.json();
        if (!data.success || !data.orders) return;

        const storageKey = "campusbites_last_order_statuses";
        const stored: Record<string, string> = JSON.parse(localStorage.getItem(storageKey) || "{}");
        const updated = { ...stored };

        data.orders.forEach((order: any) => {
          order.vendorPortions?.forEach((portion: any) => {
            const prevStatus = stored[portion.tokenNumber];
            if (prevStatus && prevStatus !== portion.status) {
              notifyStatus(portion.stallName, portion.tokenNumber, portion.status);
            }
            updated[portion.tokenNumber] = portion.status;
          });
        });

        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to poll order statuses for notifications:", e);
      }
    };

    checkOrderStatuses();
    const interval = setInterval(checkOrderStatuses, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("campusbites_user_role");
    localStorage.removeItem("campusbites_user_phone");
    localStorage.removeItem("campusbites_student_reg");
    localStorage.removeItem("campusbites_user_name");
    localStorage.removeItem("campusbites_guest_expires_at");
    localStorage.removeItem("campusbites_guest_college");
    localStorage.removeItem("campusbites_guest_event");
    router.push("/login");
  };

  return (
    <header suppressHydrationWarning className="sticky top-0 z-50 bg-surface border-b border-ink/15">
      {/* Main Navbar row */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand & Location Picker */}
        <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 min-w-0">
          <Link href="/student/dashboard" className="flex items-center gap-2.5 group shrink-0">
            <div>
              <span className="font-display text-base sm:text-xl font-bold tracking-tight text-marigold whitespace-nowrap">
                CampusBites
              </span>
              <p className="hidden sm:block text-[9px] text-ink-soft font-semibold tracking-wider uppercase">
                Campus Canteen Hub
              </p>
            </div>
          </Link>

          {/* Custom Advanced Campus Location Picker Dropdown */}
          <div ref={campusDropdownRef} suppressHydrationWarning className="relative min-w-0">
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setIsCampusDropdownOpen((prev) => !prev)}
              aria-expanded={isCampusDropdownOpen}
              aria-haspopup="listbox"
              title="Select Campus Location"
              className={`flex items-center gap-1.5 sm:gap-2 bg-cardstock hover:bg-cardstock-hover border ${
                isCampusDropdownOpen ? "border-marigold shadow-md ring-2 ring-marigold/25" : "border-ink/15 hover:border-ink/30"
              } rounded-xl px-2 sm:px-3 py-1.5 text-xs text-ink transition-all cursor-pointer min-w-0 max-w-[130px] sm:max-w-none group`}
            >
              <div className="w-5 h-5 rounded-lg bg-marigold/15 text-marigold flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col items-start min-w-0 text-left">
                <span className="font-extrabold text-xs text-ink truncate max-w-[75px] sm:max-w-[135px]">
                  {selectedCampus}
                </span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-ink-soft shrink-0 transition-transform duration-200 ${
                  isCampusDropdownOpen ? "rotate-180 text-marigold" : ""
                }`}
              />
            </button>

            {/* Advanced Dropdown Popover */}
            {isCampusDropdownOpen && (
              <div
                role="listbox"
                suppressHydrationWarning
                className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-surface/95 backdrop-blur-xl border border-ink/15 dark:border-ink/20 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1"
              >
                <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-ink/10">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-ink-soft">
                    <Building2 className="w-3.5 h-3.5 text-marigold" />
                    <span>Select Campus Hub</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                  </span>
                </div>

                <div className="pt-1 space-y-1">
                  {CAMPUS_OPTIONS.map((c) => {
                    const isSelected = selectedCampus === c.name;
                    return (
                      <button
                        key={c.name}
                        role="option"
                        aria-selected={isSelected}
                        type="button"
                        onClick={() => {
                          if (onCampusChange) onCampusChange(c.name);
                          setIsCampusDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? "bg-marigold/15 border-marigold/40 shadow-sm"
                            : "bg-cardstock/50 hover:bg-cardstock border-transparent hover:border-ink/15"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              isSelected
                                ? "bg-marigold text-white shadow-sm"
                                : "bg-surface border border-ink/10 text-ink-soft"
                            }`}
                          >
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p
                              className={`text-xs font-black truncate ${
                                isSelected ? "text-marigold" : "text-ink"
                              }`}
                            >
                              {c.name}
                            </p>
                            <p className="text-[10px] text-ink-soft truncate">
                              {c.tagline}
                            </p>
                          </div>
                        </div>

                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-marigold text-white flex items-center justify-center shrink-0 shadow-sm">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-ink-soft/70 px-1.5 py-0.5 rounded bg-ink/5">
                            Switch
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="px-2.5 py-1.5 pt-2 border-t border-ink/10 flex items-center gap-1.5 text-[10px] text-ink-soft">
                  <Info className="w-3 h-3 text-marigold shrink-0" />
                  <span>Stalls and live menus update automatically per campus</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Global Search Bar — desktop only, mobile gets its own row below */}
        <div className="hidden sm:flex items-center flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-ink-soft absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder="Search stalls, burgers, dosas, cold brew..."
            className="w-full bg-cardstock border border-ink/15 rounded pl-10 pr-4 py-2 text-xs text-ink placeholder-ink-soft/70 focus:outline-none focus:border-b-2 focus:border-b-marigold transition-all"
            suppressHydrationWarning
          />
        </div>

        {/* Action Buttons */}
        <div suppressHydrationWarning className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <ThemeToggle />

          {/* 1-Day Event Guest Pass Badge */}
          {mounted && userRole === "GUEST" && (
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setShowGuestPassModal(true)}
              className="flex items-center gap-1.5 bg-marigold/15 border border-marigold/40 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold text-ink hover:bg-marigold/25 transition-all cursor-pointer shadow-sm"
            >
              <Ticket className="w-3.5 h-3.5 text-marigold shrink-0" />
              <div className="flex items-center gap-1 text-[11px] sm:text-xs">
                <span className="font-extrabold text-marigold">1-Day Pass</span>
                {guestCollege && <span className="hidden md:inline text-ink-soft">· {guestCollege}</span>}
              </div>
              {guestTimeRemaining && (
                <span className="px-1.5 py-0.5 rounded bg-marigold/20 text-[10px] font-mono font-black text-marigold flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {guestTimeRemaining}
                </span>
              )}
            </button>
          )}

          {/* Cart Trigger */}
          <Link
            href="/student/cart"
            suppressHydrationWarning
            className="relative w-9 h-9 sm:w-auto sm:px-3.5 sm:py-2 rounded bg-cardstock hover:bg-cardstock-hover border border-ink/15 text-ink font-semibold text-xs transition-colors flex items-center justify-center sm:gap-2"
          >
            <ShoppingBag className="w-4 h-4 text-marigold" />
            <span className="hidden sm:inline-block font-bold">Cart</span>
            {cartCount > 0 && (
              <span suppressHydrationWarning className="absolute -top-1.5 -right-1.5 sm:static bg-marigold text-white text-[10px] sm:text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-full sm:rounded min-w-[18px] sm:min-w-[20px] text-center">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Student / Guest Profile & Logout */}
          {mounted && studentReg ? (
            <div suppressHydrationWarning className="flex items-center gap-1.5 sm:gap-2">
              <div className="hidden md:flex items-center gap-1.5 bg-cardstock border border-ink/15 px-3.5 py-2 rounded text-xs font-mono font-bold text-ink">
                <User className="w-3.5 h-3.5 text-marigold" />
                <span>{userRole === "GUEST" ? `${userName || studentReg}` : studentReg}</span>
              </div>
              <button
                suppressHydrationWarning
                onClick={handleSignOut}
                aria-label="Sign out"
                className="w-9 h-9 sm:w-auto sm:px-3 sm:py-2 rounded bg-chili-soft border border-chili/30 text-chili hover:bg-chili hover:text-white transition-colors text-xs font-bold flex items-center justify-center sm:gap-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline-block">Sign Out</span>
              </button>
            </div>
          ) : !mounted ? (
            <div suppressHydrationWarning className="w-9 h-9 sm:w-20 sm:h-8 rounded bg-cardstock/60 animate-pulse border border-ink/10" />
          ) : (
            <Link
              href="/login"
              aria-label="Sign in"
              suppressHydrationWarning
              className="bg-marigold hover:bg-marigold-hover w-9 h-9 sm:w-auto sm:px-3.5 sm:py-2 rounded text-xs font-bold text-white flex items-center justify-center sm:gap-1.5 transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline-block">Sign In</span>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile-only search row */}
      <div className="sm:hidden px-3 pb-2.5 relative">
        <Search className="w-4 h-4 text-ink-soft absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          placeholder="Search stalls, burgers, dosas..."
          className="w-full bg-cardstock border border-ink/15 rounded pl-10 pr-4 py-2 text-xs text-ink placeholder-ink-soft/70 focus:outline-none focus:border-b-2 focus:border-b-marigold transition-all"
          suppressHydrationWarning={true}
        />
      </div>

      {/* MODAL: 1-DAY EVENT GUEST PASS DETAILS */}
      {showGuestPassModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-cardstock border border-marigold/40 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-marigold/20 border border-marigold/40 flex items-center justify-center text-marigold">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-ink font-display">
                    1-Day Event Guest Pass
                  </h3>
                  <p className="text-[10px] text-marigold font-bold uppercase tracking-wider">
                    Active Today · Valid until 11:59 PM
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuestPassModal(false)}
                className="text-ink-soft hover:text-ink font-bold text-base p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-surface border border-ink/10 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-ink-soft font-semibold">Guest Name:</span>
                  <span className="font-black text-ink">{userName || "Visiting Guest"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-ink-soft font-semibold">Home College:</span>
                  <span className="font-bold text-marigold">{guestCollege || "Visiting Institution"}</span>
                </div>
                {guestEvent && (
                  <div className="flex justify-between items-center">
                    <span className="text-ink-soft font-semibold">Event / Fest:</span>
                    <span className="font-bold text-ink">{guestEvent}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-ink-soft font-semibold">Pass Identifier:</span>
                  <span className="font-mono font-bold text-ink">{studentReg}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-ink-soft font-semibold">Time Remaining:</span>
                  <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    {guestTimeRemaining || "Active Today"}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-marigold/10 border border-marigold/30 text-ink space-y-1">
                <div className="flex items-center gap-1.5 text-marigold font-bold text-[11px]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Campus Canteen Access</span>
                </div>
                <p className="text-[11px] text-ink-soft leading-relaxed">
                  You can browse all food stalls, order meals via UPI, and receive live digital pickup notifications for today.
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowGuestPassModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-surface hover:bg-cardstock-hover border border-ink/15 text-xs font-bold text-ink transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex-1 py-2.5 rounded-xl bg-chili-soft hover:bg-chili hover:text-white border border-chili/30 text-xs font-bold text-chili transition-colors cursor-pointer"
              >
                Sign Out / Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

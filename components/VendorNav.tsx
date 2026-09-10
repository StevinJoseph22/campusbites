"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Building2, Leaf, Menu as MenuIcon, X } from "lucide-react";
import { getActiveRestaurant, RestaurantAccount } from "@/lib/restaurants-data";

const NAV_LINKS = [
  { href: "/vendor/dashboard", label: "Overview" },
  { href: "/vendor/orders", label: "Orders" },
  { href: "/vendor/menu", label: "Menu" },
  { href: "/vendor/sales", label: "Sales" },
];

export function VendorNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentVendor, setCurrentVendor] = useState<RestaurantAccount | null>(null);
  const [isOpenStatus, setIsOpenStatus] = useState<boolean>(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (currentVendor) {
      setIsOpenStatus(currentVendor.isOpen ?? true);
    }
  }, [currentVendor]);

  const toggleOpenClose = async () => {
    if (!currentVendor) return;
    const newStatus = !isOpenStatus;
    setIsOpenStatus(newStatus); // optimistic update
    try {
      const res = await fetch("/api/restaurants", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId: currentVendor.id, isOpen: newStatus })
      });
      const data = await res.json();
      if (data.success && data.restaurant) {
        setIsOpenStatus(data.restaurant.isOpen);
        setCurrentVendor(prev => prev ? { ...prev, isOpen: data.restaurant.isOpen } : null);
      }
    } catch (e) {
      console.error("Failed to toggle open/close status:", e);
      setIsOpenStatus(!newStatus); // revert on error
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const role = localStorage.getItem("campusbites_user_role");
      if (role && role !== "VENDOR") {
        if (role === "STUDENT") {
          router.push("/student/dashboard");
        } else if (role === "ADMIN") {
          router.push("/admin");
        }
      }
    }

    const currentId = typeof window !== "undefined" ? localStorage.getItem("campusbites_active_vendor_id") : null;

    const loadVendorDetails = async () => {
      let active = getActiveRestaurant();
      try {
        const res = await fetch("/api/restaurants");
        const data = await res.json();
        if (data.success && data.restaurants && currentId) {
          const found = data.restaurants.find((r: any) => r.id === currentId);
          if (found) {
            active = found;
          }
        }
      } catch (e) {
        console.error("Failed to fetch live restaurant details:", e);
      }
      setCurrentVendor(active);
    };

    loadVendorDetails();
  }, [router]);

  const handleSignOut = () => {
    localStorage.removeItem("campusbites_user_role");
    localStorage.removeItem("campusbites_user_phone");
    localStorage.removeItem("campusbites_student_reg");
    localStorage.removeItem("campusbites_user_name");
    localStorage.removeItem("campusbites_active_vendor_id");
    router.push("/login");
  };

  if (!currentVendor) return null;

  return (
    <header className="sticky top-0 z-40 bg-surface border-b border-ink/10">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src={currentVendor.logo} alt={currentVendor.name} className="w-10 h-10 rounded object-cover border border-ink/15 shrink-0" />

          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-ink">{currentVendor.name}</span>
              <span className="px-1.5 py-0.5 rounded bg-marigold/10 border border-marigold/30 text-marigold text-[10px] font-mono font-bold">
                {currentVendor.tokenPrefix}
              </span>
              {currentVendor.type === "PURE_VEG" ? (
                <span className="px-1.5 py-0.5 rounded bg-sage-soft text-sage text-[9px] font-bold flex items-center gap-0.5 border border-sage/30">
                  <Leaf className="w-2.5 h-2.5" /> PURE VEG
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded bg-cardstock text-ink-soft text-[9px] font-bold border border-ink/15">
                  MIXED
                </span>
              )}
            </div>
            <p className="text-[10px] text-ink-soft flex items-center gap-1">
              <Building2 className="w-3 h-3" /> {currentVendor.floor}
            </p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-bold">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3.5 py-2 rounded transition-colors ${
                pathname === link.href ? "bg-marigold text-white" : "text-ink-soft hover:text-ink"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleOpenClose}
            title={isOpenStatus ? "Click to close stall" : "Click to open stall"}
            className={`hidden sm:flex px-3.5 py-2 rounded border text-xs font-bold items-center gap-1.5 transition-colors active:scale-95 ${
              isOpenStatus
                ? "bg-sage-soft border-sage/30 text-sage hover:bg-sage hover:text-white"
                : "bg-chili-soft border-chili/30 text-chili hover:bg-chili hover:text-white"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isOpenStatus ? "bg-sage" : "bg-chili"}`} />
            <span>{isOpenStatus ? "Stall Open" : "Stall Closed"}</span>
          </button>

          <button
            onClick={handleSignOut}
            className="hidden sm:flex px-3.5 py-2 rounded bg-chili-soft border border-chili/30 text-chili hover:bg-chili hover:text-white text-xs font-bold items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

          <button
            onClick={() => setIsMobileMenuOpen((v) => !v)}
            className="md:hidden p-2 rounded border border-ink/15 text-ink-soft"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <MenuIcon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-ink/10 bg-surface px-4 py-3 space-y-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3.5 py-2 rounded text-xs font-bold ${
                pathname === link.href ? "bg-marigold text-white" : "text-ink-soft hover:text-ink"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={toggleOpenClose}
            className={`w-full text-left px-3.5 py-2 rounded text-xs font-bold flex items-center gap-1.5 ${
              isOpenStatus ? "text-sage" : "text-chili"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isOpenStatus ? "bg-sage" : "bg-chili"}`} />
            {isOpenStatus ? "Stall Open — tap to close" : "Stall Closed — tap to open"}
          </button>
          <button
            onClick={handleSignOut}
            className="w-full text-left px-3.5 py-2 rounded text-xs font-bold text-chili flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      )}
    </header>
  );
}

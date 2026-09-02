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
  LogOut
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface NavbarProps {
  cartCount?: number;
  onOpenCart?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  selectedCampus?: string;
  onCampusChange?: (campus: string) => void;
}

export function Navbar({ 
  cartCount = 0, 
  onOpenCart, 
  searchQuery = "", 
  onSearchChange,
  selectedCampus = "Airport Road Campus",
  onCampusChange
}: NavbarProps) {
  const router = useRouter();
  const [campus, setCampus] = useState("North Campus Food Court");
  const [studentReg, setStudentReg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const reg = localStorage.getItem("campusbites_student_reg");
      const role = localStorage.getItem("campusbites_user_role");

      if (role && role !== "STUDENT") {
        if (role === "VENDOR") {
          router.push("/vendor/orders");
        } else if (role === "ADMIN") {
          router.push("/admin");
        }
      }
      setStudentReg(reg);
    }
  }, [router]);

  const handleSignOut = () => {
    localStorage.removeItem("campusbites_user_role");
    localStorage.removeItem("campusbites_user_phone");
    localStorage.removeItem("campusbites_student_reg");
    localStorage.removeItem("campusbites_user_name");
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 bg-surface border-b border-ink/15">
      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Brand & Location Picker */}
        <div className="flex items-center gap-4 lg:gap-6">
          <Link href="/student/dashboard" className="flex items-center gap-2.5 group">
            <div>
              <span className="font-display text-xl font-bold tracking-tight text-marigold">
                CampusBites
              </span>
              <p className="text-[9px] text-ink-soft font-semibold tracking-wider uppercase">
                Student Canteen Hub
              </p>
            </div>
          </Link>

          {/* Campus Location Picker Dropdown */}
          <div className="flex items-center gap-1.5 bg-cardstock border border-ink/15 rounded px-2.5 py-1.5 text-xs text-ink hover:border-ink/30 transition-colors">
            <MapPin className="w-3.5 h-3.5 text-marigold" />
            <select
              value={selectedCampus}
              onChange={(e) => onCampusChange && onCampusChange(e.target.value)}
              className="bg-transparent text-ink font-bold border-none p-0 focus:outline-none cursor-pointer text-xs pr-1"
            >
              <option value="Central Campus">Central Campus</option>
              <option value="Airport Road Campus">Airport Road Campus</option>
            </select>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex items-center flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-ink-soft absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder="Search stalls, burgers, dosas, cold brew..."
            className="w-full bg-cardstock border border-ink/15 rounded pl-10 pr-4 py-2 text-xs text-ink placeholder-ink-soft/70 focus:outline-none focus:border-b-2 focus:border-b-marigold transition-all"
            suppressHydrationWarning={true}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle />

          {/* Cart Trigger */}
          <Link
            href="/student/cart"
            className="relative px-3.5 py-2 rounded bg-cardstock hover:bg-cardstock-hover border border-ink/15 text-ink font-semibold text-xs transition-colors flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4 text-marigold" />
            <span className="hidden sm:inline-block font-bold">Cart</span>
            {cartCount > 0 && (
              <span className="bg-marigold text-white text-[11px] font-mono font-bold px-1.5 py-0.5 rounded min-w-[20px] text-center">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Student Profile / Register Number Banner & Logout */}
          {studentReg ? (
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-1.5 bg-cardstock border border-ink/15 px-3.5 py-2 rounded text-xs font-mono font-bold text-ink">
                <User className="w-3.5 h-3.5 text-marigold" />
                <span>{studentReg}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="px-3 py-2 rounded bg-chili-soft border border-chili/30 text-chili hover:bg-chili hover:text-white transition-colors text-xs font-bold flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline-block">Sign Out</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-marigold hover:bg-marigold-hover px-3.5 py-2 rounded text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              <span>Student Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

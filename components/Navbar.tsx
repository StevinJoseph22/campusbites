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
  Sparkles,
  LogOut
} from "lucide-react";

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
  const [stallsCount, setStallsCount] = useState(4);

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

    // Fetch live registered canteens count
    fetch("/api/restaurants")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.restaurants) {
          setStallsCount(data.restaurants.length);
        }
      })
      .catch(e => console.error(e));
  }, [router]);

  const handleSignOut = () => {
    localStorage.removeItem("campusbites_user_role");
    localStorage.removeItem("campusbites_user_phone");
    localStorage.removeItem("campusbites_student_reg");
    localStorage.removeItem("campusbites_user_name");
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80">
      {/* Top Campus Live Ticker */}
      <div className="bg-slate-950/90 border-b border-slate-800/60 px-4 lg:px-8 py-1 text-[11px] text-slate-400">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot" />
            <span className="font-semibold text-slate-300">Live Campus Canteen:</span>
            <span className="hidden sm:inline-block text-slate-400">{stallsCount} Stalls Open • Avg. Prep Time: <strong className="text-emerald-400 font-semibold">4 mins</strong></span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="text-orange-400 font-medium hidden md:inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Skip Canteen Lines
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Brand & Location Picker */}
        <div className="flex items-center gap-4 lg:gap-6">
          <Link href="/student/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 p-0.5 shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-orange-400">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-extrabold tracking-tight text-white">
                  Campus<span className="text-gradient-orange">Bites</span>
                </span>
              </div>
              <p className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase">
                Student Canteen Hub
              </p>
            </div>
          </Link>

          {/* Campus Location Picker Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 hover:border-slate-700 transition-colors">
            <MapPin className="w-3.5 h-3.5 text-orange-400" />
            <select
              value={selectedCampus}
              onChange={(e) => onCampusChange && onCampusChange(e.target.value)}
              className="bg-transparent text-slate-200 font-extrabold border-none p-0 focus:outline-none cursor-pointer text-xs pr-1"
            >
              <option value="Central Campus" className="bg-slate-950 text-white font-bold">Central Campus</option>
              <option value="Airport Road Campus" className="bg-slate-950 text-white font-bold">Airport Road Campus</option>
            </select>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex items-center flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder="Search stalls, burgers, dosas, cold brew..."
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all shadow-inner"
            suppressHydrationWarning={true}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Cart Trigger */}
          <Link 
            href="/student/cart"
            className="relative px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-xs transition-colors flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4 text-orange-400" />
            <span className="hidden sm:inline-block font-bold">Cart</span>
            {cartCount > 0 && (
              <span className="bg-orange-500 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-md shadow-orange-500/30">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Student Profile / Register Number Banner & Logout */}
          {studentReg ? (
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 px-3.5 py-2 rounded-xl text-xs font-extrabold text-orange-400">
                <User className="w-3.5 h-3.5" />
                <span>🎓 {studentReg}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition-colors text-xs font-bold flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline-block">Sign Out</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="btn-primary-gradient px-3.5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-sm"
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

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Store, 
  ChefHat, 
  Clock, 
  QrCode, 
  Utensils, 
  LogOut,
  ChevronDown,
  Building2,
  Lock,
  KeyRound,
  X,
  CheckCircle2,
  Leaf
} from "lucide-react";
import { getStoredRestaurants, getActiveRestaurant, setActiveRestaurant, RestaurantAccount } from "@/lib/restaurants-data";

export function VendorNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<RestaurantAccount[]>([]);
  const [currentVendor, setCurrentVendor] = useState<RestaurantAccount | null>(null);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isOpenStatus, setIsOpenStatus] = useState<boolean>(true);

  // Sync isOpenStatus when currentVendor loads
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
        // Also update local currentVendor
        setCurrentVendor(prev => prev ? { ...prev, isOpen: data.restaurant.isOpen } : null);
      }
    } catch (e) {
      console.error("Failed to toggle open/close status:", e);
      setIsOpenStatus(!newStatus); // revert on error
    }
  };

  // 6-digit PIN Modal state
  const [targetVendor, setTargetVendor] = useState<RestaurantAccount | null>(null);
  const [enteredPin, setEnteredPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);

  const fetchLiveVendors = async () => {
    try {
      const res = await fetch("/api/restaurants");
      const data = await res.json();
      if (data.success && data.restaurants) {
        setRestaurants(data.restaurants);
      } else {
        setRestaurants(getStoredRestaurants());
      }
    } catch (e) {
      setRestaurants(getStoredRestaurants());
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
        if (data.success && data.restaurants) {
          setRestaurants(data.restaurants);
          if (currentId) {
            const found = data.restaurants.find((r: any) => r.id === currentId);
            if (found) {
              active = found;
            }
          }
        } else {
          setRestaurants(getStoredRestaurants());
        }
      } catch (e) {
        setRestaurants(getStoredRestaurants());
      }
      setCurrentVendor(active);
    };

    loadVendorDetails();
  }, [router]);

  const handleSelectVendorClick = (vendor: RestaurantAccount) => {
    setIsSwitcherOpen(false);
    if (vendor.id === currentVendor?.id) return;

    // Prompt for 6-Digit Security PIN Code
    setTargetVendor(vendor);
    setEnteredPin("");
    setPinError(null);
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetVendor) return;

    const correctPin = targetVendor.pinCode || "123456";
    if (enteredPin.trim() === correctPin) {
      setActiveRestaurant(targetVendor.id);
      setCurrentVendor(targetVendor);
      setTargetVendor(null);
      setPinError(null);
      window.location.reload();
    } else {
      setPinError("Invalid 6-digit security PIN code. Try '123456'.");
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("campusbites_user_role");
    localStorage.removeItem("campusbites_user_phone");
    localStorage.removeItem("campusbites_student_reg");
    localStorage.removeItem("campusbites_user_name");
    router.push("/login");
  };

  if (!currentVendor) return null;

  return (
    <>
      <header className="sticky top-0 z-40 glass-panel border-b border-slate-800/80 bg-slate-950/90">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center justify-between gap-4">
          
          {/* Active Restaurant Selector with 6-digit PIN Lock */}
          <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-2 rounded-2xl">
            <img src={currentVendor.logo} alt={currentVendor.name} className="w-9 h-9 rounded-xl object-cover border border-slate-700" />
            
            <div className="text-left">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black text-white">{currentVendor.name}</span>
                <span className="px-1.5 py-0.2 rounded bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[10px] font-mono font-bold">
                  {currentVendor.tokenPrefix}
                </span>
                {currentVendor.type === "PURE_VEG" ? (
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-extrabold flex items-center gap-0.5 border border-emerald-500/40">
                    <Leaf className="w-2.5 h-2.5" /> PURE VEG
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 text-[9px] font-extrabold border border-slate-700">
                    MIXED
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                <Building2 className="w-3 h-3 text-purple-400" /> {currentVendor.floor}
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-2 text-xs font-bold">
            <Link
              href="/vendor/dashboard"
              className={`px-3.5 py-2 rounded-xl transition-all ${
                pathname === "/vendor/dashboard" ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" : "text-slate-400 hover:text-white"
              }`}
            >
              Overview
            </Link>

            <Link
              href="/vendor/orders"
              className={`px-3.5 py-2 rounded-xl transition-all ${
                pathname === "/vendor/orders" ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" : "text-slate-400 hover:text-white"
              }`}
            >
              Live Kitchen Queue
            </Link>

            <Link
              href="/vendor/menu"
              className={`px-3.5 py-2 rounded-xl transition-all ${
                pathname === "/vendor/menu" ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" : "text-slate-400 hover:text-white"
              }`}
            >
              Menu Manager
            </Link>

            <Link
              href="/vendor/slots"
              className={`px-3.5 py-2 rounded-xl transition-all ${
                pathname === "/vendor/slots" ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" : "text-slate-400 hover:text-white"
              }`}
            >
              Break Slots
            </Link>

            <Link
              href="/vendor/sales"
              className={`px-3.5 py-2 rounded-xl transition-all ${
                pathname === "/vendor/sales" ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" : "text-slate-400 hover:text-white"
              }`}
            >
              Sales Report
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleOpenClose}
              title={isOpenStatus ? "Click to close stall" : "Click to open stall"}
              className={`px-3.5 py-2 rounded-xl border text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 shadow-md ${
                isOpenStatus 
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white"
                  : "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isOpenStatus ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
              <span>{isOpenStatus ? "Stall Open" : "Stall Closed"}</span>
            </button>

            <button
              onClick={handleSignOut}
              className="px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* 6-DIGIT PIN CODE VERIFICATION MODAL */}
      {targetVendor && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="glass-panel w-full max-w-sm rounded-3xl border-slate-700 bg-slate-900 p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setTargetVendor(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center mx-auto shadow-md">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-white">Enter 6-Digit Restaurant Security PIN</h3>
              <p className="text-xs text-slate-400">
                Security verification required to access <strong>{targetVendor.name}</strong> terminal.
              </p>
            </div>

            <form onSubmit={handleVerifyPin} className="space-y-4">
              {pinError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold text-center">
                  {pinError}
                </div>
              )}

              <div>
                <input
                  type="password"
                  maxLength={6}
                  value={enteredPin}
                  onChange={(e) => setEnteredPin(e.target.value)}
                  placeholder="Enter 6-digit PIN (Default: 123456)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-center text-lg font-mono font-bold tracking-widest text-white focus:outline-none focus:border-orange-500"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="w-full btn-primary-gradient py-3 text-xs font-bold text-white rounded-xl shadow-lg shadow-orange-500/20"
              >
                Unlock {targetVendor.name} Terminal →
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
